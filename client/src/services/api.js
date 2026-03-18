const API_BASE = '/api';

export async function searchFlights(params) {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Search failed');
  }
  return res.json();
}

export async function fetchAirports(query = '') {
  const res = await fetch(`${API_BASE}/airports?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function fetchAirlines() {
  const res = await fetch(`${API_BASE}/airlines`);
  return res.json();
}

export async function fetchAlliances() {
  const res = await fetch(`${API_BASE}/alliances`);
  return res.json();
}

export async function fetchAircraft() {
  const res = await fetch(`${API_BASE}/aircraft`);
  return res.json();
}

export async function fetchCurrencies() {
  const res = await fetch(`${API_BASE}/currencies`);
  return res.json();
}

export async function fetchRegions() {
  const res = await fetch(`${API_BASE}/regions`);
  return res.json();
}

export async function fetchAircraftFamilies() {
  const res = await fetch(`${API_BASE}/aircraft-families`);
  return res.json();
}

export async function fetchDiagnostics() {
  const res = await fetch(`${API_BASE}/diagnostics`);
  return res.json();
}
