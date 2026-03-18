const airports = [
  { code: "SFO", city: "San Francisco", country: "United States", area: "North America" },
  { code: "LAX", city: "Los Angeles", country: "United States", area: "North America" },
  { code: "JFK", city: "New York", country: "United States", area: "North America" },
  { code: "SEA", city: "Seattle", country: "United States", area: "North America" },
  { code: "ORD", city: "Chicago", country: "United States", area: "North America" },
  { code: "LHR", city: "London", country: "United Kingdom", area: "Europe" },
  { code: "FRA", city: "Frankfurt", country: "Germany", area: "Europe" },
  { code: "IST", city: "Istanbul", country: "Türkiye", area: "Europe" },
  { code: "DXB", city: "Dubai", country: "United Arab Emirates", area: "Middle East" },
  { code: "SIN", city: "Singapore", country: "Singapore", area: "Asia" },
  { code: "HND", city: "Tokyo", country: "Japan", area: "Asia" },
  { code: "PEK", city: "Beijing", country: "China", area: "Asia" },
  { code: "ICN", city: "Seoul", country: "South Korea", area: "Asia" },
  { code: "SYD", city: "Sydney", country: "Australia", area: "Oceania" }
];

const planeTypes = [
  "Airbus A220-100", "Airbus A220-300", "Airbus A319", "Airbus A320", "Airbus A320neo",
  "Airbus A321", "Airbus A321neo", "Airbus A330-200", "Airbus A330-300", "Airbus A330-900neo",
  "Airbus A340-300", "Airbus A350-900", "Airbus A350-1000", "Airbus A380-800",
  "Boeing 717-200", "Boeing 737-700", "Boeing 737-800", "Boeing 737-8 MAX", "Boeing 737-9 MAX",
  "Boeing 747-8", "Boeing 757-200", "Boeing 767-300ER", "Boeing 777-200ER", "Boeing 777-300ER",
  "Boeing 777-9", "Boeing 787-8", "Boeing 787-9", "Boeing 787-10", "COMAC C919",
  "Embraer 170", "Embraer 175", "Embraer 190", "Embraer 195-E2", "ATR 72-600"
].sort();

const airlines = [
  { code: "UA", name: "United Airlines", alliance: "Star Alliance", sourceUrl: "https://www.united.com/en/us/book-flight/united-reservations" },
  { code: "SQ", name: "Singapore Airlines", alliance: "Star Alliance", sourceUrl: "https://www.singaporeair.com/en_UK/us/home#/book/bookflight" },
  { code: "LH", name: "Lufthansa", alliance: "Star Alliance", sourceUrl: "https://www.lufthansa.com/us/en/booking" },
  { code: "EK", name: "Emirates", alliance: "Independent", sourceUrl: "https://www.emirates.com/us/english/book/" },
  { code: "BA", name: "British Airways", alliance: "oneworld", sourceUrl: "https://www.britishairways.com/travel/home/public/en_us" },
  { code: "AA", name: "American Airlines", alliance: "oneworld", sourceUrl: "https://www.aa.com/booking/find-flights" },
  { code: "TK", name: "Turkish Airlines", alliance: "Star Alliance", sourceUrl: "https://www.turkishairlines.com/en-us/flights/booking/" },
  { code: "NH", name: "ANA", alliance: "Star Alliance", sourceUrl: "https://www.ana.co.jp/en/us/" },
  { code: "CX", name: "Cathay Pacific", alliance: "oneworld", sourceUrl: "https://www.cathaypacific.com/cx/en_US/book-a-trip/book-flights.html" },
  { code: "QF", name: "Qantas", alliance: "oneworld", sourceUrl: "https://www.qantas.com/us/en/book-a-trip/flights.html" }
];

