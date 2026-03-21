const Amadeus = require('amadeus');
const { getSettings } = require('./settings');
const { AIRPORTS } = require('../data/airports');
const { AIRLINES } = require('../data/airlines');
const { AIRCRAFT_TYPES } = require('../data/aircraft');

// Cache the Amadeus client instance, rebuild when settings change
let cachedClient = null;
let cachedKey = '';
let cachedSecret = '';
let cachedEnv = '';

function getAmadeusClient() {
  const settings = getSettings();
  const { amadeusApiKey, amadeusApiSecret, amadeusEnvironment } = settings;

  if (!amadeusApiKey || !amadeusApiSecret) {
    return null;
  }

  // Rebuild client if credentials changed
  if (
    cachedClient &&
    cachedKey === amadeusApiKey &&
    cachedSecret === amadeusApiSecret &&
    cachedEnv === amadeusEnvironment
  ) {
    return cachedClient;
  }

  cachedClient = new Amadeus({
    clientId: amadeusApiKey,
    clientSecret: amadeusApiSecret,
    hostname: amadeusEnvironment === 'production' ? 'production' : 'test',
  });
  cachedKey = amadeusApiKey;
  cachedSecret = amadeusApiSecret;
  cachedEnv = amadeusEnvironment;

  return cachedClient;
}

// Test the Amadeus connection with the current credentials
async function testAmadeusConnection() {
  const client = getAmadeusClient();
  if (!client) {
    return { ok: false, message: 'API key and secret are not configured.' };
  }

  try {
    // Use a simple search to test credentials
    await client.shopping.flightOffersSearch.get({
      originLocationCode: 'JFK',
      destinationLocationCode: 'LAX',
      departureDate: getFutureDateString(14),
      adults: 1,
      max: 1,
    });
    return { ok: true, message: 'Amadeus API connection successful.' };
  } catch (err) {
    const msg = parseAmadeusError(err);
    return { ok: false, message: msg };
  }
}

