import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
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

const SessionScreen: React.FC = () => {
  const { navigateToHome } = useApp();
  const { sessionState, endSession, updateElapsed } = useSession();
  const { addSession } = useHistory();

  const [timeRemaining, setTimeRemaining] = useState(
    sessionState.duration * 60,
  );
  const [showTimer, setShowTimer] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);

  const progress = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    startAudio();
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSessionComplete();
          return 0;
        }
        const newTime = prev - 1;
        const elapsed = sessionState.duration * 60 - newTime;
        updateElapsed(elapsed);
        progress.value = withTiming(elapsed / (sessionState.duration * 60), {
          duration: 1000,
          easing: Easing.linear,
        });
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      stopAudio();
    };
  }, []);

  const startAudio = async () => {
    const tracks: string[] = [];
    if (sessionState.audioSettings.natureEnabled) {
      tracks.push(sessionState.audioSettings.natureTrack);
    }
    if (sessionState.audioSettings.musicEnabled) {
      tracks.push(sessionState.audioSettings.musicTrack);
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

  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        opacity.value = 1 - event.translationY / 300;
      }
    })
    .onEnd(event => {
      if (event.translationY > 150) {
        handleEndSession();
      } else {
        translateY.value = withTiming(0);
        opacity.value = withTiming(1);
      }
    });

  const handleEndSession = async () => {
    await stopAudio();
    endSession();
    navigateToHome();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <SafeAreaView style={styles.safeArea}>
          <Pressable
            style={styles.content}
            onPress={() => setShowTimer(!showTimer)}
          >
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
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

export default SessionScreen;
