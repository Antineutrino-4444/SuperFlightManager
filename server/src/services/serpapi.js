const fetch = require('node-fetch');
const { getSettings } = require('./settings');
const { AIRPORTS } = require('../data/airports');
const { AIRLINES } = require('../data/airlines');
const { AIRCRAFT_TYPES } = require('../data/aircraft');

const SERPAPI_BASE_URL = 'https://serpapi.com/search';

function getApiKey() {
  const settings = getSettings();
  return settings.serpApiKey || '';
}

// Test the SerpApi connection with current credentials
async function testSerpApiConnection() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, message: 'SerpApi key is not configured.' };
  }

  try {
    const futureDate = getFutureDateString(14);
    const params = new URLSearchParams({
      engine: 'google_flights',
      departure_id: 'JFK',
      arrival_id: 'LAX',
      outbound_date: futureDate,
      type: '2', // one-way
      adults: '1',
      currency: 'USD',
      api_key: apiKey,
    });

    const response = await fetch(`${SERPAPI_BASE_URL}?${params}`);
    const data = await response.json();

    if (data.error) {
      return { ok: false, message: data.error };
    }

    const flightCount = (data.best_flights?.length || 0) + (data.other_flights?.length || 0);
    return { ok: true, message: `SerpApi connection successful (${flightCount} test result${flightCount !== 1 ? 's' : ''}).` };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

function getFutureDateString(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

// Search flights using SerpApi Google Flights and map to our itinerary format
async function searchSerpApiFlights(origin, destination, date, filters = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('SerpApi key not configured');
  }

  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: origin,
    arrival_id: destination,
    outbound_date: date,
    type: '2', // one-way
    adults: '1',
    currency: 'USD',
    api_key: apiKey,
    hl: 'en',
  });

  // Stops filter: 0=any, 1=nonstop, 2=1stop or fewer, 3=2stops or fewer
  if (filters.maxStops === 0) {
    params.set('stops', '1');
  } else if (filters.maxStops === 1) {
    params.set('stops', '2');
  } else if (filters.maxStops === 2) {
    params.set('stops', '3');
  }

  // Airline filter
  if (filters.airlines && filters.airlines.length > 0) {
    params.set('include_airlines', filters.airlines.join(','));
  }

  try {
    const response = await fetch(`${SERPAPI_BASE_URL}?${params}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return mapSerpApiResponse(data, origin, destination, date);
  } catch (err) {
    throw new Error(`Google Flights API error: ${err.message}`);
  }
}

// Map SerpApi Google Flights response to our itinerary format
function mapSerpApiResponse(apiResponse, origin, destination, date) {
  const bestFlights = apiResponse.best_flights || [];
  const otherFlights = apiResponse.other_flights || [];
  const allFlights = [...bestFlights, ...otherFlights];

  const itineraries = [];

  for (let idx = 0; idx < allFlights.length; idx++) {
    const offer = allFlights[idx];
    const segments = offer.flights || [];
    if (segments.length === 0) continue;

    const legs = [];
    let totalDistanceKm = 0;
    let totalEstimatedMiles = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];

      // Extract airline code from flight_number (e.g. "AA 1234" -> "AA")
      const flightNumberRaw = seg.flight_number || '';
      const airlineCode = extractAirlineCode(flightNumberRaw, seg.airline);
      const airlineInfo = AIRLINES.find(a => a.code === airlineCode);
      const airlineName = seg.airline || airlineInfo?.name || airlineCode;

      // Aircraft info from "airplane" field (e.g. "Boeing 737MAX 8 Passenger")
      const aircraftRaw = seg.airplane || '';
      const aircraftMatch = matchAircraft(aircraftRaw);
      const aircraftCode = aircraftMatch?.code || '';
      const aircraftModel = aircraftMatch?.model || aircraftRaw || 'Unknown';
      const aircraftCategory = aircraftMatch?.category || 'Unknown';

      // Get airport info
      const origCode = seg.departure_airport?.id || origin;
      const destCode = seg.arrival_airport?.id || destination;
      const origAirport = AIRPORTS[origCode] || {};
      const destAirport = AIRPORTS[destCode] || {};

      // Calculate distance
      let distanceKm = 0;
      if (origAirport.lat && destAirport.lat) {
        const { haversineDistance } = require('./flightSearch');
        distanceKm = Math.round(haversineDistance(
          origAirport.lat, origAirport.lon,
          destAirport.lat, destAirport.lon
        ));
      }
      const distanceMiles = Math.round(distanceKm * 0.621371);
      totalDistanceKm += distanceKm;

      // Duration directly from API (in minutes)
      const durationMinutes = seg.duration || 0;

      // Flight number - clean up spacing
      const flightNumber = flightNumberRaw.replace(/\s+/g, '');

      // Fare class from travel_class
      const fareClass = seg.travel_class || 'Economy';

      // Price per leg (divide total evenly)
      const totalPrice = offer.price || 0;
      const legPrice = Math.round((totalPrice / segments.length) * 100) / 100;

      const estimatedMiles = airlineInfo
        ? Math.round(distanceMiles * (airlineInfo.milesPerMile || 1) / 5 + legPrice * (airlineInfo.milesPerDollar || 5) / 5)
        : Math.round(distanceMiles);
      totalEstimatedMiles += estimatedMiles;

      legs.push({
        id: `${flightNumber || `seg${i}`}-${date}-${i}`,
        flightNumber: flightNumber || `${airlineCode}${i}`,
        airline: airlineCode,
        airlineName,
        alliance: airlineInfo?.alliance || 'None',
        origin: origCode,
        originName: origAirport.name || seg.departure_airport?.name || origCode,
        originCity: origAirport.city || origCode,
        destination: destCode,
        destinationName: destAirport.name || seg.arrival_airport?.name || destCode,
        destinationCity: destAirport.city || destCode,
        departureTime: seg.departure_airport?.time || '',
        arrivalTime: seg.arrival_airport?.time || '',
        durationMinutes,
        aircraft: aircraftCode,
        aircraftModel,
        aircraftCategory,
        priceUSD: legPrice,
        currency: 'USD',
        fareClass,
        distanceKm,
        distanceMiles,
        loyaltyProgram: airlineInfo?.loyalty || airlineName,
        estimatedMiles,
        milesPerDollar: airlineInfo?.milesPerDollar || 5,
        source: 'Google Flights',
        legroom: seg.legroom || null,
        isOvernight: seg.overnight || false,
        oftenDelayed: seg.often_delayed_by_over_30_min || false,
        operatedBy: seg.plane_and_crew_by || null,
      });
    }

    const stops = segments.length - 1;
    const totalPrice = offer.price || 0;
    const totalDurationMinutes = offer.total_duration || legs.reduce((sum, l) => sum + l.durationMinutes, 0);

    // Build layover info from the API's layovers array
    const layovers = [];
    const apiLayovers = offer.layovers || [];
    for (let i = 0; i < apiLayovers.length; i++) {
      const lay = apiLayovers[i];
      const hubCode = lay.id || '';
      const hubInfo = AIRPORTS[hubCode];

      layovers.push({
        airport: hubCode,
        airportName: hubInfo?.name || lay.name || hubCode,
        city: hubInfo?.city || hubCode,
        continent: hubInfo?.continent,
        region: hubInfo?.region,
        durationMinutes: lay.duration || 0,
        isOvernight: lay.overnight || false,
      });
    }

    const hasOvernightLayover = layovers.some(l => l.isOvernight);
    const uniqueAirlines = [...new Set(legs.map(l => l.airlineName))];
    const uniqueAlliances = [...new Set(legs.map(l => l.alliance))];

    // Carbon emissions
    const emissions = offer.carbon_emissions || {};

    itineraries.push({
      id: `gf-${idx}-${date}`,
      type: stops === 0 ? 'direct' : 'connecting',
      legs,
      totalPriceUSD: totalPrice,
      priceBreakdown: legs.map(l => `$${l.priceUSD}`),
      totalDurationMinutes,
      stops,
      airlines: uniqueAirlines,
      alliances: uniqueAlliances,
      aircraftTypes: legs.map(l => l.aircraft),
      aircraftModels: legs.map(l => l.aircraftModel),
      hasOvernightLayover,
      layovers,
      totalDistanceKm,
      totalDistanceMiles: Math.round(totalDistanceKm * 0.621371),
      totalEstimatedMiles,
      source: 'Google Flights',
      carbonEmissions: emissions.this_flight || null,
      typicalEmissions: emissions.typical_for_this_route || null,
      departureToken: offer.departure_token || null,
      bookingToken: offer.booking_token || null,
    });
  }

  return itineraries;
}

// Extract 2-letter IATA airline code from flight number string like "AA 1234"
function extractAirlineCode(flightNumber, airlineName) {
  // Try to get code from flight number prefix
  const match = flightNumber.match(/^([A-Z]{2})\s*/);
  if (match) return match[1];

  // Try numeric prefix like "6E 1234" (IndiGo)
  const match2 = flightNumber.match(/^(\d[A-Z]|[A-Z]\d)\s*/);
  if (match2) return match2[1];

  // Fall back to looking up airline name in our database
  if (airlineName) {
    const found = AIRLINES.find(a =>
      a.name.toLowerCase() === airlineName.toLowerCase()
    );
    if (found) return found.code;
  }

  return flightNumber.split(/\s/)[0] || '';
}

// Match aircraft description string to our aircraft database
function matchAircraft(description) {
  if (!description) return null;
  const descLower = description.toLowerCase();

  // Try exact code match first
  const directMatch = AIRCRAFT_TYPES.find(a =>
    descLower.includes(a.code.toLowerCase())
  );
  if (directMatch) return directMatch;

  // Try model name match
  const modelMatch = AIRCRAFT_TYPES.find(a =>
    a.model && descLower.includes(a.model.toLowerCase())
  );
  if (modelMatch) return modelMatch;

  // Try partial matching on common keywords
  const keywords = [
    { pattern: /737\s*max/i, search: '737' },
    { pattern: /737/i, search: '737' },
    { pattern: /747/i, search: '747' },
    { pattern: /757/i, search: '757' },
    { pattern: /767/i, search: '767' },
    { pattern: /777/i, search: '777' },
    { pattern: /787/i, search: '787' },
    { pattern: /a220/i, search: 'A220' },
    { pattern: /a300/i, search: 'A300' },
    { pattern: /a310/i, search: 'A310' },
    { pattern: /a319/i, search: 'A319' },
    { pattern: /a320/i, search: 'A320' },
    { pattern: /a321/i, search: 'A321' },
    { pattern: /a330/i, search: 'A330' },
    { pattern: /a340/i, search: 'A340' },
    { pattern: /a350/i, search: 'A350' },
    { pattern: /a380/i, search: 'A380' },
    { pattern: /embraer\s*1[79]0/i, search: 'E1' },
    { pattern: /embraer/i, search: 'E' },
    { pattern: /crj/i, search: 'CRJ' },
    { pattern: /dash\s*8|dhc-8|q400/i, search: 'DH' },
    { pattern: /atr/i, search: 'ATR' },
  ];

  for (const kw of keywords) {
    if (kw.pattern.test(description)) {
      const found = AIRCRAFT_TYPES.find(a =>
        a.code.startsWith(kw.search) || (a.model && a.model.includes(kw.search))
      );
      if (found) return found;
    }
  }

  return null;
}

module.exports = {
  searchSerpApiFlights,
  testSerpApiConnection,
};
