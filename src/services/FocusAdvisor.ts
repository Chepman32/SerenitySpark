import { SessionRecord } from '../types';

export interface FocusAdvice {
  focusMinutes: number;
  breakMinutes: number;
  rationale: string;
  confidence: number; // 0-1
}

const DEFAULT_ADVICE: FocusAdvice = {
  focusMinutes: 25,
  breakMinutes: 5,
  rationale: 'Default Pomodoro-friendly cadence.',
  confidence: 0.25,
};

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower];
  }
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

export const buildFocusAdvice = (history: SessionRecord[]): FocusAdvice => {
  if (!history.length) {
    return DEFAULT_ADVICE;
  }

  const last20 = history.slice(0, 20);
  const completed = last20.filter(s => s.completed);
  const gaveUp = last20.filter(s => !s.completed);

  const completedDurations = completed.map(s => s.duration);
  const gaveUpDurations = gaveUp.map(s =>
    s.actualDurationSeconds
      ? Math.max(1, Math.round(s.actualDurationSeconds / 60))
      : s.duration,
  );

  const medianCompleted = percentile(completedDurations, 50) || DEFAULT_ADVICE.focusMinutes;
  const safetyBand =
    gaveUpDurations.length > 0
      ? percentile(gaveUpDurations, 40)
      : medianCompleted;

  const suggestedFocus = Math.max(
    10,
    Math.round(
      medianCompleted - Math.max(0, medianCompleted - safetyBand) * 0.35,
    ),
  );

  const completionRate = completed.length / last20.length;
  const confidence = Math.min(
    1,
    0.3 + 0.7 * Math.min(1, completed.length / 10) * completionRate,
  );
  const breakMinutes = Math.max(3, Math.round(suggestedFocus * 0.2));

  const rationale = completionRate < 0.5
    ? 'Shortened focus blocks to reduce mid-session drop-offs.'
    : 'Based on your median completed sessions.';

  return {
    focusMinutes: suggestedFocus,
    breakMinutes,
    rationale,
    confidence,
  };
};
