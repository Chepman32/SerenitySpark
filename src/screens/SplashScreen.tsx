import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Video from 'react-native-video';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';

const SplashScreen: React.FC = () => {
  const { theme } = useTheme();
  const { navigateToHome } = useApp();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goHome = useCallback(
    (delay = 0) => {
      clearTimer();
      if (delay === 0) {
        navigateToHome();
        return;
      }
      timerRef.current = setTimeout(() => {
        navigateToHome();
        timerRef.current = null;
      }, delay);
    },
    [clearTimer, navigateToHome],
  );

  const handlePress = useCallback(() => goHome(0), [goHome]);
  const handleVideoEnd = useCallback(() => goHome(200), [goHome]);
  const handleVideoError = useCallback(() => goHome(0), [goHome]);

  useEffect(() => clearTimer, [clearTimer]);

  const styles = createStyles(theme);

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Video
        source={require('../assets/splash_video.mp4')}
        style={styles.video}
        resizeMode="cover"
        onEnd={handleVideoEnd}
        onError={handleVideoError}
        paused={false}
        repeat={false}
        muted
        ignoreSilentSwitch="obey"
        playWhenInactive
        controls={false}
        rate={1.8}
      />
    </Pressable>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    video: {
      width: '100%',
      height: '100%',
    },
  });

export default SplashScreen;
