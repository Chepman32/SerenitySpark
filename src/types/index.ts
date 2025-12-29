export interface SessionRecord {
  id: string;
  timestamp: number;
  duration: number;
  completed: boolean;
  endType?: 'completed' | 'gave_up' | 'cancelled';
  endReason?: string | null;
  actualDurationSeconds?: number;
  audioSettings: {
    nature: boolean;
    music: boolean;
  };
}

export interface ReminderTime {
  hour: number;
  minute: number;
}

export interface NotificationPeriod {
  id: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  enabled: boolean;
}

export interface UserSettings {
  defaultNatureTrack: string;
  defaultMusicTrack: string;
  hasSeenOnboarding: boolean;
  lastSelectedDuration: number;
  reducedMotion: boolean;
  lastBackgroundImageIndex: number | null;
  hardModeEnabled: boolean;
  aggressiveRemindersEnabled: boolean;
  focusAdvisorEnabled: boolean;
  premiumTheme: 'default' | 'amoled' | 'neon' | 'seasonal';
  theme: 'light' | 'dark' | 'solar' | 'mono';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  notificationPeriods: {
    morning: boolean;
    day: boolean;
    evening: boolean;
  };
  reminderTimes: {
    morning: ReminderTime;
    day: ReminderTime;
    evening: ReminderTime;
  };
  customNotificationPeriods: NotificationPeriod[];
  hasAskedNotificationPermission: boolean;
}

export interface AudioTrack {
  id: string;
  name: string;
  filename: string;
  type: 'nature' | 'music';
  duration: number;
  isPremium: boolean;
}

export interface AudioSettings {
  natureEnabled: boolean;
  musicEnabled: boolean;
  natureTrack: string;
  musicTrack: string;
}

export interface SessionState {
  duration: number;
  elapsed: number;
  isActive: boolean;
  audioSettings: AudioSettings;
}

export interface HistoryStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  completedSessions: number;
  gaveUpSessions: number;
  completionRate: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
  averageDuration: number;
  bestStreak: number;
  mostProductiveDay: string;
  longestSessionMinutes: number;
}

export type PremiumFeature =
  | 'focusOptimizer'
  | 'distractionBlocking'
  | 'hardMode'
  | 'advancedAnalytics'
  | 'premiumThemes'
  | 'liveActivities'
  | 'backups'
  | 'reports'
  | 'soundPacks';

export interface SubscriptionState {
  isPremium: boolean;
  activeProducts: string[];
  entitlements: Record<PremiumFeature, boolean>;
  packs: {
    themePack: boolean;
    focusSoundsPack: boolean;
    deepWorkPack: boolean;
  };
  lastSynced?: number;
}
