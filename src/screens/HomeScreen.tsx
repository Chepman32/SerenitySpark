import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DurationCarousel from '../components/DurationCarousel';
import SoundToggle from '../components/SoundToggle';
import StartButton from '../components/StartButton';
import OnboardingOverlay from '../components/OnboardingOverlay';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useSession } from '../contexts/SessionContext';
import { useSettings } from '../contexts/SettingsContext';

const BACKGROUND_IMAGES: ImageSourcePropType[] = [
  require('../assets/images/antonio-virgil-mnm1lGiHghU-unsplash.jpg'),
  require('../assets/images/victor-poblete-BrnTuS7LVpY-unsplash.jpg'),
  require('../assets/images/sabharish-p-v-7SeVkyRJKlk-unsplash.jpg'),
  require('../assets/images/chirag-saini-ZtORJBpQljA-unsplash.jpg'),
  require('../assets/images/nikolay-hristov-17SOjjfHKQ4-unsplash.jpg'),
  require('../assets/images/richard-tao-etc3j1nnTik-unsplash.jpg'),
  require('../assets/images/imaad-whd-YEiqu8XitRI-unsplash.jpg'),
  require('../assets/images/sabharish-p-v-hwLcTJzWFLk-unsplash.jpg'),
  require('../assets/images/helena-janes-MCupFjvApO0-unsplash.jpg'),
  require('../assets/images/reza-ghazali-Yn87qLYN8R8-unsplash.jpg'),
  require('../assets/images/brian-gomes-dX8Rt1sdIWw-unsplash.jpg'),
  require('../assets/images/prabhu-raj-g-jB4D3rXV8-unsplash.jpg'),
  require('../assets/images/bernd-dittrich-6R7BwMBZVvE-unsplash.jpg'),
  require('../assets/images/giancarlo-corti-BiJbcrEFnZc-unsplash.jpg'),
];

const getNextBackgroundIndex = (excludeIndex: number | null): number => {
  const totalImages = BACKGROUND_IMAGES.length;
  if (totalImages === 0) {
    throw new Error('No background images available.');
  }
  if (totalImages === 1) {
    return 0;
  }

  const isValidExclude =
    typeof excludeIndex === 'number' &&
    excludeIndex >= 0 &&
    excludeIndex < totalImages;

  let nextIndex = Math.floor(Math.random() * totalImages);
  while (isValidExclude && nextIndex === excludeIndex) {
    nextIndex = Math.floor(Math.random() * totalImages);
  }
  return nextIndex;
};

const HomeScreen: React.FC = () => {
  const { navigateToSession } = useApp();
  const { startSession } = useSession();
  const { settings, updateSettings, isLoaded } = useSettings();

  const [selectedDuration, setSelectedDuration] = useState(
    settings.lastSelectedDuration,
  );
  const [natureEnabled, setNatureEnabled] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState<number | null>(null);
  const hasInitializedBackground = useRef(false);

  const selectNewBackground = useCallback(
    (excludeIndex: number | null) => {
      const nextIndex = getNextBackgroundIndex(excludeIndex);
      setBackgroundIndex(nextIndex);
      hasInitializedBackground.current = true;
      void updateSettings({ lastBackgroundImageIndex: nextIndex });
    },
    [updateSettings],
  );

  useEffect(() => {
    if (!isLoaded || hasInitializedBackground.current) {
      return;
    }

    const previousIndex =
      typeof settings.lastBackgroundImageIndex === 'number'
        ? settings.lastBackgroundImageIndex
        : null;

    selectNewBackground(previousIndex);
  }, [isLoaded, selectNewBackground, settings.lastBackgroundImageIndex]);

  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration);
  };

  const beginSession = (duration: number) => {
    selectNewBackground(backgroundIndex);
    startSession(duration, {
      natureEnabled,
      musicEnabled,
      natureTrack: settings.defaultNatureTrack,
      musicTrack: settings.defaultMusicTrack,
    });
    navigateToSession();
  };

  const handleStartSession = () => {
    beginSession(selectedDuration);
  };

  const handleDurationPress = (duration: number) => {
    setSelectedDuration(duration);
    beginSession(duration);
  };

  const handleDismissOnboarding = () => {
    updateSettings({ hasSeenOnboarding: true });
  };

  const content = (
    <SafeAreaView style={styles.container}>
      {!settings.hasSeenOnboarding && (
        <OnboardingOverlay onDismiss={handleDismissOnboarding} />
      )}
      <View style={styles.content}>
        <DurationCarousel
          onDurationSelect={handleDurationSelect}
          initialDuration={selectedDuration}
          onDurationPress={handleDurationPress}
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
  );

  if (backgroundIndex === null) {
    return <View style={styles.background}>{content}</View>;
  }

  return (
    <ImageBackground
      source={BACKGROUND_IMAGES[backgroundIndex]}
      style={styles.background}
      blurRadius={2}
    >
      {content}
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
