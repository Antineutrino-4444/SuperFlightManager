import React, { useState, useEffect } from 'react';
import { fetchSettings, saveSettings as apiSaveSettings, testAmadeusConnection } from '../services/api';

export default function SettingsModal({ onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [environment, setEnvironment] = useState('test');
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    fetchSettings().then(data => {
      setApiKey(data.amadeusApiKey || '');
      setApiSecret(data.amadeusApiSecret || '');
      setEnvironment(data.amadeusEnvironment || 'test');
      setConfigured(data.amadeusConfigured);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    setTestResult(null);
    try {
      const result = await apiSaveSettings({
        amadeusApiKey: apiKey,
        amadeusApiSecret: apiSecret,
        amadeusEnvironment: environment,
      });
      setConfigured(result.amadeusConfigured);
      setApiKey(result.amadeusApiKey);
      setApiSecret(result.amadeusApiSecret);
      setSaveMsg({ ok: true, text: 'Settings saved.' });
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
      const result = await testAmadeusConnection();
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
      const result = await apiSaveSettings({
        amadeusApiKey: '',
        amadeusApiSecret: '',
        amadeusEnvironment: 'test',
      });
      setApiKey('');
      setApiSecret('');
      setEnvironment('test');
      setConfigured(false);
      setSaveMsg({ ok: true, text: 'API keys cleared. Using mock data.' });
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
                ? 'Amadeus API is configured — searches return real flight data'
                : 'Amadeus API not configured — searches return simulated data'}
            </div>

            {/* Amadeus API Section */}
            <div className="settings-section">
              <h4>Amadeus Flight API</h4>
              <p className="settings-help">
                Get real flight data from the Amadeus Self-Service API. Free tier includes
                2,000 flight searches/month.
              </p>

              <div className="settings-instructions">
                <strong>How to get your API key (free, takes 2 minutes):</strong>
                <ol>
                  <li>Go to <a href="https://developers.amadeus.com/register" target="_blank" rel="noopener noreferrer">developers.amadeus.com/register</a></li>
                  <li>Create a free account and verify your email</li>
                  <li>Log in, click your username (top-right), then "My Self-Service Workspace"</li>
                  <li>Click "Create new app" — you'll receive an <strong>API Key</strong> and <strong>API Secret</strong></li>
                  <li>Paste both values below and click Save</li>
                </ol>
                <div className="settings-pricing-note">
                  <strong>Pricing:</strong> The test environment is completely free (2,000 searches/month).
                  Production has the same free quota but charges for overages.
                </div>
              </div>

              <div className="settings-field">
                <label>API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Enter your Amadeus API Key"
                  spellCheck={false}
                />
              </div>

              <div className="settings-field">
                <label>API Secret</label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={e => setApiSecret(e.target.value)}
                  placeholder="Enter your Amadeus API Secret"
                  spellCheck={false}
                />
              </div>

              <div className="settings-field">
                <label>Environment</label>
                <select value={environment} onChange={e => setEnvironment(e.target.value)}>
                  <option value="test">Test (free, 2,000 searches/month)</option>
                  <option value="production">Production (free quota + paid overages)</option>
                </select>
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
                    Clear Keys
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
