import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { theme } from '../constants/theme';

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
  const radius = (size - strokeWidth) / 2;
  const centerPoint = size / 2;

  // Animated style for the left half (0-50% progress)
  const leftHalfStyle = useAnimatedStyle(() => {
    const rotation = Math.min(progress.value * 2, 1) * 180;
    return {
      transform: [
        { translateX: centerPoint },
        { translateY: centerPoint },
        { rotate: `${rotation}deg` },
        { translateX: -centerPoint },
        { translateY: -centerPoint },
      ],
    };
  });

  // Animated style for the right half (50-100% progress)
  const rightHalfStyle = useAnimatedStyle(() => {
    const rotation = Math.max((progress.value * 2 - 1), 0) * 180;
    return {
      transform: [
        { translateX: centerPoint },
        { translateY: centerPoint },
        { rotate: `${rotation}deg` },
        { translateX: -centerPoint },
        { translateY: -centerPoint },
      ],
    };
  });

  // Animated opacity for the right half container (only visible after 50%)
  const rightContainerStyle = useAnimatedStyle(() => {
    return {
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

      {/* Left half container (0-50%) */}
      <View
        style={[
          styles.halfContainer,
          {
            width: size,
            height: size,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.halfCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 8,
            },
            leftHalfStyle,
          ]}
        />
      </View>

      {/* Right half container (50-100%) */}
      <Animated.View
        style={[
          styles.halfContainer,
          {
            width: size,
            height: size,
          },
          rightContainerStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.halfCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 8,
            },
            rightHalfStyle,
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundCircle: {
    position: 'absolute',
  },
  halfContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  halfCircle: {
    position: 'absolute',
  },
});

export default ProgressRing;
