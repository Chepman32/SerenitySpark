import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DurationCarousel from '../components/DurationCarousel';
import SoundToggle from '../components/SoundToggle';
import StartButton from '../components/StartButton';
import OnboardingOverlay from '../components/OnboardingOverlay';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useSession } from '../contexts/SessionContext';
import { useSettings } from '../contexts/SettingsContext';

const HomeScreen: React.FC = () => {
  const { navigateToSession } = useApp();
  const { startSession } = useSession();
  const { settings, updateSettings } = useSettings();

  const [selectedDuration, setSelectedDuration] = useState(
    settings.lastSelectedDuration,
  );
  const [natureEnabled, setNatureEnabled] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);

  const handleStartSession = () => {
    startSession(selectedDuration, {
      natureEnabled,
      musicEnabled,
      natureTrack: settings.defaultNatureTrack,
      musicTrack: settings.defaultMusicTrack,
    });
    navigateToSession();
  };

  const handleDismissOnboarding = () => {
    updateSettings({ hasSeenOnboarding: true });
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg',
      }}
      style={styles.background}
      blurRadius={2}
    >
      <SafeAreaView style={styles.container}>
        {!settings.hasSeenOnboarding && (
          <OnboardingOverlay onDismiss={handleDismissOnboarding} />
        )}
        <View style={styles.content}>
          <DurationCarousel
            onDurationSelect={setSelectedDuration}
            initialDuration={selectedDuration}
          />

          <View style={styles.soundToggles}>
            <SoundToggle
              type="nature"
              enabled={natureEnabled}
              onToggle={() => setNatureEnabled(!natureEnabled)}
              icon="🍃"
              label="Nature"
            />
            <SoundToggle
              type="music"
              enabled={musicEnabled}
              onToggle={() => setMusicEnabled(!musicEnabled)}
              icon="🎵"
              label="Music"
            />
          </View>

          <View style={styles.startButtonContainer}>
            <StartButton onPress={handleStartSession} />
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.7)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.xl,
  },
  soundToggles: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  startButtonContainer: {
    alignItems: 'center',
  },
});

export default HomeScreen;
