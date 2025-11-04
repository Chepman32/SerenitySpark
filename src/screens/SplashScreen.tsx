import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import SplashIcon from "../assets/icons/icon.png"

const SplashScreen: React.FC = () => {
  const { navigateToHome } = useApp();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Animate logo entrance
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
    rotation.value = withSequence(
      withTiming(360, { duration: 1000, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 500 }),
    );

    // Auto-navigate after 2 seconds
    const timer = setTimeout(() => {
      navigateToHome();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const handleSkip = () => {
    navigateToHome();
  };

  return (
    <Pressable style={styles.container} onPress={handleSkip}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Image source={SplashIcon} style={styles.logo}/>
        <Text style={styles.appName}>SerenitySpark</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: theme.spacing.md
  },
  appName: {
    fontSize: 32,
    fontWeight: '300',
    color: theme.colors.text,
    letterSpacing: 2,
  },
  hint: {
    position: 'absolute',
    bottom: 40,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default SplashScreen;
