import { useState, useCallback } from 'react';

const STORAGE_KEY = 'pmhub_settings';

const DEFAULT_SETTINGS = {
  anthropicKey: '',
  linearToken: '',
  sentryToken: '',
  amplitudeToken: '',
  appsflyerToken: '',
  appstoreKey: '',
  googleplayKey: '',
  selectedApps: ['thrillz-android', 'thrillz-ios', 'play-smart'],
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState(() => loadSettings());

  const updateSettings = useCallback((updates) => {
    setSettingsState(prev => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettingsState({ ...DEFAULT_SETTINGS });
  }, []);

  const isFirstRun = !settings.anthropicKey;

  return { settings, updateSettings, resetSettings, isFirstRun };
}
