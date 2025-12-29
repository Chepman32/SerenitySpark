export const ANIMATION_CONFIG = {
  splash: {
    duration: 2000,
    fragmentCount: 12,
    gravity: 0.5,
  },
  carousel: {
    snapThreshold: 0.3,
    centerScale: 1.2,
    sideScale: 0.9,
    centerOpacity: 1.0,
    sideOpacity: 0.6,
  },
  session: {
    swipeThreshold: 150,
    progressRingSize: 200,
    progressRingStrokeWidth: 8,
    dismissAnimationDuration: 420,
    dismissScale: {
      mid: 0.92,
      end: 0.85,
    },
    velocityThresholds: {
      slow: 800,
      medium: 1800,
      fast: 3000,
    },
    springs: {
      dismissSlow: { damping: 18, stiffness: 150, mass: 0.95 },
      dismissMedium: { damping: 16, stiffness: 170, mass: 0.85 },
      dismissFast: { damping: 14, stiffness: 200, mass: 0.75 },
      dismissVeryFast: { damping: 12, stiffness: 230, mass: 0.65 },
      progress: { damping: 20, stiffness: 180, mass: 0.9 },
    },
    blur: {
      intensity: 20,
      intensityAndroid: 12,
    },
  },
  // PlayStation-style session end animation config
  playstation: {
    // Particle configuration
    particleCount: 16,
    particleSizes: { min: 8, max: 24 },
    particleOrbitRadius: { min: 100, max: 220 },
    // Ribbon configuration
    ribbonCount: 3,
    ribbonWidth: { min: 3, max: 4 },
    // Central orb
    orbSizeStart: 80,
    orbSizeMax: 420,
    // Animation phases (progress values 0-1)
    phases: {
      float: { start: 0, end: 0.3 },
      converge: { start: 0.3, end: 0.6 },
      burst: { start: 0.6, end: 1.0 },
    },
    // Colors
    colors: {
      cyan: '#4ECDC4',
      blue: '#60A5FA',
      purple: '#8B5CF6',
      white: '#E0E7FF',
      deepBlue: '#0A0A1F',
    },
  },
  completion: {
    particleCount: 12,
    animationDuration: 2000,
    autoNavigateDelay: 3000,
  },
  navigation: {
    swipeThreshold: 0.3,
    edgeSwipeWidth: 50,
  },
};

export const GESTURE_THRESHOLDS = {
  swipeVelocity: 500,
  panDistance: 10,
  longPressDelay: 500,
};
