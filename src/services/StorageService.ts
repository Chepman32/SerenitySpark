import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionRecord, UserSettings } from '../types';

const STORAGE_KEYS = {
  SESSIONS: '@serenityspark:sessions',
  SETTINGS: '@serenityspark:settings',
};

const DEFAULT_SETTINGS: UserSettings = {
  defaultNatureTrack: 'rain',
  defaultMusicTrack: 'piano',
  hasSeenOnboarding: false,
  lastSelectedDuration: 10,
  reducedMotion: false,
  lastBackgroundImageIndex: null,
};

class StorageService {
  private inMemorySessions: SessionRecord[] = [];
  private inMemorySettings: UserSettings = DEFAULT_SETTINGS;

  async saveSession(session: SessionRecord): Promise<void> {
    try {
      const sessions = await this.getHistory();
      sessions.unshift(session);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSIONS,
        JSON.stringify(sessions),
      );
      this.inMemorySessions = sessions;
    } catch (error) {
      console.error('Failed to save session:', error);
      this.inMemorySessions.unshift(session);
    }
  }

  async getHistory(): Promise<SessionRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (data) {
        const sessions = JSON.parse(data);
        this.inMemorySessions = sessions;
        return sessions;
      }
      return [];
    } catch (error) {
      console.error('Failed to get history:', error);
      return this.inMemorySessions;
    }
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(settings),
      );
      this.inMemorySettings = settings;
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.inMemorySettings = settings;
    }
  }

  async getSettings(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        const settings = JSON.parse(data);
        this.inMemorySettings = settings;
        return settings;
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.inMemorySettings;
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS);
      this.inMemorySessions = [];
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  async resetSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
      this.inMemorySettings = DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  }
}

export default new StorageService();
