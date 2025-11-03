import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/contexts/AppContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { SessionProvider } from './src/contexts/SessionContext';
import { HistoryProvider } from './src/contexts/HistoryContext';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import SessionScreen from './src/screens/SessionScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const AppNavigator: React.FC = () => {
  const { currentScreen } = useApp();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Splash':
        return <SplashScreen />;
      case 'Home':
        return <HomeScreen />;
      case 'Session':
        return <SessionScreen />;
      case 'History':
        return <HistoryScreen />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      {renderScreen()}
    </>
  );
};

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <SettingsProvider>
            <SessionProvider>
              <HistoryProvider>
                <AppNavigator />
              </HistoryProvider>
            </SessionProvider>
          </SettingsProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
