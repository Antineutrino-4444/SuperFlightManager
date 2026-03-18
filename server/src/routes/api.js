const express = require('express');
const router = express.Router();
const { buildItineraries, filterItineraries } = require('../services/pathBuilder');
const { convertCurrency, getExchangeRates } = require('../services/currency');
const { AIRPORTS, CONTINENTS, REGIONS } = require('../data/airports');
const { AIRLINES, ALLIANCES } = require('../data/airlines');
const { AIRCRAFT_TYPES } = require('../data/aircraft');
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

    res.json({
      origin: { code: origin, ...AIRPORTS[origin] },
      destination: { code: destination, ...AIRPORTS[destination] },
      date,
      currency,
      resultCount: results.length,
      results,
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

module.exports = router;
