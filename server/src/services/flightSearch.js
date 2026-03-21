const { AIRPORTS } = require('../data/airports');
const { AIRLINES } = require('../data/airlines');
const { AIRCRAFT_TYPES } = require('../data/aircraft');

// ============================================================
// Mock flight data generator for demo mode (no API key needed)
// When Kiwi API key is configured, this is bypassed
// ============================================================

// Haversine distance in km
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Get realistic aircraft for a given distance
function getAircraftForDistance(distanceKm) {
  if (distanceKm > 6000) {
    // Long haul - widebodies
    return ['773', '789', '351', '380', '77L', '788', '35K', '748', '772', '339', '333'];
  } else if (distanceKm > 2500) {
    // Medium haul
    return ['789', '788', '321', '32Q', '333', '332', '738', '739', '763', '351'];
  } else if (distanceKm > 800) {
    // Short haul
    return ['738', '32N', '320', '321', '739', '7M8', 'E95', 'E90', '319'];
  } else {
    // Regional
    return ['E75', 'E90', 'CR9', 'DH8', 'AT7', '738', '320', 'E70'];
  }
}

// Airlines that are known to operate specific country-pair routes
// Key format: "COUNTRY1-COUNTRY2" (alphabetical), value: array of airline codes
const COUNTRY_PAIR_CARRIERS = {
  'CN-US': ['UA', 'DL', 'AA', 'CA', 'MU', 'CZ', 'HU'],
  'JP-US': ['UA', 'DL', 'AA', 'NH', 'JL'],
  'KR-US': ['UA', 'DL', 'AA', 'KE', 'OZ'],
  'GB-US': ['UA', 'DL', 'AA', 'BA', 'VS'],
  'DE-US': ['UA', 'DL', 'LH'],
  'FR-US': ['UA', 'DL', 'AF'],
  'AE-US': ['EK', 'EY'],
  'QA-US': ['QR'],
  'SG-US': ['SQ'],
  'CN-JP': ['CA', 'MU', 'CZ', 'NH', 'JL'],
  'CN-KR': ['CA', 'MU', 'CZ', 'KE', 'OZ'],
  'CN-GB': ['BA', 'CA', 'MU', 'CZ'],
  'AU-US': ['QF', 'UA', 'DL'],
  'IN-US': ['UA', 'DL', 'AA', 'AI'],
  'TR-US': ['TK'],
  'HK-US': ['CX', 'UA', 'DL', 'AA'],
  'TW-US': ['BR', 'UA', 'DL'],
  'TH-US': ['TG'],
  'CA-US': ['AC', 'UA', 'DL', 'AA'],
  'MX-US': ['AM', 'UA', 'DL', 'AA'],
  'BR-US': ['LA', 'UA', 'DL', 'AA'],
};

function getCountryPairKey(country1, country2) {
  return [country1, country2].sort().join('-');
}

// Get airlines that plausibly operate between two regions
function getAirlinesForRoute(origin, destination) {
  const o = AIRPORTS[origin];
  const d = AIRPORTS[destination];
  if (!o || !d) return AIRLINES;

  // Start with country-pair specific carriers (these always appear)
  const pairKey = getCountryPairKey(o.country, d.country);
  const pairCarrierCodes = COUNTRY_PAIR_CARRIERS[pairKey] || [];
  const guaranteed = AIRLINES.filter(a => pairCarrierCodes.includes(a.code));

  // Then add other plausible candidates
  const majorIntl = ['EK', 'QR', 'SQ', 'TK', 'EY', 'BA', 'LH', 'AF', 'KL', 'UA', 'DL', 'AA', 'ET', 'CX', 'NH', 'JL', 'KE', 'CA', 'MU', 'QF'];
  const guaranteedCodes = new Set(guaranteed.map(a => a.code));

  const additionalCandidates = AIRLINES.filter(a => {
    if (guaranteedCodes.has(a.code)) return false;
    if (majorIntl.includes(a.code)) return true;
    if (a.country === o.country || a.country === d.country) return true;
    return false;
  });

  // Include all plausible carriers — no shuffling or caps
  return [...guaranteed, ...additionalCandidates];
}

// Generate a realistic departure time
function generateDepartureTime(date, index) {
  const hours = [6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23];
  const h = hours[index % hours.length];
  const m = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][index % 12];
  return `${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

// Calculate arrival time given departure and distance
function calculateArrival(departureTime, distanceKm, timezoneOffsetHours) {
  const speed = distanceKm > 3000 ? 850 : 750; // km/h
  const flightHours = distanceKm / speed;
  const dep = new Date(departureTime);
  dep.setMinutes(dep.getMinutes() + Math.round(flightHours * 60));
  // Simulate timezone difference
  dep.setHours(dep.getHours() + timezoneOffsetHours);
  return dep.toISOString().replace('.000Z', '');
}

function estimateTimezoneOffset(origin, destination) {
  const o = AIRPORTS[origin];
  const d = AIRPORTS[destination];
  if (!o || !d) return 0;
  return Math.round((d.lon - o.lon) / 15);
}

// Generate mock direct flights between two airports
function generateDirectFlights(origin, destination, date, numFlights = null) {
  const o = AIRPORTS[origin];
  const d = AIRPORTS[destination];
  if (!o || !d) return [];

  const distance = haversineDistance(o.lat, o.lon, d.lat, d.lon);
  const aircraftCodes = getAircraftForDistance(distance);
  const airlines = getAirlinesForRoute(origin, destination);
  const tzOffset = estimateTimezoneOffset(origin, destination);

  const count = numFlights || airlines.length;
  const flights = [];

  for (let i = 0; i < count; i++) {
    const airline = airlines[i % airlines.length];
    const aircraft = aircraftCodes[i % aircraftCodes.length];
    const aircraftInfo = AIRCRAFT_TYPES.find(a => a.code === aircraft);
    const depTime = generateDepartureTime(date, i);
    const arrTime = calculateArrival(depTime, distance, tzOffset);

    // Price based on distance — deterministic per airline index
    const basePrice = Math.round(distance * 0.08 + 100 + (i * 17) % 150);
    const flightNumber = `${airline.code}${1000 + i * 7}`;

    const speed = distance > 3000 ? 850 : 750;
    const durationMinutes = Math.round((distance / speed) * 60);

    flights.push({
      id: `${flightNumber}-${date}`,
      flightNumber,
      airline: airline.code,
      airlineName: airline.name,
      alliance: airline.alliance,
      origin,
      originName: o.name,
      originCity: o.city,
      destination,
      destinationName: d.name,
      destinationCity: d.city,
      departureTime: depTime,
      arrivalTime: arrTime,
      durationMinutes,
      aircraft: aircraft,
      aircraftModel: aircraftInfo ? aircraftInfo.model : aircraft,
      aircraftCategory: aircraftInfo ? aircraftInfo.category : 'Unknown',
      priceUSD: basePrice,
      currency: 'USD',
      fareClass: ['Economy', 'Premium Economy', 'Business', 'First'][i % 4],
      distanceKm: Math.round(distance),
      distanceMiles: Math.round(distance * 0.621371),
      loyaltyProgram: airline.loyalty,
      estimatedMiles: Math.round(distance * 0.621371 * airline.milesPerMile / 5 + basePrice * airline.milesPerDollar / 5),
      milesPerDollar: airline.milesPerDollar,
      source: `${airline.name} Official`,
    });
  }

  return flights;
}

module.exports = {
  generateDirectFlights,
  haversineDistance,
  AIRPORTS,
};
