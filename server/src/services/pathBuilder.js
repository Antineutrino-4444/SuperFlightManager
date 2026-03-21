const { generateDirectFlights, haversineDistance, AIRPORTS } = require('./flightSearch');

// Hub airports that are commonly used as connection points
const HUB_AIRPORTS = [
  'JFK', 'LAX', 'ORD', 'ATL', 'DFW', 'DEN', 'SFO', 'SEA', 'MIA', 'IAH', 'EWR', 'IAD',
  'YYZ', 'YVR',
  'LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'FCO', 'MUC', 'IST', 'ZRH', 'VIE', 'CPH', 'HEL',
  'DXB', 'DOH', 'AUH',
  'PEK', 'PVG', 'HKG', 'NRT', 'HND', 'ICN', 'TPE', 'CAN',
  'SIN', 'BKK', 'KUL',
  'DEL', 'BOM',
  'SYD', 'MEL', 'AKL',
  'JNB', 'ADD', 'CAI',
  'GRU', 'BOG', 'MEX', 'PTY', 'SCL', 'LIM',
];

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

// Find reasonable connecting airports for a route
function findConnectionAirports(origin, destination, maxStops) {
  const o = AIRPORTS[origin];
  const d = AIRPORTS[destination];
  if (!o || !d) return [];

  const directDist = haversineDistance(o.lat, o.lon, d.lat, d.lon);

  // Filter hubs: don't go wildly out of the way (max 1.6x direct distance via any path)
  return HUB_AIRPORTS.filter(hub => {
    if (hub === origin || hub === destination) return false;
    const h = AIRPORTS[hub];
    if (!h) return false;
    const viaDistance = haversineDistance(o.lat, o.lon, h.lat, h.lon) +
      haversineDistance(h.lat, h.lon, d.lat, d.lon);
    return viaDistance < directDist * 1.8;
  });
}

