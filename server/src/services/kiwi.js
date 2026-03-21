const fetch = require('node-fetch');
const { getSettings } = require('./settings');
const { AIRPORTS } = require('../data/airports');
const { AIRLINES } = require('../data/airlines');
const { AIRCRAFT_TYPES } = require('../data/aircraft');

const KIWI_BASE_URL = 'https://tequila-api.kiwi.com';

function getApiKey() {
  const settings = getSettings();
  return settings.kiwiApiKey || '';
}

// Test the Kiwi API connection with current credentials
async function testKiwiConnection() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, message: 'Kiwi API key is not configured.' };
  }

  try {
    const futureDate = getFutureDateString(14);
    const params = new URLSearchParams({
      fly_from: 'JFK',
      fly_to: 'LAX',
      date_from: formatDateForKiwi(futureDate),
      date_to: formatDateForKiwi(futureDate),
      flight_type: 'oneway',
      adults: '1',
      limit: '1',
    });

    const response = await fetch(`${KIWI_BASE_URL}/v2/search?${params}`, {
      headers: { apikey: apiKey },
    });

    if (!response.ok) {
      const body = await response.text();
      let msg = `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(body);
        msg = parsed.message || parsed.error || msg;
      } catch (_) {}
      return { ok: false, message: msg };
    }

    const data = await response.json();
    const count = data.data ? data.data.length : 0;
    return { ok: true, message: `Kiwi API connection successful (${count} test result${count !== 1 ? 's' : ''}).` };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

// Convert YYYY-MM-DD to DD/MM/YYYY for Kiwi API
function formatDateForKiwi(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function getFutureDateString(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

// Search flights using Kiwi Tequila API and map to our itinerary format
async function searchKiwiFlights(origin, destination, date, filters = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Kiwi API not configured');
  }

  const params = new URLSearchParams({
    fly_from: origin,
    fly_to: destination,
    date_from: formatDateForKiwi(date),
    date_to: formatDateForKiwi(date),
    flight_type: 'oneway',
    adults: '1',
    curr: 'USD',
    limit: '200',
  });

  // If maxStops is specified, set max_stopovers
  if (filters.maxStops !== undefined) {
    params.set('max_stopovers', String(filters.maxStops));
  }

  // If specific airlines are requested
  if (filters.airlines && filters.airlines.length > 0) {
    params.set('select_airlines', filters.airlines.join(','));
  }

  try {
    const response = await fetch(`${KIWI_BASE_URL}/v2/search?${params}`, {
      headers: { apikey: apiKey },
    });

    if (!response.ok) {
      const body = await response.text();
      let msg = `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(body);
        msg = parsed.message || parsed.error || msg;
      } catch (_) {}
      throw new Error(msg);
    }

    const apiResponse = await response.json();
    return mapKiwiResponse(apiResponse, origin, destination, date);
  } catch (err) {
    if (err.message.startsWith('HTTP ')) {
      throw new Error(`Kiwi API error: ${err.message}`);
    }
    throw new Error(`Kiwi API error: ${err.message}`);
  }
}

