import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { UserSettings } from '../types';
import StorageService from '../services/StorageService';

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<UserSettings>({
    defaultNatureTrack: 'rain',
    defaultMusicTrack: 'piano',
    hasSeenOnboarding: false,
    lastSelectedDuration: 10,
    reducedMotion: false,
    lastBackgroundImageIndex: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await StorageService.getSettings();
      setSettings(loadedSettings);
    } finally {
      setIsLoaded(true);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings);
  };

  const resetSettings = async () => {
    await StorageService.resetSettings();
    await loadSettings();
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, resetSettings, isLoaded }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