const flightSegments = [
  {
    id: "ua-sfo-lhr-789",
    origin: "SFO", destination: "LHR", airline: "UA", aircraft: "Boeing 787-9", cabin: "Economy",
    durationMinutes: 635, depart: "13:45", arrive: "07:20", publishedFareUsd: 740,
    officialSourceUrl: "https://www.united.com/en/us/book-flight/united-reservations",
    officialSourceLabel: "United booking",
    miles: { program: "MileagePlus", redeemable: 5350, pqp: 296 },
    notes: "Published nonstop segment on the airline's official booking flow."
  },
  {
    id: "ua-lhr-sfo-789",
    origin: "LHR", destination: "SFO", airline: "UA", aircraft: "Boeing 787-9", cabin: "Economy",
    durationMinutes: 665, depart: "11:05", arrive: "14:10", publishedFareUsd: 760,
    officialSourceUrl: "https://www.united.com/en/us/book-flight/united-reservations",
    officialSourceLabel: "United booking",
    miles: { program: "MileagePlus", redeemable: 5350, pqp: 304 },
    notes: "Published nonstop segment on the airline's official booking flow."
  },
  {
    id: "ua-sfo-hnd-77w",
    origin: "SFO", destination: "HND", airline: "UA", aircraft: "Boeing 777-300ER", cabin: "Economy",
    durationMinutes: 660, depart: "11:15", arrive: "15:15", publishedFareUsd: 890,
    officialSourceUrl: "https://www.united.com/en/us/book-flight/united-reservations",
    officialSourceLabel: "United booking",
    miles: { program: "MileagePlus", redeemable: 5124, pqp: 356 },
    notes: "Long-haul nonstop listed on United's booking site."
  },
  {
    id: "nh-hnd-sin-789",
    origin: "HND", destination: "SIN", airline: "NH", aircraft: "Boeing 787-9", cabin: "Economy",
    durationMinutes: 430, depart: "18:10", arrive: "00:20", publishedFareUsd: 420,
    officialSourceUrl: "https://www.ana.co.jp/en/us/",
    officialSourceLabel: "ANA booking",
    miles: { program: "ANA Mileage Club", redeemable: 3310, pqp: 0 },
    notes: "Official ANA-published segment used as a combinable connection building block."
  },
  {
    id: "sq-sin-syd-388",
    origin: "SIN", destination: "SYD", airline: "SQ", aircraft: "Airbus A380-800", cabin: "Economy",
    durationMinutes: 470, depart: "07:40", arrive: "17:30", publishedFareUsd: 510,
    officialSourceUrl: "https://www.singaporeair.com/en_UK/us/home#/book/bookflight",
    officialSourceLabel: "Singapore Airlines booking",
    miles: { program: "KrisFlyer", redeemable: 3906, pqp: 0 },
    notes: "A380-operated official Singapore Airlines segment."
  },
  {
    id: "sq-sin-lhr-359",
    origin: "SIN", destination: "LHR", airline: "SQ", aircraft: "Airbus A350-900", cabin: "Economy",
    durationMinutes: 830, depart: "09:00", arrive: "15:50", publishedFareUsd: 690,
    officialSourceUrl: "https://www.singaporeair.com/en_UK/us/home#/book/bookflight",
    officialSourceLabel: "Singapore Airlines booking",
    miles: { program: "KrisFlyer", redeemable: 6763, pqp: 0 },
    notes: "Published official long-haul segment."
  },
  {
    id: "ek-jfk-dxb-388",
    origin: "JFK", destination: "DXB", airline: "EK", aircraft: "Airbus A380-800", cabin: "Economy",
    durationMinutes: 750, depart: "11:20", arrive: "08:50", publishedFareUsd: 980,
    officialSourceUrl: "https://www.emirates.com/us/english/book/",
    officialSourceLabel: "Emirates booking",
    miles: { program: "Skywards", redeemable: 6846, pqp: 0 },
    notes: "A380 official segment that can anchor aircraft-based searches."
  },
  {
    id: "ek-dxb-sin-388",
    origin: "DXB", destination: "SIN", airline: "EK", aircraft: "Airbus A380-800", cabin: "Economy",
    durationMinutes: 450, depart: "21:00", arrive: "08:30", publishedFareUsd: 470,
    officialSourceUrl: "https://www.emirates.com/us/english/book/",
    officialSourceLabel: "Emirates booking",
    miles: { program: "Skywards", redeemable: 3632, pqp: 0 },
    notes: "Official Emirates A380 segment."
  },
  {
    id: "lh-sfo-fra-748",
    origin: "SFO", destination: "FRA", airline: "LH", aircraft: "Boeing 747-8", cabin: "Economy",
    durationMinutes: 655, depart: "14:20", arrive: "10:15", publishedFareUsd: 720,
    officialSourceUrl: "https://www.lufthansa.com/us/en/booking",
    officialSourceLabel: "Lufthansa booking",
    miles: { program: "Miles & More", redeemable: 5686, pqp: 0 },
    notes: "Official Lufthansa nonstop on the 747-8."
  },
  {
    id: "lh-fra-ist-32n",
    origin: "FRA", destination: "IST", airline: "LH", aircraft: "Airbus A320neo", cabin: "Economy",
    durationMinutes: 185, depart: "13:05", arrive: "17:10", publishedFareUsd: 160,
    officialSourceUrl: "https://www.lufthansa.com/us/en/booking",
    officialSourceLabel: "Lufthansa booking",
    miles: { program: "Miles & More", redeemable: 1159, pqp: 0 },
    notes: "Regional Lufthansa segment suitable for self-built connections."
  },
  {
    id: "tk-ist-sin-359",
    origin: "IST", destination: "SIN", airline: "TK", aircraft: "Airbus A350-900", cabin: "Economy",
    durationMinutes: 635, depart: "01:50", arrive: "17:25", publishedFareUsd: 440,
    officialSourceUrl: "https://www.turkishairlines.com/en-us/flights/booking/",
    officialSourceLabel: "Turkish Airlines booking",
    miles: { program: "Miles&Smiles", redeemable: 5266, pqp: 0 },
    notes: "Official Turkish Airlines segment with an overnight departure profile."
  },
  {
    id: "ba-jfk-lhr-388",
    origin: "JFK", destination: "LHR", airline: "BA", aircraft: "Airbus A380-800", cabin: "Economy",
    durationMinutes: 415, depart: "19:30", arrive: "07:05", publishedFareUsd: 650,
    officialSourceUrl: "https://www.britishairways.com/travel/home/public/en_us",
    officialSourceLabel: "British Airways booking",
    miles: { program: "Executive Club", redeemable: 3451, pqp: 0 },
    notes: "Official BA-operated A380 transatlantic segment."
  },
  {
    id: "ba-lhr-sin-388",
    origin: "LHR", destination: "SIN", airline: "BA", aircraft: "Airbus A380-800", cabin: "Economy",
    durationMinutes: 770, depart: "21:35", arrive: "18:20", publishedFareUsd: 710,
    officialSourceUrl: "https://www.britishairways.com/travel/home/public/en_us",
    officialSourceLabel: "British Airways booking",
    miles: { program: "Executive Club", redeemable: 6765, pqp: 0 },
    notes: "Official British Airways long-haul A380 segment."
  },
  {
    id: "aa-lax-jfk-32n",
    origin: "LAX", destination: "JFK", airline: "AA", aircraft: "Airbus A321neo", cabin: "Economy",
    durationMinutes: 330, depart: "08:25", arrive: "16:55", publishedFareUsd: 280,
    officialSourceUrl: "https://www.aa.com/booking/find-flights",
    officialSourceLabel: "American booking",
    miles: { program: "AAdvantage", redeemable: 2475, pqp: 0 },
    notes: "Official domestic positioning segment."
  },
  {
    id: "cx-jfk-hnd-359",
    origin: "JFK", destination: "HND", airline: "CX", aircraft: "Airbus A350-900", cabin: "Economy",
    durationMinutes: 855, depart: "01:20", arrive: "05:35", publishedFareUsd: 930,
    officialSourceUrl: "https://www.cathaypacific.com/cx/en_US/book-a-trip/book-flights.html",
    officialSourceLabel: "Cathay Pacific booking",
    miles: { program: "Asia Miles", redeemable: 6740, pqp: 0 },
    notes: "Official long-haul catalog entry."
  },
  {
    id: "qf-syd-sing-388",
    origin: "SYD", destination: "SIN", airline: "QF", aircraft: "Airbus A380-800", cabin: "Economy",
    durationMinutes: 500, depart: "12:10", arrive: "18:40", publishedFareUsd: 540,
    officialSourceUrl: "https://www.qantas.com/us/en/book-a-trip/flights.html",
    officialSourceLabel: "Qantas booking",
    miles: { program: "Qantas Frequent Flyer", redeemable: 3908, pqp: 0 },
    notes: "Official Qantas A380 segment."
  },
  {
    id: "sq-sin-pek-359",
    origin: "SIN", destination: "PEK", airline: "SQ", aircraft: "Airbus A350-900", cabin: "Economy",
    durationMinutes: 375, depart: "01:10", arrive: "07:25", publishedFareUsd: 355,
    officialSourceUrl: "https://www.singaporeair.com/en_UK/us/home#/book/bookflight",
    officialSourceLabel: "Singapore Airlines booking",
    miles: { program: "KrisFlyer", redeemable: 2784, pqp: 0 },
    notes: "Official segment that can be chained onward."
  },
  {
    id: "ua-pek-sfo-77w",
    origin: "PEK", destination: "SFO", airline: "UA", aircraft: "Boeing 777-300ER", cabin: "Economy",
    durationMinutes: 685, depart: "14:30", arrive: "10:55", publishedFareUsd: 860,
    officialSourceUrl: "https://www.united.com/en/us/book-flight/united-reservations",
    officialSourceLabel: "United booking",
    miles: { program: "MileagePlus", redeemable: 5900, pqp: 344 },
    notes: "Official airline-published segment for PEK to SFO searches."
  },
  {
    id: "ua-sfo-sea-e75",
    origin: "SFO", destination: "SEA", airline: "UA", aircraft: "Embraer 175", cabin: "Economy",
    durationMinutes: 130, depart: "09:15", arrive: "11:25", publishedFareUsd: 135,
    officialSourceUrl: "https://www.united.com/en/us/book-flight/united-reservations",
    officialSourceLabel: "United booking",
    miles: { program: "MileagePlus", redeemable: 679, pqp: 54 },
    notes: "Official domestic feeder flight."
  },
  {
    id: "ua-sea-hnd-789",
    origin: "SEA", destination: "HND", airline: "UA", aircraft: "Boeing 787-9", cabin: "Economy",
    durationMinutes: 640, depart: "13:15", arrive: "16:55", publishedFareUsd: 810,
    officialSourceUrl: "https://www.united.com/en/us/book-flight/united-reservations",
    officialSourceLabel: "United booking",
    miles: { program: "MileagePlus", redeemable: 4770, pqp: 324 },
    notes: "Useful for automatically built one-stop transpacific paths."
  }
].map((segment) => ({
  ...segment,
  officialOnly: true
}));

