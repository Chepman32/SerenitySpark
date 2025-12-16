import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { useHistory } from '../contexts/HistoryContext';
import { useApp } from '../contexts/AppContext';
import { SessionRecord } from '../types';
const HistoryScreen: React.FC = () => {
  const { sessions, stats } = useHistory();
  const { navigateToHome } = useApp();

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSession = ({ item }: { item: SessionRecord }) => (
    <View style={styles.sessionItem}>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionDate}>{formatDate(item.timestamp)}</Text>
        <Text style={styles.sessionTime}>{formatTime(item.timestamp)}</Text>
      </View>
      <Text style={styles.sessionDuration}>{item.duration} min</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={navigateToHome}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Your Journey</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalSessions}</Text>
          <Text style={styles.statLabel}>Sessions Logged</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalMinutes}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      <View style={styles.analyticsContainer}>
        <View style={styles.analyticsRow}>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>
              {(stats.completionRate * 100).toFixed(0)}%
            </Text>
            <Text style={styles.analyticsLabel}>Reached the end</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{stats.gaveUpSessions}</Text>
            <Text style={styles.analyticsLabel}>Gave up</Text>
          </View>
        </View>
        <View style={styles.analyticsRow}>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{stats.weeklyMinutes}</Text>
            <Text style={styles.analyticsLabel}>Last 7 days (min)</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{stats.monthlyMinutes}</Text>
            <Text style={styles.analyticsLabel}>Last 30 days (min)</Text>
          </View>
        </View>
        <View style={styles.analyticsRow}>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{stats.averageDuration}m</Text>
            <Text style={styles.analyticsLabel}>Avg. session length</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{stats.bestStreak}</Text>
            <Text style={styles.analyticsLabel}>Best streak</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No sessions yet. Start meditating!
          </Text>
        }
      />
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
    fontWeight: '300',
    color: theme.colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '300',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  analyticsContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.3)',
  },
  analyticsValue: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  analyticsLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },

  listContent: {
    padding: theme.spacing.lg,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  sessionDuration: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: theme.spacing.xl,
  },
});

export default HistoryScreen;
