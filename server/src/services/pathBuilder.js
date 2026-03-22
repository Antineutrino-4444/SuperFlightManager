const { AIRPORTS } = require('../data/airports');
const { AIRLINES } = require('../data/airlines');
const { haversineDistance } = require('./flightSearch');
const { searchNonstopLegs } = require('./serpapi');

// Major hub airports for self-constructed connecting itineraries
const HUB_AIRPORTS = [
  // North America
  'JFK', 'LAX', 'ORD', 'ATL', 'DFW', 'DEN', 'SFO', 'SEA', 'MIA', 'IAH', 'EWR', 'IAD', 'YYZ', 'YVR',
  // Europe
  'LHR', 'CDG', 'FRA', 'AMS', 'IST', 'MAD', 'FCO', 'MUC', 'ZRH', 'VIE', 'CPH', 'HEL',
  // Middle East
  'DXB', 'DOH', 'AUH',
  // Asia
  'SIN', 'HKG', 'NRT', 'HND', 'ICN', 'PEK', 'BKK', 'KUL', 'TPE', 'DEL', 'BOM',
  // South America
  'GRU', 'BOG', 'PTY', 'SCL', 'LIM',
  // Africa
  'JNB', 'ADD', 'CAI',
  // Oceania
  'SYD', 'AKL',
];

// Find geographically reasonable connection airports between origin and destination
function findConnectionAirports(originCode, destinationCode, maxHubs = 5) {
  const orig = AIRPORTS[originCode];
  const dest = AIRPORTS[destinationCode];
  if (!orig || !dest) return [];

  const directDistance = haversineDistance(orig.lat, orig.lon, dest.lat, dest.lon);
  // Max detour: 1.8x direct distance
  const maxTotalDistance = directDistance * 1.8;

  const candidates = HUB_AIRPORTS
    .filter(code => code !== originCode && code !== destinationCode)
    .map(code => {
      const hub = AIRPORTS[code];
      if (!hub) return null;
      const distToHub = haversineDistance(orig.lat, orig.lon, hub.lat, hub.lon);
      const distFromHub = haversineDistance(hub.lat, hub.lon, dest.lat, dest.lon);
      const totalDistance = distToHub + distFromHub;
      return { code, totalDistance, detourRatio: totalDistance / directDistance };
    })
    .filter(c => c && c.totalDistance <= maxTotalDistance)
    .sort((a, b) => a.detourRatio - b.detourRatio)
    .slice(0, maxHubs);

  return candidates.map(c => c.code);
}

// Build self-constructed connecting itineraries by searching nonstop legs via hubs
async function buildSelfConstructedItineraries(origin, destination, date) {
  const hubs = findConnectionAirports(origin, destination);
  if (hubs.length === 0) return [];

  // Search all hub legs in parallel (2 API calls per hub: origin→hub, hub→destination)
  const hubSearches = hubs.map(async (hub) => {
    const [toHub, fromHub] = await Promise.all([
      searchNonstopLegs(origin, hub, date),
      searchNonstopLegs(hub, destination, date),
    ]);
    return { hub, toHub, fromHub };
  });

  const hubResults = await Promise.all(hubSearches);
  const itineraries = [];

  for (const { hub, toHub, fromHub } of hubResults) {
    if (toHub.length === 0 || fromHub.length === 0) continue;

    // Combine each leg1 with each compatible leg2
    for (const leg1 of toHub) {
      for (const leg2 of fromHub) {
        // Validate layover time (1.5h to 8h)
        const leg1Arrival = new Date(leg1.arrivalTime);
        const leg2Departure = new Date(leg2.departureTime);
        const layoverMinutes = (leg2Departure - leg1Arrival) / (1000 * 60);

        if (layoverMinutes < 90 || layoverMinutes > 480) continue;

        const hubInfo = AIRPORTS[hub] || {};
        const overnightLayover = isOvernightLayover(leg1.arrivalTime, leg2.departureTime);

        const totalPrice = leg1.priceUSD + leg2.priceUSD;
        const priceAvailable = leg1.priceUSD > 0 && leg2.priceUSD > 0;
        const totalDuration = leg1.durationMinutes + layoverMinutes + leg2.durationMinutes;
        const totalDistanceKm = leg1.distanceKm + leg2.distanceKm;
        const totalDistanceMiles = leg1.distanceMiles + leg2.distanceMiles;
        const totalEstimatedMiles = leg1.estimatedMiles + leg2.estimatedMiles;

        const legs = [
          { ...leg1, id: `sc-${leg1.flightNumber}-${date}-0` },
          { ...leg2, id: `sc-${leg2.flightNumber}-${date}-1` },
        ];

        const uniqueAirlines = [...new Set(legs.map(l => l.airlineName))];
        const uniqueAlliances = [...new Set(legs.map(l => l.alliance))];

        itineraries.push({
          id: `sc-${origin}-${hub}-${destination}-${leg1.flightNumber}-${leg2.flightNumber}-${date}`,
          type: 'connecting',
          itineraryType: 'self-constructed',
          priceUnavailable: !priceAvailable,
          legs,
          totalPriceUSD: totalPrice,
          priceBreakdown: legs.map(l => `$${l.priceUSD}`),
          totalDurationMinutes: Math.round(totalDuration),
          stops: 1,
          airlines: uniqueAirlines,
          alliances: uniqueAlliances,
          aircraftTypes: legs.map(l => l.aircraft),
          aircraftModels: legs.map(l => l.aircraftModel),
          hasOvernightLayover: overnightLayover,
          layovers: [{
            airport: hub,
            airportName: hubInfo.name || hub,
            city: hubInfo.city || hub,
            continent: hubInfo.continent,
            region: hubInfo.region,
            durationMinutes: Math.round(layoverMinutes),
            isOvernight: overnightLayover,
          }],
          totalDistanceKm,
          totalDistanceMiles,
          totalEstimatedMiles,
          source: 'Google Flights',
          carbonEmissions: null,
          typicalEmissions: null,
          departureToken: null,
          bookingToken: null,
        });
      }
    }
  }

  // Sort by total price, then duration
  itineraries.sort((a, b) => {
    if (a.totalPriceUSD !== b.totalPriceUSD) return a.totalPriceUSD - b.totalPriceUSD;
    return a.totalDurationMinutes - b.totalDurationMinutes;
  });

  // Limit to top 20 self-constructed itineraries to avoid overwhelming results
  return itineraries.slice(0, 20);
}