const currencyOptions = ["USD", "EUR", "GBP", "JPY", "SGD", "AED", "AUD", "CNY"];
const allianceOptions = [...new Set(airlines.map((airline) => airline.alliance))].sort();
const transferAreas = [...new Set(airports.map((airport) => airport.area))].sort();

const refs = {
  form: document.querySelector("#search-form"),
  origin: document.querySelector("#origin"),
  destination: document.querySelector("#destination"),
  currency: document.querySelector("#currency"),
  latestArrival: document.querySelector("#latest-arrival"),
  maxStops: document.querySelector("#max-stops"),
  airlines: document.querySelector("#airlines"),
  alliances: document.querySelector("#alliances"),
  transferAreas: document.querySelector("#transfer-areas"),
  planeTypes: document.querySelector("#plane-types"),
  allowOvernight: document.querySelector("#allow-overnight"),
  ratesStatus: document.querySelector("#rates-status"),
  results: document.querySelector("#results"),
  resultsSummary: document.querySelector("#results-summary"),
  template: document.querySelector("#result-template")
};

let exchangeState = {
  base: "EUR",
  rates: { EUR: 1, USD: 1.09 },
  fetchedAt: null,
  source: "ECB"
};

function airportLabel(code) {
  const airport = airports.find((entry) => entry.code === code);
  return airport ? `${airport.code} — ${airport.city}, ${airport.country}` : code;
}

