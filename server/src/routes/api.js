const express = require('express');
const router = express.Router();
const { buildItineraries, filterItineraries } = require('../services/pathBuilder');
const { convertCurrency, getExchangeRates } = require('../services/currency');
const { AIRPORTS, CONTINENTS, REGIONS } = require('../data/airports');
const { AIRLINES, ALLIANCES } = require('../data/airlines');
const { AIRCRAFT_TYPES, AIRCRAFT_FAMILIES } = require('../data/aircraft');
const { CURRENCIES } = require('../data/currencies');

// GET /api/airports - search airports
router.get('/airports', (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  const entries = Object.entries(AIRPORTS);

  if (!query) {
    const result = entries.map(([code, info]) => ({ code, ...info }));
    return res.json(result);
  }

  const results = entries
    .filter(([code, info]) =>
      code.toLowerCase().includes(query) ||
      info.name.toLowerCase().includes(query) ||
      info.city.toLowerCase().includes(query) ||
      info.country.toLowerCase().includes(query)
    )
    .map(([code, info]) => ({ code, ...info }))
    .slice(0, 20);

  res.json(results);
});

// GET /api/airlines
router.get('/airlines', (req, res) => {
  res.json(AIRLINES);
});

// GET /api/alliances
router.get('/alliances', (req, res) => {
  res.json(ALLIANCES);
});

// GET /api/aircraft
router.get('/aircraft', (req, res) => {
  res.json(AIRCRAFT_TYPES);
});

// GET /api/aircraft-families
router.get('/aircraft-families', (req, res) => {
  res.json(AIRCRAFT_FAMILIES);
});

// GET /api/currencies
router.get('/currencies', (req, res) => {
  res.json(CURRENCIES);
});

