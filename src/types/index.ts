export interface SessionRecord {
  id: string;
  timestamp: number;
  duration: number;
  completed: boolean;
  audioSettings: {
    nature: boolean;
    music: boolean;
  };
}

export interface UserSettings {
  defaultNatureTrack: string;
  defaultMusicTrack: string;
  hasSeenOnboarding: boolean;
  lastSelectedDuration: number;
  reducedMotion: boolean;
  lastBackgroundImageIndex: number | null;
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
}
