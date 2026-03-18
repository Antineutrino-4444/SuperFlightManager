const { AIRPORTS } = require('../data/airports');
const { AIRLINES } = require('../data/airlines');
const { AIRCRAFT_TYPES } = require('../data/aircraft');

// ============================================================
// Mock flight data generator for demo mode (no API key needed)
// When Amadeus API keys are configured, this is bypassed
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

// Get airlines that plausibly operate between two regions
function getAirlinesForRoute(origin, destination) {
  const o = AIRPORTS[origin];
  const d = AIRPORTS[destination];
  if (!o || !d) return AIRLINES.slice(0, 5);

  const majorIntl = ['EK', 'QR', 'SQ', 'TK', 'EY', 'BA', 'LH', 'AF', 'KL', 'UA', 'DL', 'AA', 'ET', 'CX', 'NH', 'JL', 'KE', 'CA', 'MU', 'QF'];

  // Home country airlines always included
  const homeAirlines = AIRLINES.filter(a =>
    a.country === o.country || a.country === d.country
  );

  // Major international carriers relevant to this route
  const majorCarriers = AIRLINES.filter(a =>
    majorIntl.includes(a.code) && !homeAirlines.some(h => h.code === a.code)
  );

  // Always include home airlines + a good selection of major carriers
  // Shuffle major carriers but keep all home airlines
  const shuffledMajor = majorCarriers.sort(() => Math.random() - 0.5);
  const maxMajor = Math.max(6, 12 - homeAirlines.length);
  const selected = [...homeAirlines, ...shuffledMajor.slice(0, maxMajor)];

  // Shuffle the final list so home airlines aren't always first in results
  return selected.sort(() => Math.random() - 0.5);
}

// Generate a realistic departure time
function generateDepartureTime(date, index) {
  const hours = [6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23];
  const h = hours[index % hours.length];
  const m = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][Math.floor(Math.random() * 12)];
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

  const count = numFlights || Math.min(airlines.length, Math.max(2, Math.floor(Math.random() * 5) + 2));
  const flights = [];

  for (let i = 0; i < count; i++) {
    const airline = airlines[i % airlines.length];
    const aircraft = aircraftCodes[Math.floor(Math.random() * aircraftCodes.length)];
    const aircraftInfo = AIRCRAFT_TYPES.find(a => a.code === aircraft);
    const depTime = generateDepartureTime(date, i);
    const arrTime = calculateArrival(depTime, distance, tzOffset);

    // Price based on distance + randomness
    const basePrice = Math.round(distance * 0.08 + Math.random() * 150 + 50);
    const flightNumber = `${airline.code}${Math.floor(Math.random() * 9000) + 100}`;

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
      fareClass: ['Economy', 'Premium Economy', 'Business', 'First'][Math.floor(Math.random() * 2)], // mostly economy
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
