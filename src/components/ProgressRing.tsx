import React from 'react';
import { Canvas, Path, Skia, BlurMask } from '@shopify/react-native-skia';
import Animated, { useDerivedValue } from 'react-native-reanimated';
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
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  const path = useDerivedValue(() => {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + progress.value * 2 * Math.PI;

    const skPath = Skia.Path.Make();
    skPath.addArc(
      {
        x: center - radius,
        y: center - radius,
        width: radius * 2,
        height: radius * 2,
      },
      (startAngle * 180) / Math.PI,
      ((endAngle - startAngle) * 180) / Math.PI,
    );

    return skPath;
  });

  return (
    <Canvas style={{ width: size, height: size }}>
      <Path
        path={path}
        color={color}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeCap="round"
      >
        <BlurMask blur={4} style="solid" />
      </Path>
    </Canvas>
  );
};

export default ProgressRing;