// Check if a layover counts as "overnight" based on user's customizable definition
function isOvernightLayover(arrivalTime, departureTime, config = {}) {
  const nightStartHour = config.nightStartHour ?? 0;  // midnight
  const nightEndHour = config.nightEndHour ?? 6;       // 6 AM
  const minNightOverlapMinutes = config.minNightOverlapMinutes ?? 120; // 2 hours overlap

  const arrival = new Date(arrivalTime);
  const departure = new Date(departureTime);

  // Check each hour of the layover to see how much overlaps with the "night" window
  let nightMinutes = 0;
  const cursor = new Date(arrival);
  while (cursor < departure) {
    const hour = cursor.getHours();
    const isNightHour = nightStartHour <= nightEndHour
      ? (hour >= nightStartHour && hour < nightEndHour)
      : (hour >= nightStartHour || hour < nightEndHour);
    if (isNightHour) nightMinutes++;
    cursor.setMinutes(cursor.getMinutes() + 1);
    // Safety: don't loop more than 48 hours
    if (cursor - arrival > 48 * 60 * 60 * 1000) break;
  }

  return nightMinutes >= minNightOverlapMinutes;
}

// Apply all filters to itineraries
function filterItineraries(itineraries, filters = {}) {
  let results = [...itineraries];

  // Filter by aircraft type
  if (filters.aircraftTypes && filters.aircraftTypes.length > 0) {
    results = results.filter(it =>
      it.aircraftTypes.some(ac => filters.aircraftTypes.includes(ac))
    );
  }

  // Filter by airline
  if (filters.airlines && filters.airlines.length > 0) {
    results = results.filter(it =>
      it.legs.some(leg => filters.airlines.includes(leg.airline))
    );
  }

  // Filter by alliance
  if (filters.alliances && filters.alliances.length > 0) {
    results = results.filter(it =>
      it.alliances.some(a => filters.alliances.includes(a))
    );
  }

  // Filter by max stops
  if (filters.maxStops !== undefined) {
    results = results.filter(it => it.stops <= filters.maxStops);
  }

  // Filter by overnight layover preference
  if (filters.allowOvernight === false) {
    results = results.filter(it => !it.hasOvernightLayover);
  }

  // Filter by max price
  if (filters.maxPrice) {
    results = results.filter(it => it.totalPriceUSD <= filters.maxPrice);
  }

  // Filter by latest arrival time (HH:MM format)
  if (filters.latestArrival) {
    const [h, m] = filters.latestArrival.split(':').map(Number);
    results = results.filter(it => {
      const lastLeg = it.legs[it.legs.length - 1];
      const arr = new Date(lastLeg.arrivalTime);
      return arr.getHours() < h || (arr.getHours() === h && arr.getMinutes() <= m);
    });
  }

  // Filter by transfer continent
  if (filters.transferContinents && filters.transferContinents.length > 0) {
    results = results.filter(it => {
      if (it.layovers.length === 0) return true; // direct flights pass through
      return it.layovers.every(l => filters.transferContinents.includes(l.continent));
    });
  }

  // Filter by transfer region
  if (filters.transferRegions && filters.transferRegions.length > 0) {
    results = results.filter(it => {
      if (it.layovers.length === 0) return true;
      return it.layovers.every(l => filters.transferRegions.includes(l.region));
    });
  }

  // Filter by specific transfer airports
  if (filters.transferAirports && filters.transferAirports.length > 0) {
    results = results.filter(it => {
      if (it.layovers.length === 0) return true;
      return it.layovers.every(l => filters.transferAirports.includes(l.airport));
    });
  }

  // Sort
  const sortBy = filters.sortBy || 'price';
  results.sort((a, b) => {
    switch (sortBy) {
      case 'price': return a.totalPriceUSD - b.totalPriceUSD;
      case 'duration': return a.totalDurationMinutes - b.totalDurationMinutes;
      case 'stops': return a.stops - b.stops;
      case 'departure': return new Date(a.legs[0].departureTime) - new Date(b.legs[0].departureTime);
      default: return a.totalPriceUSD - b.totalPriceUSD;
    }
  });

  return results;
}

module.exports = { filterItineraries, isOvernightLayover, buildSelfConstructedItineraries, findConnectionAirports };
