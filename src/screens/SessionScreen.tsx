import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  AppState,
  AppStateStatus,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
  interpolateColor,
  SharedValue,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Netflix-style particle configuration
const PARTICLE_COUNT = 24;
const GLOW_PARTICLE_COUNT = 8;

interface DismissParticle {
  id: number;
  startX: number;
  startY: number;
  angle: number;
  speed: number;
  size: number;
  delay: number;
  color: string;
}

// Generate particles for the dismissal effect
const generateDismissParticles = (): DismissParticle[] => {
  const particles: DismissParticle[] = [];
  const colors = ['#4ECDC4', '#FF6B6B', '#FFE66D', '#95E1D3', '#F38181'];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.5;
    particles.push({
      id: i,
      startX: SCREEN_WIDTH / 2,
      startY: SCREEN_HEIGHT / 2,
      angle,
      speed: 150 + Math.random() * 200,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return particles;
};

// Glow ring particle component
const GlowParticle: React.FC<{
  index: number;
  dismissProgress: SharedValue<number>;
  total: number;
}> = ({ index, dismissProgress, total }) => {
  const angle = (index / total) * Math.PI * 2;
  const radius = 120;

  const style = useAnimatedStyle(() => {
    const progress = dismissProgress.value;
    const expandedRadius = radius + progress * 80;
    const x = SCREEN_WIDTH / 2 + Math.cos(angle) * expandedRadius - 6;
    const y = SCREEN_HEIGHT / 2 + Math.sin(angle) * expandedRadius - 6;

    return {
      position: 'absolute',
      left: x,
      top: y,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#4ECDC4',
      opacity: interpolate(progress, [0, 0.3, 0.7, 1], [0, 0.8, 0.6, 0]),
      transform: [
        { scale: interpolate(progress, [0, 0.5, 1], [0.5, 1.5, 0.3]) },
      ],
      shadowColor: '#4ECDC4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 8,
    };
  });

  return <Animated.View style={style} />;
};

// Burst particle component
const BurstParticle: React.FC<{
  particle: DismissParticle;
  dismissProgress: SharedValue<number>;
}> = ({ particle, dismissProgress }) => {
  const style = useAnimatedStyle(() => {
    const progress = dismissProgress.value;
    const distance = particle.speed * progress;
    const x = particle.startX + Math.cos(particle.angle) * distance;
    const y =
      particle.startY +
      Math.sin(particle.angle) * distance +
      progress * progress * 100;

    return {
      position: 'absolute',
      left: x - particle.size / 2,
      top: y - particle.size / 2,
      width: particle.size,
      height: particle.size,
      borderRadius: particle.size / 2,
      backgroundColor: particle.color,
      opacity: interpolate(progress, [0, 0.2, 0.8, 1], [0, 1, 0.6, 0]),
      transform: [
        { scale: interpolate(progress, [0, 0.3, 1], [0, 1.2, 0.2]) },
        { rotate: `${progress * 360}deg` },
      ],
      shadowColor: particle.color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 4,
    };
  });

  return <Animated.View style={style} />;
};

// Cinematic vignette overlay
const CinematicVignette: React.FC<{
  dismissProgress: SharedValue<number>;
}> = ({ dismissProgress }) => {
  const style = useAnimatedStyle(() => {
    const progress = dismissProgress.value;
    return {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
      borderWidth: interpolate(progress, [0, 0.5, 0.85, 1], [0, 60, 80, 0]),
      borderColor: 'rgba(0, 0, 0, 0.9)',
      borderRadius: interpolate(progress, [0, 0.85, 1], [0, 180, 0]),
      opacity: interpolate(progress, [0, 0.3, 0.8, 1], [0, 1, 0.8, 0]),
    };
  });

  return <Animated.View style={style} pointerEvents="none" />;
};

// Radial glow effect
const RadialGlow: React.FC<{
  dismissProgress: SharedValue<number>;
}> = ({ dismissProgress }) => {
  const style = useAnimatedStyle(() => {
    const progress = dismissProgress.value;
    const size = interpolate(progress, [0, 0.5, 1], [100, 300, 50]);

    return {
      position: 'absolute',
      left: SCREEN_WIDTH / 2 - size / 2,
      top: SCREEN_HEIGHT / 2 - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#4ECDC4',
      opacity: interpolate(progress, [0, 0.3, 0.6, 1], [0, 0.4, 0.2, 0]),
      shadowColor: '#4ECDC4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 60,
    };
  });

  return <Animated.View style={style} pointerEvents="none" />;
};

const BlurredBackground: React.FC<{
  dismissProgress: SharedValue<number>;
}> = ({ dismissProgress }) => {
  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dismissProgress.value, [0, 0.1, 0.8, 1], [0, 1, 1, 0]),
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, blurStyle]}
      pointerEvents="none"
    >
      <BlurView
        blurAmount={40}
        blurType="dark"
        style={StyleSheet.absoluteFill}
        reducedTransparencyFallbackColor="rgba(0,0,0,0.9)"
      />
    </Animated.View>
  );
};

