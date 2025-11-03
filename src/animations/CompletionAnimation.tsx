import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { ANIMATION_CONFIG } from '../constants/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

interface CompletionAnimationProps {
  onComplete: () => void;
}

const CompletionAnimation: React.FC<CompletionAnimationProps> = ({
  onComplete,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const particleProgress = useSharedValue(0);

  const particles: Particle[] = Array.from(
    { length: ANIMATION_CONFIG.completion.particleCount },
    (_, i) => {
      const angle =
        (i / ANIMATION_CONFIG.completion.particleCount) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      return {
        x: SCREEN_WIDTH / 2,
        y: SCREEN_HEIGHT / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: theme.colors.primary,
        size: 8 + Math.random() * 8,
      };
    },
  );

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSequence(
      withTiming(1.2, { duration: 400, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 200 }),
    );

    particleProgress.value = withTiming(1, {
      duration: ANIMATION_CONFIG.completion.animationDuration,
      easing: Easing.out(Easing.quad),
    });

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onComplete)();
      });
    }, ANIMATION_CONFIG.completion.autoNavigateDelay);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const particleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - particleProgress.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <Text style={styles.checkmark}>✓</Text>
        <Text style={styles.message}>Session Complete</Text>
        <Text style={styles.subMessage}>Well done!</Text>
      </Animated.View>

      <Animated.View style={[styles.particleContainer, particleAnimatedStyle]}>
        <Canvas style={styles.canvas}>
          {particles.map((particle, index) => {
            const progress = particleProgress.value;
            const x = particle.x + particle.vx * progress * 100;
            const y =
              particle.y +
              particle.vy * progress * 100 +
              progress * progress * 200;

            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={particle.size * (1 - progress)}
                color={particle.color}
                opacity={1 - progress}
              />
            );
          })}
        </Canvas>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  checkmark: {
    fontSize: 80,
    color: theme.colors.success,
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: 32,
    fontWeight: '300',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subMessage: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  canvas: {
    flex: 1,
  },
});

export default CompletionAnimation;