// GET /api/exchange-rates
router.get('/exchange-rates', async (req, res) => {
  try {
    const rates = await getExchangeRates();
    res.json(rates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

// GET /api/regions
router.get('/regions', (req, res) => {
  res.json({ continents: CONTINENTS, regions: REGIONS });
});

// POST /api/search - main flight search
router.post('/search', async (req, res) => {
  try {
    const {
      origin,
      destination,
      date,
      filters = {},
      currency = 'USD',
    } = req.body;

    if (!origin || !destination || !date) {
      return res.status(400).json({ error: 'origin, destination, and date are required' });
    }

    if (!AIRPORTS[origin]) {
      return res.status(400).json({ error: `Unknown airport: ${origin}` });
    }
    if (!AIRPORTS[destination]) {
      return res.status(400).json({ error: `Unknown airport: ${destination}` });
    }

    // Build all possible itineraries
    const itineraries = buildItineraries(origin, destination, date, filters);

    // Apply filters
    const filtered = filterItineraries(itineraries, filters);

    // Convert currency if needed
    let results = filtered;
    if (currency !== 'USD') {
      const rates = await getExchangeRates();
      const rate = rates[currency] || 1;
      results = filtered.map(it => ({
        ...it,
        displayPrice: Math.round(it.totalPriceUSD * rate * 100) / 100,
        displayCurrency: currency,
        priceBreakdown: it.priceBreakdown.map(p => {
          const usdAmount = parseFloat(p.replace('$', ''));
          const converted = Math.round(usdAmount * rate * 100) / 100;
          return `${converted}`;
        }),
        legs: it.legs.map(leg => ({
          ...leg,
          displayPrice: Math.round(leg.priceUSD * rate * 100) / 100,
          displayCurrency: currency,
        })),
      }));
    } else {
      results = filtered.map(it => ({
        ...it,
        displayPrice: it.totalPriceUSD,
        displayCurrency: 'USD',
        legs: it.legs.map(leg => ({
          ...leg,
          displayPrice: leg.priceUSD,
          displayCurrency: 'USD',
        })),
      }));
    }

    // Build diagnostic info about the search
    const searchDiagnostics = {
      totalGenerated: itineraries.length,
      totalAfterFilter: filtered.length,
      filtersApplied: [],
      dataSource: 'Mock flight generator (synthetic data based on real airline/route/aircraft databases)',
    };

    // Track which filters were applied
    if (filters.aircraftTypes && filters.aircraftTypes.length > 0) searchDiagnostics.filtersApplied.push(`Aircraft: ${filters.aircraftTypes.join(', ')}`);
    if (filters.airlines && filters.airlines.length > 0) searchDiagnostics.filtersApplied.push(`Airlines: ${filters.airlines.join(', ')}`);
    if (filters.alliances && filters.alliances.length > 0) searchDiagnostics.filtersApplied.push(`Alliances: ${filters.alliances.join(', ')}`);
    if (filters.maxStops !== undefined) searchDiagnostics.filtersApplied.push(`Max stops: ${filters.maxStops}`);
    if (filters.allowOvernight === false) searchDiagnostics.filtersApplied.push('No overnight layovers');
    if (filters.maxPrice) searchDiagnostics.filtersApplied.push(`Max price: $${filters.maxPrice}`);
    if (filters.latestArrival) searchDiagnostics.filtersApplied.push(`Latest arrival: ${filters.latestArrival}`);
    if (filters.transferContinents && filters.transferContinents.length > 0) searchDiagnostics.filtersApplied.push(`Transfer continents: ${filters.transferContinents.join(', ')}`);
    if (filters.transferRegions && filters.transferRegions.length > 0) searchDiagnostics.filtersApplied.push(`Transfer regions: ${filters.transferRegions.join(', ')}`);

    // Determine reason if no results
    if (results.length === 0) {
      if (itineraries.length === 0) {
        searchDiagnostics.noResultsReason = 'No itineraries could be generated for this route. This may happen if the airports are too close, or no valid hub connections exist within the distance threshold (1.8x direct distance).';
      } else {
        searchDiagnostics.noResultsReason = `${itineraries.length} itineraries were generated but all were eliminated by your filters: ${searchDiagnostics.filtersApplied.join('; ')}. Try relaxing your filter criteria.`;
      }
    }

    res.json({
      origin: { code: origin, ...AIRPORTS[origin] },
      destination: { code: destination, ...AIRPORTS[destination] },
      date,
      currency,
      resultCount: results.length,
      results,
      diagnostics: searchDiagnostics,
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// GET /api/diagnostics - test all data sources and connections
router.get('/diagnostics', async (req, res) => {
  const checks = [];

  // Check airports data
  const airportCount = Object.keys(AIRPORTS).length;
  checks.push({
    name: 'Airport Database',
    status: airportCount > 0 ? 'ok' : 'error',
    detail: `${airportCount} airports loaded`,
  });

  // Check airlines data
  checks.push({
    name: 'Airline Database',
    status: AIRLINES.length > 0 ? 'ok' : 'error',
    detail: `${AIRLINES.length} airlines loaded (${ALLIANCES.length} alliance groups)`,
  });

  // Check aircraft data
  checks.push({
    name: 'Aircraft Database',
    status: AIRCRAFT_TYPES.length > 0 ? 'ok' : 'error',
    detail: `${AIRCRAFT_TYPES.length} aircraft types, ${AIRCRAFT_FAMILIES.length} families loaded`,
  });

  // Check currencies data
  checks.push({
    name: 'Currency Database',
    status: CURRENCIES.length > 0 ? 'ok' : 'error',
    detail: `${CURRENCIES.length} currencies loaded`,
  });

  // Check exchange rate API
  try {
    const rates = await getExchangeRates();
    const rateCount = Object.keys(rates).length;
    checks.push({
      name: 'Exchange Rate API',
      status: rateCount > 0 ? 'ok' : 'warning',
      detail: rateCount > 0
        ? `${rateCount} exchange rates fetched (live from open.er-api.com)`
        : 'Using fallback rates (API unreachable)',
    });
  } catch (err) {
    checks.push({
      name: 'Exchange Rate API',
      status: 'error',
      detail: `Failed: ${err.message}`,
    });
  }

  // Check flight generation works
  try {
    const { generateDirectFlights } = require('../services/flightSearch');
    const testFlights = generateDirectFlights('JFK', 'LAX', '2025-06-01', 2);
    checks.push({
      name: 'Flight Generator',
      status: testFlights.length > 0 ? 'ok' : 'error',
      detail: `Generated ${testFlights.length} test flights (JFK-LAX)`,
    });
  } catch (err) {
    checks.push({
      name: 'Flight Generator',
      status: 'error',
      detail: `Failed: ${err.message}`,
    });
  }

  // Data source info
  checks.push({
    name: 'Data Source',
    status: 'info',
    detail: 'Mock flight generator (no external flight API). Flights are synthetically generated based on realistic airline/route/aircraft data.',
  });

  const allOk = checks.every(c => c.status === 'ok' || c.status === 'info');
  res.json({ healthy: allOk, checks });
});

module.exports = router;
