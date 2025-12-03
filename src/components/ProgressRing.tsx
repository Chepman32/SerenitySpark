import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface ProgressRingProps {
  progress: Animated.SharedValue<number>;
  size: number;
  strokeWidth: number;
  color: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size,
  strokeWidth,
  color,
}) => {
  // Right Half Animation (0-50% progress)
  // We want to fill the right side (12 to 6 o'clock).
  // We use a semi-circle that covers the LEFT half (6 to 12) initially.
  // By rotating it 180 degrees, it moves to the RIGHT half.
  // Base rotation for "Left Half" (Top+Left borders) is -45deg to align to 6-12.
  const rightHalfStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 0.5], [0, 180], Extrapolate.CLAMP);
    return {
      transform: [
        { rotate: `${-45 + rotate}deg` },
      ],
    };
  });

  // Left Half Animation (50-100% progress)
  // We want to fill the left side (6 to 12 o'clock).
  // We use a semi-circle that covers the RIGHT half (12 to 6) initially.
  // By rotating it 180 degrees, it moves to the LEFT half.
  // Base rotation for "Right Half" (Top+Right borders) is 45deg to align to 12-6.
  const leftHalfStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0.5, 1], [0, 180], Extrapolate.CLAMP);
    // We only show this after 50% to avoid glitches, although clipping handles most.
    // Opacity is a safe guard.
    return {
      transform: [
        { rotate: `${45 + rotate}deg` },
      ],
      opacity: progress.value > 0.5 ? 1 : 0,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.backgroundCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
        ]}
      />

      {/* Right Half Container (Clips to show only right side) */}
      <View
        style={[
          styles.halfContainer,
          {
            width: size / 2,
            height: size,
            right: 0,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderTopColor: color,
              borderLeftColor: color, // Top + Left = Left Half (initially)
              right: 0, // Shift back to center relative to this container
            },
            rightHalfStyle,
          ]}
        />
      </View>

      {/* Left Half Container (Clips to show only left side) */}
      <View
        style={[
          styles.halfContainer,
          {
            width: size / 2,
            height: size,
            left: 0,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderTopColor: color,
              borderRightColor: color, // Top + Right = Right Half (initially)
              left: 0,
            },
            leftHalfStyle,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
  },
  halfContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
  },
});

export default ProgressRing;
