import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { theme, animations } from '../constants/theme';
import HapticService from '../services/HapticService';

interface StartButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const StartButton: React.FC<StartButtonProps> = ({
  onPress,
  disabled = false,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95, animations.spring.bouncy);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animations.spring.default);
  };

  const handlePress = () => {
    if (!disabled) {
      HapticService.medium();
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.button, disabled && styles.buttonDisabled, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
    >
      <Text style={styles.text}>▶ Start</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.surface,
    opacity: 0.5,
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

export default StartButton;
