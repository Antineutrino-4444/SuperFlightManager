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
      const parsed = JSON.parse(raw);
      // Only pick known keys — ignore any leftover old settings
      return {
        serpApiKey: parsed.serpApiKey || '',
      };
    }
  } catch (err) {
    console.error('Failed to load settings:', err.message);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(updates) {
  const current = loadSettings();
  const merged = {
    serpApiKey: updates.serpApiKey !== undefined ? updates.serpApiKey : current.serpApiKey,
  };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`Settings saved to ${SETTINGS_FILE} (key ${merged.serpApiKey ? 'present' : 'empty'})`);
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
