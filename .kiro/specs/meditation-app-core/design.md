# Design Document

## Overview

SerenitySpark is a React Native meditation app that leverages modern animation libraries and gesture-based navigation to provide an immersive, offline-first meditation experience. The architecture emphasizes smooth 60 FPS animations, intuitive touch interactions, and a calming visual aesthetic.

The app consists of four main screens (Splash, Home, Session, History) plus a Settings panel, all connected through gesture-based navigation. All functionality works completely offline with local data persistence.

## Architecture

### Technology Stack

- **Framework**: React Native (latest stable version)
- **Animation**: React Native Reanimated 3 (for 60 FPS native thread animations)
- **Graphics**: React Native Skia (@shopify/react-native-skia) for custom 2D rendering
- **Gestures**: React Native Gesture Handler (integrated with Reanimated)
- **Audio**: expo-av or react-native-sound for audio playback
- **Storage**: AsyncStorage for local data persistence
- **Physics**: Matter.js for splash screen physics simulation
- **Navigation**: Custom gesture-based navigation with minimal use of navigation library

### Application Structure

```
SerenitySpark/
├── src/
│   ├── screens/
│   │   ├── SplashScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── SessionScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── DurationCarousel.tsx
│   │   ├── SoundToggle.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── StartButton.tsx
│   │   └── OnboardingOverlay.tsx
│   ├── animations/
│   │   ├── SplashAnimation.tsx
│   │   ├── CompletionAnimation.tsx
│   │   └── TransitionAnimations.ts
│   ├── services/
│   │   ├── AudioService.ts
│   │   ├── StorageService.ts
│   │   └── HapticService.ts
│   ├── hooks/
│   │   ├── useSessionTimer.ts
│   │   ├── useGestureNavigation.ts
│   │   └── useAudioPlayer.ts
│   ├── constants/
│   │   ├── theme.ts
│   │   ├── durations.ts
│   │   └── animations.ts
│   └── types/
│       └── index.ts
└── assets/
    ├── audio/
    │   ├── nature/
    │   └── music/
    ├── images/
    └── icons/
```

### State Management

Given the app's simplicity, we use React Context API for global state:

- **AppContext**: Manages current screen, navigation state
- **SettingsContext**: Stores user preferences (sound selections, onboarding status)
- **SessionContext**: Manages active session state (duration, audio, timer)
- **HistoryContext**: Provides access to session history data

## Components and Interfaces

### 1. Splash Screen

**Purpose**: Display animated logo on app launch with physics-based breakdown effect.

**Key Components**:

- `SplashAnimation`: Skia canvas component rendering logo fragments
- Physics engine (Matter.js) calculating fragment positions
- Skip gesture detector

**Implementation Details**:

- Logo is split into fragments (10-15 pieces)
- Each fragment is a Skia path or image section
- Matter.js simulates gravity and collisions
- Reanimated shared values drive Skia rendering at 60 FPS
- Auto-transitions after 2 seconds or on user tap/swipe

**Interfaces**:

```typescript
interface LogoFragment {
  id: string;
  path: SkPath;
  body: Matter.Body;
  color: string;
}

interface SplashAnimationProps {
  onComplete: () => void;
}
```

### 2. Home Screen

**Purpose**: Central hub for session configuration and navigation.

**Key Components**:

- `DurationCarousel`: Horizontal swipeable selector
- `SoundToggle`: Audio option buttons (Nature, Music)
- `StartButton`: Primary action button
- `OnboardingOverlay`: First-time user guidance

**Layout**:

```
┌─────────────────────────┐
│   [Background Image]    │
│                         │
│    ┌───┬───┬───┬───┐   │
│    │ 5 │10 │15 │20 │   │  ← Duration Carousel
│    └───┴───┴───┴───┘   │
│                         │
│   [🍃 Nature] [🎵 Music]│  ← Sound Toggles
│                         │
│        [▶ Start]        │  ← Start Button
│                         │
└─────────────────────────┘
```

**Gesture Interactions**:

- Horizontal pan on carousel: Switch durations
- Tap on sound toggles: Enable/disable audio
- Swipe from left edge: Open Settings
- Swipe from right edge: Open History

**Interfaces**:

```typescript
interface DurationOption {
  minutes: number;
  icon: string;
  color: string;
}

interface AudioSettings {
  natureEnabled: boolean;
  musicEnabled: boolean;
  natureTrack: string;
  musicTrack: string;
}
```

### 3. Duration Carousel

