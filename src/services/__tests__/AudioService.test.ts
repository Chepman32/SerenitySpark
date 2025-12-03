import Sound from 'react-native-sound';
import AudioService from '../AudioService';

type SoundMockMethods = {
  mockPlay: jest.Mock;
  mockStop: jest.Mock;
  mockRelease: jest.Mock;
  mockSetVolume: jest.Mock;
  mockGetVolume: jest.Mock;
  mockSetNumberOfLoops: jest.Mock;
  mockSetCurrentTime: jest.Mock;
  mockIsLoaded: jest.Mock;
};

const mockSoundMethods: SoundMockMethods = {
  mockPlay: jest.fn(callback => {
    callback?.(true);
    return true;
  }),
  mockStop: jest.fn(callback => callback?.()),
  mockRelease: jest.fn(callback => callback?.()),
  mockSetVolume: jest.fn(),
  mockGetVolume: jest.fn(() => 1),
  mockSetNumberOfLoops: jest.fn(),
  mockSetCurrentTime: jest.fn(),
  mockIsLoaded: jest.fn(() => true),
};

jest.mock('react-native-sound', () => {
  const SoundMock = jest
    .fn()
    .mockImplementation((_source: any, callback?: (error?: any) => void) => {
      callback?.();
      return {
        play: mockSoundMethods.mockPlay,
        stop: mockSoundMethods.mockStop,
        release: mockSoundMethods.mockRelease,
        setVolume: mockSoundMethods.mockSetVolume,
        getVolume: mockSoundMethods.mockGetVolume,
        setNumberOfLoops: mockSoundMethods.mockSetNumberOfLoops,
        setCurrentTime: mockSoundMethods.mockSetCurrentTime,
        isLoaded: mockSoundMethods.mockIsLoaded,
      };
    });

  SoundMock.setCategory = jest.fn();
  SoundMock.enableInSilenceMode = jest.fn();
  (SoundMock as any).__mockedMethods = mockSoundMethods;

  return SoundMock;
});

describe('AudioService', () => {
  const soundMocks = (Sound as any).__mockedMethods as SoundMockMethods;

  beforeEach(async () => {
    jest.clearAllMocks();
    Object.values(soundMocks).forEach(mock => mock.mockClear());
    (Sound as jest.Mock).mockClear();
    soundMocks.mockGetVolume.mockReturnValue(1);
    await AudioService.unloadAll();
    (AudioService as any).sounds = new Map();
    (AudioService as any).isInitialized = false;
  });

  describe('initialize', () => {
    it('should set audio mode correctly', async () => {
      await AudioService.initialize();

      expect((Sound as any).setCategory).toHaveBeenCalledWith(
        'Playback',
        true,
      );
      expect((Sound as any).enableInSilenceMode).toHaveBeenCalledWith(true);
    });
  });

  describe('loadTrack', () => {
    it('should load a track successfully', async () => {
      const sound = await AudioService.loadTrack('forest');

      expect(Sound).toHaveBeenCalled();
      expect(sound).toBeTruthy();
    });

    it('should return null for invalid track', async () => {
      const sound = await AudioService.loadTrack('invalid');

      expect(sound).toBeNull();
    });
  });

  describe('playTrack', () => {
    it('should play a track with looping', async () => {
      await AudioService.playTrack('forest', true);

      expect(soundMocks.mockSetNumberOfLoops).toHaveBeenCalledWith(-1);
      expect(soundMocks.mockPlay).toHaveBeenCalled();
    });
  });

  describe('stopTrack', () => {
    it('should stop a track without fade', async () => {
      await AudioService.loadTrack('forest');
      await AudioService.stopTrack('forest', false);

      expect(soundMocks.mockStop).toHaveBeenCalled();
      expect(soundMocks.mockSetCurrentTime).toHaveBeenCalledWith(0);
    });
  });

  describe('mixTracks', () => {
    it('should play multiple tracks simultaneously', async () => {
      await AudioService.mixTracks(['forest', 'amberlight']);

      expect((Sound as jest.Mock).mock.calls.length).toBe(2);
    });
  });

  describe('setVolume', () => {
    it('should set volume within valid range', async () => {
      await AudioService.loadTrack('forest');
      await AudioService.setVolume('forest', 0.5);

      expect(soundMocks.mockSetVolume).toHaveBeenLastCalledWith(0.5);
    });

    it('should clamp volume to 0-1 range', async () => {
      await AudioService.loadTrack('forest');
      await AudioService.setVolume('forest', 1.5);

      expect(soundMocks.mockSetVolume).toHaveBeenLastCalledWith(1);
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
