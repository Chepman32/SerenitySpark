import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withSpring,
} from 'react-native-reanimated';
import {
  DURATION_OPTIONS,
  CARD_WIDTH,
  CARD_SPACING,
} from '../constants/durations';
import { theme, animations } from '../constants/theme';
import { ANIMATION_CONFIG } from '../constants/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

interface DurationCarouselProps {
  onDurationSelect: (duration: number) => void;
  initialDuration?: number;
}

const DurationCarousel: React.FC<DurationCarouselProps> = ({
  onDurationSelect,
  initialDuration = 10,
}) => {
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
        onDurationSelect(duration);
      }
    },
  });

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: SIDE_PADDING,
        }}
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
          />
        ))}
      </Animated.ScrollView>
      <View style={styles.indicators}>
        {DURATION_OPTIONS.map((_, index) => (
          <View key={index} style={styles.indicator} />
        ))}
      </View>
    </View>
  );
};

interface DurationCardProps {
  option: (typeof DURATION_OPTIONS)[0];
  index: number;
  scrollX: Animated.SharedValue<number>;
}

const DurationCard: React.FC<DurationCardProps> = ({
  option,
  index,
  scrollX,
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

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: option.color },
        animatedStyle,
        { marginRight: CARD_SPACING },
      ]}
    >
      <Text style={styles.minutes}>{option.minutes}</Text>
      <Text style={styles.label}>min</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
  },
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
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textSecondary,
    marginHorizontal: 4,
  },
});

export default DurationCarousel;
