import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={navigateToHome}>
          <Text style={styles.backButton}>↓ Close</Text>
        </Pressable>
        <Text style={styles.title}>Statistics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
      </ScrollView>
    </SafeAreaView>
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