**Purpose**: Swipeable interface for selecting meditation duration.

**Animation Details**:

- Uses Animated.ScrollView with horizontal paging
- Each card scales based on distance from center
- Center card: scale 1.2, opacity 1.0
- Adjacent cards: scale 0.9, opacity 0.6
- Snap animation uses spring physics (damping: 15, stiffness: 150)

**Implementation**:

```typescript
// Pseudo-code for carousel animation
const scrollX = useSharedValue(0);

const cardStyle = useAnimatedStyle(() => {
  const inputRange = [
    (index - 1) * CARD_WIDTH,
    index * CARD_WIDTH,
    (index + 1) * CARD_WIDTH,
  ];
  const scale = interpolate(scrollX.value, inputRange, [0.9, 1.2, 0.9]);
  const opacity = interpolate(scrollX.value, inputRange, [0.6, 1.0, 0.6]);

  return {
    transform: [{ scale }],
    opacity,
  };
});
```

### 4. Sound Toggles

**Purpose**: Enable/disable nature sounds and music.

**Visual States**:

- **Off**: Gray icon, no fill
- **On**: Accent color (teal), filled icon, subtle glow

**Animation**:

- Tap: Scale spring animation (1.0 → 1.1 → 1.0)
- State change: Icon fill animates with timing (200ms)
- Haptic feedback on toggle

**Interfaces**:

```typescript
interface SoundToggleProps {
  type: 'nature' | 'music';
  enabled: boolean;
  onToggle: () => void;
  icon: IconName;
}
```

### 5. Session Screen

**Purpose**: Minimal interface during active meditation.

**Key Components**:

- `ProgressRing`: Circular progress indicator (Skia)
- `SessionTimer`: Optional numeric countdown
- Swipe-down gesture detector

**Layout**:

```
┌─────────────────────────┐
│                         │
│         ╭───╮           │
│        ╱     ╲          │  ← Progress Ring
│       │  15:00 │        │     (optional timer)
│        ╲     ╱          │
│         ╰───╯           │
│                         │
│   [Swipe down to end]   │  ← Gesture hint (fades)
│                         │
└─────────────────────────┘
```

**Progress Ring Implementation**:

- Skia canvas draws arc from 0° to 360°
- Arc end angle driven by: `(elapsed / total) * 2π`
- Stroke width: 8px, color: teal with glow effect
- Updates at 60 FPS via Reanimated

**Interfaces**:

```typescript
interface SessionState {
  duration: number; // minutes
  elapsed: number; // seconds
  isActive: boolean;
  audioSettings: AudioSettings;
}

interface ProgressRingProps {
  progress: Animated.SharedValue<number>; // 0 to 1
  size: number;
  strokeWidth: number;
  color: string;
}
```

### 6. Session Controls

**Swipe-Down to End**:

- Pan gesture with vertical direction
- Threshold: 150px downward movement
- Visual feedback: Screen dims proportionally to swipe distance
- Release before threshold: Animate back with spring
- Release after threshold: End session and navigate home

**Implementation**:

```typescript
const gesture = Gesture.Pan()
  .onUpdate(event => {
    if (event.translationY > 0) {
      translateY.value = event.translationY;
      opacity.value = interpolate(event.translationY, [0, 150], [1, 0.3]);
    }
  })
  .onEnd(event => {
    if (event.translationY > 150) {
      runOnJS(endSession)();
    } else {
      translateY.value = withSpring(0);
      opacity.value = withSpring(1);
    }
  });
```

### 7. Session Completion

**Purpose**: Celebrate session completion and transition home.

**Sequence**:

1. Timer reaches zero
2. Play chime sound (500ms)
3. Fade out ambient audio (1 second)
4. Display "Session Complete" message
5. Trigger particle animation (2 seconds)
6. Auto-navigate to Home (after 3 seconds total)

**Particle Animation**:

- 10-15 small particles (petals or sparkles)
- Spawn from center, float upward with slight randomness
- Implemented with Skia drawing + simple physics
- Particles fade out as they rise

**Interfaces**:

```typescript
interface CompletionAnimationProps {
  onComplete: () => void;
}

interface Particle {
  x: Animated.SharedValue<number>;
  y: Animated.SharedValue<number>;
  opacity: Animated.SharedValue<number>;
  velocity: { x: number; y: number };
}
```

### 8. History Screen

**Purpose**: Display past meditation sessions and statistics.

**Layout**:

```
┌─────────────────────────┐
│   Your Journey          │
│                         │
│   📊 Total: 24 sessions │
│   ⏱️  Total: 180 minutes│
│                         │
│   Today                 │
│   • 09:00 - 10 min     │
│   • 18:30 - 15 min     │
│                         │
│   Yesterday             │
│   • 08:00 - 5 min      │
│                         │
│   [Scroll for more...]  │
└─────────────────────────┘
```

**Data Structure**:

```typescript
interface SessionRecord {
  id: string;
  timestamp: number;
  duration: number; // minutes
  completed: boolean;
}

interface HistoryStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
}
```

**Implementation**:

- FlatList for session records
- Group by date using section headers
- Calculate stats from all records
- Swipe right from left edge to return home

### 9. Settings Screen

**Purpose**: Configure app preferences and view information.

**Settings Options**:

- Default nature sound selection (dropdown/list)
- Default music track selection (dropdown/list)
- App version display
- Privacy information
- Placeholder for future IAP

**Layout**:

```
┌─────────────────────────┐
│   Settings              │
│                         │
│   Audio Preferences     │
│   Nature Sound: Rain ▼  │
│   Music Track: Piano ▼  │
│                         │
│   About                 │
│   Version: 1.0.0        │
│   Privacy Policy        │
│                         │
│   [Coming Soon]         │
│   Premium Features      │
└─────────────────────────┘
```

**Interfaces**:

```typescript
interface AppSettings {
  defaultNatureTrack: string;
  defaultMusicTrack: string;
  hasSeenOnboarding: boolean;
  reducedMotion: boolean;
}

interface AudioTrack {
  id: string;
  name: string;
  filename: string;
  type: 'nature' | 'music';
}
```

### 10. Gesture Navigation System

**Purpose**: Manage screen transitions via edge swipes.

**Navigation Model**:

```
Settings ←→ Home ←→ History
```

**Implementation Approach**:

- Three-screen horizontal layout (Settings, Home, History)
- Pan gesture on entire app container
- Shared value `navOffset` controls position
- Interpolate screen positions based on offset

**Gesture Logic**:

```typescript
const navOffset = useSharedValue(0); // 0 = Home, -width = History, +width = Settings

const panGesture = Gesture.Pan()
  .onUpdate(event => {
    // Only allow edge swipes on Home screen
    if (currentScreen === 'Home') {
      navOffset.value = event.translationX;
    }
  })
  .onEnd(event => {
    const threshold = SCREEN_WIDTH * 0.3;

    if (event.translationX < -threshold) {
      // Navigate to History
      navOffset.value = withSpring(-SCREEN_WIDTH);
      runOnJS(setCurrentScreen)('History');
    } else if (event.translationX > threshold) {
      // Navigate to Settings
      navOffset.value = withSpring(SCREEN_WIDTH);
      runOnJS(setCurrentScreen)('Settings');
    } else {
      // Return to Home
      navOffset.value = withSpring(0);
    }
  });
```

## Data Models

### Session Record

```typescript
interface SessionRecord {
  id: string;
  timestamp: number;
  duration: number;
  completed: boolean;
  audioSettings: {
    nature: boolean;
    music: boolean;
  };
}
```

### User Settings

```typescript
interface UserSettings {
  defaultNatureTrack: string;
  defaultMusicTrack: string;
  hasSeenOnboarding: boolean;
  lastSelectedDuration: number;
  reducedMotion: boolean;
}
```

### Audio Track

```typescript
interface AudioTrack {
  id: string;
  name: string;
  filename: string;
  type: 'nature' | 'music';
  duration: number;
  isPremium: boolean;
}
```

## Services

### Audio Service

**Responsibilities**:

- Load and play audio files
- Mix multiple tracks
- Handle looping
- Fade in/out
- Respect device volume

**Interface**:

```typescript
class AudioService {
  async loadTrack(filename: string): Promise<Audio.Sound>;
  async playTrack(trackId: string, loop: boolean): Promise<void>;
  async stopTrack(trackId: string, fadeOut: boolean): Promise<void>;
  async mixTracks(tracks: string[]): Promise<void>;
  setVolume(trackId: string, volume: number): void;
}
```

### Storage Service

**Responsibilities**:

- Save/load session history
- Save/load user settings
- Manage onboarding flag

**Interface**:

```typescript
class StorageService {
  async saveSession(session: SessionRecord): Promise<void>;
  async getHistory(): Promise<SessionRecord[]>;
  async saveSettings(settings: UserSettings): Promise<void>;
  async getSettings(): Promise<UserSettings>;
  async clearHistory(): Promise<void>;
}
```

