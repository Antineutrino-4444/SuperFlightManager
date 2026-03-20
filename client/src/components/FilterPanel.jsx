import React, { useState, useEffect } from 'react';
import { fetchAircraft, fetchAirlines, fetchRegions, fetchAircraftFamilies } from '../services/api';

function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="filter-section">
      <h3 onClick={() => setOpen(!open)}>
        {title}
        <span className="toggle">{open ? 'Hide' : 'Show'}</span>
      </h3>
      <div className={`filter-content ${open ? '' : 'collapsed'}`}>
        {children}
      </div>
    </div>
  );
}

export default function FilterPanel({ filters, onChange }) {
  const [aircraft, setAircraft] = useState([]);
  const [families, setFamilies] = useState({});
  const [airlines, setAirlines] = useState([]);
  const [regions, setRegions] = useState({ continents: [], regions: [] });
  const [aircraftSearch, setAircraftSearch] = useState('');
  const [airlineSearch, setAirlineSearch] = useState('');
  const [aircraftMode, setAircraftMode] = useState('family'); // 'family' or 'individual'

  useEffect(() => {
    fetchAircraft().then(setAircraft);
    fetchAircraftFamilies().then(setFamilies);
    fetchAirlines().then(setAirlines);
    fetchRegions().then(setRegions);
  }, []);

  const updateFilter = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleArrayItem = (key, item) => {
    const arr = filters[key] || [];
    const newArr = arr.includes(item)
      ? arr.filter(x => x !== item)
      : [...arr, item];
    updateFilter(key, newArr);
  };

  const familyList = Object.values(families);
  const filteredFamilies = familyList.filter(f =>
    !aircraftSearch || f.family.toLowerCase().includes(aircraftSearch.toLowerCase()) ||
    f.manufacturer.toLowerCase().includes(aircraftSearch.toLowerCase())
  );

  const filteredAircraft = aircraft.filter(a =>
    !aircraftSearch || a.model.toLowerCase().includes(aircraftSearch.toLowerCase()) ||
    a.manufacturer.toLowerCase().includes(aircraftSearch.toLowerCase()) ||
    a.code.toLowerCase().includes(aircraftSearch.toLowerCase())
  );

  const filteredAirlines = airlines.filter(a =>
    !airlineSearch || a.name.toLowerCase().includes(airlineSearch.toLowerCase()) ||
    a.code.toLowerCase().includes(airlineSearch.toLowerCase())
  );

  const alliances = ['Star Alliance', 'oneworld', 'SkyTeam', 'None'];

  const hasAircraftFilter = (filters.aircraftTypes || []).length > 0 || (filters.aircraftFamilies || []).length > 0;

  return (
    <>
      {/* Max Stops */}
      <CollapsibleSection title="Stops" defaultOpen={true}>
        <div className="form-group">
          <select
            value={filters.maxStops ?? 2}
            onChange={e => updateFilter('maxStops', parseInt(e.target.value))}
          >
            <option value={0}>Direct only</option>
            <option value={1}>Up to 1 stop</option>
            <option value={2}>Up to 2 stops</option>
            <option value={3}>Up to 3 stops</option>
          </select>
        </div>
      </CollapsibleSection>

      {/* Aircraft Type */}
      <CollapsibleSection title="Aircraft Type">
        <div className="aircraft-mode-toggle">
          <button
            className={aircraftMode === 'family' ? 'active' : ''}
            onClick={() => setAircraftMode('family')}
          >
            By Family
          </button>
          <button
            className={aircraftMode === 'individual' ? 'active' : ''}
            onClick={() => setAircraftMode('individual')}
          >
            Individual
          </button>
        </div>
        <input
          type="text"
          placeholder={aircraftMode === 'family' ? 'Search families...' : 'Search aircraft...'}
          value={aircraftSearch}
          onChange={e => setAircraftSearch(e.target.value)}
          style={{ width: '100%', padding: '0.3rem 0.5rem', marginBottom: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.8rem' }}
        />

        {aircraftMode === 'family' ? (
          <div className="checkbox-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filteredFamilies.map(fam => (
              <label key={fam.family} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(filters.aircraftFamilies || []).includes(fam.family)}
                  onChange={() => toggleArrayItem('aircraftFamilies', fam.family)}
                />
                <span>{fam.manufacturer} {fam.family}</span>
                <span style={{ color: 'var(--text-light)', fontSize: '0.7rem' }}>
                  ({fam.codes.length} variant{fam.codes.length > 1 ? 's' : ''})
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="checkbox-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filteredAircraft.map(ac => (
              <label key={ac.code + ac.model} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(filters.aircraftTypes || []).includes(ac.code)}
                  onChange={() => toggleArrayItem('aircraftTypes', ac.code)}
                />
                <span>{ac.model}</span>
                <span style={{ color: 'var(--text-light)', fontSize: '0.7rem' }}>({ac.category})</span>
              </label>
            ))}
          </div>
        )}

        {hasAircraftFilter && (
          <button
            onClick={() => {
              onChange({ ...filters, aircraftTypes: [], aircraftFamilies: [] });
            }}
            style={{ marginTop: '0.3rem', fontSize: '0.7rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clear aircraft filter
          </button>
        )}
      </CollapsibleSection>

      {/* Alliance */}
      <CollapsibleSection title="Alliance">
        <div className="checkbox-group">
          {alliances.map(al => (
            <label key={al} className="checkbox-item">
              <input
                type="checkbox"
                checked={(filters.alliances || []).includes(al)}
                onChange={() => toggleArrayItem('alliances', al)}
              />
              <span>{al === 'None' ? 'Non-alliance' : al}</span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Airlines */}
      <CollapsibleSection title="Airlines">
        <input
          type="text"
          placeholder="Search airlines..."
          value={airlineSearch}
          onChange={e => setAirlineSearch(e.target.value)}
          style={{ width: '100%', padding: '0.3rem 0.5rem', marginBottom: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.8rem' }}
        />
        <div className="checkbox-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {filteredAirlines.map(al => (
            <label key={al.code} className="checkbox-item">
              <input
                type="checkbox"
                checked={(filters.airlines || []).includes(al.code)}
                onChange={() => toggleArrayItem('airlines', al.code)}
              />
              <span>{al.code} - {al.name}</span>
            </label>
          ))}
        </div>
        {(filters.airlines || []).length > 0 && (
          <button
            onClick={() => updateFilter('airlines', [])}
            style={{ marginTop: '0.3rem', fontSize: '0.7rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clear airline filter
          </button>
        )}
      </CollapsibleSection>

      {/* Transfer Area */}
      <CollapsibleSection title="Transfer Area">
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>By Continent</label>
          <div className="checkbox-group">
            {regions.continents.map(c => (
              <label key={c} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(filters.transferContinents || []).includes(c)}
                  onChange={() => toggleArrayItem('transferContinents', c)}
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>By Region</label>
          <div className="checkbox-group" style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {regions.regions.map(r => (
              <label key={r} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(filters.transferRegions || []).includes(r)}
                  onChange={() => toggleArrayItem('transferRegions', r)}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Overnight Layover */}
      <CollapsibleSection title="Overnight Layover">
        <label className="checkbox-item" style={{ marginBottom: '0.5rem' }}>
          <input
            type="checkbox"
            checked={filters.allowOvernight !== false}
            onChange={e => updateFilter('allowOvernight', e.target.checked)}
          />
          <span>Allow overnight layovers</span>
        </label>
        <div style={{ marginTop: '0.5rem' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Customize "overnight" definition
          </label>
          <div className="overnight-config">
            <div>
              <label>Night starts (hour)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={filters.overnightConfig?.nightStartHour ?? 0}
                onChange={e => updateFilter('overnightConfig', {
                  ...filters.overnightConfig,
                  nightStartHour: parseInt(e.target.value),
                })}
              />
            </div>
            <div>
              <label>Night ends (hour)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={filters.overnightConfig?.nightEndHour ?? 6}
                onChange={e => updateFilter('overnightConfig', {
                  ...filters.overnightConfig,
                  nightEndHour: parseInt(e.target.value),
                })}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Min overlap (minutes)</label>
              <input
                type="number"
                min="0"
                max="480"
                value={filters.overnightConfig?.minNightOverlapMinutes ?? 120}
                onChange={e => updateFilter('overnightConfig', {
                  ...filters.overnightConfig,
                  minNightOverlapMinutes: parseInt(e.target.value),
                })}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Price & Time */}
      <CollapsibleSection title="Price & Time">
        <div className="form-group">
          <label>Max Price (USD)</label>
          <input
            type="number"
            placeholder="No limit"
            value={filters.maxPrice || ''}
            onChange={e => updateFilter('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>
        <div className="form-group">
          <label>Latest Arrival (HH:MM)</label>
          <input
            type="time"
            value={filters.latestArrival || ''}
            onChange={e => updateFilter('latestArrival', e.target.value || undefined)}
          />
        </div>
      </CollapsibleSection>
    </>
  );
}
