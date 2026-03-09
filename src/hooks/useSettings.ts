import type { Settings } from '../types';
import { useLocalStorage } from './useLocalStorage';

const DEFAULT_SETTINGS: Settings = {
  fmpApiKey: '',
  autoRefreshInterval: 60,
  dataSource: 'auto',
  geminiApiKey: '',
  firebaseProjectId: '',
  firebaseApiKey: '',
  firebaseAppId: '',
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>('stock-app-settings', DEFAULT_SETTINGS);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return { settings, updateSettings };
}
