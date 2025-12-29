import React, { useMemo } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useAnimatedProps,
  interpolate,
  interpolateColor,
  SharedValue,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import Svg, {
  Path,
  Defs,
  RadialGradient,
  Stop,
  Circle,
} from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// PlayStation signature colors - premium and ethereal
const PS_COLORS = {
  ice: '#E0F7FF',
  cyan: '#00D9FF',
  blue: '#0070DD',
  deepBlue: '#003A70',
  purple: '#7B2CBF',
  magenta: '#C77DFF',
  white: '#FFFFFF',
  darkBg: '#0A0E27',
};

// ============================================================
// ENERGY PARTICLES - Floating orbs with trails
// ============================================================

interface ParticleConfig {
  id: number;
  startAngle: number;
  radius: number;
  size: number;
  color: string;
  speed: number;
  delay: number;
}

const createParticles = (): ParticleConfig[] => {
  const particles: ParticleConfig[] = [];
  const colors = [
    PS_COLORS.ice,
    PS_COLORS.cyan,
    PS_COLORS.blue,
    PS_COLORS.magenta,
  ];
  const particleCount = 24;

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    particles.push({
      id: i,
      startAngle: angle,
      radius: 80 + (i % 3) * 60,
      size: 6 + (i % 4) * 4,
      color: colors[i % colors.length],
      speed: 0.7 + (i % 3) * 0.3,
      delay: (i / particleCount) * 0.15,
    });
  }
  return particles;
};

const EnergyParticle: React.FC<{
  config: ParticleConfig;
  progress: SharedValue<number>;
}> = ({ config, progress }) => {
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;

  const style = useAnimatedStyle(() => {
    const p = Math.max(0, progress.value - config.delay) / (1 - config.delay);

    // Phase 1 (0-0.25): Materialize and orbit
    // Phase 2 (0.25-0.6): Spiral inward with acceleration
    // Phase 3 (0.6-0.85): Converge to center
    // Phase 4 (0.85-1.0): Explosive burst outward

    let radius: number;
    let angle: number;
    let scale: number;
    let opacity: number;

    if (p < 0.25) {
      // Materialize phase
      const phase = p / 0.25;
      radius = config.radius;
      angle = config.startAngle + phase * 0.3 * config.speed;
      scale = interpolate(phase, [0, 0.6, 1], [0, 1.3, 1], Extrapolation.CLAMP);
      opacity = interpolate(
        phase,
        [0, 0.4, 1],
        [0, 1, 0.95],
        Extrapolation.CLAMP,
      );
    } else if (p < 0.6) {
      // Spiral inward
      const phase = (p - 0.25) / 0.35;
      const eased = phase * phase; // Quadratic ease
      radius = interpolate(
        eased,
        [0, 1],
        [config.radius, 40],
        Extrapolation.CLAMP,
      );
      angle =
        config.startAngle +
        0.3 * config.speed +
        phase * Math.PI * 2 * config.speed;
      scale = interpolate(
        phase,
        [0, 0.7, 1],
        [1, 1.2, 0.9],
        Extrapolation.CLAMP,
      );
      opacity = 0.95;
    } else if (p < 0.85) {
      // Converge to center
      const phase = (p - 0.6) / 0.25;
      radius = interpolate(phase, [0, 1], [40, 0], Extrapolation.CLAMP);
      angle =
        config.startAngle + 0.3 * config.speed + Math.PI * 2 * config.speed;
      scale = interpolate(
        phase,
        [0, 0.5, 1],
        [0.9, 1.5, 2],
        Extrapolation.CLAMP,
      );
      opacity = interpolate(
        phase,
        [0, 0.8, 1],
        [0.95, 1, 1],
        Extrapolation.CLAMP,
      );
    } else {
      // Explosive burst
      const phase = (p - 0.85) / 0.15;
      const burst = phase * phase * phase; // Cubic ease for dramatic acceleration
      radius = interpolate(burst, [0, 1], [0, 600], Extrapolation.CLAMP);
      angle =
        config.startAngle +
        0.3 * config.speed +
        Math.PI * 2 * config.speed +
        phase * 0.5;
      scale = interpolate(phase, [0, 0.3, 1], [2, 1.2, 0], Extrapolation.CLAMP);
      opacity = interpolate(
        phase,
        [0, 0.5, 1],
        [1, 0.7, 0],
        Extrapolation.CLAMP,
      );
    }

    const x = centerX + Math.cos(angle) * radius - config.size / 2;
    const y = centerY + Math.sin(angle) * radius - config.size / 2;

    // Glow intensity
    const shadowRadius = interpolate(
      p,
      [0.2, 0.6, 0.85, 1],
      [8, 16, 24, 12],
      Extrapolation.CLAMP,
    );

    return {
      position: 'absolute' as const,
      left: x,
      top: y,
      width: config.size,
      height: config.size,
      borderRadius: config.size / 2,
      backgroundColor: config.color,
      opacity,
      transform: [{ scale }],
      shadowColor: config.color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius,
    };
  });

  return <Animated.View style={style} pointerEvents="none" />;
};