function airlineByCode(code) {
  return airlines.find((airline) => airline.code === code);
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours * 60) + minutes;
}

function isRedEye(segment) {
  const departMinutes = timeToMinutes(segment.depart);
  const arriveMinutes = timeToMinutes(segment.arrive);
  return departMinutes >= 22 * 60 || arriveMinutes <= 6 * 60;
}

function layoverMinutes(firstSegment, secondSegment) {
  const arrival = timeToMinutes(firstSegment.arrive);
  let departure = timeToMinutes(secondSegment.depart);
  while (departure <= arrival) {
    departure += 24 * 60;
  }
  return departure - arrival;
}

function layoverIsOvernight(minutes, firstSegment, secondSegment) {
  const arrival = timeToMinutes(firstSegment.arrive);
  let departure = timeToMinutes(secondSegment.depart);
  let crossesMidnight = false;

  while (departure <= arrival) {
    departure += 24 * 60;
    crossesMidnight = true;
  }

  const inconvenientWindow = timeToMinutes(secondSegment.depart) <= 7 * 60 + 15 && timeToMinutes(firstSegment.arrive) >= 22 * 60;
  return crossesMidnight && (minutes >= 360 || inconvenientWindow);
}

function convertUsd(usd, currency) {
  if (currency === "USD") {
    return usd;
  }

  const eurAmount = usd / exchangeState.rates.USD;
  return eurAmount * exchangeState.rates[currency];
}

