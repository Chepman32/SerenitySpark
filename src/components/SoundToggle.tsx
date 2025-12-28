import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { animations } from '../constants/theme';
import HapticService from '../services/HapticService';

interface SoundToggleProps {
  type: 'nature' | 'music';
  enabled: boolean;
  onToggle: () => void;
  icon: string;
  label: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SoundToggle: React.FC<SoundToggleProps> = ({
  type,
  enabled,
  onToggle,
  icon,
  label,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(enabled ? 1 : 0.6);

  const handlePressIn = () => {
    scale.value = withSpring(1.1, animations.spring.bouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animations.spring.default);
  };

  const handlePress = () => {
    HapticService.light();
    onToggle();
    opacity.value = withTiming(enabled ? 0.6 : 1, {
      duration: animations.timing.fast,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const styles = createStyles(theme);

  return (
    <AnimatedPressable
      style={[
        styles.container,
        enabled && styles.containerEnabled,
        animatedStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, enabled && styles.labelEnabled]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 120,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    containerEnabled: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    icon: {
      fontSize: 24,
      marginRight: theme.spacing.sm,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    labelEnabled: {
      color: theme.colors.text,
    },
  });

export default SoundToggle;
