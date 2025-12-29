import {
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { ReminderTime } from '../types';

const { NotificationModule } = NativeModules;

const CHANNEL_ID = 'session-reminders';
const SESSION_NOTIFICATION_ID = 1001;

type AndroidNotificationModule = {
  createChannel: (id: string, name: string, description: string) => void;
  sendNotification: (
    channelId: string,
    title: string,
    message: string,
    notificationId: number,
  ) => void;
  cancelAll: () => void;
  isPermissionGranted?: () => Promise<boolean>;
  requestPermissions?: () => Promise<boolean>;
  scheduleReminder?: (title: string, body: string) => void;
  scheduleDailyReminder?: (
    identifier: string,
    title: string,
    body: string,
    hour: number,
    minute: number,
  ) => void;
  cancelScheduledReminder?: (identifier: string) => void;
  cancelAllScheduledReminders?: () => void;
  clearAll?: () => void;
};

type IOSAuthorizationStatus =
  | 'authorized'
  | 'denied'
  | 'notDetermined'
  | 'provisional'
  | 'ephemeral'
  | 'restricted';

class NotificationService {
  private channelConfigured = false;
  private missingModuleLogged = false;

  private get nativeModule():
    | AndroidNotificationModule
    | (Partial<AndroidNotificationModule> & {
        getAuthorizationStatus?: () => Promise<IOSAuthorizationStatus>;
      })
    | undefined {
    if (!NotificationModule && !this.missingModuleLogged) {
      console.warn('NotificationModule native module is not linked.');
      this.missingModuleLogged = true;
    }
    return NotificationModule as
      | AndroidNotificationModule
      | (Partial<AndroidNotificationModule> & {
          getAuthorizationStatus?: () => Promise<IOSAuthorizationStatus>;
        })
      | undefined;
  }

  private get androidModule(): AndroidNotificationModule | undefined {
    if (Platform.OS !== 'android') {
      return undefined;
    }
    return this.nativeModule as AndroidNotificationModule | undefined;
  }

  private async ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android' || this.channelConfigured) {
      return;
    }

    const module = this.androidModule;
    if (!module?.createChannel) {
      console.warn('Notification module not available on Android.');
      return;
    }

    module.createChannel(
      CHANNEL_ID,
      'Session reminders',
      'Reminders to continue your ongoing SerenitySpark sessions.',
    );
    this.channelConfigured = true;
  }

  private async hasPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const status = await this.nativeModule?.getAuthorizationStatus?.();
      return (
        status === 'authorized' ||
        status === 'provisional' ||
        status === 'ephemeral'
      );
    }

    if (Platform.OS === 'android') {
      if (Platform.Version < 33) {
        return true;
      }
      const granted = await this.nativeModule?.isPermissionGranted?.();
      if (typeof granted === 'boolean') {
        return granted;
      }
      return false;
    }

    return false;
  }

  private async ensurePermissions(): Promise<boolean> {
    const alreadyGranted = await this.hasPermission();
    if (alreadyGranted) {
      return true;
    }
    return this.requestPermissions();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const module = this.nativeModule;
      if (!module?.requestPermissions) {
        console.warn(
          'Notification module does not expose requestPermissions on iOS.',
        );
        return false;
      }
      try {
        const granted = await module.requestPermissions();
        return Boolean(granted);
      } catch (error) {
        console.error('Failed to request notification permissions:', error);
        return false;
      }
    }

    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    }

    return false;
  }

  async prepare(): Promise<boolean> {
    const granted = await this.ensurePermissions();
    if (granted) {
      await this.ensureAndroidChannel();
      return true;
    }
    return false;
  }

  async notifySessionRunning(remainingSeconds: number): Promise<void> {
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    const body =
      remainingMinutes > 0
        ? `Your SerenitySpark session is still running (${remainingMinutes} min left). Tap to return.`
        : 'Your SerenitySpark session is still running. Tap to return.';

    if (Platform.OS === 'ios') {
      const module = this.nativeModule;
      if (!module?.scheduleReminder) {
        console.warn(
          'Notification module does not expose scheduleReminder on iOS.',
        );
        return;
      }
      module.scheduleReminder('Session in progress', body);
      return;
    }

    if (Platform.OS === 'android') {
      const module = this.androidModule;
      if (!module?.sendNotification) {
        console.warn('Notification module not available on Android.');
        return;
      }
      await this.ensureAndroidChannel();
      module.sendNotification(
        CHANNEL_ID,
        'Session in progress',
        body,
        SESSION_NOTIFICATION_ID,
      );
    }
  }

  clearAll(): void {
    const module = this.nativeModule;
    module?.clearAll?.();
    if (Platform.OS === 'android') {
      this.androidModule?.cancelAll?.();
    }
  }

  async getPermissionStatus(): Promise<IOSAuthorizationStatus> {
    if (Platform.OS === 'ios') {
      const status = await this.nativeModule?.getAuthorizationStatus?.();
      return status ?? 'notDetermined';
    }

    if (Platform.OS === 'android') {
      if (Platform.Version < 33) {
        return 'authorized';
      }
      const granted = await this.nativeModule?.isPermissionGranted?.();
      return granted ? 'authorized' : 'denied';
    }

    return 'notDetermined';
  }

  async openSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Failed to open app settings:', error);
    }
  }

  async scheduleDailyReminder(
    identifier: string,
    title: string,
    body: string,
    time: ReminderTime,
  ): Promise<void> {
    const hasPermission = await this.hasPermission();
    if (!hasPermission) {
      console.warn(
        'Cannot schedule reminder: notification permission not granted',
      );
      return;
    }

    const module = this.nativeModule;
    if (!module?.scheduleDailyReminder) {
      console.warn('scheduleDailyReminder not available on this platform');
      return;
    }

    try {
      module.scheduleDailyReminder(
        identifier,
        title,
        body,
        time.hour,
        time.minute,
      );
    } catch (error) {
      console.error('Failed to schedule daily reminder:', error);
    }
  }

  async cancelScheduledReminder(identifier: string): Promise<void> {
    const module = this.nativeModule;
    if (!module?.cancelScheduledReminder) {
      console.warn('cancelScheduledReminder not available on this platform');
      return;
    }

    try {
      module.cancelScheduledReminder(identifier);
    } catch (error) {
      console.error('Failed to cancel scheduled reminder:', error);
    }
  }

  async cancelAllScheduledReminders(): Promise<void> {
    const module = this.nativeModule;
    if (!module?.cancelAllScheduledReminders) {
      console.warn(
        'cancelAllScheduledReminders not available on this platform',
      );
      return;
    }

    try {
      module.cancelAllScheduledReminders();
    } catch (error) {
      console.error('Failed to cancel all scheduled reminders:', error);
    }
  }

  async scheduleAllReminders(
    periods: { morning: boolean; day: boolean; evening: boolean },
    times: { morning: ReminderTime; day: ReminderTime; evening: ReminderTime },
    messages: {
      morning: { title: string; body: string };
      day: { title: string; body: string };
      evening: { title: string; body: string };
    },
  ): Promise<void> {
    // Cancel all existing reminders first
    await this.cancelAllScheduledReminders();

    // Schedule enabled reminders
    if (periods.morning) {
      await this.scheduleDailyReminder(
        'morning-reminder',
        messages.morning.title,
        messages.morning.body,
        times.morning,
      );
    }

    if (periods.day) {
      await this.scheduleDailyReminder(
        'day-reminder',
        messages.day.title,
        messages.day.body,
        times.day,
      );
    }

    if (periods.evening) {
      await this.scheduleDailyReminder(
        'evening-reminder',
        messages.evening.title,
        messages.evening.body,
        times.evening,
      );
    }
  }
}

export default new NotificationService();