// Build multi-leg itineraries
function buildItineraries(origin, destination, date, filters = {}) {
  const maxStops = filters.maxStops ?? 2;
  const results = [];

  // 1. Direct flights
  const directFlights = generateDirectFlights(origin, destination, date);
  for (const f of directFlights) {
    results.push({
      id: `direct-${f.id}`,
      type: 'direct',
      legs: [f],
      totalPriceUSD: f.priceUSD,
      priceBreakdown: [`$${f.priceUSD}`],
      totalDurationMinutes: f.durationMinutes,
      stops: 0,
      airlines: [f.airlineName],
      alliances: [f.alliance],
      aircraftTypes: [f.aircraft],
      aircraftModels: [f.aircraftModel],
      hasOvernightLayover: false,
      layovers: [],
      totalDistanceKm: f.distanceKm,
      totalDistanceMiles: f.distanceMiles,
      totalEstimatedMiles: f.estimatedMiles,
    });
  }

  if (maxStops < 1) return results;

  // 2. One-stop connections
  const connections = findConnectionAirports(origin, destination, 1);
  for (let i = 0; i < connections.length; i++) {
    const hub = connections[i];
    const leg1Flights = generateDirectFlights(origin, hub, date, 2);
    const leg2Flights = generateDirectFlights(hub, destination, date, 2);

    for (const l1 of leg1Flights) {
      for (const l2 of leg2Flights) {
        // Check connection time: min 1.5h, max 8h
        const arr = new Date(l1.arrivalTime);
        const dep = new Date(l2.departureTime);
        const layoverMinutes = (dep - arr) / 60000;

        if (layoverMinutes < 90 || layoverMinutes > 480) continue;

        const overnight = isOvernightLayover(l1.arrivalTime, l2.departureTime, filters.overnightConfig);
        const hubInfo = AIRPORTS[hub];

        results.push({
          id: `1stop-${l1.id}-${l2.id}`,
          type: 'connecting',
          legs: [l1, l2],
          totalPriceUSD: l1.priceUSD + l2.priceUSD,
          priceBreakdown: [`$${l1.priceUSD}`, `$${l2.priceUSD}`],
          totalDurationMinutes: l1.durationMinutes + layoverMinutes + l2.durationMinutes,
          stops: 1,
          airlines: [...new Set([l1.airlineName, l2.airlineName])],
          alliances: [...new Set([l1.alliance, l2.alliance])],
          aircraftTypes: [l1.aircraft, l2.aircraft],
          aircraftModels: [l1.aircraftModel, l2.aircraftModel],
          hasOvernightLayover: overnight,
          layovers: [{
            airport: hub,
            airportName: hubInfo?.name || hub,
            city: hubInfo?.city || hub,
            continent: hubInfo?.continent,
            region: hubInfo?.region,
            durationMinutes: Math.round(layoverMinutes),
            isOvernight: overnight,
          }],
          totalDistanceKm: l1.distanceKm + l2.distanceKm,
          totalDistanceMiles: l1.distanceMiles + l2.distanceMiles,
          totalEstimatedMiles: l1.estimatedMiles + l2.estimatedMiles,
        });
      }
    }
  }

  if (maxStops < 2) return results;

  // 3. Two-stop connections
  for (let i = 0; i < connections.length; i++) {
    for (let j = 0; j < connections.length; j++) {
      if (i === j) continue;
      const hub1 = connections[i];
      const hub2 = connections[j];
      if (hub1 === hub2) continue;

      // Verify hub2 is somewhat reasonable from hub1 toward destination
      const h1 = AIRPORTS[hub1];
      const h2 = AIRPORTS[hub2];
      const dest = AIRPORTS[destination];
      if (!h1 || !h2 || !dest) continue;

      const h1ToDest = haversineDistance(h1.lat, h1.lon, dest.lat, dest.lon);
      const h1ToH2 = haversineDistance(h1.lat, h1.lon, h2.lat, h2.lon);
      const h2ToDest = haversineDistance(h2.lat, h2.lon, dest.lat, dest.lon);

      if (h1ToH2 + h2ToDest > h1ToDest * 1.6) continue;

      const l1s = generateDirectFlights(origin, hub1, date, 1);
      const l2s = generateDirectFlights(hub1, hub2, date, 1);
      const l3s = generateDirectFlights(hub2, destination, date, 1);

      for (const l1 of l1s) {
        for (const l2 of l2s) {
          for (const l3 of l3s) {
            const layover1 = (new Date(l2.departureTime) - new Date(l1.arrivalTime)) / 60000;
            const layover2 = (new Date(l3.departureTime) - new Date(l2.arrivalTime)) / 60000;

            if (layover1 < 90 || layover1 > 480 || layover2 < 90 || layover2 > 480) continue;

            const on1 = isOvernightLayover(l1.arrivalTime, l2.departureTime, filters.overnightConfig);
            const on2 = isOvernightLayover(l2.arrivalTime, l3.departureTime, filters.overnightConfig);
            const hub1Info = AIRPORTS[hub1];
            const hub2Info = AIRPORTS[hub2];

            results.push({
              id: `2stop-${l1.id}-${l2.id}-${l3.id}`,
              type: 'connecting',
              legs: [l1, l2, l3],
              totalPriceUSD: l1.priceUSD + l2.priceUSD + l3.priceUSD,
              priceBreakdown: [`$${l1.priceUSD}`, `$${l2.priceUSD}`, `$${l3.priceUSD}`],
              totalDurationMinutes: l1.durationMinutes + layover1 + l2.durationMinutes + layover2 + l3.durationMinutes,
              stops: 2,
              airlines: [...new Set([l1.airlineName, l2.airlineName, l3.airlineName])],
              alliances: [...new Set([l1.alliance, l2.alliance, l3.alliance])],
              aircraftTypes: [l1.aircraft, l2.aircraft, l3.aircraft],
              aircraftModels: [l1.aircraftModel, l2.aircraftModel, l3.aircraftModel],
              hasOvernightLayover: on1 || on2,
              layovers: [
                {
                  airport: hub1,
                  airportName: hub1Info?.name || hub1,
                  city: hub1Info?.city || hub1,
                  continent: hub1Info?.continent,
                  region: hub1Info?.region,
                  durationMinutes: Math.round(layover1),
                  isOvernight: on1,
                },
                {
                  airport: hub2,
                  airportName: hub2Info?.name || hub2,
                  city: hub2Info?.city || hub2,
                  continent: hub2Info?.continent,
                  region: hub2Info?.region,
                  durationMinutes: Math.round(layover2),
                  isOvernight: on2,
                },
              ],
              totalDistanceKm: l1.distanceKm + l2.distanceKm + l3.distanceKm,
              totalDistanceMiles: l1.distanceMiles + l2.distanceMiles + l3.distanceMiles,
              totalEstimatedMiles: l1.estimatedMiles + l2.estimatedMiles + l3.estimatedMiles,
            });
          }
        }
      }
    }
  }

  return results;
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

module.exports = { buildItineraries, filterItineraries, isOvernightLayover };
