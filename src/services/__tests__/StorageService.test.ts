import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageService from '../StorageService';
import { SessionRecord, UserSettings } from '../../types';

jest.mock('@react-native-async-storage/async-storage');

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveSession', () => {
    it('should save a session to AsyncStorage', async () => {
      const mockSession: SessionRecord = {
        id: '1',
        timestamp: Date.now(),
        duration: 10,
        completed: true,
        audioSettings: { nature: true, music: false },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await StorageService.saveSession(mockSession);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@serenityspark:sessions',
        JSON.stringify([mockSession]),
      );
    });

    it('should handle errors and use in-memory fallback', async () => {
      const mockSession: SessionRecord = {
        id: '2',
        timestamp: Date.now(),
        duration: 5,
        completed: true,
        audioSettings: { nature: false, music: true },
      };

      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error'),
      );

      await StorageService.saveSession(mockSession);

      const history = await StorageService.getHistory();
      expect(history).toContainEqual(mockSession);
    });
  });

  describe('getHistory', () => {
    it('should retrieve sessions from AsyncStorage', async () => {
      const mockSessions: SessionRecord[] = [
        {
          id: '1',
          timestamp: Date.now(),
          duration: 10,
          completed: true,
          audioSettings: { nature: true, music: false },
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSessions),
      );

      const result = await StorageService.getHistory();

      expect(result).toEqual(mockSessions);
    });

    it('should return empty array when no data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await StorageService.getHistory();

      expect(result).toEqual([]);
    });
  });

  describe('saveSettings', () => {
    it('should save settings to AsyncStorage', async () => {
      const mockSettings: UserSettings = {
        defaultNatureTrack: 'forest',
        defaultMusicTrack: 'amberlight',
        hasSeenOnboarding: true,
        lastSelectedDuration: 15,
        reducedMotion: false,
        lastBackgroundImageIndex: 2,
      };

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await StorageService.saveSettings(mockSettings);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@serenityspark:settings',
        JSON.stringify(mockSettings),
      );
    });
  });

  describe('getSettings', () => {
    it('should retrieve settings from AsyncStorage', async () => {
      const mockSettings: UserSettings = {
        defaultNatureTrack: 'forest',
        defaultMusicTrack: 'amberlight',
        hasSeenOnboarding: true,
        lastSelectedDuration: 10,
        reducedMotion: false,
        lastBackgroundImageIndex: 1,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSettings),
      );

      const result = await StorageService.getSettings();

      expect(result).toEqual(mockSettings);
    });

    it('should return default settings when no data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await StorageService.getSettings();

      expect(result).toHaveProperty('defaultNatureTrack');
      expect(result).toHaveProperty('hasSeenOnboarding', false);
    });
  });
});