const SessionScreen: React.FC = () => {
  const { navigateToHome } = useApp();
  const { sessionState, endSession } = useSession();
  const { addSession } = useHistory();
  const { settings } = useSettings();

  // Generate particles once
  const dismissParticles = useMemo(() => generateDismissParticles(), []);

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

  const getVelocityBasedSpringConfig = (velocityY: number) => {
    'worklet';
    const absVelocity = Math.abs(velocityY);
    const thresholds = ANIMATION_CONFIG.session.velocityThresholds;
    const springs = ANIMATION_CONFIG.session.springs;

    let config;
    if (absVelocity < thresholds.slow) {
      config = springs.dismissSlow;
    } else if (absVelocity < thresholds.medium) {
      config = springs.dismissMedium;
    } else if (absVelocity < thresholds.fast) {
      config = springs.dismissFast;
    } else {
      config = springs.dismissVeryFast;
    }

    return {
      ...config,
      velocity: velocityY,
      restDisplacementThreshold: 0.1,
      restSpeedThreshold: 0.1,
    };
  };

  const animateSessionDismissal = (velocityY = 0) => {
    'worklet';
    runOnJS(setIsExiting)(true);

    // Fast, snappy Netflix-style dismissal
    translateY.value = withTiming(SCREEN_HEIGHT * 1.1, {
      duration: 450,
      easing: Easing.in(Easing.cubic),
    });

    // Quick progress animation - navigate when complete
    dismissProgress.value = withTiming(
      1,
      {
        duration: 400,
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

  const animatedStyle = useAnimatedStyle(() => {
    const progress = dismissProgress.value;

    // Netflix-style cinematic card animation
    return {
      transform: [
        { translateY: translateY.value },
        // Perspective for 3D depth
        { perspective: 1200 },
        // Dramatic scale: shrink to 40% for cinematic effect
        {
          scale: interpolate(progress, [0, 0.3, 0.7, 1], [1, 0.85, 0.55, 0.3]),
        },
        // Strong backward tilt (falling into the void)
        { rotateX: `${interpolate(progress, [0, 0.5, 1], [0, -35, -55])}deg` },
        // Subtle side rotation for dynamic feel
        { rotateY: `${interpolate(progress, [0, 0.5, 1], [0, 8, 15])}deg` },
        // Dramatic twist
        { rotateZ: `${interpolate(progress, [0, 0.4, 1], [0, -5, -12])}deg` },
      ],
      opacity: interpolate(progress, [0, 0.5, 0.8, 1], [1, 0.9, 0.5, 0]),
      // Glow effect during dismissal
      shadowColor: '#4ECDC4',
      shadowOffset: {
        width: 0,
        height: interpolate(progress, [0, 0.5, 1], [14, 30, 0]),
      },
      shadowOpacity: interpolate(
        progress,
        [0, 0.3, 0.7, 1],
        [0.35, 0.8, 0.6, 0],
      ),
      shadowRadius: interpolate(progress, [0, 0.5, 1], [28, 60, 20]),
    };
  });

  // Cinematic background darkening - fades back to transparent at end
  const overlayStyle = useAnimatedStyle(() => {
    const progress = dismissProgress.value;
    return {
      backgroundColor: interpolateColor(
        progress,
        [0, 0.3, 0.6, 0.9, 1],
        [
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0.6)',
          'rgba(5,5,8,0.7)',
          'rgba(5,5,8,0.3)',
          'rgba(0,0,0,0)',
        ],
      ),
    };
  });

  // Glowing border effect on the card
  const glowBorderStyle = useAnimatedStyle(() => {
    const progress = dismissProgress.value;
    return {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 24,
      borderWidth: interpolate(progress, [0, 0.3, 0.7, 1], [0, 2, 3, 0]),
      borderColor: interpolateColor(
        progress,
        [0, 0.3, 0.7, 1],
        ['transparent', '#4ECDC4', '#FF6B6B', 'transparent'],
      ),
      shadowColor: '#4ECDC4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: interpolate(progress, [0, 0.3, 0.7, 1], [0, 0.8, 0.5, 0]),
      shadowRadius: interpolate(progress, [0, 0.5, 1], [0, 20, 0]),
    };
  });

  // Animated hint text that responds to swipe
  const hintStyle = useAnimatedStyle(() => {
    const progress = dismissProgress.value;
    return {
      opacity: interpolate(progress, [0, 0.3, 0.6], [1, 0.5, 0]),
      transform: [
        { translateY: interpolate(progress, [0, 0.5], [0, 20]) },
        { scale: interpolate(progress, [0, 0.3], [1, 0.9]) },
      ],
    };
  });

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
          {/* Cinematic background blur */}
          <BlurredBackground dismissProgress={dismissProgress} />

          {/* Dark overlay with color transition */}
          <Animated.View
            style={[styles.overlay, overlayStyle]}
            pointerEvents="none"
          />

          {/* Radial glow effect */}
          <RadialGlow dismissProgress={dismissProgress} />

          {/* Glow ring particles - only show during exit */}
          {isExiting &&
            Array.from({ length: GLOW_PARTICLE_COUNT }).map((_, i) => (
              <GlowParticle
                key={`glow-${i}`}
                index={i}
                dismissProgress={dismissProgress}
                total={GLOW_PARTICLE_COUNT}
              />
            ))}

          {/* Burst particles - only show during exit */}
          {isExiting &&
            dismissParticles.map(particle => (
              <BurstParticle
                key={particle.id}
                particle={particle}
                dismissProgress={dismissProgress}
              />
            ))}

          {/* Cinematic vignette */}
          <CinematicVignette dismissProgress={dismissProgress} />

          {/* Main card with Netflix-style animation */}
          <Animated.View style={[styles.cardWrapper, animatedStyle]}>
            {/* Glowing border effect */}
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
                    Swipe down to end
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

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(10,10,15,1)',
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
