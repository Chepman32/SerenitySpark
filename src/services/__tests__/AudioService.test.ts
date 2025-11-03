import { Audio } from 'expo-av';
import AudioService from '../AudioService';

jest.mock('expo-av');

describe('AudioService', () => {
  const mockSound = {
    playAsync: jest.fn(),
    stopAsync: jest.fn(),
    setIsLoopingAsync: jest.fn(),
    setVolumeAsync: jest.fn(),
    setPositionAsync: jest.fn(),
    getStatusAsync: jest.fn(),
    unloadAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Audio.setAudioModeAsync as jest.Mock).mockResolvedValue(undefined);
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
    });
    mockSound.getStatusAsync.mockResolvedValue({
      isLoaded: true,
      volume: 1,
    });
  });

  describe('initialize', () => {
    it('should set audio mode correctly', async () => {
      await AudioService.initialize();

      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    });
  });

  describe('loadTrack', () => {
    it('should load a track successfully', async () => {
      const sound = await AudioService.loadTrack('rain');

      expect(Audio.Sound.createAsync).toHaveBeenCalled();
      expect(sound).toBeTruthy();
    });

    it('should return null for invalid track', async () => {
      const sound = await AudioService.loadTrack('invalid');

      expect(sound).toBeNull();
    });
  });

  describe('playTrack', () => {
    it('should play a track with looping', async () => {
      await AudioService.playTrack('rain', true);

      expect(mockSound.setIsLoopingAsync).toHaveBeenCalledWith(true);
      expect(mockSound.playAsync).toHaveBeenCalled();
    });
  });

  describe('stopTrack', () => {
    it('should stop a track without fade', async () => {
      await AudioService.loadTrack('rain');
      await AudioService.stopTrack('rain', false);

      expect(mockSound.stopAsync).toHaveBeenCalled();
      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
    });
  });

  describe('mixTracks', () => {
    it('should play multiple tracks simultaneously', async () => {
      await AudioService.mixTracks(['rain', 'piano']);

      expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('setVolume', () => {
    it('should set volume within valid range', async () => {
      await AudioService.loadTrack('rain');
      await AudioService.setVolume('rain', 0.5);

      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.5);
    });

    it('should clamp volume to 0-1 range', async () => {
      await AudioService.loadTrack('rain');
      await AudioService.setVolume('rain', 1.5);

      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(1);
    });
  });

  describe('getAvailableTracks', () => {
    it('should return all tracks when no type specified', () => {
      const tracks = AudioService.getAvailableTracks();

      expect(tracks.length).toBeGreaterThan(0);
    });

    it('should filter tracks by type', () => {
      const natureTracks = AudioService.getAvailableTracks('nature');

      expect(natureTracks.every(t => t.type === 'nature')).toBe(true);
    });
  });
});
