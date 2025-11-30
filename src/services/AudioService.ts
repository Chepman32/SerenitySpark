import Sound from 'react-native-sound';
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
  private sounds: Map<string, Sound> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      Sound.setCategory('Playback', true);
      Sound.enableInSilenceMode(true);
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

  private async createSound(track: AudioTrack): Promise<Sound | null> {
    const source = this.getAudioSource(track);
    if (!source) {
      console.error(`Audio source not found for track: ${track.id}`);
      return null;
    }

    return new Promise(resolve => {
      const sound = new Sound(source, error => {
        if (error) {
          console.error(`Failed to load track ${track.id}:`, error);
          resolve(null);
          return;
        }

        resolve(sound);
      });
    });
  }

  private playSound(sound: Sound, waitForCompletion: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      const started = sound.play(success => {
        if (!success) {
          console.error('Playback failed to finish');
          if (waitForCompletion) {
            reject(new Error('Playback failed'));
          }
          return;
        }
        if (waitForCompletion) {
          resolve();
        }
      });

      if (started === false) {
        reject(new Error('Playback failed to start'));
        return;
      }

      if (!waitForCompletion) {
        resolve();
      }
    });
  }

  async loadTrack(trackId: string): Promise<Sound | null> {
    try {
      await this.initialize();

      if (this.sounds.has(trackId)) {
        return this.sounds.get(trackId)!;
      }

      const track = AUDIO_TRACKS.find(t => t.id === trackId);
      if (!track) {
        console.error(`Track not found: ${trackId}`);
        return null;
      }

      const sound = await this.createSound(track);
      if (!sound) {
        return null;
      }

      sound.setNumberOfLoops(-1);
      sound.setVolume(0.7);

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

      sound.setNumberOfLoops(loop ? -1 : 0);
      await this.playSound(sound);
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

      await new Promise<void>(resolve => {
        sound.stop(() => {
          sound.setCurrentTime?.(0);
          resolve();
        });
      });
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
        sound.setVolume(Math.max(0, Math.min(1, volume)));
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

      if (!sound.isLoaded()) {
        return;
      }

      const startVolume = sound.getVolume() || 1;
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = startVolume / steps;

      for (let i = 0; i < steps; i++) {
        const newVolume = startVolume - volumeStep * (i + 1);
        sound.setVolume(Math.max(0, newVolume));
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
      const unloadPromises = Array.from(this.sounds.values()).map(
        sound =>
          new Promise<void>(resolve => {
            sound.release(() => resolve());
          }),
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

      const sound = await this.createSound(chimeTrack);
      if (!sound) {
        return;
      }

      sound.setVolume(0.8);
      sound.setNumberOfLoops(0);

      await this.playSound(sound, true);
      sound.release();
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