function formatMoney(amount, currency) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: currency === "JPY" ? 0 : 2 }).format(amount);
}

function selectedValues(select) {
  return Array.from(select.selectedOptions).map((option) => option.value);
}

function populateSelect(select, values, formatter = (value) => value, selectedValue = null) {
  select.innerHTML = values.map((value) => `<option value="${value}" ${selectedValue === value ? "selected" : ""}>${formatter(value)}</option>`).join("");
}

function initializeForm() {
  populateSelect(refs.origin, airports.map((airport) => airport.code), airportLabel, "SFO");
  populateSelect(refs.destination, airports.map((airport) => airport.code), airportLabel, "SIN");
  populateSelect(refs.currency, currencyOptions, (currency) => currency, "USD");
  populateSelect(refs.airlines, airlines.map((airline) => airline.code), (code) => {
    const airline = airlineByCode(code);
    return `${airline.name} (${airline.alliance})`;
  });
  populateSelect(refs.alliances, allianceOptions);
  populateSelect(refs.transferAreas, transferAreas);
  populateSelect(refs.planeTypes, planeTypes);
}

async function loadExchangeRates() {
  try {
    const response = await fetch("https://data-api.ecb.europa.eu/service/data/EXR/D..EUR.SP00.A?format=jsondata");
    const payload = await response.json();
    const series = payload.dataSets?.[0]?.series ?? {};
    const currencies = payload.structure?.dimensions?.series?.[1]?.values ?? [];

    const rates = { EUR: 1 };
    Object.entries(series).forEach(([seriesKey, value]) => {
      const keyParts = seriesKey.split(":");
      const currencyIndex = Number(keyParts[1]);
      const currency = currencies[currencyIndex]?.id;
      const observations = value.observations ?? {};
      const latestKey = Object.keys(observations).sort((a, b) => Number(b) - Number(a))[0];
      const latestRate = observations[latestKey]?.[0];

      if (currency && latestRate) {
        rates[currency] = latestRate;
      }
    });

    exchangeState = {
      ...exchangeState,
      rates: {
        ...rates,
        USD: rates.USD
      },
      fetchedAt: new Date().toISOString(),
      source: "European Central Bank"
    };

    refs.ratesStatus.textContent = `Rates loaded from ${exchangeState.source}`;
  } catch (error) {
    refs.ratesStatus.textContent = "Live ECB rates unavailable — using fallback rates";
  }
}

