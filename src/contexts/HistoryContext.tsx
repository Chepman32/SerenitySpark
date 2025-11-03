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
    const totalSessions = sessions.filter(s => s.completed).length;
    const totalMinutes = sessions
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.duration, 0);

    const currentStreak = calculateStreak(sessions);

    setStats({
      totalSessions,
      totalMinutes,
      currentStreak,
    });
  };

  const calculateStreak = (sessionList: SessionRecord[]): number => {
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentDate = today.getTime();

    for (const session of completedSessions) {
      const sessionDate = new Date(session.timestamp);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === currentDate) {
        streak++;
        currentDate -= 24 * 60 * 60 * 1000;
      } else if (sessionDate.getTime() < currentDate) {
        break;
      }
    }

    return streak;
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
