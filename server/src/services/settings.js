const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../../.settings.json');

const DEFAULT_SETTINGS = {
  serpApiKey: '',
};

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load settings:', err.message);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(updates) {
  const current = loadSettings();
  const merged = { ...current, ...updates };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

function getSettings() {
  return loadSettings();
}

function isSerpApiConfigured() {
  const s = loadSettings();
  return !!s.serpApiKey;
}

module.exports = { getSettings, saveSettings, isSerpApiConfigured };
