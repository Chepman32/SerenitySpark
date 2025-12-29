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
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';

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

    // Don't animate when coming from Session - HomeScreen was already visible underneath
    if (currentScreen === 'Home' && previousScreen === 'Session') {
      opacity.value = 1;
      return;
    }

    // Skip fade-in for swipe-navigated screens to avoid white blink
    // These screens already have smooth exit animations via gestures
    const swipeNavigatedScreens = [
      'Home',
      'Settings',
      'Statistics',
      'NotificationSettings',
    ];
    const isSwipeTransition =
      swipeNavigatedScreens.includes(currentScreen) &&
      previousScreen &&
      swipeNavigatedScreens.includes(previousScreen);

    if (isSwipeTransition) {
      opacity.value = 1;
      return;
    }

    // Fade in on screen change (only for non-swipe transitions like Splash -> Home)
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Splash':
        return <SplashScreen />;
      case 'Home':
      case 'Session':
        // Always render with same structure to prevent unmount/remount blink
        // HomeScreen stays mounted, SessionScreen conditionally renders on top
        return (
          <>
            <View style={StyleSheet.absoluteFill}>
              <HomeScreen />
            </View>
            {currentScreen === 'Session' && (
              <View style={StyleSheet.absoluteFill}>
                <SessionScreen />
              </View>
            )}
          </>
        );
      case 'History':
        return <HistoryScreen />;
      case 'Settings':
        return <SettingsScreen />;
      case 'Statistics':
        return <StatisticsScreen />;
      case 'NotificationSettings':
        return <NotificationSettingsScreen />;
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
