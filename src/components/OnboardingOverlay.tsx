import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';

interface OnboardingOverlayProps {
  onDismiss: () => void;
}

const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onDismiss }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const handleDismiss = () => {
    opacity.value = withTiming(0, { duration: 200 });
    setTimeout(onDismiss, 200);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.overlay, animatedStyle]}>
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to SerenitySpark</Text>

          <View style={styles.hint}>
            <Text style={styles.hintIcon}>👆</Text>
            <Text style={styles.hintText}>
              Swipe left or right on the cards to choose your meditation
              duration
            </Text>
          </View>

          <View style={styles.hint}>
            <Text style={styles.hintIcon}>🔊</Text>
            <Text style={styles.hintText}>
              Tap the Nature or Music buttons to add ambient sounds
            </Text>
          </View>

          <View style={styles.hint}>
            <Text style={styles.hintIcon}>👈 👉</Text>
            <Text style={styles.hintText}>
              Swipe from the edges to access History and Settings
            </Text>
          </View>

          <Text style={styles.dismissText}>Tap anywhere to continue</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: theme.spacing.xl,
    maxWidth: 320,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  hintIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  hintText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 22,
  },
  dismissText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});

export default OnboardingOverlay;
