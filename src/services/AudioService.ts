import { Image } from 'react-native';
import Sound from 'react-native-sound';
import { AudioTrack } from '../types';

const DEFAULT_VOLUME = 0.7;

const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'forest',
    name: 'Forest Ambience',
    filename: 'forest.mp3',
    type: 'nature',
    duration: 300,
    isPremium: false,
  },
  {
    id: 'jungle',
    name: 'Jungle Night',
    filename: 'jungle.mp3',
    type: 'nature',
    duration: 300,
    isPremium: false,
  },
  {
    id: 'amberlight',
    name: 'Amberlight',
    filename: 'amberlight.mp3',
    type: 'music',
    duration: 300,
    isPremium: false,
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    filename: 'sovereign.mp3',
    type: 'music',
    duration: 300,
    isPremium: false,
  },
];

class AudioService {
  private sounds: Map<string, Sound> = new Map();
  private isInitialized = false;
  private preloadingPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      Sound.setCategory('Playback', true);
      Sound.enableInSilenceMode(true);
      await this.preloadAllTracks();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  private getAudioSource(track: AudioTrack): any {
    // Keep this mapping explicit so Metro can bundle the assets
    switch (track.id) {
      case 'forest':
        return require('../assets/audio/nature/forest.mp3');
      case 'jungle':
        return require('../assets/audio/nature/jungle.mp3');
      case 'amberlight':
        return require('../assets/audio/music/amberlight.mp3');
      case 'sovereign':
        return require('../assets/audio/music/sovereign.mp3');
      default:
        return undefined;
    }
  }

  private preloadAllTracks(): Promise<void> {
    if (this.preloadingPromise) {
      return this.preloadingPromise;
    }

    this.preloadingPromise = Promise.all(
      AUDIO_TRACKS.map(async track => {
        if (this.sounds.has(track.id)) {
          return;
        }
        const sound = await this.createSound(track);
        if (sound) {
          sound.setNumberOfLoops(-1);
          sound.setVolume(DEFAULT_VOLUME);
          this.sounds.set(track.id, sound);
        }
      }),
    )
      .catch(error => {
        console.error('Failed to preload audio tracks:', error);
      })
      .then(() => {
        this.preloadingPromise = null;
      });

    return this.preloadingPromise;
  }

  private async createSound(track: AudioTrack): Promise<Sound | null> {
    const source = this.getAudioSource(track);
    if (!source) {
      console.error(`Audio source not found for track: ${track.id}`);
      return null;
    }

    const resolvedSource = this.resolveAudioUri(source);
    if (!resolvedSource) {
      console.error(`Unable to resolve audio URI for track: ${track.id}`);
      return null;
    }

    return new Promise(resolve => {
      const sound = new Sound(resolvedSource, undefined, error => {
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

      // if (started === false) {
      //   reject(new Error('Playback failed to start'));
      //   return;
      // }

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
      sound.setVolume(DEFAULT_VOLUME);

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

      sound.setVolume(DEFAULT_VOLUME);
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
          sound.setVolume(DEFAULT_VOLUME);
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
            sound.release();
            resolve();
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
      return AUDIO_TRACKS.filter(track => track.type === type);
    }
    return AUDIO_TRACKS;
  }

  getRandomTrack(type: 'nature' | 'music'): AudioTrack | undefined {
    const tracks = this.getAvailableTracks(type);
    if (tracks.length === 0) {
      return undefined;
    }
    const randomIndex = Math.floor(Math.random() * tracks.length);
    return tracks[randomIndex];
  }

  private resolveAudioUri(source: any): string | null {
    if (!source) {
      return null;
    }

    if (typeof source === 'string') {
      return source;
    }

    try {
      const resolved = Image.resolveAssetSource(source);
      if (resolved?.uri) {
        return resolved.uri;
      }
    } catch (error) {
      console.warn('Failed to resolve audio asset source:', error);
    }

    if (source.uri && typeof source.uri === 'string') {
      return source.uri;
    }

    return null;
  }

}

export default new AudioService();