// Map Kiwi flight offers to our itinerary format
function mapKiwiResponse(apiResponse, origin, destination, date) {
  const offers = apiResponse.data || [];
  const itineraries = [];

  for (const offer of offers) {
    const segments = offer.route || [];
    if (segments.length === 0) continue;

    const legs = [];
    let totalDistanceKm = 0;
    let totalEstimatedMiles = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const airlineCode = seg.airline || '';
      const airlineInfo = AIRLINES.find(a => a.code === airlineCode);
      const airlineName = airlineInfo?.name || seg.airline || airlineCode;

      // Kiwi may provide equipment/aircraft info in the segment
      const aircraftCode = seg.equipment || '';
      const aircraftInfo = AIRCRAFT_TYPES.find(a => a.code === aircraftCode);

      // Get airport info from our data
      const origAirport = AIRPORTS[seg.flyFrom] || {};
      const destAirport = AIRPORTS[seg.flyTo] || {};

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

      // Duration in minutes from Kiwi's seconds-based duration
      // Kiwi route segments don't always have individual duration, calculate from times
      const depTime = new Date(seg.local_departure || seg.dTimeUTC * 1000);
      const arrTime = new Date(seg.local_arrival || seg.aTimeUTC * 1000);
      const durationMinutes = Math.round((arrTime - depTime) / 60000);

      // Flight number
      const flightNo = seg.flight_no ? `${airlineCode}${seg.flight_no}` : `${airlineCode}${seg.id || ''}`;

      // Map fare class
      const fareClass = mapFareCategory(seg.fare_category || offer.fare_category || 'M');

      // Price per leg (divide total evenly)
      const totalPrice = offer.price || 0;
      const legPrice = Math.round((totalPrice / segments.length) * 100) / 100;

      const estimatedMiles = airlineInfo
        ? Math.round(distanceMiles * (airlineInfo.milesPerMile || 1) / 5 + legPrice * (airlineInfo.milesPerDollar || 5) / 5)
        : Math.round(distanceMiles);
      totalEstimatedMiles += estimatedMiles;

      legs.push({
        id: `${flightNo}-${date}-${i}`,
        flightNumber: flightNo,
        airline: airlineCode,
        airlineName,
        alliance: airlineInfo?.alliance || 'None',
        origin: seg.flyFrom,
        originName: origAirport.name || seg.cityFrom || seg.flyFrom,
        originCity: origAirport.city || seg.cityFrom || seg.flyFrom,
        destination: seg.flyTo,
        destinationName: destAirport.name || seg.cityTo || seg.flyTo,
        destinationCity: destAirport.city || seg.cityTo || seg.flyTo,
        departureTime: seg.local_departure,
        arrivalTime: seg.local_arrival,
        durationMinutes: durationMinutes > 0 ? durationMinutes : 0,
        aircraft: aircraftCode,
        aircraftModel: aircraftInfo?.model || aircraftCode || 'Unknown',
        aircraftCategory: aircraftInfo?.category || 'Unknown',
        priceUSD: legPrice,
        currency: 'USD',
        fareClass,
        distanceKm,
        distanceMiles,
        loyaltyProgram: airlineInfo?.loyalty || airlineName,
        estimatedMiles,
        milesPerDollar: airlineInfo?.milesPerDollar || 5,
        source: 'Kiwi',
      });
    }

    const stops = segments.length - 1;
    const totalPrice = offer.price || 0;

    // Total duration from Kiwi (in seconds)
    const totalDurationMinutes = offer.duration
      ? Math.round((offer.duration.departure || 0) / 60)
      : legs.reduce((sum, l) => sum + l.durationMinutes, 0);

    // Build layover info
    const layovers = [];
    for (let i = 0; i < segments.length - 1; i++) {
      const arrTimeStr = segments[i].local_arrival;
      const depTimeStr = segments[i + 1].local_departure;
      const layoverMinutes = Math.round(
        (new Date(depTimeStr) - new Date(arrTimeStr)) / 60000
      );
      const hubCode = segments[i].flyTo;
      const hubInfo = AIRPORTS[hubCode];

      layovers.push({
        airport: hubCode,
        airportName: hubInfo?.name || segments[i].cityTo || hubCode,
        city: hubInfo?.city || segments[i].cityTo || hubCode,
        continent: hubInfo?.continent,
        region: hubInfo?.region,
        durationMinutes: layoverMinutes,
        isOvernight: isOvernightSimple(arrTimeStr, depTimeStr),
      });
    }

    const hasOvernightLayover = layovers.some(l => l.isOvernight);
    const uniqueAirlines = [...new Set(legs.map(l => l.airlineName))];
    const uniqueAlliances = [...new Set(legs.map(l => l.alliance))];

    itineraries.push({
      id: `kiwi-${offer.id}`,
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
      source: 'Kiwi',
      deepLink: offer.deep_link || null,
      bookingToken: offer.booking_token || null,
      availableSeats: offer.availability?.seats || null,
      quality: offer.quality || null,
    });
  }

  return itineraries;
}

function mapFareCategory(category) {
  switch ((category || '').toUpperCase()) {
    case 'M': return 'Economy';
    case 'W': return 'Premium Economy';
    case 'C': return 'Business';
    case 'F': return 'First';
    default: return 'Economy';
  }
}

function isOvernightSimple(arrivalTime, departureTime) {
  const arrival = new Date(arrivalTime);
  const departure = new Date(departureTime);
  return arrival.getDate() !== departure.getDate();
}

module.exports = {
  searchKiwiFlights,
  testKiwiConnection,
};
