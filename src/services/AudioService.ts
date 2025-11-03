import { Audio, AVPlaybackStatus } from 'expo-av';
import { AudioTrack } from '../types';

const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'rain',
    name: 'Rain',
    filename: 'rain.mp3',
    type: 'nature',
    duration: 300,
    isPremium: false,
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    filename: 'ocean.mp3',
    type: 'nature',
    duration: 300,
    isPremium: false,
  },
  {
    id: 'forest',
    name: 'Forest',
    filename: 'forest.mp3',
    type: 'nature',
    duration: 300,
    isPremium: false,
  },
  {
    id: 'piano',
    name: 'Piano',
    filename: 'piano.mp3',
    type: 'music',
    duration: 300,
    isPremium: false,
  },
  {
    id: 'ambient',
    name: 'Ambient',
    filename: 'ambient.mp3',
    type: 'music',
    duration: 300,
    isPremium: false,
  },
  {
    id: 'chime',
    name: 'Chime',
    filename: 'chime.mp3',
    type: 'nature',
    duration: 2,
    isPremium: false,
  },
];

class AudioService {
  private sounds: Map<string, Audio.Sound> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  private getAudioSource(track: AudioTrack): any {
    // Map track IDs to require() statements for local assets
    const audioSources: Record<string, any> = {
      rain: require('../../assets/audio/nature/rain.mp3'),
      ocean: require('../../assets/audio/nature/ocean.mp3'),
      forest: require('../../assets/audio/nature/forest.mp3'),
      piano: require('../../assets/audio/music/piano.mp3'),
      ambient: require('../../assets/audio/music/ambient.mp3'),
      chime: require('../../assets/audio/chime.mp3'),
    };

    return audioSources[track.id];
  }

  async loadTrack(trackId: string): Promise<Audio.Sound | null> {
    try {
      if (this.sounds.has(trackId)) {
        return this.sounds.get(trackId)!;
      }

      const track = AUDIO_TRACKS.find(t => t.id === trackId);
      if (!track) {
        console.error(`Track not found: ${trackId}`);
        return null;
      }

      const source = this.getAudioSource(track);
      if (!source) {
        console.error(`Audio source not found for track: ${trackId}`);
        return null;
      }

      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: false,
        isLooping: true,
        volume: 0.7,
      });

      this.sounds.set(trackId, sound);
      return sound;
    } catch (error) {
      console.error(`Failed to load track ${trackId}:`, error);
      return null;
    }
  }

  async playTrack(trackId: string, loop: boolean = true): Promise<void> {
    try {
      await this.initialize();

      let sound = this.sounds.get(trackId);
      if (!sound) {
        const loadedSound = await this.loadTrack(trackId);
        if (!loadedSound) {
          return;
        }
        sound = loadedSound;
      }

      await sound.setIsLoopingAsync(loop);
      await sound.playAsync();
    } catch (error) {
      console.error(`Failed to play track ${trackId}:`, error);
    }
  }

  async stopTrack(trackId: string, fadeOut: boolean = false): Promise<void> {
    try {
      const sound = this.sounds.get(trackId);
      if (!sound) {
        return;
      }

      if (fadeOut) {
        await this.fadeOutTrack(trackId, 1000);
      }

      await sound.stopAsync();
      await sound.setPositionAsync(0);
    } catch (error) {
      console.error(`Failed to stop track ${trackId}:`, error);
    }
  }

  async mixTracks(trackIds: string[]): Promise<void> {
    try {
      await this.initialize();

      const playPromises = trackIds.map(trackId => this.playTrack(trackId));
      await Promise.all(playPromises);
    } catch (error) {
      console.error('Failed to mix tracks:', error);
    }
  }

  async setVolume(trackId: string, volume: number): Promise<void> {
    try {
      const sound = this.sounds.get(trackId);
      if (sound) {
        await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
      }
    } catch (error) {
      console.error(`Failed to set volume for ${trackId}:`, error);
    }
  }

  async fadeOutTrack(trackId: string, duration: number): Promise<void> {
    try {
      const sound = this.sounds.get(trackId);
      if (!sound) {
        return;
      }

      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        return;
      }

      const startVolume = status.volume || 1;
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = startVolume / steps;

      for (let i = 0; i < steps; i++) {
        const newVolume = startVolume - volumeStep * (i + 1);
        await sound.setVolumeAsync(Math.max(0, newVolume));
        await new Promise<void>(resolve =>
          setTimeout(() => resolve(), stepDuration),
        );
      }
    } catch (error) {
      console.error(`Failed to fade out ${trackId}:`, error);
    }
  }

  async stopAll(fadeOut: boolean = false): Promise<void> {
    try {
      const stopPromises = Array.from(this.sounds.keys()).map(trackId =>
        this.stopTrack(trackId, fadeOut),
      );
      await Promise.all(stopPromises);
    } catch (error) {
      console.error('Failed to stop all tracks:', error);
    }
  }

  async unloadAll(): Promise<void> {
    try {
      const unloadPromises = Array.from(this.sounds.values()).map(sound =>
        sound.unloadAsync(),
      );
      await Promise.all(unloadPromises);
      this.sounds.clear();
    } catch (error) {
      console.error('Failed to unload all tracks:', error);
    }
  }

  async playChime(): Promise<void> {
    try {
      await this.initialize();
      const chimeTrack = AUDIO_TRACKS.find(t => t.id === 'chime');
      if (!chimeTrack) {
        return;
      }

      const source = this.getAudioSource(chimeTrack);
      if (!source) {
        return;
      }

      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: true,
        isLooping: false,
        volume: 0.8,
      });

      // Unload after playing
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Failed to play chime:', error);
    }
  }

  getAvailableTracks(type?: 'nature' | 'music'): AudioTrack[] {
    if (type) {
      return AUDIO_TRACKS.filter(
        track => track.type === type && track.id !== 'chime',
      );
    }
    return AUDIO_TRACKS.filter(track => track.id !== 'chime');
  }
}

export default new AudioService();