### Haptic Service

**Responsibilities**:

- Provide tactile feedback for interactions

**Interface**:

```typescript
class HapticService {
  light(): void; // For toggles
  medium(): void; // For button presses
  heavy(): void; // For session completion
}
```

## Error Handling

### Audio Playback Errors

- **Issue**: Audio file fails to load
- **Handling**: Log error, continue without audio, show subtle notification
- **Recovery**: Retry on next session

### Storage Errors

- **Issue**: AsyncStorage write fails
- **Handling**: Log error, keep data in memory for current session
- **Recovery**: Retry write on next app launch

### Animation Performance

- **Issue**: Frame drops detected
- **Handling**: Automatically reduce animation complexity
- **Fallback**: Disable Skia effects, use simpler View-based animations

### Gesture Conflicts

- **Issue**: Multiple gestures trigger simultaneously
- **Handling**: Use gesture priority and `requireToFail()` to establish hierarchy
- **Priority Order**: Session controls > Navigation > Carousel

## Testing Strategy

### Unit Tests

- Audio service track loading and mixing
- Storage service CRUD operations
- Timer logic and countdown calculations
- History statistics calculations

### Component Tests

- Duration carousel selection and animation
- Sound toggle state management
- Progress ring rendering at various progress values
- Onboarding overlay display logic

### Integration Tests

- Complete session flow (select → start → complete → log)
- Navigation between all screens
- Audio playback during session
- Settings persistence across app restarts

### Gesture Tests

- Carousel swipe and snap behavior
- Navigation edge swipes
- Session swipe-down to end
- Tap-to-skip splash

### Performance Tests

- Animation frame rate monitoring (target: 60 FPS)
- App launch time (target: < 2 seconds to Home)
- Memory usage during session
- Audio mixing performance

### Accessibility Tests

- VoiceOver navigation
- Dynamic Type support
- Reduced Motion preference
- High Contrast mode

## Visual Design System

### Color Palette

```typescript
const theme = {
  colors: {
    background: '#0A0A0F',
    surface: '#1A1A2E',
    primary: '#4ECDC4', // Teal accent
    secondary: '#FF6B6B', // Warm accent
    text: '#F7F7F7',
    textSecondary: '#A0A0A0',
    success: '#51CF66',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
  typography: {
    title: {
      fontSize: 32,
      fontWeight: '300',
    },
    heading: {
      fontSize: 24,
      fontWeight: '400',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
    },
  },
};
```

### Animation Constants

```typescript
const animations = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  spring: {
    default: {
      damping: 15,
      stiffness: 150,
    },
    gentle: {
      damping: 20,
      stiffness: 100,
    },
    bouncy: {
      damping: 10,
      stiffness: 200,
    },
  },
};
```

## Performance Optimization

### Animation Performance

- All animations run on UI thread via Reanimated worklets
- Skia drawings use GPU acceleration
- Avoid setState during animations
- Use `useAnimatedStyle` and `useAnimatedProps`

### Asset Optimization

- Compress background images (JPEG, quality 80%)
- Use vector icons (SVG) for scalability
- Compress audio files (AAC, 128kbps)
- Lazy load non-critical assets

### Memory Management

- Unload audio when not in use
- Limit history records in memory (load paginated)
- Clean up animation listeners on unmount
- Use React.memo for static components

### Startup Optimization

- Preload critical assets during splash
- Defer non-critical initialization
- Use Hermes engine for faster JS execution
- Minimize initial bundle size

## Platform Considerations

### iOS Specific

- Respect safe area insets
- Use iOS-style haptics
- Follow iOS gesture conventions
- Support Dynamic Island (future)

### Android Compatibility

- Adapt navigation for Android back button
- Use Android-style ripple effects
- Test on various screen sizes
- Handle different gesture sensitivities

## Future Enhancements

### In-App Purchases

- Premium audio track packs
- Guided meditation content
- Advanced statistics and insights
- Cloud backup and sync

### Additional Features

- HealthKit integration (log Mindful Minutes)
- Apple Watch companion app
- Widgets for quick session start
- Siri Shortcuts integration
- Custom session durations
- Breathing exercise animations
- Multi-day meditation programs

### Technical Improvements

- Migrate to TypeScript fully
- Add E2E tests with Detox
- Implement analytics (privacy-focused)
- Add crash reporting
- Optimize bundle size further
