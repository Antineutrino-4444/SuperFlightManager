import React, { useState } from 'react';

function formatTime(isoString) {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

function formatPrice(amount, currency, currencies) {
  const info = currencies.find(c => c.code === currency);
  const symbol = info ? info.symbol : currency + ' ';

  if (['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'COP'].includes(currency)) {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function FlightLegDetail({ leg, currency, currencies }) {
  return (
    <div className="leg-detail-panel">
      <div className="leg-detail-grid">
        <div className="leg-detail-section">
          <h4>Flight Info</h4>
          <div className="detail-row"><span>Flight</span><span>{leg.flightNumber}</span></div>
          <div className="detail-row"><span>Airline</span><span>{leg.airlineName}</span></div>
          <div className="detail-row"><span>Alliance</span><span>{leg.alliance || 'None'}</span></div>
          <div className="detail-row"><span>Fare Class</span><span>{leg.fareClass}</span></div>
        </div>
        <div className="leg-detail-section">
          <h4>Aircraft</h4>
          <div className="detail-row"><span>Model</span><span>{leg.aircraftModel}</span></div>
          <div className="detail-row"><span>Type Code</span><span>{leg.aircraft}</span></div>
          <div className="detail-row"><span>Category</span><span>{leg.aircraftCategory}</span></div>
        </div>
        <div className="leg-detail-section">
          <h4>Route</h4>
          <div className="detail-row">
            <span>From</span>
            <span>{leg.originCity} ({leg.origin})</span>
          </div>
          <div className="detail-row">
            <span>To</span>
            <span>{leg.destinationCity} ({leg.destination})</span>
          </div>
          <div className="detail-row"><span>Distance</span><span>{leg.distanceMiles.toLocaleString()} mi / {leg.distanceKm.toLocaleString()} km</span></div>
          <div className="detail-row"><span>Duration</span><span>{formatDuration(leg.durationMinutes)}</span></div>
        </div>
        <div className="leg-detail-section">
          <h4>Pricing & Loyalty</h4>
          <div className="detail-row">
            <span>Leg Price</span>
            <span>{formatPrice(leg.displayPrice || leg.priceUSD, leg.displayCurrency || currency, currencies)}</span>
          </div>
          <div className="detail-row"><span>Loyalty Program</span><span>{leg.loyaltyProgram}</span></div>
          <div className="detail-row"><span>Est. Miles Earned</span><span>{leg.estimatedMiles.toLocaleString()}</span></div>
          <div className="detail-row"><span>Source</span><span>{leg.source}</span></div>
        </div>
      </div>
    </div>
  );
}

export default function ItineraryCard({ itinerary, currency, currencies }) {
  const it = itinerary;
  const firstLeg = it.legs[0];
  const lastLeg = it.legs[it.legs.length - 1];
  const [expandedLegs, setExpandedLegs] = useState({});

  const toggleLeg = (legId) => {
    setExpandedLegs(prev => ({ ...prev, [legId]: !prev[legId] }));
  };

  return (
    <div className="itinerary-card">
      {/* Header */}
      <div className="itinerary-header">
        <div>
          <div className="itinerary-route">
            <span>{firstLeg.origin}</span>
            <span className="arrow">
              {it.stops === 0 ? '---' : `- ${it.stops} stop${it.stops > 1 ? 's' : ''} -`}
            </span>
            <span>{lastLeg.destination}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
            {it.stops === 0 && <span className="tag tag-direct">Direct</span>}
            {it.itineraryType === 'self-constructed' ? (
              <span className="tag tag-self-constructed">Self-Constructed</span>
            ) : (
              <span className="tag tag-source">Airline Offered</span>
            )}
            {it.alliances.filter(a => a !== 'None').map(a => (
              <span key={a} className="tag tag-alliance">{a}</span>
            ))}
            {it.hasOvernightLayover && <span className="tag tag-overnight">Overnight</span>}
          </div>
        </div>
        <div className="itinerary-price">
          {it.priceUnavailable ? (
            <div className="total price-unavailable">Price unavailable</div>
          ) : (
            <div className="total">
              {formatPrice(it.displayPrice, it.displayCurrency || currency, currencies)}
            </div>
          )}
          {it.stops > 0 && !it.priceUnavailable && (
            <div className="breakdown">
              {it.priceBreakdown.map((p, i) => {
                const currInfo = currencies.find(c => c.code === (it.displayCurrency || currency));
                const sym = currInfo ? currInfo.symbol : '$';
                return (
                  <span key={i}>
                    {i > 0 ? ' + ' : ''}{sym}{p}
                  </span>
                );
              })}
            </div>
          )}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
            Total: {formatDuration(it.totalDurationMinutes)}
          </div>
        </div>
      </div>

      {/* Body - Flight Legs */}
      <div className="itinerary-body">
        {it.legs.map((leg, idx) => (
          <React.Fragment key={leg.id}>
            {/* Layover bar between legs */}
            {idx > 0 && it.layovers[idx - 1] && (
              <div className={`layover-bar ${it.layovers[idx - 1].isOvernight ? 'overnight' : ''}`}>
                <span>Layover in <strong>{it.layovers[idx - 1].city}</strong> ({it.layovers[idx - 1].airport})</span>
                <span>{formatDuration(it.layovers[idx - 1].durationMinutes)}</span>
                {it.layovers[idx - 1].isOvernight && <span>Overnight</span>}
              </div>
            )}

            <div
              className={`flight-leg ${expandedLegs[leg.id] ? 'expanded' : ''}`}
              onClick={() => toggleLeg(leg.id)}
              title="Click for flight details"
            >
              <div className="leg-time">
                <div className="time">{formatTime(leg.departureTime)}</div>
                <div className="date-label">{formatDate(leg.departureTime)}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{leg.origin}</div>
              </div>

              <div className="leg-visual">
                <div className="leg-line"></div>
                <div className="leg-duration">
                  {formatDuration(leg.durationMinutes)}
                  <br />
                  <span style={{ fontSize: '0.65rem' }}>{leg.distanceMiles} mi</span>
                  <br />
                  <span className="leg-expand-hint">
                    {expandedLegs[leg.id] ? 'click to collapse' : 'click for details'}
                  </span>
                </div>
                <div className="leg-line"></div>
              </div>

              <div className="leg-time">
                <div className="time">{formatTime(leg.arrivalTime)}</div>
                <div className="date-label">{formatDate(leg.arrivalTime)}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{leg.destination}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                <div className="leg-info">
                  <div className="airline">{leg.airlineName}</div>
                  <div className="flight-number">{leg.flightNumber}</div>
                </div>
                <div className="leg-aircraft">
                  <div className="model">{leg.aircraftModel}</div>
                  <div className="category">{leg.aircraftCategory}</div>
                </div>
              </div>
            </div>

            {/* Expanded detail panel */}
            {expandedLegs[leg.id] && (
              <FlightLegDetail leg={leg} currency={currency} currencies={currencies} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Footer - Miles & Source */}
      <div className="itinerary-footer">
        <div className="miles-info">
          <div className="miles-item">
            <span className="miles-label">Est. Miles Earned</span>
            <span className="miles-value">{it.totalEstimatedMiles.toLocaleString()} miles</span>
          </div>
          <div className="miles-item">
            <span className="miles-label">Distance</span>
            <span className="miles-value">{it.totalDistanceMiles.toLocaleString()} mi / {it.totalDistanceKm.toLocaleString()} km</span>
          </div>
          <div className="miles-item">
            <span className="miles-label">Loyalty Program(s)</span>
            <span className="miles-value">
              {[...new Set(it.legs.map(l => l.loyaltyProgram).filter(Boolean))].join(', ') || 'N/A'}
            </span>
          </div>
        </div>
        <div className="source-info">
          {it.itineraryType === 'self-constructed'
            ? 'Self-constructed itinerary — individual flights combined by SuperFlightManager'
            : `Airline-offered itinerary via ${[...new Set(it.legs.map(l => l.source))].join(', ')}`}
          {it.legs.some(l => l.operatedBy) && (
            <span> | Operated by: {[...new Set(it.legs.filter(l => l.operatedBy).map(l => l.operatedBy))].join(', ')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
