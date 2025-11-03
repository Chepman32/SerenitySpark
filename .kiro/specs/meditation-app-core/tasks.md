# Implementation Plan

- [x] 1. Set up project dependencies and configuration

  - Install React Native Reanimated 3, React Native Skia, React Native Gesture Handler, expo-av, and AsyncStorage
  - Configure Reanimated plugin in babel.config.js
  - Set up TypeScript types and tsconfig
  - Create project folder structure (screens, components, services, hooks, constants, types)
  - _Requirements: 14.5, 11.1, 11.2_

- [x] 2. Create theme and design system constants

  - Define color palette in constants/theme.ts
  - Define typography styles and spacing constants
  - Define animation timing and spring configurations
  - Create duration options array (5, 10, 15, 20, 30 minutes)
  - _Requirements: 15.1, 15.2, 15.5_

- [x] 3. Implement storage service

  - [x] 3.1 Create StorageService class with AsyncStorage

    - Implement saveSession method for logging completed sessions
    - Implement getHistory method to retrieve all session records
    - Implement saveSettings and getSettings methods for user preferences
    - Add error handling with fallback to in-memory storage
    - _Requirements: 8.1, 8.5, 10.3_

  - [x]\* 3.2 Write unit tests for storage operations
    - Test session saving and retrieval
    - Test settings persistence
    - Test error handling scenarios
    - _Requirements: 8.1, 8.5_

- [x] 4. Implement audio service

  - [x] 4.1 Create AudioService class with expo-av

    - Implement loadTrack method to load audio files from assets
    - Implement playTrack method with looping support
    - Implement stopTrack method with fade-out capability
    - Implement mixTracks method for simultaneous playback
    - Add volume control and device volume respect
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x]\* 4.2 Write unit tests for audio service
    - Test track loading and playback
    - Test mixing multiple tracks
    - Test fade-out functionality
    - _Requirements: 13.1, 13.2, 13.4_

- [x] 5. Implement haptic service

  - Create HapticService class using React Native Haptics
  - Implement light, medium, and heavy haptic feedback methods
  - Add platform-specific handling (iOS/Android)
  - _Requirements: 3.5_

- [x] 6. Create app context providers

  - Create AppContext for navigation state
  - Create SettingsContext for user preferences with persistence
  - Create SessionContext for active session management
  - Create HistoryContext for session history data
  - Wire up contexts in App.tsx root component
  - _Requirements: 10.3, 3.4, 8.5_

- [x] 7. Build duration carousel component

  - [x] 7.1 Create DurationCarousel component with Animated.ScrollView

    - Render five duration cards (5, 10, 15, 20, 30 min)
    - Implement horizontal pan gesture with Gesture Handler
    - Add scroll position tracking with useSharedValue
    - Implement card scaling animation based on scroll position
    - Add snap-to-center behavior with spring animation
    - Display visual indicators (dots or edge peeks) for additional options
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x]\* 7.2 Write component tests for carousel
    - Test swipe gesture handling
    - Test card selection and centering
    - Test animation smoothness
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 8. Build sound toggle components

  - [x] 8.1 Create SoundToggle component

    - Implement toggle button with icon (nature/music)
    - Add tap gesture handler with haptic feedback
    - Implement scale spring animation on press
    - Add visual state changes (color, fill) with timing animation
    - Connect to SettingsContext for state persistence
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ]\* 8.2 Write component tests for sound toggles
    - Test toggle state changes
    - Test haptic feedback triggering
    - Test animation behavior
    - _Requirements: 3.2, 3.5_

- [x] 9. Build start button component

  - Create StartButton component with prominent styling
  - Add press animation with scale and ripple effect
  - Implement navigation to session screen on press
  - Add disabled state when no duration selected
  - _Requirements: 4.1, 4.2_

- [x] 10. Build home screen

  - [x] 10.1 Create HomeScreen component layout

    - Add background image or gradient
    - Integrate DurationCarousel component
    - Integrate two SoundToggle components (nature and music)
    - Integrate StartButton component
    - Add edge swipe gesture detectors for navigation
    - Display subtle visual hints for edge swipes
    - _Requirements: 2.1, 3.1, 4.1, 9.1, 9.2, 9.5_

  - [ ]\* 10.2 Write integration tests for home screen
    - Test complete session setup flow
    - Test navigation gestures
    - Test component interactions
    - _Requirements: 2.1, 3.1, 4.1, 9.1_

