import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';

interface SwipeIndicatorProps {
  direction: 'up' | 'down';
  color?: string;
}

const CHEVRON_SIZE = 24;
const BOUNCE_DISTANCE = 6;
const ANIMATION_DURATION = 800;
const BOUNCE_TIMEOUT = 20000;

const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({
  direction,
  color,
}) => {
  const { theme } = useTheme();
  const indicatorColor = color || theme.colors.success;
  const translateY = useSharedValue(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) {
      return;
    }

    const bounceDirection = direction === 'down' ? 1 : -1;
    translateY.value = withRepeat(
      withSequence(
        withTiming(BOUNCE_DISTANCE * bounceDirection, {
          duration: ANIMATION_DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: ANIMATION_DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );

    const timeout = setTimeout(() => {
      cancelAnimation(translateY);
      translateY.value = withTiming(0, { duration: 300 });
      setIsAnimating(false);
    }, BOUNCE_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [direction, translateY, isAnimating]);

  const rotation = direction === 'up' ? 180 : 0;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation}deg` }, { translateY: translateY.value }],
  }));

  const Chevron = () => (
    <Svg width={CHEVRON_SIZE} height={CHEVRON_SIZE * 0.5} viewBox="0 0 24 12">
      <Path
        d="M2 2L12 10L22 2"
        stroke={indicatorColor}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.chevronWrapper}>
        <Chevron />
      </View>
      <View style={styles.chevronWrapper}>
        <Chevron />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    opacity: 0.65,
  },
  chevronWrapper: {
    marginVertical: -2,
  },
});

export default SwipeIndicator;
