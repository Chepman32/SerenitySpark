import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { themes, Theme, ThemeType } from '../constants/themes';
import { useSettings } from './SettingsContext';

interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  setTheme: (type: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { settings, updateSettings, isLoaded } = useSettings();
  const [themeType, setThemeType] = useState<ThemeType>('dark');

  useEffect(() => {
    if (isLoaded && settings.theme && themes[settings.theme as ThemeType]) {
      setThemeType(settings.theme as ThemeType);
    }
  }, [isLoaded, settings.theme]);

  const setTheme = (type: ThemeType) => {
    setThemeType(type);
    updateSettings({ theme: type });
  };

  return (
    <ThemeContext.Provider
      value={{ theme: themes[themeType], themeType, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
