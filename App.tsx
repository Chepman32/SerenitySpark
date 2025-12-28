import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import './src/locales'; // Initialize i18n
import { AppProvider, useApp } from './src/contexts/AppContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { SessionProvider } from './src/contexts/SessionContext';
import { HistoryProvider } from './src/contexts/HistoryContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import SessionScreen from './src/screens/SessionScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';

const AppNavigator: React.FC = () => {
  const { currentScreen } = useApp();
  const { theme } = useTheme();
  const opacity = useSharedValue(1);
  const [previousScreen, setPreviousScreen] = useState<string | null>(null);

  useEffect(() => {
    // Track previous screen for session transitions
    if (currentScreen !== 'Session') {
      setPreviousScreen(currentScreen);
    }

    // Fade in on screen change (except when leaving Session - that has its own animation)
    if (currentScreen !== 'Home' || previousScreen !== 'Session') {
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [currentScreen]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Splash':
        return <SplashScreen />;
      case 'Home':
        return <HomeScreen />;
      case 'Session':
        // Render HomeScreen underneath SessionScreen for smooth dismissal
        return (
          <>
            <View style={StyleSheet.absoluteFill}>
              <HomeScreen />
            </View>
            <View style={StyleSheet.absoluteFill}>
              <SessionScreen />
            </View>
          </>
        );
      case 'History':
        return <HistoryScreen />;
      case 'Settings':
        return <SettingsScreen />;
      case 'Statistics':
        return <StatisticsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={
          theme.colors.background === '#FFFFFF' ||
          theme.colors.background === '#FFF8E7'
            ? 'dark-content'
            : 'light-content'
        }
        backgroundColor={theme.colors.background}
      />
      <Animated.View style={[styles.screenContainer, animatedStyle]}>
        {renderScreen()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F', // Dark background to prevent white flash
  },
  screenContainer: {
    flex: 1,
  },
});

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <SafeAreaProvider>
        <AppProvider>
          <SubscriptionProvider>
            <SettingsProvider>
              <ThemeProvider>
                <SessionProvider>
                  <HistoryProvider>
                    <AppNavigator />
                  </HistoryProvider>
                </SessionProvider>
              </ThemeProvider>
            </SettingsProvider>
          </SubscriptionProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
