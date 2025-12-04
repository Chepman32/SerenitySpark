import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { SessionRecord, HistoryStats } from '../types';
import StorageService from '../services/StorageService';

interface HistoryContextType {
  sessions: SessionRecord[];
  stats: HistoryStats;
  addSession: (session: SessionRecord) => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    completedSessions: 0,
    gaveUpSessions: 0,
    completionRate: 0,
    weeklyMinutes: 0,
    monthlyMinutes: 0,
    averageDuration: 0,
    bestStreak: 0,
  });

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [sessions]);

  const loadHistory = async () => {
    const loadedSessions = await StorageService.getHistory();
    setSessions(loadedSessions);
  };

  const calculateStats = () => {
    const completedSessions = sessions.filter(s => s.completed).length;
    const gaveUpSessions = sessions.filter(
      s => !s.completed && s.endType === 'gave_up',
    ).length;
    const totalSessions = sessions.length;

    const totalFocusSeconds = sessions.reduce((sum, s) => {
      const elapsedSeconds =
        typeof s.actualDurationSeconds === 'number'
          ? s.actualDurationSeconds
          : s.duration * 60;
      return sum + elapsedSeconds;
    }, 0);

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const weeklyMinutes = Math.round(
      sessions
        .filter(s => s.timestamp >= weekAgo)
        .reduce((sum, s) => {
          const elapsedSeconds =
            typeof s.actualDurationSeconds === 'number'
              ? s.actualDurationSeconds
              : s.duration * 60;
          return sum + elapsedSeconds / 60;
        }, 0),
    );

    const monthlyMinutes = Math.round(
      sessions
        .filter(s => s.timestamp >= monthAgo)
        .reduce((sum, s) => {
          const elapsedSeconds =
            typeof s.actualDurationSeconds === 'number'
              ? s.actualDurationSeconds
              : s.duration * 60;
          return sum + elapsedSeconds / 60;
        }, 0),
    );

    const averageDuration =
      totalSessions === 0
        ? 0
        : Math.round(
            sessions.reduce((sum, s) => {
              const durationMinutes = s.actualDurationSeconds
                ? s.actualDurationSeconds / 60
                : s.duration;
              return sum + durationMinutes;
            }, 0) / totalSessions,
          );

    const currentStreak = calculateStreak(sessions);
    const bestStreak = calculateStreak(sessions, true);

    setStats({
      totalSessions,
      totalMinutes: Math.round(totalFocusSeconds / 60),
      currentStreak,
      completedSessions,
      gaveUpSessions,
      completionRate:
        totalSessions === 0 ? 0 : completedSessions / totalSessions,
      weeklyMinutes,
      monthlyMinutes,
      averageDuration,
      bestStreak,
    });
  };

  const calculateStreak = (
    sessionList: SessionRecord[],
    findMax = false,
  ): number => {
    if (sessionList.length === 0) {
      return 0;
    }

    const completedSessions = sessionList
      .filter(s => s.completed)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (completedSessions.length === 0) {
      return 0;
    }

    let streak = 0;
    let best = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentDate = today.getTime();

    for (const session of completedSessions) {
      const sessionDate = new Date(session.timestamp);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === currentDate) {
        streak++;
        currentDate -= 24 * 60 * 60 * 1000;
        best = Math.max(best, streak);
      } else if (sessionDate.getTime() < currentDate) {
        break;
      }
    }

    return findMax ? Math.max(best, streak) : streak;
  };

  const addSession = async (session: SessionRecord) => {
    await StorageService.saveSession(session);
    await loadHistory();
  };

  const clearHistory = async () => {
    await StorageService.clearHistory();
    setSessions([]);
  };

  const refreshHistory = async () => {
    await loadHistory();
  };

  return (
    <HistoryContext.Provider
      value={{ sessions, stats, addSession, clearHistory, refreshHistory }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within HistoryProvider');
  }
  return context;
};