// ============================================================
// LIGHT WAVES - Expanding circular waves
// ============================================================

interface WaveConfig {
  id: number;
  delay: number;
  color: string;
  maxRadius: number;
}

const createWaves = (): WaveConfig[] => [
  { id: 1, delay: 0.2, color: PS_COLORS.cyan, maxRadius: 400 },
  { id: 2, delay: 0.35, color: PS_COLORS.blue, maxRadius: 500 },
  { id: 3, delay: 0.5, color: PS_COLORS.purple, maxRadius: 600 },
  { id: 4, delay: 0.65, color: PS_COLORS.magenta, maxRadius: 700 },
];

const LightWave: React.FC<{
  config: WaveConfig;
  progress: SharedValue<number>;
}> = ({ config, progress }) => {
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;

  const animatedProps = useAnimatedProps(() => {
    const p = Math.max(0, progress.value - config.delay) / (1 - config.delay);

    const radius = interpolate(
      p,
      [0, 0.7, 1],
      [0, config.maxRadius, config.maxRadius * 1.2],
      Extrapolation.CLAMP,
    );

    const strokeWidth = interpolate(
      p,
      [0, 0.3, 0.7, 1],
      [0, 3, 2, 0],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      p,
      [0, 0.2, 0.6, 1],
      [0, 0.8, 0.5, 0],
      Extrapolation.CLAMP,
    );

    return {
      cx: centerX,
      cy: centerY,
      r: radius,
      strokeWidth,
      opacity,
    };
  });

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <AnimatedCircle
        animatedProps={animatedProps}
        stroke={config.color}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
};

// ============================================================
// ENERGY BEAMS - Sweeping light beams
// ============================================================

interface BeamConfig {
  id: number;
  startAngle: number;
  sweepAngle: number;
  length: number;
  color: string;
  delay: number;
}

const createBeams = (): BeamConfig[] => [
  {
    id: 1,
    startAngle: 0,
    sweepAngle: Math.PI * 0.4,
    length: 500,
    color: PS_COLORS.cyan,
    delay: 0.3,
  },
  {
    id: 2,
    startAngle: Math.PI * 0.5,
    sweepAngle: Math.PI * 0.35,
    length: 450,
    color: PS_COLORS.blue,
    delay: 0.4,
  },
  {
    id: 3,
    startAngle: Math.PI,
    sweepAngle: Math.PI * 0.45,
    length: 480,
    color: PS_COLORS.purple,
    delay: 0.5,
  },
  {
    id: 4,
    startAngle: Math.PI * 1.5,
    sweepAngle: Math.PI * 0.38,
    length: 520,
    color: PS_COLORS.magenta,
    delay: 0.6,
  },
];

