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
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useHistory } from '../contexts/HistoryContext';
import { useApp } from '../contexts/AppContext';

const StatisticBlock: React.FC<{
  label: string;
  value: string;
  sub?: string;
}> = ({ label, value, sub }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub && <Text style={styles.statSub}>{sub}</Text>}
  </View>
);

const StatisticsScreen: React.FC = () => {
  const { stats } = useHistory();
  const { navigateToHome } = useApp();
  const translateY = useSharedValue(0);
  const screenHeight = Dimensions.get('window').height;
  const panRef = React.useRef(null);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .withRef(panRef)
        .onUpdate(event => {
          'worklet';
          translateY.value = event.translationY;
        })
        .onEnd(event => {
          'worklet';
          const threshold = 80;
          if (event.translationY > threshold) {
            translateY.value = withTiming(screenHeight, { duration: 220 }, finished => {
              if (finished) {
                runOnJS(navigateToHome)();
              }
            });
          } else if (event.translationY < -threshold) {
            translateY.value = withTiming(-screenHeight, { duration: 220 }, finished => {
              if (finished) {
                runOnJS(navigateToHome)();
              }
            });
          } else {
            translateY.value = withTiming(0, { duration: 200 });
          }
        }),
    [navigateToHome, screenHeight, translateY],
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
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={navigateToHome}>
              <Text style={styles.backButton}>↓ Close</Text>
            </Pressable>
            <Text style={styles.title}>Statistics</Text>
          </View>

          <GHScrollView
            contentContainerStyle={styles.content}
            simultaneousHandlers={panRef}
          >
            <View style={styles.grid}>
              <StatisticBlock
                label="Total Minutes"
                value={`${stats.totalMinutes}`}
                sub={`${stats.totalSessions} sessions`}
              />
              <StatisticBlock
                label="Completion Rate"
                value={`${Math.round(stats.completionRate * 100)}%`}
                sub={`${stats.completedSessions} completed`}
              />
              <StatisticBlock
                label="Weekly Focus"
                value={`${stats.weeklyMinutes}m`}
                sub="Last 7 days"
              />
              <StatisticBlock
                label="Monthly Focus"
                value={`${stats.monthlyMinutes}m`}
                sub="Last 30 days"
              />
              <StatisticBlock
                label="Avg. Length"
                value={`${stats.averageDuration}m`}
                sub="Per session"
              />
              <StatisticBlock
                label="Best Streak"
                value={`${stats.bestStreak} days`}
                sub={`Current: ${stats.currentStreak}`}
              />
            </View>
          </GHScrollView>
        </SafeAreaView>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    fontWeight: '600',
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.2)',
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: theme.colors.text,
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  statSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});

export default StatisticsScreen;
