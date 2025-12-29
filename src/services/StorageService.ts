import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SessionRecord,
  SubscriptionState,
  UserSettings,
  PremiumFeature,
} from '../types';

const STORAGE_KEYS = {
  SESSIONS: '@serenityspark:sessions',
  SETTINGS: '@serenityspark:settings',
  SUBSCRIPTION: '@serenityspark:subscription',
};

const DEFAULT_SETTINGS: UserSettings = {
  defaultNatureTrack: 'forest',
  defaultMusicTrack: 'amberlight',
  hasSeenOnboarding: false,
  lastSelectedDuration: 10,
  reducedMotion: false,
  lastBackgroundImageIndex: null,
  hardModeEnabled: false,
  aggressiveRemindersEnabled: false,
  focusAdvisorEnabled: true,
  premiumTheme: 'default',
  theme: 'dark',
  soundEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: false,
  notificationPeriods: {
    morning: true,
    day: true,
    evening: true,
  },
  reminderTimes: {
    morning: { hour: 8, minute: 0 },
    day: { hour: 13, minute: 0 },
    evening: { hour: 20, minute: 0 },
  },
  customNotificationPeriods: [],
  hasAskedNotificationPermission: false,
};

const PREMIUM_FEATURES: PremiumFeature[] = [
  'focusOptimizer',
  'distractionBlocking',
  'hardMode',
  'advancedAnalytics',
  'premiumThemes',
  'liveActivities',
  'backups',
  'reports',
  'soundPacks',
];

class StorageService {
  private inMemorySessions: SessionRecord[] = [];
  private inMemorySettings: UserSettings = DEFAULT_SETTINGS;
  private inMemorySubscription: SubscriptionState = {
    isPremium: false,
    activeProducts: [],
    entitlements: PREMIUM_FEATURES.reduce(
      (acc, feature) => ({ ...acc, [feature]: false }),
      {} as Record<PremiumFeature, boolean>,
    ),
    packs: {
      themePack: false,
      focusSoundsPack: false,
      deepWorkPack: false,
    },
  };
  private storageReady = false;
  private storageBroken = false;
  private warned = false;

  private async ensureStorage(): Promise<boolean> {
    if (this.storageBroken) {
      return false;
    }
    if (this.storageReady) {
      return true;
    }
    try {
      await AsyncStorage.setItem(
        '@serenityspark:healthcheck',
        Date.now().toString(),
      );
      this.storageReady = true;
      return true;
    } catch (error) {
      if (!this.warned) {
        console.warn(
          'AsyncStorage not writable; falling back to in-memory only.',
          error,
        );
        this.warned = true;
      }
      this.storageBroken = true;
      return false;
    }
  }

  async saveSession(session: SessionRecord): Promise<void> {
    const canPersist = await this.ensureStorage();
    const sessions = await this.getHistory();
    sessions.unshift(session);
    if (canPersist) {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SESSIONS,
          JSON.stringify(sessions),
        );
      } catch (error) {
        if (!this.warned) {
          console.warn('Failed to save session, using memory fallback.', error);
          this.warned = true;
        }
      }
    }
    this.inMemorySessions = sessions;
  }

  async getHistory(): Promise<SessionRecord[]> {
    const canPersist = await this.ensureStorage();
    if (canPersist) {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
        if (data) {
          const sessions = JSON.parse(data);
          this.inMemorySessions = sessions;
          return sessions;
        }
        return [];
      } catch (error) {
        if (!this.warned) {
          console.warn('Failed to read history, using memory cache.', error);
          this.warned = true;
        }
      }
    }
    return this.inMemorySessions;
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    const canPersist = await this.ensureStorage();
    if (canPersist) {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(settings),
        );
      } catch (error) {
        if (!this.warned) {
          console.warn(
            'Failed to save settings, using memory fallback.',
            error,
          );
          this.warned = true;
        }
      }
    }
    this.inMemorySettings = settings;
  }

  async getSettings(): Promise<UserSettings> {
    const canPersist = await this.ensureStorage();
    if (canPersist) {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (data) {
          const settings = JSON.parse(data);
          const merged = { ...DEFAULT_SETTINGS, ...settings };
          this.inMemorySettings = merged;
          return merged;
        }
        return DEFAULT_SETTINGS;
      } catch (error) {
        if (!this.warned) {
          console.warn(
            'Failed to read settings, using memory fallback.',
            error,
          );
          this.warned = true;
        }
      }
    }
    return this.inMemorySettings;
  }

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS);
      this.inMemorySessions = [];
    } catch (error) {
      console.warn('Failed to clear history:', error);
    }
  }

  async resetSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
      this.inMemorySettings = DEFAULT_SETTINGS;
    } catch (error) {
      console.warn('Failed to reset settings:', error);
    }
  }

  async saveSubscriptionState(subscription: SubscriptionState): Promise<void> {
    const canPersist = await this.ensureStorage();
    if (canPersist) {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SUBSCRIPTION,
          JSON.stringify(subscription),
        );
      } catch (error) {
        if (!this.warned) {
          console.warn(
            'Failed to save subscription state, using memory fallback.',
            error,
          );
          this.warned = true;
        }
      }
    }
    this.inMemorySubscription = subscription;
  }

  async getSubscriptionState(): Promise<SubscriptionState> {
    const canPersist = await this.ensureStorage();
    if (canPersist) {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
        if (data) {
          const parsed = JSON.parse(data);
          const merged: SubscriptionState = {
            ...this.inMemorySubscription,
            ...parsed,
            entitlements: {
              ...this.inMemorySubscription.entitlements,
              ...(parsed?.entitlements ?? {}),
            },
            packs: {
              ...this.inMemorySubscription.packs,
              ...(parsed?.packs ?? {}),
            },
          };
          this.inMemorySubscription = merged;
          return merged;
        }
      } catch (error) {
        if (!this.warned) {
          console.warn(
            'Failed to read subscription state, using memory fallback.',
            error,
          );
          this.warned = true;
        }
      }
    }
    return this.inMemorySubscription;
  }
}

export default new StorageService();