const EnergyBeam: React.FC<{
  config: BeamConfig;
  progress: SharedValue<number>;
}> = ({ config, progress }) => {
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;

  const animatedProps = useAnimatedProps(() => {
    const p = Math.max(0, progress.value - config.delay) / (1 - config.delay);

    const currentAngle =
      config.startAngle +
      interpolate(p, [0, 1], [0, config.sweepAngle], Extrapolation.CLAMP);

    const length = interpolate(
      p,
      [0, 0.4, 0.8, 1],
      [0, config.length, config.length * 1.1, config.length * 1.3],
      Extrapolation.CLAMP,
    );

    const endX = centerX + Math.cos(currentAngle) * length;
    const endY = centerY + Math.sin(currentAngle) * length;

    return {
      d: `M ${centerX} ${centerY} L ${endX} ${endY}`,
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    const p = Math.max(0, progress.value - config.delay) / (1 - config.delay);

    const opacity = interpolate(
      p,
      [0, 0.2, 0.7, 1],
      [0, 0.7, 0.5, 0],
      Extrapolation.CLAMP,
    );

    return { opacity };
  });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, containerStyle]}
      pointerEvents="none"
    >
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        <Defs>
          <RadialGradient id={`beam-grad-${config.id}`} cx="0%" cy="0%">
            <Stop offset="0%" stopColor={config.color} stopOpacity={1} />
            <Stop offset="100%" stopColor={config.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <AnimatedPath
          animatedProps={animatedProps}
          stroke={`url(#beam-grad-${config.id})`}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
};

// ============================================================
// CORE ENERGY ORB - Central pulsing light source
// ============================================================

