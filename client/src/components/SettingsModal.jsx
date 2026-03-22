import React, { useState, useEffect } from 'react';
import { fetchSettings, saveSettings as apiSaveSettings, testConnection } from '../services/api';

export default function SettingsModal({ onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);
  // Track if user has typed a new key (vs displaying the masked saved key)
  const [keyModified, setKeyModified] = useState(false);

  useEffect(() => {
    fetchSettings().then(data => {
      setApiKey(data.serpApiKey || '');
      setConfigured(data.serpApiConfigured);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function handleKeyChange(e) {
    setApiKey(e.target.value);
    setKeyModified(true);
  }

  async function handleSave() {
    // Don't save if the key wasn't modified (it would save the masked version)
    if (!keyModified) {
      setSaveMsg({ ok: true, text: 'No changes to save.' });
      return;
    }

    setSaving(true);
    setSaveMsg(null);
    setTestResult(null);
    try {
      const result = await apiSaveSettings({
        serpApiKey: apiKey,
      });
      setConfigured(result.serpApiConfigured);
      // Don't replace the input with the masked key — keep what user typed
      // Just show the masked version to confirm it saved
      setSaveMsg({ ok: true, text: 'API key saved successfully.' });
      setKeyModified(false);
    } catch (err) {
      setSaveMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection();
      setTestResult(result);
    } catch (err) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setTesting(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    setSaveMsg(null);
    setTestResult(null);
    try {
      await apiSaveSettings({
        serpApiKey: '',
      });
      setApiKey('');
      setConfigured(false);
      setKeyModified(false);
      setSaveMsg({ ok: true, text: 'API key cleared.' });
    } catch (err) {
      setSaveMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="status-overlay" onClick={onClose}>
      <div className="status-modal settings-modal" onClick={e => e.stopPropagation()}>
        <div className="status-modal-header">
          <h3>Settings</h3>
          <button onClick={onClose} className="status-close">&times;</button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div className="status-body">
            {/* Current status banner */}
            <div className={`settings-status-banner ${configured ? 'configured' : 'not-configured'}`}>
              {configured
                ? 'SerpApi is configured — searches return real Google Flights data'
                : 'No API key configured — add your SerpApi key below to search flights'}
            </div>

            {/* SerpApi Section */}
            <div className="settings-section">
              <h4>Google Flights via SerpApi</h4>
              <p className="settings-help">
                Get real flight data from Google Flights via SerpApi. Free tier includes
                250 searches/month with no credit card required.
              </p>

              <div className="settings-instructions">
                <strong>How to get your API key (free, takes 1 minute):</strong>
                <ol>
                  <li>Go to <a href="https://serpapi.com/users/sign_up" target="_blank" rel="noopener noreferrer">serpapi.com/users/sign_up</a></li>
                  <li>Create a free account (no credit card needed)</li>
                  <li>Your API key is shown on the <a href="https://serpapi.com/dashboard" target="_blank" rel="noopener noreferrer">dashboard</a> after sign-in</li>
                  <li>Paste the API key below and click Save</li>
                </ol>
                <div className="settings-pricing-note">
                  <strong>Pricing:</strong> Free plan includes 250 searches/month.
                  Data comes directly from Google Flights — same prices, airlines, and routes you see on google.com/travel/flights.
                </div>
              </div>

              <div className="settings-field">
                <label>API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={handleKeyChange}
                  placeholder="Enter your SerpApi key"
                  spellCheck={false}
                />
              </div>

              <div className="settings-actions">
                <button className="settings-save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="settings-test-btn" onClick={handleTest} disabled={testing || !configured}>
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                {configured && (
                  <button className="settings-clear-btn" onClick={handleClear} disabled={saving}>
                    Clear Key
                  </button>
                )}
              </div>

              {saveMsg && (
                <div className={`settings-msg ${saveMsg.ok ? 'ok' : 'err'}`}>
                  {saveMsg.text}
                </div>
              )}

              {testResult && (
                <div className={`settings-msg ${testResult.ok ? 'ok' : 'err'}`}>
                  {testResult.ok ? 'Connection successful!' : `Connection failed: ${testResult.message}`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
