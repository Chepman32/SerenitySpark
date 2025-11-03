import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Platform } from 'react-native';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

class HapticService {
  light(): void {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactLight', options);
    } else {
      ReactNativeHapticFeedback.trigger('impactLight', options);
    }
  }

  medium(): void {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactMedium', options);
    } else {
      ReactNativeHapticFeedback.trigger('impactMedium', options);
    }
  }

  heavy(): void {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactHeavy', options);
    } else {
      ReactNativeHapticFeedback.trigger('impactHeavy', options);
    }
  }

  success(): void {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('notificationSuccess', options);
    } else {
      ReactNativeHapticFeedback.trigger('notificationSuccess', options);
    }
  }

  warning(): void {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('notificationWarning', options);
    } else {
      ReactNativeHapticFeedback.trigger('notificationWarning', options);
    }
  }

  selection(): void {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('selection', options);
    } else {
      ReactNativeHapticFeedback.trigger('selection', options);
    }
  }
}

export default new HapticService();
