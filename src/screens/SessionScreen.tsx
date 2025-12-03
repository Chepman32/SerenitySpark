import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ProgressRing from '../components/ProgressRing';
import CompletionAnimation from '../animations/CompletionAnimation';
import { theme } from '../constants/theme';
import { ANIMATION_CONFIG } from '../constants/animations';
import { useApp } from '../contexts/AppContext';
import { useSession } from '../contexts/SessionContext';
import { useHistory } from '../contexts/HistoryContext';
import AudioService from '../services/AudioService';
import NotificationService from '../services/NotificationService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SessionScreen: React.FC = () => {
  const { navigateToHome } = useApp();
  const { sessionState, endSession } = useSession();
  const { addSession } = useHistory();

  const [timeRemaining, setTimeRemaining] = useState(
    sessionState.duration * 60,
  );
  const [showTimer, setShowTimer] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const remainingRef = useRef(timeRemaining);

  const progress = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dismissProgress = useSharedValue(0);

  useEffect(() => {
    remainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive') &&
        sessionState.isActive
      ) {
        NotificationService.notifySessionRunning(remainingRef.current).catch(
          error => {
            console.error('Failed to schedule session reminder:', error);
          },
        );
      }

      if (nextAppState === 'active') {
        NotificationService.clearAll();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [sessionState.isActive]);

  useEffect(() => {
    if (!sessionState.isActive) {
      NotificationService.clearAll();
    }
  }, [sessionState.isActive]);

  useEffect(() => {
    translateY.value = 0;
    dismissProgress.value = 0;
    startAudio();
    let elapsedTime = 0;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSessionComplete();
          return 0;
        }
        const newTime = prev - 1;
        elapsedTime = sessionState.duration * 60 - newTime;

        // Update progress animation
        progress.value = withTiming(
          elapsedTime / (sessionState.duration * 60),
          {
            duration: 1000,
            easing: Easing.linear,
          },
        );

        return newTime;
      });

      // Elapsed time is tracked locally in this component
      // No need to update context during active session
    }, 1000);

    return () => {
      clearInterval(interval);
      stopAudio();
      NotificationService.clearAll();
    };
  }, []);

  const startAudio = async () => {
    console.log('startAudio called', sessionState.audioSettings);
    const tracks: string[] = [];
    if (sessionState.audioSettings.natureEnabled) {
      const randomNatureTrack = AudioService.getRandomTrack('nature');
      console.log('Random nature track:', randomNatureTrack);
      if (randomNatureTrack) {
        tracks.push(randomNatureTrack.id);
      }
    }
    if (sessionState.audioSettings.musicEnabled) {
      const randomMusicTrack = AudioService.getRandomTrack('music');
      console.log('Random music track:', randomMusicTrack);
      if (randomMusicTrack) {
        tracks.push(randomMusicTrack.id);
      }
    }
    console.log('Tracks to play:', tracks);
    if (tracks.length > 0) {
      await AudioService.mixTracks(tracks);
    }
  };

  const stopAudio = async () => {
    await AudioService.stopAll(true);
  };

  const handleSessionComplete = async () => {
    await stopAudio();
    NotificationService.clearAll();
    await addSession({
      id: Date.now().toString(),
      timestamp: Date.now(),
      duration: sessionState.duration,
      completed: true,
      audioSettings: {
        nature: sessionState.audioSettings.natureEnabled,
        music: sessionState.audioSettings.musicEnabled,
      },
    });
    endSession();
    setShowCompletion(true);
  };

  const handleCompletionAnimationEnd = () => {
    navigateToHome();
  };

  const finalizeEndSession = () => {
    stopAudio().catch(error => {
      console.error('Failed to stop audio on session end:', error);
    });
    NotificationService.clearAll();
    endSession();
    navigateToHome();
  };

  const animateSessionDismissal = () => {
    'worklet';
    dismissProgress.value = withTiming(1, {
      duration: ANIMATION_CONFIG.session.dismissAnimationDuration,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      {
        duration: ANIMATION_CONFIG.session.dismissAnimationDuration,
        easing: Easing.out(Easing.cubic),
      },
      finished => {
        if (finished) {
          runOnJS(finalizeEndSession)();
        }
      },
    );
  };

  const resetDismissState = () => {
    'worklet';
    translateY.value = withTiming(0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    dismissProgress.value = withTiming(0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      'worklet';
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        const targetProgress = Math.min(
          Math.max(
            event.translationY /
              (ANIMATION_CONFIG.session.swipeThreshold * 1.6),
            0,
          ),
          1,
        );
        dismissProgress.value = withTiming(targetProgress, {
          duration: 120,
          easing: Easing.out(Easing.cubic),
        });
      }
    })
    .onEnd(event => {
      'worklet';
      if (event.translationY > ANIMATION_CONFIG.session.swipeThreshold) {
        animateSessionDismissal();
      } else {
        resetDismissState();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      {
        scale: interpolate(
          dismissProgress.value,
          [0, 0.6, 1],
          [1, ANIMATION_CONFIG.session.dismissScale.mid, ANIMATION_CONFIG.session.dismissScale.end],
        ),
      },
      {
        rotate: `${interpolate(dismissProgress.value, [0, 1], [0, -6])}deg`,
      },
    ],
    opacity: interpolate(dismissProgress.value, [0, 0.8, 1], [1, 0.92, 0]),
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      dismissProgress.value,
      [0, 0.6, 1],
      ['rgba(10,10,15,0)', 'rgba(86, 55, 194, 0.6)', 'rgba(10,10,15,0)'],
    ),
    opacity: interpolate(dismissProgress.value, [0, 0.6, 1], [0, 1, 0]),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dismissProgress.value, [0, 0.6, 1], [0, 0.35, 0]),
    transform: [
      {
        scale: interpolate(dismissProgress.value, [0, 1], [0.3, 1.8]),
      },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dismissProgress.value, [0, 0.45, 1], [0, 0.6, 0]),
    transform: [
      {
        scale: interpolate(dismissProgress.value, [0, 1], [0.7, 2.2]),
      },
    ],
  }));

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none" />
        <Animated.View style={[styles.container, animatedStyle]}>
          <SafeAreaView style={styles.safeArea}>
            <Pressable
              style={styles.content}
              onPress={() => setShowTimer(!showTimer)}
            >
              <Animated.View
                style={[styles.pulse, pulseStyle]}
                pointerEvents="none"
              />
              <Animated.View
                style={[styles.glow, glowStyle]}
                pointerEvents="none"
              />
              <View style={styles.progressContainer}>
                <ProgressRing
                  progress={progress}
                  size={ANIMATION_CONFIG.session.progressRingSize}
                  strokeWidth={ANIMATION_CONFIG.session.progressRingStrokeWidth}
                  color={theme.colors.primary}
                />
                {showTimer && (
                  <Text style={styles.timerText}>
                    {formatTime(timeRemaining)}
                  </Text>
                )}
              </View>

              <Text style={styles.hint}>Swipe down to end</Text>
            </Pressable>
          </SafeAreaView>
          {showCompletion && (
            <CompletionAnimation onComplete={handleCompletionAnimationEnd} />
          )}
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 260,
    height: 260,
    top: '50%',
    left: '50%',
    marginLeft: -130,
    marginTop: -130,
    borderRadius: 130,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    top: '50%',
    left: '50%',
    marginLeft: -160,
    marginTop: -160,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 215, 128, 0.25)',
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  timerText: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: '300',
    color: theme.colors.text,
  },
  hint: {
    position: 'absolute',
    bottom: 40,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default SessionScreen;