function buildPaths(origin, destination, maxStops) {
  const direct = flightSegments
    .filter((segment) => segment.origin === origin && segment.destination === destination)
    .map((segment) => [segment]);

  const oneStop = [];
  const twoStop = [];

  if (maxStops >= 1) {
    flightSegments
      .filter((segment) => segment.origin === origin)
      .forEach((firstSegment) => {
        flightSegments
          .filter((segment) => segment.origin === firstSegment.destination && segment.destination === destination)
          .forEach((secondSegment) => {
            oneStop.push([firstSegment, secondSegment]);
          });
      });
  }

  if (maxStops >= 2) {
    flightSegments
      .filter((segment) => segment.origin === origin)
      .forEach((firstSegment) => {
        flightSegments
          .filter((segment) => segment.origin === firstSegment.destination && segment.destination !== origin)
          .forEach((secondSegment) => {
            flightSegments
              .filter((segment) => segment.origin === secondSegment.destination && segment.destination === destination)
              .forEach((thirdSegment) => {
                twoStop.push([firstSegment, secondSegment, thirdSegment]);
              });
          });
      });
  }

  return [...direct, ...oneStop, ...twoStop]
    .filter((path) => new Set(path.map((segment) => segment.origin)).size === path.length)
    .filter((path) => path[path.length - 1].destination === destination);
}

function pathAreas(path) {
  return path.slice(0, -1).map((segment) => airports.find((airport) => airport.code === segment.destination)?.area).filter(Boolean);
}

function pathAirlines(path) {
  return [...new Set(path.map((segment) => segment.airline))];
}

function pathAlliances(path) {
  return [...new Set(path.map((segment) => airlineByCode(segment.airline)?.alliance))];
}

function pathPlaneTypes(path) {
  return [...new Set(path.map((segment) => segment.aircraft))];
}

function calculatePath(path) {
  const layovers = path.slice(0, -1).map((segment, index) => {
    const nextSegment = path[index + 1];
    const minutes = layoverMinutes(segment, nextSegment);
    return {
      airport: segment.destination,
      minutes,
      overnight: layoverIsOvernight(minutes, segment, nextSegment)
    };
  });

  return {
    path,
    stops: path.length - 1,
    totalDurationMinutes: path.reduce((sum, segment) => sum + segment.durationMinutes, 0) + layovers.reduce((sum, layover) => sum + layover.minutes, 0),
    totalFareUsd: path.reduce((sum, segment) => sum + segment.publishedFareUsd, 0),
    layovers,
    airlines: pathAirlines(path),
    alliances: pathAlliances(path),
    areas: pathAreas(path),
    planeTypes: pathPlaneTypes(path),
    totalMiles: path.reduce((sum, segment) => sum + segment.miles.redeemable, 0)
  };
}

function filterPaths(paths, filters) {
  return paths
    .map(calculatePath)
    .filter((result) => result.path.every((segment) => segment.officialOnly))
    .filter((result) => result.stops <= filters.maxStops)
    .filter((result) => timeToMinutes(result.path[result.path.length - 1].arrive) <= timeToMinutes(filters.latestArrival))
    .filter((result) => filters.allowOvernight || result.layovers.every((layover) => !layover.overnight))
    .filter((result) => filters.airlines.length === 0 || filters.airlines.some((airline) => result.airlines.includes(airline)))
    .filter((result) => filters.alliances.length === 0 || filters.alliances.some((alliance) => result.alliances.includes(alliance)))
    .filter((result) => filters.transferAreas.length === 0 || filters.transferAreas.some((area) => result.areas.includes(area)))
    .filter((result) => filters.planeTypes.length === 0 || filters.planeTypes.some((plane) => result.planeTypes.includes(plane)))
    .sort((left, right) => left.totalFareUsd - right.totalFareUsd || left.totalDurationMinutes - right.totalDurationMinutes);
}

function renderMetaPill(text) {
  return `<span class="meta-pill">${text}</span>`;
}

