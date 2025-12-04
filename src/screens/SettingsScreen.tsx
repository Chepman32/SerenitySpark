import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Gesture,
  GestureDetector,
  ScrollView as GHScrollView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useSettings } from '../contexts/SettingsContext';
import { useApp } from '../contexts/AppContext';
import AudioService from '../services/AudioService';
import { useSubscription } from '../contexts/SubscriptionContext';
import PremiumCallout from '../components/PremiumCallout';

const SettingsScreen: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { navigateToHome } = useApp();
  const { hasFeature, markPremium, isPremium } = useSubscription();
  const translateY = useSharedValue(0);
  const screenHeight = Dimensions.get('window').height;
  const panRef = React.useRef(null);
  const scrollY = useSharedValue(0);
  const onScroll = React.useCallback(event => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  }, []);

  const AnimatedScrollView = Animated.ScrollView;

  const natureTracks = AudioService.getAvailableTracks('nature');
  const musicTracks = AudioService.getAvailableTracks('music');

  const handleNatureTrackSelect = (trackId: string) => {
    updateSettings({ defaultNatureTrack: trackId });
  };

  const handleMusicTrackSelect = (trackId: string) => {
    updateSettings({ defaultMusicTrack: trackId });
  };

  const toggleHardMode = () => {
    if (!hasFeature('hardMode')) {
      return;
    }
    updateSettings({ hardModeEnabled: !settings.hardModeEnabled });
  };

  const toggleAggressiveReminders = () => {
    if (!hasFeature('distractionBlocking')) {
      return;
    }
    updateSettings({
      aggressiveRemindersEnabled: !settings.aggressiveRemindersEnabled,
    });
  };

  const toggleFocusAdvisor = () => {
    if (!hasFeature('focusOptimizer')) {
      return;
    }
    updateSettings({ focusAdvisorEnabled: !settings.focusAdvisorEnabled });
  };

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .withRef(panRef)
        .onUpdate(event => {
          'worklet';
          if (scrollY.value > 0 && event.translationY > 0) {
            translateY.value = 0;
            return;
          }
          translateY.value = event.translationY;
        })
        .onEnd(event => {
          'worklet';
          const threshold = 80;
          if (scrollY.value > 0) {
            translateY.value = withTiming(0, { duration: 200 });
            return;
          }
          if (event.translationY > threshold) {
            translateY.value = withTiming(screenHeight, { duration: 220 }, finished => {
              if (finished) {
                runOnJS(navigateToHome)();
                translateY.value = 0;
              }
            });
          } else if (event.translationY < -threshold) {
            translateY.value = withTiming(-screenHeight, { duration: 220 }, finished => {
              if (finished) {
                runOnJS(navigateToHome)();
                translateY.value = 0;
              }
            });
          } else {
            translateY.value = withTiming(0, { duration: 200 });
          }
        }),
    [navigateToHome, translateY, screenHeight, scrollY],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const distance = translateY.value;
    const fadeDistance = screenHeight / 2;
    return {
      transform: [{ translateY: distance }],
      opacity: interpolate(
        Math.abs(distance),
        [0, fadeDistance],
        [1, 0.85],
        'clamp',
      ),
    };
  });

  return (
    <GestureDetector gesture={gesture} style={styles.root}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={navigateToHome}>
              <Text style={styles.backButton}>← Back</Text>
            </Pressable>
            <Text style={styles.title}>Settings</Text>
          </View>

          <GHScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            contentInsetAdjustmentBehavior="automatic"
            simultaneousHandlers={panRef}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Audio Preferences</Text>

              <Text style={styles.label}>Nature Sound</Text>
              {natureTracks.map(track => (
                <Pressable
                  key={track.id}
                  style={[
                    styles.option,
                    settings.defaultNatureTrack === track.id &&
                      styles.optionSelected,
                  ]}
                  onPress={() => handleNatureTrackSelect(track.id)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      settings.defaultNatureTrack === track.id &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {track.name}
                  </Text>
                  {settings.defaultNatureTrack === track.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              ))}

              <Text style={[styles.label, { marginTop: theme.spacing.lg }]}>
                Music Track
              </Text>
              {musicTracks.map(track => (
                <Pressable
                  key={track.id}
                  style={[
                    styles.option,
                    settings.defaultMusicTrack === track.id &&
                      styles.optionSelected,
                  ]}
                  onPress={() => handleMusicTrackSelect(track.id)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      settings.defaultMusicTrack === track.id &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {track.name}
                  </Text>
                  {settings.defaultMusicTrack === track.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Focus & Protection</Text>
              <Pressable
                style={[
                  styles.option,
                  settings.hardModeEnabled && styles.optionSelected,
                  !hasFeature('hardMode') && styles.optionDisabled,
                ]}
                onPress={toggleHardMode}
              >
                <View style={styles.optionTextGroup}>
                  <Text
                    style={[
                      styles.optionText,
                      settings.hardModeEnabled && styles.optionTextSelected,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Hard mode (confirm reason)
                  </Text>
                  <Text style={styles.optionSubtext} numberOfLines={2}>
                    Swipe-to-end requires a reason and is logged separately.
                  </Text>
                </View>
                <View style={styles.checkmarkContainer}>
                  <Text style={styles.checkmark}>
                    {settings.hardModeEnabled ? 'On' : 'Off'}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.option,
                  settings.aggressiveRemindersEnabled && styles.optionSelected,
                  !hasFeature('distractionBlocking') && styles.optionDisabled,
                ]}
                onPress={toggleAggressiveReminders}
              >
                <View style={styles.optionTextGroup}>
                  <Text
                    style={[
                      styles.optionText,
                      settings.aggressiveRemindersEnabled &&
                        styles.optionTextSelected,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Aggressive reminders
                  </Text>
                  <Text style={styles.optionSubtext} numberOfLines={2}>
                    Extra nudges when you leave the app mid-session (Premium).
                  </Text>
                </View>
                <View style={styles.checkmarkContainer}>
                  <Text style={styles.checkmark}>
                    {settings.aggressiveRemindersEnabled ? 'On' : 'Off'}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.option,
                  settings.focusAdvisorEnabled && styles.optionSelected,
                  !hasFeature('focusOptimizer') && styles.optionDisabled,
                ]}
                onPress={toggleFocusAdvisor}
              >
                <View style={styles.optionTextGroup}>
                  <Text
                    style={[
                      styles.optionText,
                      settings.focusAdvisorEnabled && styles.optionTextSelected,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Focus Advisor suggestions
                  </Text>
                  <Text style={styles.optionSubtext} numberOfLines={2}>
                    Adaptive durations based on your history.
                  </Text>
                </View>
                <View style={styles.checkmarkContainer}>
                  <Text style={styles.checkmark}>
                    {settings.focusAdvisorEnabled ? 'On' : 'Off'}
                  </Text>
                </View>
              </Pressable>
              {!hasFeature('hardMode') && (
                <View style={{ marginTop: theme.spacing.sm }}>
                  <PremiumCallout
                    title="Upgrade for protection"
                    description="Hard mode, distraction blocking nudges, and adaptive durations are Premium."
                    onPress={() => null}
                  />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subscription</Text>
              <Pressable
                style={styles.option}
                onPress={() => {
                  markPremium();
                }}
              >
                <View>
                  <Text style={styles.optionText}>
                    {isPremium ? 'Premium active' : 'Restore Premium (sandbox)'}
                  </Text>
                  <Text style={styles.optionSubtext}>
                    Use after a successful TestFlight purchase to refresh entitlements.
                  </Text>
                </View>
                <Text style={styles.checkmark}>{isPremium ? '✓' : '→'}</Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.aboutText}>SerenitySpark v1.0.0</Text>
              <Text style={styles.aboutText}>
                A gesture-driven meditation app for mindful moments.
              </Text>
              <Text style={[styles.aboutText, { marginTop: theme.spacing.md }]}>
                Privacy: All your data stays on your device.
              </Text>
            </View>
          </GHScrollView>
        </SafeAreaView>
      </Animated.View>
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
  scroll: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  backButton: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  optionTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  optionSelected: {
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  optionTextSelected: {
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: theme.colors.text,
  },
  optionSubtext: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  checkmarkContainer: {
    paddingLeft: theme.spacing.md,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  optionDisabled: {
    opacity: 0.6,
  },
  aboutText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default SettingsScreen;
