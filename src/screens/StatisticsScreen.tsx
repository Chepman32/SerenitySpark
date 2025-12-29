import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
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
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useHistory } from '../contexts/HistoryContext';
import { useApp } from '../contexts/AppContext';

const StatisticBlock: React.FC<{
  label: string;
  value: string;
  sub?: string;
  theme: any;
}> = ({ label, value, sub, theme }) => {
  const styles = createBlockStyles(theme);
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
};

const createBlockStyles = (theme: any) =>
  StyleSheet.create({
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

const StatisticsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
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
          if (event.translationY < -threshold) {
            translateY.value = withTiming(
              -screenHeight,
              { duration: 220 },
              finished => {
                if (finished) {
                  runOnJS(navigateToHome)();
                }
              },
            );
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

  const styles = createStyles(theme);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={navigateToHome}>
              <Text style={styles.backButton}>↓ {t('statistics.close')}</Text>
            </Pressable>
            <Text style={styles.title}>{t('statistics.title')}</Text>
          </View>

          <GHScrollView
            contentContainerStyle={styles.content}
            simultaneousHandlers={panRef}
            bounces={false}
            overScrollMode="never"
          >
            <View style={styles.grid}>
              <StatisticBlock
                label={t('statistics.totalMinutes')}
                value={`${stats.totalMinutes}`}
                sub={`${stats.totalSessions} ${t('statistics.sessions')}`}
                theme={theme}
              />
              <StatisticBlock
                label={t('statistics.completionRate')}
                value={`${Math.round(stats.completionRate * 100)}%`}
                sub={`${stats.completedSessions} ${t('statistics.completed')}`}
                theme={theme}
              />
              <StatisticBlock
                label={t('statistics.weeklyFocus')}
                value={`${stats.weeklyMinutes}m`}
                sub={t('statistics.last7Days')}
                theme={theme}
              />
              <StatisticBlock
                label={t('statistics.monthlyFocus')}
                value={`${stats.monthlyMinutes}m`}
                sub={t('statistics.last30Days')}
                theme={theme}
              />
              <StatisticBlock
                label={t('statistics.avgLength')}
                value={`${stats.averageDuration}m`}
                sub={t('statistics.perSession')}
                theme={theme}
              />
              <StatisticBlock
                label={t('statistics.bestStreak')}
                value={`${stats.bestStreak} ${t('history.days')}`}
                sub={`${t('statistics.current')}: ${stats.currentStreak}`}
                theme={theme}
              />
              <StatisticBlock
                label={t('statistics.mostProductive')}
                value={stats.mostProductiveDay}
                sub={t('statistics.dayOfWeek')}
                theme={theme}
              />
              <StatisticBlock
                label={t('statistics.longestSession')}
                value={`${stats.longestSessionMinutes}m`}
                sub={t('statistics.personalBest')}
                theme={theme}
              />
            </View>
          </GHScrollView>
        </SafeAreaView>
      </Animated.View>
    </GestureDetector>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
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
  });

export default StatisticsScreen;
