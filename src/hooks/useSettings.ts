'use client';
import type { Settings } from '../types';
import { useLocalStorage } from './useLocalStorage';

const DEFAULT_SETTINGS: Settings = {
  autoRefreshInterval: 60,
  dataSource: 'auto',
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  syncId: '',
  notionApiKey: '',
  notionParentPageId: '',
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>('stock-app-settings', DEFAULT_SETTINGS);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // Merge env vars as defaults (localStorage overrides if set)
  const mergedSettings: Settings = {
    ...settings,
    firebaseProjectId: settings.firebaseProjectId || DEFAULT_SETTINGS.firebaseProjectId,
    firebaseApiKey: settings.firebaseApiKey || DEFAULT_SETTINGS.firebaseApiKey,
    firebaseAppId: settings.firebaseAppId || DEFAULT_SETTINGS.firebaseAppId,
  };

  return { settings: mergedSettings, updateSettings };
}