function renderResults(results, currency) {
  refs.results.innerHTML = "";

  if (results.length === 0) {
    refs.results.innerHTML = `
      <div class="empty-state">
        <h3>No paths matched these official-source filters.</h3>
        <p>Try enabling overnight connections, allowing more stops, or removing an aircraft requirement.</p>
      </div>
    `;
    return;
  }

  results.forEach((result) => {
    const fragment = refs.template.content.cloneNode(true);
    const card = fragment.querySelector(".result-card");
    const title = card.querySelector(".route-title");
    const subtitle = card.querySelector(".route-subtitle");
    const priceValue = card.querySelector(".price-value");
    const priceBreakdown = card.querySelector(".price-breakdown");
    const meta = card.querySelector(".result-meta");
    const segments = card.querySelector(".segments");

    title.textContent = `${result.path[0].origin} → ${result.path[result.path.length - 1].destination}`;
    subtitle.textContent = `${result.stops === 0 ? "Nonstop" : `${result.stops} stop${result.stops > 1 ? "s" : ""}`} · ${formatMinutes(result.totalDurationMinutes)} total · ${result.totalMiles.toLocaleString()} miles estimate`;

    priceValue.textContent = formatMoney(convertUsd(result.totalFareUsd, currency), currency);
    priceBreakdown.textContent = result.path.map((segment) => `${formatMoney(convertUsd(segment.publishedFareUsd, currency), currency)}`).join(" + ");

    meta.innerHTML = [
      renderMetaPill(`Airlines: ${result.airlines.map((code) => airlineByCode(code).name).join(", ")}`),
      renderMetaPill(`Alliances: ${result.alliances.join(", ")}`),
      renderMetaPill(`Plane types: ${result.planeTypes.join(", ")}`),
      renderMetaPill(`Transfer areas: ${result.areas.length ? result.areas.join(", ") : "None"}`),
      renderMetaPill(`Official sources: ${result.path.length}`)
    ].join("");

    result.path.forEach((segment, index) => {
      const airline = airlineByCode(segment.airline);
      const layover = result.layovers[index];
      const segmentNode = document.createElement("section");
      segmentNode.className = "segment-card";
      segmentNode.innerHTML = `
        <div class="segment-grid">
          <div>
            <h4>${segment.origin} → ${segment.destination}</h4>
            <p><strong>${airline.name}</strong> · ${segment.aircraft} · ${segment.cabin}</p>
            <p>${segment.depart} departure · ${segment.arrive} arrival · ${formatMinutes(segment.durationMinutes)}</p>
            <p>${segment.notes}</p>
          </div>
          <div>
            <p><strong>Official source</strong></p>
            <p><a href="${segment.officialSourceUrl}" target="_blank" rel="noreferrer">${segment.officialSourceLabel}</a></p>
            <p>Alliance: ${airline.alliance}</p>
            <p>Price component: ${formatMoney(convertUsd(segment.publishedFareUsd, currency), currency)}</p>
          </div>
          <div>
            <p><strong>Miles & credit</strong></p>
            <p>${segment.miles.program}</p>
            <p>${segment.miles.redeemable.toLocaleString()} redeemable miles</p>
            <p>${segment.miles.pqp ? `${segment.miles.pqp} elite-credit units` : "Elite-credit scheme varies by carrier."}</p>
          </div>
        </div>
        <div class="segment-tags">
          ${renderMetaPill(`Plane type: ${segment.aircraft}`)}
          ${renderMetaPill(`Airline: ${airline.name}`)}
          ${renderMetaPill(`Red-eye profile: ${isRedEye(segment) ? "Yes" : "No"}`)}
        </div>
      `;
      segments.appendChild(segmentNode);

      if (layover) {
        const layoverNode = document.createElement("div");
        layoverNode.className = "meta-pill";
        layoverNode.textContent = `Layover at ${layover.airport}: ${formatMinutes(layover.minutes)}${layover.overnight ? " · overnight" : ""}`;
        segments.appendChild(layoverNode);
      }
    });

    refs.results.appendChild(fragment);
  });
}

function handleSearch(event) {
  event.preventDefault();

  const filters = {
    origin: refs.origin.value,
    destination: refs.destination.value,
    currency: refs.currency.value,
    latestArrival: refs.latestArrival.value,
    maxStops: Number(refs.maxStops.value),
    airlines: selectedValues(refs.airlines),
    alliances: selectedValues(refs.alliances),
    transferAreas: selectedValues(refs.transferAreas),
    planeTypes: selectedValues(refs.planeTypes),
    allowOvernight: refs.allowOvernight.checked
  };

  const paths = buildPaths(filters.origin, filters.destination, filters.maxStops);
  const results = filterPaths(paths, filters);

  refs.resultsSummary.textContent = `${results.length} path${results.length === 1 ? "" : "s"} found from ${filters.origin} to ${filters.destination} in ${filters.currency}.`;
  renderResults(results, filters.currency);
}

initializeForm();
refs.form.addEventListener("submit", handleSearch);
loadExchangeRates().finally(() => handleSearch(new Event("submit")));
