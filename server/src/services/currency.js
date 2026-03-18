const fetch = require('node-fetch');

let ratesCache = null;
let ratesCacheTime = 0;
const CACHE_DURATION = 3600000; // 1 hour

async function getExchangeRates() {
  const now = Date.now();
  if (ratesCache && now - ratesCacheTime < CACHE_DURATION) {
    return ratesCache;
  }

  try {
    // Using the free exchangerate.host API (no key required)
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    if (data.result === 'success') {
      ratesCache = data.rates;
      ratesCacheTime = now;
      return ratesCache;
    }
  } catch (err) {
    console.error('Failed to fetch exchange rates:', err.message);
  }

  // Fallback rates if API fails
  if (ratesCache) return ratesCache;

  return {
    USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, CNY: 7.24, KRW: 1320,
    CAD: 1.36, AUD: 1.53, NZD: 1.63, CHF: 0.88, HKD: 7.82, SGD: 1.34,
    TWD: 31.5, INR: 83.1, THB: 35.2, MYR: 4.72, IDR: 15600, PHP: 56.1,
    VND: 24500, BRL: 4.97, MXN: 17.1, ARS: 830, CLP: 930, COP: 4050,
    TRY: 29.0, AED: 3.67, SAR: 3.75, QAR: 3.64, ZAR: 18.7, EGP: 30.9,
    NGN: 1550, KES: 153, RUB: 92.5, PLN: 4.02, SEK: 10.5, NOK: 10.6,
    DKK: 6.88, ILS: 3.67,
  };
}

async function convertCurrency(amountUSD, targetCurrency) {
  if (targetCurrency === 'USD') return amountUSD;
  const rates = await getExchangeRates();
  const rate = rates[targetCurrency];
  if (!rate) return amountUSD;
  return Math.round(amountUSD * rate * 100) / 100;
}

module.exports = { getExchangeRates, convertCurrency };
