import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import {
  DURATION_OPTIONS,
  CARD_WIDTH,
  CARD_SPACING,
} from '../constants/durations';
import { useTheme } from '../contexts/ThemeContext';
import { animations } from '../constants/theme';
import { ANIMATION_CONFIG } from '../constants/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

interface DurationCarouselProps {
  onDurationSelect: (duration: number) => void;
  initialDuration?: number;
  onDurationPress?: (duration: number) => void;
}

const DurationCarousel: React.FC<DurationCarouselProps> = ({
  onDurationSelect,
  initialDuration = 10,
  onDurationPress,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const scrollX = useSharedValue(0);
  const initialIndex = DURATION_OPTIONS.findIndex(
    opt => opt.minutes === initialDuration,
  );
  const initialOffset = initialIndex * (CARD_WIDTH + CARD_SPACING);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: event => {
      const index = Math.round(
        event.contentOffset.x / (CARD_WIDTH + CARD_SPACING),
      );
      const duration = DURATION_OPTIONS[index]?.minutes;
      if (duration) {
        runOnJS(onDurationSelect)(duration);
      }
    },
  });

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: SIDE_PADDING },
        ]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentOffset={{ x: initialOffset, y: 0 }}
      >
        {DURATION_OPTIONS.map((option, index) => (
          <DurationCard
            key={option.minutes}
            option={option}
            index={index}
            scrollX={scrollX}
            onPress={onDurationPress}
            theme={theme}
            label={t('home.minutes')}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
};

interface DurationCardProps {
  option: (typeof DURATION_OPTIONS)[0];
  index: number;
  scrollX: Animated.SharedValue<number>;
  onPress?: (duration: number) => void;
  theme: any;
  label: string;
}

const DurationCard: React.FC<DurationCardProps> = ({
  option,
  index,
  scrollX,
  onPress,
  theme,
  label,
}) => {
  const inputRange = [
    (index - 1) * (CARD_WIDTH + CARD_SPACING),
    index * (CARD_WIDTH + CARD_SPACING),
    (index + 1) * (CARD_WIDTH + CARD_SPACING),
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, inputRange, [
      ANIMATION_CONFIG.carousel.sideScale,
      ANIMATION_CONFIG.carousel.centerScale,
      ANIMATION_CONFIG.carousel.sideScale,
    ]);

    const opacity = interpolate(scrollX.value, inputRange, [
      ANIMATION_CONFIG.carousel.sideOpacity,
      ANIMATION_CONFIG.carousel.centerOpacity,
      ANIMATION_CONFIG.carousel.sideOpacity,
    ]);

    return {
      transform: [{ scale: withSpring(scale, animations.spring.default) }],
      opacity,
    };
  });

  const handlePress = () => {
    if (onPress) {
      onPress(option.minutes);
    }
  };

  const styles = createCardStyles(theme);

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: option.color },
          animatedStyle,
          { marginRight: CARD_SPACING },
        ]}
      >
        <Text style={styles.minutes}>{option.minutes}</Text>
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

const createStyles = (_theme: any) =>
  StyleSheet.create({
    container: {
      height: 220,
      paddingVertical: 20,
    },
    scrollView: {
      overflow: 'visible',
    },
    scrollContent: {
      alignItems: 'center',
      paddingVertical: 20,
    },
  });

const createCardStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: 160,
      borderRadius: theme.borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    minutes: {
      fontSize: 48,
      fontWeight: '300',
      color: theme.colors.text,
    },
    label: {
      fontSize: 18,
      fontWeight: '400',
      color: theme.colors.text,
      marginTop: 4,
    },
  });

export default DurationCarousel;
