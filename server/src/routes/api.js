const express = require('express');
const router = express.Router();
const { buildItineraries, filterItineraries } = require('../services/pathBuilder');
const { convertCurrency, getExchangeRates } = require('../services/currency');
const { AIRPORTS, CONTINENTS, REGIONS } = require('../data/airports');
const { AIRLINES, ALLIANCES } = require('../data/airlines');
const { AIRCRAFT_TYPES, AIRCRAFT_FAMILIES } = require('../data/aircraft');
const { CURRENCIES } = require('../data/currencies');
const { getSettings, saveSettings, isAmadeusConfigured } = require('../services/settings');
const { searchAmadeusFlights, testAmadeusConnection } = require('../services/amadeus');

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

// GET /api/status - check connectivity to all data sources
router.get('/status', async (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    endpoints: {},
  };

  // Check airports data
  try {
    const airportCount = Object.keys(AIRPORTS).length;
    status.endpoints.airports = { ok: true, count: airportCount, message: `${airportCount} airports loaded` };
  } catch (e) {
    status.endpoints.airports = { ok: false, count: 0, message: e.message };
  }

  // Check airlines data
  try {
    const airlineCount = AIRLINES.length;
    status.endpoints.airlines = { ok: true, count: airlineCount, message: `${airlineCount} airlines loaded` };
  } catch (e) {
    status.endpoints.airlines = { ok: false, count: 0, message: e.message };
  }

  // Check aircraft data
  try {
    const aircraftCount = AIRCRAFT_TYPES.length;
    const familyCount = Object.keys(AIRCRAFT_FAMILIES).length;
    status.endpoints.aircraft = { ok: true, count: aircraftCount, message: `${aircraftCount} aircraft types in ${familyCount} families` };
  } catch (e) {
    status.endpoints.aircraft = { ok: false, count: 0, message: e.message };
  }

  // Check currencies data
  try {
    const currCount = CURRENCIES.length;
    status.endpoints.currencies = { ok: true, count: currCount, message: `${currCount} currencies loaded` };
  } catch (e) {
    status.endpoints.currencies = { ok: false, count: 0, message: e.message };
  }

  // Check exchange rate API
  try {
    const rates = await getExchangeRates();
    const rateCount = Object.keys(rates).length;
    status.endpoints.exchangeRates = { ok: rateCount > 0, count: rateCount, message: rateCount > 0 ? `${rateCount} exchange rates available` : 'Using fallback rates' };
  } catch (e) {
    status.endpoints.exchangeRates = { ok: false, count: 0, message: `Exchange rate API error: ${e.message}` };
  }

  // Check alliances
  try {
    status.endpoints.alliances = { ok: true, count: ALLIANCES.length, message: `${ALLIANCES.length} alliances loaded` };
  } catch (e) {
    status.endpoints.alliances = { ok: false, count: 0, message: e.message };
  }

  // Check Amadeus API
  if (isAmadeusConfigured()) {
    try {
      const amadeusResult = await testAmadeusConnection();
      status.endpoints.amadeus = {
        ok: amadeusResult.ok,
        count: amadeusResult.ok ? 1 : 0,
        message: amadeusResult.message,
      };
    } catch (e) {
      status.endpoints.amadeus = { ok: false, count: 0, message: e.message };
    }
  } else {
    status.endpoints.amadeus = { ok: false, count: 0, message: 'Not configured — go to Settings to add your API key' };
  }

  status.allOk = Object.values(status.endpoints).every(e => e.ok);
  status.dataSource = isAmadeusConfigured()
    ? 'Amadeus Self-Service API (real flight data)'
    : 'Mock data generator (configure Amadeus API key in Settings for real flights)';
  status.note = isAmadeusConfigured()
    ? 'Flight data is sourced from the Amadeus API with real-time pricing and availability.'
    : 'Flight data is generated algorithmically. Configure your Amadeus API key in Settings to get real flight data.';

  res.json(status);
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

// GET /api/settings - get current settings (masks secrets)
router.get('/settings', (req, res) => {
  const settings = getSettings();
  res.json({
    amadeusApiKey: settings.amadeusApiKey ? maskSecret(settings.amadeusApiKey) : '',
    amadeusApiSecret: settings.amadeusApiSecret ? maskSecret(settings.amadeusApiSecret) : '',
    amadeusEnvironment: settings.amadeusEnvironment,
    amadeusConfigured: isAmadeusConfigured(),
  });
});

function maskSecret(s) {
  if (!s || s.length < 8) return '****';
  return s.slice(0, 4) + '****' + s.slice(-4);
}

// POST /api/settings - save settings
router.post('/settings', (req, res) => {
  try {
    const { amadeusApiKey, amadeusApiSecret, amadeusEnvironment } = req.body;
    const updates = {};
    if (amadeusApiKey !== undefined) updates.amadeusApiKey = amadeusApiKey;
    if (amadeusApiSecret !== undefined) updates.amadeusApiSecret = amadeusApiSecret;
    if (amadeusEnvironment !== undefined) updates.amadeusEnvironment = amadeusEnvironment;
    const saved = saveSettings(updates);
    res.json({
      amadeusApiKey: saved.amadeusApiKey ? maskSecret(saved.amadeusApiKey) : '',
      amadeusApiSecret: saved.amadeusApiSecret ? maskSecret(saved.amadeusApiSecret) : '',
      amadeusEnvironment: saved.amadeusEnvironment,
      amadeusConfigured: isAmadeusConfigured(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings', details: err.message });
  }
});

// POST /api/settings/test-amadeus - test Amadeus API connection
router.post('/settings/test-amadeus', async (req, res) => {
  try {
    const result = await testAmadeusConnection();
    res.json(result);
  } catch (err) {
    res.json({ ok: false, message: err.message });
  }
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

    // Expand aircraft family selections into individual codes
    const expandedFilters = { ...filters };
    if (filters.aircraftFamilies && filters.aircraftFamilies.length > 0) {
      const familyCodes = [];
      for (const familyName of filters.aircraftFamilies) {
        const fam = AIRCRAFT_FAMILIES[familyName];
        if (fam) familyCodes.push(...fam.codes);
      }
      // Merge with any individually selected aircraft types
      const existing = filters.aircraftTypes || [];
      expandedFilters.aircraftTypes = [...new Set([...existing, ...familyCodes])];
    }

    // Determine data source: Amadeus API or mock generator
    let itineraries;
    let dataSource = 'mock';
    let amadeusError = null;

    if (isAmadeusConfigured()) {
      try {
        itineraries = await searchAmadeusFlights(origin, destination, date, expandedFilters);
        dataSource = 'amadeus';
      } catch (err) {
        console.error('Amadeus API failed, falling back to mock:', err.message);
        amadeusError = err.message;
        itineraries = buildItineraries(origin, destination, date, expandedFilters);
      }
    } else {
      itineraries = buildItineraries(origin, destination, date, expandedFilters);
    }

    // Apply filters (works the same for both data sources)
    const filtered = filterItineraries(itineraries, expandedFilters);

    // Build diagnostics for when results are empty
    let diagnostics = null;
    if (filtered.length === 0) {
      diagnostics = {
        totalGenerated: itineraries.length,
        filterBreakdown: {},
      };
      if (itineraries.length === 0) {
        diagnostics.reason = 'NO_ITINERARIES_GENERATED';
        diagnostics.explanation = dataSource === 'amadeus'
          ? `The Amadeus API returned no flight offers between ${origin} and ${destination} on ${date}. This route may not have any flights on this date.`
          : `The path builder could not generate any itineraries between ${origin} and ${destination}. This may happen if both airports are valid but no connecting hub paths exist within the distance constraints.`;
      } else {
        diagnostics.reason = 'ALL_FILTERED_OUT';
        diagnostics.explanation = `${itineraries.length} itinerary(ies) were generated but all were removed by your active filters. Try relaxing your filter criteria.`;
        // Test each filter individually to show which ones are removing results
        const filterTests = [
          { key: 'aircraftTypes', label: 'Aircraft Type', test: (it) => expandedFilters.aircraftTypes?.length > 0 ? it.aircraftTypes.some(ac => expandedFilters.aircraftTypes.includes(ac)) : true },
          { key: 'airlines', label: 'Airlines', test: (it) => expandedFilters.airlines?.length > 0 ? it.legs.some(leg => expandedFilters.airlines.includes(leg.airline)) : true },
          { key: 'alliances', label: 'Alliances', test: (it) => expandedFilters.alliances?.length > 0 ? it.alliances.some(a => expandedFilters.alliances.includes(a)) : true },
          { key: 'maxStops', label: 'Max Stops', test: (it) => expandedFilters.maxStops !== undefined ? it.stops <= expandedFilters.maxStops : true },
          { key: 'allowOvernight', label: 'Overnight Layover', test: (it) => expandedFilters.allowOvernight === false ? !it.hasOvernightLayover : true },
          { key: 'maxPrice', label: 'Max Price', test: (it) => expandedFilters.maxPrice ? it.totalPriceUSD <= expandedFilters.maxPrice : true },
        ];
        for (const ft of filterTests) {
          const passing = itineraries.filter(ft.test).length;
          if (passing < itineraries.length) {
            diagnostics.filterBreakdown[ft.label] = {
              passing,
              total: itineraries.length,
              removed: itineraries.length - passing,
            };
          }
        }
      }
    }

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

    res.json({
      origin: { code: origin, ...AIRPORTS[origin] },
      destination: { code: destination, ...AIRPORTS[destination] },
      date,
      currency,
      resultCount: results.length,
      results,
      diagnostics,
      dataSource,
      amadeusError,
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

module.exports = router;
