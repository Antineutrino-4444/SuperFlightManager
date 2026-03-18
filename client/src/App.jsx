import React, { useState, useEffect } from 'react';
import AirportInput from './components/AirportInput';
import FilterPanel from './components/FilterPanel';
import ItineraryCard from './components/ItineraryCard';
import { searchFlights, fetchCurrencies, fetchDiagnostics } from './services/api';

export default function App() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [currency, setCurrency] = useState('USD');
  const [currencies, setCurrencies] = useState([]);
  const [filters, setFilters] = useState({ maxStops: 2 });
  const [sortBy, setSortBy] = useState('price');

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [showDiag, setShowDiag] = useState(false);

  useEffect(() => {
    fetchCurrencies().then(setCurrencies);
  }, []);

  async function handleSearch() {
    if (!origin || !destination || !date) {
      setError('Please fill in origin, destination, and date.');
      return;
    }
    if (origin === destination) {
      setError('Origin and destination must be different.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const data = await searchFlights({
        origin,
        destination,
        date,
        currency,
        filters: { ...filters, sortBy },
      });
      setResults(data);
    } catch (err) {
      setError(err.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDiagnostics() {
    setDiagLoading(true);
    try {
      const data = await fetchDiagnostics();
      setDiagnostics(data);
      setShowDiag(true);
    } catch (err) {
      setDiagnostics({ healthy: false, checks: [{ name: 'Connection', status: 'error', detail: err.message }] });
      setShowDiag(true);
    } finally {
      setDiagLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div onKeyDown={handleKeyDown}>
      {/* Header */}
      <header className="header">
        <div>
          <h1>SuperFlightManager</h1>
          <div className="header-subtitle">Smart flight search with custom path building</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="diag-btn"
            onClick={handleDiagnostics}
            disabled={diagLoading}
          >
            {diagLoading ? 'Testing...' : 'Test Connections'}
          </button>
          <div className="currency-selector">
            <label>Currency:</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}>
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Diagnostics Modal */}
      {showDiag && diagnostics && (
        <div className="diag-overlay" onClick={() => setShowDiag(false)}>
          <div className="diag-modal" onClick={e => e.stopPropagation()}>
            <div className="diag-header">
              <h3>System Diagnostics</h3>
              <span className={`diag-status ${diagnostics.healthy ? 'healthy' : 'unhealthy'}`}>
                {diagnostics.healthy ? 'All Systems OK' : 'Issues Detected'}
              </span>
              <button onClick={() => setShowDiag(false)} className="diag-close">&times;</button>
            </div>
            <div className="diag-body">
              {diagnostics.checks.map((check, i) => (
                <div key={i} className={`diag-check diag-${check.status}`}>
                  <span className="diag-icon">
                    {check.status === 'ok' ? '\u2713' : check.status === 'error' ? '\u2717' : check.status === 'warning' ? '!' : 'i'}
                  </span>
                  <div>
                    <div className="diag-name">{check.name}</div>
                    <div className="diag-detail">{check.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-container">
        {/* Left: Search & Filters */}
        <div className="search-panel">
          <h2>Search Flights</h2>

          <AirportInput
            label="From"
            value={origin}
            onChange={setOrigin}
            placeholder="e.g., PEK, Beijing..."
          />

          <AirportInput
            label="To"
            value={destination}
            onChange={setDestination}
            placeholder="e.g., SFO, San Francisco..."
          />

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button
            className="search-btn"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search Flights'}
          </button>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {error}
            </div>
          )}

          {/* Filters */}
          <FilterPanel filters={filters} onChange={setFilters} />
        </div>

        {/* Right: Results */}
        <div className="results-panel">
          {!searched && !loading && (
            <div className="empty-state">
              <div className="icon">&#9992;</div>
              <h3>Search for flights</h3>
              <p>
                Enter your origin, destination, and travel date. SuperFlightManager will find direct
                flights and automatically build connecting itineraries with up to 3 stops.
              </p>
            </div>
          )}

          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <div>Searching flights and building itineraries...</div>
            </div>
          )}

          {results && !loading && (
            <>
              <div className="results-header">
                <div>
                  <h2>
                    {results.origin.city} ({results.origin.code}) to {results.destination.city} ({results.destination.code})
                  </h2>
                  <span className="results-count">
                    {results.resultCount} itineraries found
                    {results.diagnostics && results.diagnostics.totalGenerated > results.resultCount && (
                      <span style={{ color: 'var(--text-light)', marginLeft: '0.5rem' }}>
                        ({results.diagnostics.totalGenerated} generated, {results.diagnostics.totalAfterFilter} after filters)
                      </span>
                    )}
                  </span>
                </div>
                <div className="sort-controls">
                  <label>Sort by:</label>
                  <select value={sortBy} onChange={e => { setSortBy(e.target.value); }}>
                    <option value="price">Price (lowest)</option>
                    <option value="duration">Duration (shortest)</option>
                    <option value="stops">Stops (fewest)</option>
                    <option value="departure">Departure (earliest)</option>
                  </select>
                </div>
              </div>

              {results.results.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">&#128269;</div>
                  <h3>No flights found</h3>
                  {results.diagnostics ? (
                    <div className="no-results-detail">
                      <p className="no-results-reason">{results.diagnostics.noResultsReason}</p>
                      <div className="no-results-info">
                        <div className="no-results-row">
                          <span className="no-results-label">Data Source:</span>
                          <span>{results.diagnostics.dataSource}</span>
                        </div>
                        <div className="no-results-row">
                          <span className="no-results-label">Itineraries Generated:</span>
                          <span>{results.diagnostics.totalGenerated}</span>
                        </div>
                        <div className="no-results-row">
                          <span className="no-results-label">After Filters:</span>
                          <span>{results.diagnostics.totalAfterFilter}</span>
                        </div>
                        {results.diagnostics.filtersApplied.length > 0 && (
                          <div className="no-results-row">
                            <span className="no-results-label">Active Filters:</span>
                            <span>{results.diagnostics.filtersApplied.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p>Try adjusting your filters or search criteria.</p>
                  )}
                </div>
              ) : (
                results.results.map(it => (
                  <ItineraryCard
                    key={it.id}
                    itinerary={it}
                    currency={currency}
                    currencies={currencies}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