- [x] 11. Build onboarding overlay

  - Create OnboardingOverlay component with semi-transparent backdrop
  - Add visual hints for swipe gestures, toggles, and navigation
  - Implement tap-anywhere or gesture-to-dismiss functionality
  - Connect to SettingsContext to check hasSeenOnboarding flag
  - Save flag to storage after dismissal
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 12. Build progress ring component

  - [x] 12.1 Create ProgressRing component with Skia Canvas

    - Draw circular arc using Skia Path API
    - Animate arc end angle from 0 to 2π based on progress shared value
    - Apply stroke styling (width, color, glow effect)
    - Ensure 60 FPS rendering with Reanimated worklets
    - _Requirements: 5.2, 5.4_

  - [ ]\* 12.2 Write component tests for progress ring
    - Test rendering at various progress values
    - Test animation smoothness
    - Test Skia drawing performance
    - _Requirements: 5.2, 5.4_

- [x] 13. Implement session timer hook

  - Create useSessionTimer custom hook
  - Implement countdown logic with setInterval
  - Expose elapsed time and remaining time as shared values
  - Add pause and resume functionality
  - Trigger completion callback when timer reaches zero
  - Clean up interval on unmount
  - _Requirements: 4.4, 5.2, 7.1_

- [x] 14. Build session screen

  - [x] 14.1 Create SessionScreen component

    - Apply dark theme background
    - Integrate ProgressRing component with timer progress
    - Add optional numeric countdown display (toggleable)
    - Implement tap gesture to toggle timer visibility
    - Hide all navigation elements during session
    - Start audio playback on mount based on settings
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 4.3_

  - [x] 14.2 Implement swipe-down to end gesture

    - Add vertical pan gesture handler
    - Animate screen dim based on swipe distance
    - Display "Release to end" indicator at threshold
    - End session if swipe exceeds 150px threshold
    - Animate back with spring if released early
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]\* 14.3 Write integration tests for session screen
    - Test timer countdown accuracy
    - Test swipe-down gesture behavior
    - Test audio playback integration
    - Test tap-to-toggle timer display
    - _Requirements: 5.2, 6.1, 6.2, 6.3_

- [x] 15. Build session completion animation

  - [x] 15.1 Create CompletionAnimation component with Skia

    - Display "Session Complete" message with fade-in
    - Generate 10-15 particle objects with random positions
    - Animate particles floating upward with Reanimated
    - Draw particles on Skia canvas with fade-out
    - Trigger completion callback after 2-3 seconds
    - _Requirements: 7.2, 7.3_

  - [ ]\* 15.2 Write component tests for completion animation
    - Test particle generation and animation
    - Test timing and auto-dismiss
    - Test Skia rendering performance
    - _Requirements: 7.2_

- [x] 16. Implement session completion flow

  - Play chime sound when timer reaches zero
  - Fade out ambient audio over 1 second
  - Display CompletionAnimation component
  - Log session to storage via StorageService
  - Navigate back to Home screen after animation
  - Reset session state in SessionContext
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 17. Build history screen

  - [x] 17.1 Create HistoryScreen component

    - Fetch session history from HistoryContext
    - Calculate total sessions and total minutes statistics
    - Group sessions by date (Today, Yesterday, etc.)
    - Render FlatList with session records
    - Add swipe-right gesture to return to Home
    - Display statistics summary at top
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ]\* 17.2 Write component tests for history screen
    - Test session grouping by date
    - Test statistics calculations
    - Test list rendering with various data sets
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 18. Build settings screen

  - [x] 18.1 Create SettingsScreen component

    - Create list layout with setting items
    - Add nature sound selection dropdown/picker
    - Add music track selection dropdown/picker
    - Display app version and privacy information
    - Add placeholder for future IAP features
    - Connect to SettingsContext for state management
    - Persist changes to storage immediately
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]\* 18.2 Write component tests for settings screen
    - Test setting changes and persistence
    - Test dropdown/picker interactions
    - Test immediate application of changes
    - _Requirements: 10.2, 10.3, 10.5_

