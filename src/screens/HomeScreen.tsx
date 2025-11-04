import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ImageSourcePropType,
  Modal,
  Pressable,
  Platform,
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
import NotificationService from '../services/NotificationService';

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
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [pendingSessionDuration, setPendingSessionDuration] = useState<number | null>(null);
  const [shouldShowPermissionModalNext, setShouldShowPermissionModalNext] = useState(false);
  const hasInitializedBackground = useRef(false);

  const selectNewBackground = useCallback(
    (excludeIndex: number | null) => {
      const nextIndex = getNextBackgroundIndex(excludeIndex);
      setBackgroundIndex(nextIndex);
      hasInitializedBackground.current = true;
      updateSettings({ lastBackgroundImageIndex: nextIndex }).catch(error => {
        console.error('Failed to persist background image index:', error);
      });
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

  const proceedWithSession = (duration: number) => {
    selectNewBackground(backgroundIndex);
    startSession(duration, {
      natureEnabled,
      musicEnabled,
      natureTrack: settings.defaultNatureTrack,
      musicTrack: settings.defaultMusicTrack,
    });
    navigateToSession();
  };

  const beginSession = async (duration: number) => {
    try {
      const statusBefore = await NotificationService.getPermissionStatus();
      const isGrantedStatus =
        statusBefore === 'authorized' ||
        statusBefore === 'provisional' ||
        statusBefore === 'ephemeral';

      if (shouldShowPermissionModalNext) {
        if (isGrantedStatus) {
          setShouldShowPermissionModalNext(false);
        } else {
          setPendingSessionDuration(duration);
          setShowPermissionModal(true);
          return;
        }
      }

      if (
        Platform.OS === 'ios' &&
        (statusBefore === 'denied' || statusBefore === 'restricted')
      ) {
        setShouldShowPermissionModalNext(true);
        setPendingSessionDuration(duration);
        setShowPermissionModal(true);
        return;
      }

      const granted = await NotificationService.prepare();
      if (!granted) {
        if (statusBefore === 'notDetermined') {
          setShouldShowPermissionModalNext(true);
        } else if (!isGrantedStatus) {
          if (Platform.OS === 'ios') {
            setPendingSessionDuration(duration);
            setShowPermissionModal(true);
          } else {
            setShouldShowPermissionModalNext(true);
          }
        }
        return;
      }

      NotificationService.clearAll();
      proceedWithSession(duration);
    } catch (error) {
      console.error('Failed to prepare notifications:', error);
    }
  };

  const handleStartSession = () => {
    beginSession(selectedDuration).catch(error => {
      console.error('Failed to start session:', error);
    });
  };

  const handleDurationPress = (duration: number) => {
    setSelectedDuration(duration);
    beginSession(duration).catch(error => {
      console.error('Failed to start session from duration tap:', error);
    });
  };

  const handlePermissionModalCancel = () => {
    const duration = pendingSessionDuration ?? selectedDuration;
    setShowPermissionModal(false);
    setPendingSessionDuration(null);
    NotificationService.clearAll();
    proceedWithSession(duration);
  };

  const handlePermissionModalGrant = () => {
    setShowPermissionModal(false);
    setPendingSessionDuration(null);
    setShouldShowPermissionModalNext(false);
    NotificationService.openSettings().catch(() => null);
  };

  const permissionModal = (
    <Modal
      animationType="fade"
      transparent
      visible={showPermissionModal}
      onRequestClose={handlePermissionModalCancel}
    >
      <View style={styles.permissionModalBackdrop}>
        <View style={styles.permissionModal}>
          <Text style={styles.permissionModalTitle}>Enable notifications</Text>
          <Text style={styles.permissionModalMessage}>
            Notifications help us remind you when a session is still running. Grant access in settings, or choose Cancel to continue without reminders.
          </Text>
          <View style={styles.permissionModalActions}>
            <Pressable
              style={[styles.permissionButton, styles.permissionPrimaryButton]}
              onPress={handlePermissionModalGrant}
            >
              <Text style={styles.permissionPrimaryText}>Grant Permissions</Text>
            </Pressable>
            <Pressable
              style={[styles.permissionButton, styles.permissionSecondaryButton]}
              onPress={handlePermissionModalCancel}
            >
              <Text style={styles.permissionSecondaryText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

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
    return (
      <>
        {permissionModal}
        <View style={styles.background}>{content}</View>
      </>
    );
  }

  return (
    <>
      {permissionModal}
      <ImageBackground
        source={BACKGROUND_IMAGES[backgroundIndex]}
        style={styles.background}
        blurRadius={2}
      >
        {content}
      </ImageBackground>
    </>
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
  permissionModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  permissionModal: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  permissionModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  permissionModalMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionModalActions: {
    gap: theme.spacing.sm,
  },
  permissionButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  permissionPrimaryButton: {
    backgroundColor: theme.colors.primary,
  },
  permissionSecondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
  },
  permissionPrimaryText: {
    color: theme.colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
  permissionSecondaryText: {
    color: theme.colors.text,
    fontWeight: '500',
    fontSize: 16,
  },
});

export default HomeScreen;
