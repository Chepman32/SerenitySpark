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
import { useTranslation } from 'react-i18next';
import ProgressRing from '../components/ProgressRing';
import CompletionAnimation from '../animations/CompletionAnimation';
import {
  SessionEndAnimation,
  useCardDismissStyle,
  useGlowBorderStyle,
} from '../animations/SessionEndAnimation';
import { useTheme } from '../contexts/ThemeContext';
import { ANIMATION_CONFIG } from '../constants/animations';
import { useApp } from '../contexts/AppContext';
import { useSession } from '../contexts/SessionContext';
import { useHistory } from '../contexts/HistoryContext';
import { useSettings } from '../contexts/SettingsContext';
import AudioService from '../services/AudioService';
import NotificationService from '../services/NotificationService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SessionScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
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
  const [pendingReason, setPendingReason] = useState('lostFocus');
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const remainingRef = useRef(timeRemaining);
  const nudgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hardModeActive = settings.hardModeEnabled;
  const aggressiveRemindersActive = settings.aggressiveRemindersEnabled;

  const earlyExitReasons = [
    { key: 'lostFocus', label: t('session.lostFocus') },
    { key: 'urgentTask', label: t('session.urgentTask') },
    { key: 'tooLong', label: t('session.tooLong') },
    { key: 'needBreak', label: t('session.needBreak') },
  ];

  const progress = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dismissProgress = useSharedValue(0);
  const [isExiting, setIsExiting] = useState(false);

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

        progress.value = withTiming(
          elapsedTime / (sessionState.duration * 60),
          {
            duration: 1000,
            easing: Easing.linear,
          },
        );

        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      stopAudio();
      NotificationService.clearAll();
    };
  }, []);

  const startAudio = async () => {
    const tracks: string[] = [];
    if (sessionState.audioSettings.natureEnabled) {
      const randomNatureTrack = AudioService.getRandomTrack('nature');
      if (randomNatureTrack) {
        tracks.push(randomNatureTrack.id);
      }
    }
    if (sessionState.audioSettings.musicEnabled) {
      const randomMusicTrack = AudioService.getRandomTrack('music');
      if (randomMusicTrack) {
        tracks.push(randomMusicTrack.id);
      }
    }
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
    setPendingReason('lostFocus');
    setShowEarlyExitPrompt(true);
  };

  const confirmEarlyExit = (reason: string) => {
    setPendingReason(reason);
    setShowEarlyExitPrompt(false);
    animateSessionDismissal(0);
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

  const animateSessionDismissal = (velocityY = 0) => {
    'worklet';
    runOnJS(setIsExiting)(true);

    translateY.value = withTiming(SCREEN_HEIGHT * 1.1, {
      duration: 450,
      easing: Easing.in(Easing.cubic),
    });

    dismissProgress.value = withTiming(
      1,
      {
        duration: 450,
        easing: Easing.out(Easing.cubic),
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
          animateSessionDismissal(event.velocityY);
        }
      } else {
        resetDismissState(event.velocityY);
      }
    });

  // Use PlayStation-style card animation from SessionEndAnimation
  const animatedStyle = useCardDismissStyle(dismissProgress, translateY);
  const glowBorderStyle = useGlowBorderStyle(dismissProgress);

  const hintStyle = useAnimatedStyle(() => {
    const prog = dismissProgress.value;
    return {
      opacity: interpolate(prog, [0, 0.3, 0.6], [1, 0.5, 0]),
      transform: [
        { translateY: interpolate(prog, [0, 0.5], [0, 20]) },
        { scale: interpolate(prog, [0, 0.3], [1, 0.9]) },
      ],
    };
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = createStyles(theme);

  const earlyExitPrompt = (
    <Modal
      animationType="fade"
      transparent
      visible={showEarlyExitPrompt}
      onRequestClose={cancelEarlyExit}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{t('session.hardMode')}</Text>
          <Text style={styles.modalSubtitle}>
            {t('session.hardModeMessage')}
          </Text>
          <View style={styles.reasonList}>
            {earlyExitReasons.map(reason => (
              <Pressable
                key={reason.key}
                style={[
                  styles.reasonPill,
                  pendingReason === reason.key && styles.reasonPillSelected,
                ]}
                onPress={() => setPendingReason(reason.key)}
              >
                <Text
                  style={[
                    styles.reasonText,
                    pendingReason === reason.key && styles.reasonTextSelected,
                  ]}
                >
                  {reason.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalButton, styles.modalConfirm]}
              onPress={() => confirmEarlyExit(pendingReason)}
            >
              <Text style={styles.modalConfirmText}>
                {t('session.endEarly')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.modalCancel]}
              onPress={cancelEarlyExit}
            >
              <Text style={styles.modalCancelText}>
                {t('session.continueSession')}
              </Text>
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
          {/* PlayStation-style session end animation */}
          <SessionEndAnimation
            dismissProgress={dismissProgress}
            isExiting={isExiting}
          />
          <Animated.View style={[styles.cardWrapper, animatedStyle]}>
            <Animated.View style={glowBorderStyle} pointerEvents="none" />
            <View style={styles.edgeSoftener} pointerEvents="none" />
            <View style={styles.container}>
              <SafeAreaView style={styles.safeArea}>
                <Pressable
                  style={styles.content}
                  onPress={() => setShowTimer(!showTimer)}
                >
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

                  <Animated.Text style={[styles.hint, hintStyle]}>
                    {t('session.swipeToEnd')}
                  </Animated.Text>
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

const createStyles = (theme: any) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    cardWrapper: {
      flex: 1,
      borderRadius: 24,
      shadowColor: '#4ECDC4',
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
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
      backgroundColor: theme.colors.surface,
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
