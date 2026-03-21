import React, { useState, useEffect } from 'react';
import { fetchSettings, saveSettings as apiSaveSettings, testKiwiConnection } from '../services/api';

export default function SettingsModal({ onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    fetchSettings().then(data => {
      setApiKey(data.kiwiApiKey || '');
      setConfigured(data.kiwiConfigured);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    setTestResult(null);
    try {
      const result = await apiSaveSettings({
        kiwiApiKey: apiKey,
      });
      setConfigured(result.kiwiConfigured);
      setApiKey(result.kiwiApiKey);
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
      const result = await testKiwiConnection();
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
        kiwiApiKey: '',
      });
      setApiKey('');
      setConfigured(false);
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
                ? 'Kiwi API is configured — searches return real flight data from 800+ airlines'
                : 'Kiwi API not configured — configure your API key to search flights'}
            </div>

            {/* Kiwi API Section */}
            <div className="settings-section">
              <h4>Kiwi Tequila Flight API</h4>
              <p className="settings-help">
                Get real flight data from the Kiwi Tequila API. Free to use with access to 800+ airlines
                including low-cost carriers and virtual interlining.
              </p>

              <div className="settings-instructions">
                <strong>How to get your API key (free, takes 2 minutes):</strong>
                <ol>
                  <li>Go to <a href="https://tequila.kiwi.com/portal/login/register" target="_blank" rel="noopener noreferrer">tequila.kiwi.com/portal/login/register</a></li>
                  <li>Create a free account and verify your email</li>
                  <li>Go to "My applications" and click "+ Add application"</li>
                  <li>Choose your partnership type and create the app — you'll receive an <strong>API Key</strong></li>
                  <li>Paste the API key below and click Save</li>
                </ol>
                <div className="settings-pricing-note">
                  <strong>Pricing:</strong> Free to use. Covers 800+ airlines with real-time search,
                  virtual interlining (combines airlines that don't have interline agreements),
                  and booking capabilities.
                </div>
              </div>

              <div className="settings-field">
                <label>API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Enter your Kiwi Tequila API Key"
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
