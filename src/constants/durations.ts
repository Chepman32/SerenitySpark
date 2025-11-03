export interface DurationOption {
  minutes: number;
  icon: string;
  color: string;
}

export const DURATION_OPTIONS: DurationOption[] = [
  {
    minutes: 5,
    icon: 'clock-outline',
    color: '#4ECDC4',
  },
  {
    minutes: 10,
    icon: 'clock-outline',
    color: '#51CF66',
  },
  {
    minutes: 15,
    icon: 'clock-outline',
    color: '#FFD93D',
  },
  {
    minutes: 20,
    icon: 'clock-outline',
    color: '#FF6B6B',
  },
  {
    minutes: 30,
    icon: 'clock-outline',
    color: '#A78BFA',
  },
];

export const CARD_WIDTH = 120;
export const CARD_HEIGHT = 160;
export const CARD_SPACING = 16;
