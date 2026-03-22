const { AIRPORTS } = require('../data/airports');

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

module.exports = { filterItineraries, isOvernightLayover };