const CoreEnergyOrb: React.FC<{
  progress: SharedValue<number>;
}> = ({ progress }) => {
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;

  // Main core orb
  const coreStyle = useAnimatedStyle(() => {
    const p = progress.value;

    // Size progression: small -> grow -> massive -> flash -> collapse
    const size = interpolate(
      p,
      [0, 0.2, 0.5, 0.75, 0.88, 0.95, 1],
      [60, 90, 180, 320, 420, 480, 0],
      Extrapolation.CLAMP,
    );

    // Color evolution
    const backgroundColor = interpolateColor(
      p,
      [0, 0.3, 0.6, 0.85, 0.95],
      [
        'rgba(0, 217, 255, 0.3)',
        'rgba(0, 112, 221, 0.5)',
        'rgba(123, 44, 191, 0.7)',
        'rgba(199, 125, 255, 0.9)',
        'rgba(255, 255, 255, 1)',
      ],
    );

    const opacity = interpolate(
      p,
      [0, 0.15, 0.85, 0.95, 1],
      [0, 0.9, 1, 1, 0],
      Extrapolation.CLAMP,
    );

    const shadowRadius = interpolate(
      p,
      [0, 0.5, 0.85, 0.95],
      [20, 50, 90, 120],
      Extrapolation.CLAMP,
    );

    return {
      position: 'absolute' as const,
      left: centerX - size / 2,
      top: centerY - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor,
      opacity,
      shadowColor: PS_COLORS.white,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius,
    };
  });

  // Inner crystalline ring
  const innerRingStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const size = interpolate(
      p,
      [0.1, 0.5, 0.85, 1],
      [40, 120, 240, 0],
      Extrapolation.CLAMP,
    );

    return {
      position: 'absolute' as const,
      left: centerX - size / 2,
      top: centerY - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2.5,
      borderColor: 'rgba(224, 247, 255, 0.9)',
      backgroundColor: 'transparent',
      opacity: interpolate(
        p,
        [0.1, 0.3, 0.85, 1],
        [0, 1, 0.8, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  // Outer energy ring
  const outerRingStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const size = interpolate(
      p,
      [0.15, 0.5, 0.85, 1],
      [70, 180, 360, 0],
      Extrapolation.CLAMP,
    );

    return {
      position: 'absolute' as const,
      left: centerX - size / 2,
      top: centerY - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1.5,
      borderColor: 'rgba(0, 217, 255, 0.7)',
      backgroundColor: 'transparent',
      opacity: interpolate(
        p,
        [0.15, 0.35, 0.88, 1],
        [0, 0.9, 0.6, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  // Pulsing halo
  const haloStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const pulse = Math.sin(p * Math.PI * 6) * 0.15 + 1;
    const size =
      interpolate(
        p,
        [0.2, 0.6, 0.9, 1],
        [100, 250, 450, 0],
        Extrapolation.CLAMP,
      ) * pulse;

    return {
      position: 'absolute' as const,
      left: centerX - size / 2,
      top: centerY - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: 'rgba(0, 217, 255, 0.15)',
      opacity: interpolate(
        p,
        [0.2, 0.4, 0.85, 1],
        [0, 0.6, 0.4, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <>
      <Animated.View style={haloStyle} pointerEvents="none" />
      <Animated.View style={outerRingStyle} pointerEvents="none" />
      <Animated.View style={innerRingStyle} pointerEvents="none" />
      <Animated.View style={coreStyle} pointerEvents="none" />
    </>
  );
};

// ============================================================
// CINEMATIC ENVIRONMENT
// ============================================================

const CinematicEnvironment: React.FC<{
  progress: SharedValue<number>;
}> = ({ progress }) => {
  // Blur backdrop
  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.15, 0.9, 1],
      [0, 1, 1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  // Deep color overlay
  const overlayStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 0.3, 0.6, 0.9, 1],
      [
        'rgba(10, 14, 39, 0)',
        'rgba(10, 14, 39, 0.5)',
        'rgba(0, 58, 112, 0.6)',
        'rgba(123, 44, 191, 0.4)',
        'rgba(0, 0, 0, 0)',
      ],
    );

    return {
      backgroundColor,
      opacity: interpolate(
        progress.value,
        [0, 0.1, 0.92, 1],
        [0, 1, 1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  // Vignette effect
  const vignetteStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const borderWidth = interpolate(
      p,
      [0, 0.3, 0.7, 1],
      [0, 80, 120, 0],
      Extrapolation.CLAMP,
    );

    return {
      ...StyleSheet.absoluteFillObject,
      borderWidth,
      borderColor: 'rgba(0, 0, 0, 0.9)',
      borderRadius: interpolate(p, [0.3, 0.7], [0, 200], Extrapolation.CLAMP),
      opacity: interpolate(
        p,
        [0.15, 0.4, 0.88, 1],
        [0, 1, 0.9, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <>
      <Animated.View
        style={[StyleSheet.absoluteFill, blurStyle]}
        pointerEvents="none"
      >
        <BlurView
          blurAmount={40}
          blurType="dark"
          style={StyleSheet.absoluteFill}
          reducedTransparencyFallbackColor="rgba(10, 14, 39, 0.95)"
        />
      </Animated.View>
      <Animated.View
        style={[StyleSheet.absoluteFill, overlayStyle]}
        pointerEvents="none"
      />
      <Animated.View style={vignetteStyle} pointerEvents="none" />
    </>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

interface SessionEndAnimationProps {
  dismissProgress: SharedValue<number>;
  isExiting: boolean;
}

export const SessionEndAnimation: React.FC<SessionEndAnimationProps> = ({
  dismissProgress,
  isExiting,
}) => {
  const particles = useMemo(() => createParticles(), []);
  const waves = useMemo(() => createWaves(), []);
  const beams = useMemo(() => createBeams(), []);

  // Container style to hide everything when not active
  const containerStyle = useAnimatedStyle(() => {
    const p = dismissProgress.value;
    // Hide when no progress OR when animation is nearly complete
    // Use smooth fade out at the end to prevent flash
    let opacity: number;
    if (p <= 0.01) {
      opacity = 0;
    } else if (p >= 0.95) {
      // Fade out smoothly at the end
      opacity = interpolate(p, [0.95, 1], [1, 0], Extrapolation.CLAMP);
    } else {
      opacity = 1;
    }

    return {
      opacity,
      pointerEvents: 'none' as const,
    };
  });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, containerStyle]}
      pointerEvents="none"
    >
      <CinematicEnvironment progress={dismissProgress} />

      <CoreEnergyOrb progress={dismissProgress} />

      {isExiting &&
        waves.map(wave => (
          <LightWave key={wave.id} config={wave} progress={dismissProgress} />
        ))}

      {isExiting &&
        beams.map(beam => (
          <EnergyBeam key={beam.id} config={beam} progress={dismissProgress} />
        ))}

      {isExiting &&
        particles.map(particle => (
          <EnergyParticle
            key={particle.id}
            config={particle}
            progress={dismissProgress}
          />
        ))}
    </Animated.View>
  );
};

// ============================================================
// CARD ANIMATION HOOKS
// ============================================================

export const useCardDismissStyle = (
  dismissProgress: SharedValue<number>,
  translateY: SharedValue<number>,
) => {
  return useAnimatedStyle(() => {
    const p = dismissProgress.value;

    // Smooth scale down with elegant curve
    const scale = interpolate(
      p,
      [0, 0.2, 0.5, 0.8, 1],
      [1, 0.96, 0.85, 0.55, 0.2],
      Extrapolation.CLAMP,
    );

    // Cinematic 3D rotation
    const rotateX = interpolate(
      p,
      [0, 0.5, 0.9, 1],
      [0, -18, -42, -60],
      Extrapolation.CLAMP,
    );
    const rotateY = interpolate(
      p,
      [0, 0.6, 1],
      [0, 8, 18],
      Extrapolation.CLAMP,
    );
    const rotateZ = interpolate(
      p,
      [0, 0.4, 0.8, 1],
      [0, -2, -5, -10],
      Extrapolation.CLAMP,
    );

    // Accelerating downward motion
    const translateYAccel = interpolate(
      p,
      [0.4, 1],
      [0, SCREEN_HEIGHT * 0.3],
      Extrapolation.CLAMP,
    );

    // Subtle drift
    const translateX = interpolate(
      p,
      [0.3, 0.9],
      [0, -20],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { perspective: 1400 },
        { translateX },
        { translateY: translateY.value + translateYAccel },
        { scale },
        { rotateX: `${rotateX}deg` },
        { rotateY: `${rotateY}deg` },
        { rotateZ: `${rotateZ}deg` },
      ],
      opacity: interpolate(
        p,
        [0, 0.7, 0.92, 1],
        [1, 0.9, 0.4, 0],
        Extrapolation.CLAMP,
      ),
    };
  });
};

export const useGlowBorderStyle = (dismissProgress: SharedValue<number>) => {
  return useAnimatedStyle(() => {
    const p = dismissProgress.value;

    const borderWidth = interpolate(
      p,
      [0, 0.25, 0.6, 0.85, 1],
      [0, 2.5, 4, 3, 0],
      Extrapolation.CLAMP,
    );

    // Color evolution: cyan -> blue -> purple -> magenta -> white
    const borderColor = interpolateColor(
      p,
      [0, 0.25, 0.5, 0.75, 0.9, 1],
      [
        'transparent',
        PS_COLORS.cyan,
        PS_COLORS.blue,
        PS_COLORS.purple,
        PS_COLORS.magenta,
        'transparent',
      ],
    );

    const shadowColor = interpolateColor(
      p,
      [0.25, 0.5, 0.75, 0.9],
      [PS_COLORS.cyan, PS_COLORS.blue, PS_COLORS.purple, PS_COLORS.magenta],
    );

    return {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 24,
      borderWidth,
      borderColor,
      shadowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: interpolate(
        p,
        [0, 0.25, 0.7, 1],
        [0, 0.9, 0.8, 0],
        Extrapolation.CLAMP,
      ),
      shadowRadius: interpolate(
        p,
        [0, 0.5, 0.85, 1],
        [0, 32, 50, 0],
        Extrapolation.CLAMP,
      ),
    };
  });
};

export default SessionEndAnimation;
