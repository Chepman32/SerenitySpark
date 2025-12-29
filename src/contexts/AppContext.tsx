import React, { createContext, useContext, useState, ReactNode } from 'react';

type Screen =
  | 'Splash'
  | 'Home'
  | 'Session'
  | 'History'
  | 'Settings'
  | 'Statistics'
  | 'NotificationSettings';

interface AppContextType {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  navigateToHome: () => void;
  navigateToSession: () => void;
  navigateToHistory: () => void;
  navigateToSettings: () => void;
  navigateToStatistics: () => void;
  navigateToNotificationSettings: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Splash');

  const navigateToHome = () => setCurrentScreen('Home');
  const navigateToSession = () => setCurrentScreen('Session');
  const navigateToHistory = () => setCurrentScreen('History');
  const navigateToSettings = () => setCurrentScreen('Settings');
  const navigateToStatistics = () => setCurrentScreen('Statistics');
  const navigateToNotificationSettings = () => setCurrentScreen('NotificationSettings');

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        navigateToHome,
        navigateToSession,
        navigateToHistory,
        navigateToSettings,
        navigateToStatistics,
        navigateToNotificationSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