function getFutureDateString(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

function parseAmadeusError(err) {
  if (err.response && err.response.result) {
    const result = err.response.result;
    if (result.errors && result.errors.length > 0) {
      return result.errors.map(e => `${e.title}: ${e.detail || e.code}`).join('; ');
    }
  }
  if (err.description) {
    try {
      const parsed = JSON.parse(err.description);
      if (parsed.error_description) return parsed.error_description;
      if (parsed.errors) return parsed.errors.map(e => e.detail || e.title).join('; ');
    } catch (_) {}
    return err.description;
  }
  return err.message || 'Unknown Amadeus API error';
}

// Search flights using Amadeus API and map to our itinerary format
async function searchAmadeusFlights(origin, destination, date, filters = {}) {
  const client = getAmadeusClient();
  if (!client) {
    throw new Error('Amadeus API not configured');
  }

  const params = {
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: date,
    adults: 1,
    currencyCode: 'USD',
    nonStop: false,
  };

  // If maxStops is 0, request non-stop only
  if (filters.maxStops === 0) {
    params.nonStop = true;
  }

  // Request maximum results for comprehensiveness
  params.max = 250;

  // If specific airlines are requested, pass them
  if (filters.airlines && filters.airlines.length > 0) {
    params.includedAirlineCodes = filters.airlines.join(',');
  }

  try {
    const response = await client.shopping.flightOffersSearch.get(params);
    const offers = JSON.parse(response.body);
    return mapAmadeusResponse(offers, origin, destination, date);
  } catch (err) {
    const msg = parseAmadeusError(err);
    throw new Error(`Amadeus API error: ${msg}`);
  }
}

// Map Amadeus flight offers to our itinerary format
function mapAmadeusResponse(apiResponse, origin, destination, date) {
  const offers = apiResponse.data || [];
  const dictionaries = apiResponse.dictionaries || {};
  const carrierNames = dictionaries.carriers || {};
  const aircraftNames = dictionaries.aircraft || {};

  const itineraries = [];

  for (const offer of offers) {
    // Each offer has itineraries (we only use one-way, so itineraries[0])
    const itin = offer.itineraries[0];
    if (!itin) continue;

    const segments = itin.segments || [];
    const legs = [];
    let totalDistanceKm = 0;
    let totalEstimatedMiles = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const airlineCode = seg.carrierCode;
      const airlineName = carrierNames[airlineCode] || airlineCode;
      const aircraftCode = seg.aircraft?.code || '';
      const aircraftInfo = AIRCRAFT_TYPES.find(a => a.code === aircraftCode);

      // Find airline info from our data for alliance/loyalty
      const airlineInfo = AIRLINES.find(a => a.code === airlineCode);

      // Get airport info
      const origAirport = AIRPORTS[seg.departure.iataCode] || {};
      const destAirport = AIRPORTS[seg.arrival.iataCode] || {};

      // Calculate distance if we have airport data
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

      // Parse duration from ISO 8601 (e.g., "PT2H30M")
      const durationMinutes = parseIsoDuration(seg.duration);

      // Fare class from travelerPricings
      const travelerPricing = offer.travelerPricings?.[0];
      const segDetail = travelerPricing?.fareDetailsBySegment?.find(
        fd => fd.segmentId === seg.id
      );
      const cabin = segDetail?.cabin || 'ECONOMY';
      const fareClass = mapCabin(cabin);

      const flightNumber = `${airlineCode}${seg.number}`;

      // Price per leg (divide total evenly)
      const totalPrice = parseFloat(offer.price?.total || 0);
      const legPrice = Math.round((totalPrice / segments.length) * 100) / 100;

      const estimatedMiles = airlineInfo
        ? Math.round(distanceMiles * (airlineInfo.milesPerMile || 1) / 5 + legPrice * (airlineInfo.milesPerDollar || 5) / 5)
        : Math.round(distanceMiles);
      totalEstimatedMiles += estimatedMiles;

      legs.push({
        id: `${flightNumber}-${date}-${i}`,
        flightNumber,
        airline: airlineCode,
        airlineName,
        alliance: airlineInfo?.alliance || 'None',
        origin: seg.departure.iataCode,
        originName: origAirport.name || seg.departure.iataCode,
        originCity: origAirport.city || seg.departure.iataCode,
        destination: seg.arrival.iataCode,
        destinationName: destAirport.name || seg.arrival.iataCode,
        destinationCity: destAirport.city || seg.arrival.iataCode,
        departureTime: seg.departure.at,
        arrivalTime: seg.arrival.at,
        durationMinutes,
        aircraft: aircraftCode,
        aircraftModel: aircraftInfo?.model || aircraftNames[aircraftCode] || aircraftCode,
        aircraftCategory: aircraftInfo?.category || 'Unknown',
        priceUSD: legPrice,
        currency: 'USD',
        fareClass,
        distanceKm,
        distanceMiles,
        loyaltyProgram: airlineInfo?.loyalty || airlineName,
        estimatedMiles,
        milesPerDollar: airlineInfo?.milesPerDollar || 5,
        source: 'Amadeus',
      });
    }

    const stops = segments.length - 1;
    const totalPrice = parseFloat(offer.price?.total || 0);
    const totalDurationMinutes = parseIsoDuration(itin.duration);

    // Build layover info
    const layovers = [];
    for (let i = 0; i < segments.length - 1; i++) {
      const arrTime = segments[i].arrival.at;
      const depTime = segments[i + 1].departure.at;
      const layoverMinutes = Math.round(
        (new Date(depTime) - new Date(arrTime)) / 60000
      );
      const hubCode = segments[i].arrival.iataCode;
      const hubInfo = AIRPORTS[hubCode];

      layovers.push({
        airport: hubCode,
        airportName: hubInfo?.name || hubCode,
        city: hubInfo?.city || hubCode,
        continent: hubInfo?.continent,
        region: hubInfo?.region,
        durationMinutes: layoverMinutes,
        isOvernight: isOvernightSimple(arrTime, depTime),
      });
    }

    const hasOvernightLayover = layovers.some(l => l.isOvernight);
    const uniqueAirlines = [...new Set(legs.map(l => l.airlineName))];
    const uniqueAlliances = [...new Set(legs.map(l => l.alliance))];

    itineraries.push({
      id: `amadeus-${offer.id}`,
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
      source: 'Amadeus',
      lastTicketingDate: offer.lastTicketingDate,
      validatingAirline: offer.validatingAirlineCodes?.[0],
      bookingClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.class,
      numberOfBookableSeats: offer.numberOfBookableSeats,
    });
  }

  return itineraries;
}

function parseIsoDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] || 0) * 60) + parseInt(match[2] || 0);
}

function mapCabin(cabin) {
  switch (cabin) {
    case 'ECONOMY': return 'Economy';
    case 'PREMIUM_ECONOMY': return 'Premium Economy';
    case 'BUSINESS': return 'Business';
    case 'FIRST': return 'First';
    default: return cabin;
  }
}

function isOvernightSimple(arrivalTime, departureTime) {
  const arrival = new Date(arrivalTime);
  const departure = new Date(departureTime);
  // Simple check: if layover spans past midnight
  return arrival.getDate() !== departure.getDate();
}

module.exports = {
  searchAmadeusFlights,
  testAmadeusConnection,
  getAmadeusClient,
};