- [x] 19. Implement gesture-based navigation system

  - [x] 19.1 Create useGestureNavigation hook

    - Set up shared value for navigation offset
    - Implement pan gesture handler for horizontal swipes
    - Define threshold for navigation trigger (30% of screen width)
    - Add spring animations for screen transitions
    - Handle edge-swipe detection (left/right edges)
    - Manage current screen state
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 19.2 Wire up navigation in App.tsx

    - Create three-screen horizontal layout (Settings, Home, History)
    - Apply animated styles based on navOffset shared value
    - Connect pan gesture to all screens
    - Add visual edge indicators for swipeable areas
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]\* 19.3 Write integration tests for navigation
    - Test swipe gestures between screens
    - Test edge detection and threshold behavior
    - Test animation smoothness
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 20. Build splash screen with physics animation

  - [x] 20.1 Create SplashAnimation component

    - Set up Skia canvas for logo rendering
    - Split logo into 10-15 fragments (paths or image sections)
    - Initialize Matter.js physics engine with gravity
    - Create physics bodies for each fragment
    - Animate fragments using Matter.js simulation
    - Render fragments on Skia canvas driven by Reanimated
    - Ensure 60 FPS performance
    - _Requirements: 1.1, 1.2_

  - [x] 20.2 Implement splash screen controls

    - Add tap/swipe gesture detector for skip functionality
    - Implement auto-transition after 2 seconds
    - Add smooth transition animation to Home screen
    - Preload critical assets during splash
    - _Requirements: 1.3, 1.4_

  - [ ]\* 20.3 Write component tests for splash screen
    - Test physics animation initialization
    - Test skip gesture functionality
    - Test auto-transition timing
    - Test performance (frame rate)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 21. Add audio assets to project

  - Source or create nature sound files (rain, forest, ocean)
  - Source or create ambient music tracks (piano, ambient)
  - Compress audio files to AAC format at 128kbps
  - Add audio files to assets/audio/ directory
  - Add chime sound for session completion
  - Update AudioService with asset references
  - _Requirements: 11.1, 13.1, 7.1_

- [x] 22. Add visual assets to project

  - Source background images from Pixabay/Pexels
  - Optimize and compress images (JPEG, quality 80%)
  - Add images to assets/images/ directory
  - Source vector icons from icon library (Feather, Ionicons)
  - Create or source app logo for splash screen
  - _Requirements: 11.2, 15.3, 15.4_

- [x] 23. Implement iOS-specific configurations

  - Configure safe area insets handling
  - Set up iOS launch screen (storyboard)
  - Configure app icons for iOS
  - Set up iOS permissions (audio playback)
  - Test on iOS simulator and device
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 24. Add accessibility features

  - Add VoiceOver labels to all interactive elements
  - Implement Dynamic Type support for text scaling
  - Add reduced motion preference detection
  - Provide alternative navigation for gesture-impaired users
  - Test with VoiceOver enabled
  - _Requirements: 14.2, 15.1_

- [x] 25. Performance optimization and polish

  - [x] 25.1 Optimize animations for 60 FPS

    - Profile animation performance with Reanimated profiler
    - Ensure all animations run on UI thread
    - Optimize Skia drawings to reduce overdraw
    - Add reduced motion fallbacks if needed
    - _Requirements: 14.1, 14.2, 14.4, 14.5_

  - [x] 25.2 Optimize app startup time

    - Measure app launch time to Home screen
    - Defer non-critical initialization
    - Lazy load heavy components
    - Optimize asset loading during splash
    - Target < 2 seconds from launch to Home
    - _Requirements: 14.4_

  - [x] 25.3 Memory and asset optimization
    - Compress all images and audio files
    - Implement asset cleanup on unmount
    - Limit history records loaded in memory
    - Profile memory usage during sessions
    - _Requirements: 11.1, 11.2_

- [x]\* 26. End-to-end testing

  - Set up Detox for E2E testing
  - Write E2E test for complete meditation flow
  - Write E2E test for navigation between all screens
  - Write E2E test for settings persistence
  - Write E2E test for history logging
  - _Requirements: 2.1, 3.1, 4.1, 7.1, 8.1, 9.1_

- [x] 27. Final integration and bug fixes
  - Test complete app flow from splash to session completion
  - Verify all gestures work correctly without conflicts
  - Verify audio playback and mixing works properly
  - Verify data persistence across app restarts
  - Fix any visual inconsistencies or animation glitches
  - Test on multiple iOS devices and screen sizes
  - _Requirements: All requirements_
