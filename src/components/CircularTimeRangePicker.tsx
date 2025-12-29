import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Path, G, Line, Text as SvgText } from 'react-native-svg';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularTimeRangePickerProps {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  onTimeChange: (
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number,
  ) => void;
}

const CLOCK_SIZE = Math.min(Dimensions.get('window').width - 80, 300);
const CENTER = CLOCK_SIZE / 2;
const RADIUS = CLOCK_SIZE / 2 - 30;
const HANDLE_RADIUS = 14;
const STROKE_WIDTH = 24;

const timeToAngle = (hour: number, minute: number): number => {
  'worklet';
  const totalMinutes = (hour % 12) * 60 + minute;
  const angle = (totalMinutes / 720) * 360 - 90;
  return angle;
};

const angleToTime = (angle: number): { hour: number; minute: number } => {
  'worklet';
  let normalizedAngle = angle + 90;
  if (normalizedAngle < 0) normalizedAngle += 360;
  normalizedAngle = normalizedAngle % 360;

  const totalMinutes = (normalizedAngle / 360) * 720;
  const hour = Math.floor(totalMinutes / 60);
  const rawMinute = totalMinutes % 60;
  const minute = Math.round(rawMinute / 5) * 5; // Snap to 5-minute intervals

  return { hour: hour % 12, minute: minute === 60 ? 0 : minute };
};

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } => {
  'worklet';
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string => {
  'worklet';
  let adjustedEndAngle = endAngle;
  if (endAngle < startAngle) {
    adjustedEndAngle = endAngle + 360;
  }

  const start = polarToCartesian(x, y, radius, adjustedEndAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = adjustedEndAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
};

const formatTime = (hour: number, minute: number, is24Hour: boolean = false): string => {
  if (is24Hour) {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
};

const CircularTimeRangePicker: React.FC<CircularTimeRangePickerProps> = ({
  startHour,
  startMinute,
  endHour,
  endMinute,
  onTimeChange,
}) => {
  const { theme } = useTheme();

  const startAngle = useSharedValue(timeToAngle(startHour, startMinute));
  const endAngle = useSharedValue(timeToAngle(endHour, endMinute));
  const activeHandle = useSharedValue<'start' | 'end' | null>(null);

  // State for real-time display updates
  const [displayStartTime, setDisplayStartTime] = useState({
    hour: startHour,
    minute: startMinute,
  });
  const [displayEndTime, setDisplayEndTime] = useState({
    hour: endHour,
    minute: endMinute,
  });

  // Sync display state when props change
  useEffect(() => {
    setDisplayStartTime({ hour: startHour, minute: startMinute });
    setDisplayEndTime({ hour: endHour, minute: endMinute });
  }, [startHour, startMinute, endHour, endMinute]);

  const updateTimeFromAngle = useCallback(
    (handle: 'start' | 'end', angle: number, isPM: boolean) => {
      const time = angleToTime(angle);
      let hour = time.hour;
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;

      if (handle === 'start') {
        onTimeChange(hour, time.minute, endHour, endMinute);
      } else {
        onTimeChange(startHour, startMinute, hour, time.minute);
      }
    },
    [onTimeChange, startHour, startMinute, endHour, endMinute],
  );

  const getAngleFromPoint = useCallback(
    (x: number, y: number): number => {
      'worklet';
      const dx = x - CENTER;
      const dy = y - CENTER;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      return angle;
    },
    [],
  );

  const getDistanceToHandle = useCallback(
    (touchX: number, touchY: number, handleAngle: number): number => {
      'worklet';
      const handlePos = polarToCartesian(CENTER, CENTER, RADIUS, handleAngle);
      const dx = touchX - handlePos.x;
      const dy = touchY - handlePos.y;
      return Math.sqrt(dx * dx + dy * dy);
    },
    [],
  );

  const updateDisplayTime = useCallback(
    (handle: 'start' | 'end', angle: number, isPM: boolean) => {
      const time = angleToTime(angle);
      let hour = time.hour;
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;

      if (handle === 'start') {
        setDisplayStartTime({ hour, minute: time.minute });
      } else {
        setDisplayEndTime({ hour, minute: time.minute });
      }
    },
    [],
  );

  const unifiedGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin((event) => {
          'worklet';
          // Determine which handle is closest to the touch point
          const distToStart = getDistanceToHandle(
            event.x,
            event.y,
            startAngle.value,
          );
          const distToEnd = getDistanceToHandle(
            event.x,
            event.y,
            endAngle.value,
          );

          activeHandle.value = distToStart < distToEnd ? 'start' : 'end';
        })
        .onUpdate((event) => {
          'worklet';
          const angle = getAngleFromPoint(event.x, event.y);

          if (activeHandle.value === 'start') {
            startAngle.value = angle;
            const isPM = startHour >= 12;
            runOnJS(updateDisplayTime)('start', angle, isPM);
          } else if (activeHandle.value === 'end') {
            endAngle.value = angle;
            const isPM = endHour >= 12;
            runOnJS(updateDisplayTime)('end', angle, isPM);
          }
        })
        .onEnd(() => {
          'worklet';
          if (activeHandle.value === 'start') {
            const isPM = startHour >= 12;
            runOnJS(updateTimeFromAngle)('start', startAngle.value, isPM);
          } else if (activeHandle.value === 'end') {
            const isPM = endHour >= 12;
            runOnJS(updateTimeFromAngle)('end', endAngle.value, isPM);
          }
          activeHandle.value = null;
        }),
    [
      getAngleFromPoint,
      getDistanceToHandle,
      startAngle,
      endAngle,
      activeHandle,
      updateTimeFromAngle,
      updateDisplayTime,
      startHour,
      endHour,
    ],
  );

  const animatedArcProps = useAnimatedProps(() => {
    return {
      d: describeArc(CENTER, CENTER, RADIUS, startAngle.value, endAngle.value),
    };
  });

  const animatedStartHandleProps = useAnimatedProps(() => {
    const pos = polarToCartesian(CENTER, CENTER, RADIUS, startAngle.value);
    return {
      cx: pos.x,
      cy: pos.y,
    };
  });

  const animatedEndHandleProps = useAnimatedProps(() => {
    const pos = polarToCartesian(CENTER, CENTER, RADIUS, endAngle.value);
    return {
      cx: pos.x,
      cy: pos.y,
    };
  });

  const hourMarkers = useMemo(() => {
    const markers = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) - 90;
      const innerRadius = RADIUS - STROKE_WIDTH / 2 - 8;
      const outerRadius = RADIUS - STROKE_WIDTH / 2 - 2;
      const start = polarToCartesian(CENTER, CENTER, innerRadius, angle);
      const end = polarToCartesian(CENTER, CENTER, outerRadius, angle);

      markers.push(
        <Line
          key={`marker-${i}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={theme.colors.textSecondary}
          strokeWidth={i % 3 === 0 ? 2 : 1}
          strokeLinecap="round"
        />,
      );
    }
    return markers;
  }, [theme.colors.textSecondary]);

  const hourLabels = useMemo(() => {
    const labels = [];
    const hours = [12, 3, 6, 9];
    const angles = [-90, 0, 90, 180];

    for (let i = 0; i < hours.length; i++) {
      const angle = angles[i];
      const labelRadius = RADIUS - STROKE_WIDTH / 2 - 24;
      const pos = polarToCartesian(CENTER, CENTER, labelRadius, angle);

      labels.push(
        <SvgText
          key={`label-${hours[i]}`}
          x={pos.x}
          y={pos.y + 4}
          fontSize={12}
          fontWeight="500"
          fill={theme.colors.textSecondary}
          textAnchor="middle"
        >
          {hours[i]}
        </SvgText>,
      );
    }
    return labels;
  }, [theme.colors.textSecondary]);

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.clockContainer}>
        <Svg width={CLOCK_SIZE} height={CLOCK_SIZE}>
          {/* Background circle */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={theme.colors.border}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />

          {/* Selected range arc */}
          <AnimatedPath
            animatedProps={animatedArcProps}
            stroke={theme.colors.primary}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
          />

          {/* Hour markers */}
          <G>{hourMarkers}</G>

          {/* Hour labels */}
          <G>{hourLabels}</G>

          {/* Center dot */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={4}
            fill={theme.colors.textSecondary}
          />
        </Svg>

        {/* Handles with unified gesture detector */}
        <GestureDetector gesture={unifiedGesture}>
          <Animated.View style={[styles.handleContainer]}>
            <Svg
              width={CLOCK_SIZE}
              height={CLOCK_SIZE}
              style={StyleSheet.absoluteFill}
            >
              {/* Start handle (blue) */}
              <AnimatedCircle
                animatedProps={animatedStartHandleProps}
                r={HANDLE_RADIUS}
                fill={theme.colors.primary}
                stroke={theme.colors.background}
                strokeWidth={3}
              />
              {/* End handle (orange) */}
              <AnimatedCircle
                animatedProps={animatedEndHandleProps}
                r={HANDLE_RADIUS}
                fill={theme.colors.secondary}
                stroke={theme.colors.background}
                strokeWidth={3}
              />
            </Svg>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Time display */}
      <View style={styles.timeDisplay}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>From</Text>
          <Text style={[styles.timeValue, { color: theme.colors.primary }]}>
            {formatTime(displayStartTime.hour, displayStartTime.minute)}
          </Text>
        </View>
        <Text style={styles.timeSeparator}>→</Text>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>To</Text>
          <Text style={[styles.timeValue, { color: theme.colors.secondary }]}>
            {formatTime(displayEndTime.hour, displayEndTime.minute)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
    },
    clockContainer: {
      width: CLOCK_SIZE,
      height: CLOCK_SIZE,
      position: 'relative',
    },
    handleContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: CLOCK_SIZE,
      height: CLOCK_SIZE,
    },
    timeDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
    },
    timeBlock: {
      alignItems: 'center',
    },
    timeLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    timeValue: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    timeSeparator: {
      fontSize: 20,
      color: theme.colors.textSecondary,
      marginHorizontal: theme.spacing.lg,
    },
  });

export default CircularTimeRangePicker;
