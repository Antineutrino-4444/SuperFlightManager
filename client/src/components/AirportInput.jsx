import React, { useState, useEffect, useRef } from 'react';
import { fetchAirports } from '../services/api';

export default function AirportInput({ value, onChange, label, placeholder }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      fetchAirports(value).then(results => {
        const match = results.find(a => a.code === value);
        if (match) setDisplayValue(`${match.code} - ${match.city}`);
      });
    } else {
      setDisplayValue('');
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleInput(e) {
    const q = e.target.value;
    setQuery(q);
    setDisplayValue(q);
    if (q.length >= 1) {
      const results = await fetchAirports(q);
      setSuggestions(results);
      setOpen(true);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }

  function selectAirport(airport) {
    onChange(airport.code);
    setDisplayValue(`${airport.code} - ${airport.city}`);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="airport-input-wrapper" ref={wrapperRef}>
        <input
          type="text"
          value={displayValue}
          onChange={handleInput}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          placeholder={placeholder || 'Type city or airport code...'}
        />
        {open && suggestions.length > 0 && (
          <div className="airport-dropdown">
            {suggestions.map(a => (
              <div key={a.code} className="airport-option" onClick={() => selectAirport(a)}>
                <span className="code">{a.code}</span>
                <span className="city">{a.city} - {a.name}</span>
                <span className="country">{a.country}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
