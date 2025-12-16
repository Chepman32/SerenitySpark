import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  AppState,
  AppStateStatus,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
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
import { useSettings } from '../contexts/SettingsContext';
import AudioService from '../services/AudioService';
import NotificationService from '../services/NotificationService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SessionScreen: React.FC = () => {
  const { navigateToHome } = useApp();
  const { sessionState, endSession } = useSession();
  const { addSession } = useHistory();
  const { settings } = useSettings();

  const [timeRemaining, setTimeRemaining] = useState(
    sessionState.duration * 60,
  );
  const [showTimer, setShowTimer] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showEarlyExitPrompt, setShowEarlyExitPrompt] = useState(false);
  const [pendingReason, setPendingReason] = useState('Lost focus');
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const remainingRef = useRef(timeRemaining);
  const nudgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hardModeActive = settings.hardModeEnabled;
  const aggressiveRemindersActive = settings.aggressiveRemindersEnabled;
  const earlyExitReasons = [
    'Lost focus',
    'Urgent task',
    'Too long / fatigue',
    'Need a break',
  ];

  const progress = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dismissProgress = useSharedValue(0);

  useEffect(() => {
    remainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    const clearNudgeTimeout = () => {
      if (nudgeTimeoutRef.current) {
        clearTimeout(nudgeTimeoutRef.current);
        nudgeTimeoutRef.current = null;
      }
    };

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
        if (aggressiveRemindersActive) {
          clearNudgeTimeout();
          nudgeTimeoutRef.current = setTimeout(() => {
            NotificationService.notifySessionRunning(
              remainingRef.current,
            ).catch(error =>
              console.error('Failed to send aggressive reminder:', error),
            );
          }, 45000);
        }
      }

      if (nextAppState === 'active') {
        NotificationService.clearAll();
        clearNudgeTimeout();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      clearNudgeTimeout();
    };
  }, [sessionState.isActive, aggressiveRemindersActive]);

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

  const handleEarlyExitRequest = () => {
    setPendingReason('Lost focus');
    setShowEarlyExitPrompt(true);
  };

  const confirmEarlyExit = (reason: string) => {
    setPendingReason(reason);
    setShowEarlyExitPrompt(false);
    animateSessionDismissal();
  };

  const cancelEarlyExit = () => {
    setShowEarlyExitPrompt(false);
  };

  const finalizeEndSession = () => {
    const actualDurationSeconds =
      sessionState.duration * 60 - remainingRef.current;
    const endType = hardModeActive ? 'gave_up' : 'cancelled';
    const reason = hardModeActive
      ? pendingReason || 'Ended early'
      : 'Ended early';

    void addSession({
      id: Date.now().toString(),
      timestamp: Date.now(),
      duration: sessionState.duration,
      completed: false,
      endType,
      endReason: reason,
      actualDurationSeconds,
      audioSettings: {
        nature: sessionState.audioSettings.natureEnabled,
        music: sessionState.audioSettings.musicEnabled,
      },
    }).catch(error => {
      console.error('Failed to store early exit session:', error);
    });

    stopAudio().catch(error => {
      console.error('Failed to stop audio on session end:', error);
    });
    NotificationService.clearAll();
    endSession();
    navigateToHome();
  };

  const animateSessionDismissal = () => {
    'worklet';
    const easing = Easing.bezier(0.22, 0.61, 0.36, 1);
    dismissProgress.value = withTiming(1, {
      duration: ANIMATION_CONFIG.session.dismissAnimationDuration,
      easing,
    });
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      {
        duration: ANIMATION_CONFIG.session.dismissAnimationDuration,
        easing,
      },
      finished => {
        if (finished) {
          runOnJS(finalizeEndSession)();
        }
      },
    );
  };

  const resetDismissState = (velocityY = 0) => {
    'worklet';
    translateY.value = withSpring(0, {
      damping: 18,
      stiffness: 180,
      mass: 0.9,
      velocity: velocityY,
      restDisplacementThreshold: 0.2,
      restSpeedThreshold: 0.2,
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
        const translation = event.translationY;
        translateY.value = translation;
        const targetProgress = Math.min(
          Math.max(
            translation / (ANIMATION_CONFIG.session.swipeThreshold * 1.4),
            0,
          ),
          1,
        );
        dismissProgress.value = targetProgress;
      }
    })
    .onEnd(event => {
      'worklet';
      const shouldDismiss =
        event.translationY > ANIMATION_CONFIG.session.swipeThreshold ||
        event.velocityY > 1200;
      if (shouldDismiss) {
        if (hardModeActive) {
          resetDismissState(event.velocityY);
          runOnJS(handleEarlyExitRequest)();
        } else {
          animateSessionDismissal();
        }
      } else {
        resetDismissState(event.velocityY);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      {
        scale: interpolate(
          dismissProgress.value,
          [0, 0.6, 1],
          [
            1,
            ANIMATION_CONFIG.session.dismissScale.mid,
            ANIMATION_CONFIG.session.dismissScale.end,
          ],
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

  const earlyExitPrompt = (
    <Modal
      animationType="fade"
      transparent
      visible={showEarlyExitPrompt}
      onRequestClose={cancelEarlyExit}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Hard mode</Text>
          <Text style={styles.modalSubtitle}>
            Choose why you are ending early. We will track it separately.
          </Text>
          <View style={styles.reasonList}>
            {earlyExitReasons.map(reason => (
              <Pressable
                key={reason}
                style={[
                  styles.reasonPill,
                  pendingReason === reason && styles.reasonPillSelected,
                ]}
                onPress={() => setPendingReason(reason)}
              >
                <Text
                  style={[
                    styles.reasonText,
                    pendingReason === reason && styles.reasonTextSelected,
                  ]}
                >
                  {reason}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalButton, styles.modalConfirm]}
              onPress={() => confirmEarlyExit(pendingReason)}
            >
              <Text style={styles.modalConfirmText}>End early</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.modalCancel]}
              onPress={cancelEarlyExit}
            >
              <Text style={styles.modalCancelText}>Continue session</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      {earlyExitPrompt}
      <GestureDetector gesture={panGesture}>
        <View style={styles.root}>
          <Animated.View
            style={[styles.overlay, overlayStyle]}
            pointerEvents="none"
          />
          <Animated.View style={[styles.cardWrapper, animatedStyle]}>
            <View style={styles.edgeSoftener} pointerEvents="none" />
            <View style={styles.container}>
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
                      strokeWidth={
                        ANIMATION_CONFIG.session.progressRingStrokeWidth
                      }
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
                <CompletionAnimation
                  onComplete={handleCompletionAnimationEnd}
                />
              )}
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  cardWrapper: {
    flex: 1,
    borderRadius: 24,
    shadowColor: '#050505',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
    overflow: 'visible',
  },
  edgeSoftener: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    backgroundColor: 'rgba(8, 8, 12, 0.08)',
  },
  container: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,10,15,0.96)',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0f1420',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.3)',
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  reasonList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  reasonPill: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
  },
  reasonPillSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(78,205,196,0.15)',
  },
  reasonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  reasonTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  modalActions: {
    gap: theme.spacing.sm,
  },
  modalButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  modalConfirm: {
    backgroundColor: theme.colors.primary,
  },
  modalCancel: {
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
  },
  modalConfirmText: {
    color: theme.colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  modalCancelText: {
    color: theme.colors.text,
    fontWeight: '500',
    fontSize: 16,
  },
});

export default SessionScreen;
