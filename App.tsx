import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
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
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Fade out and fade in on screen change
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 200 });
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
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
