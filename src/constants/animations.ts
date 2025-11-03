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
