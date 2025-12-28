import { useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import HapticService from '../services/HapticService';

export const useHaptics = () => {
  const { settings } = useSettings();

  const light = useCallback(() => {
    if (settings.hapticsEnabled) {
      HapticService.light();
    }
  }, [settings.hapticsEnabled]);

  const medium = useCallback(() => {
    if (settings.hapticsEnabled) {
      HapticService.medium();
    }
  }, [settings.hapticsEnabled]);

  const heavy = useCallback(() => {
    if (settings.hapticsEnabled) {
      HapticService.heavy();
    }
  }, [settings.hapticsEnabled]);

  const success = useCallback(() => {
    if (settings.hapticsEnabled) {
      HapticService.success();
    }
  }, [settings.hapticsEnabled]);

  const warning = useCallback(() => {
    if (settings.hapticsEnabled) {
      HapticService.warning();
    }
  }, [settings.hapticsEnabled]);

  const selection = useCallback(() => {
    if (settings.hapticsEnabled) {
      HapticService.selection();
    }
  }, [settings.hapticsEnabled]);

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    selection,
  };
};
