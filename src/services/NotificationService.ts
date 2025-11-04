import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

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
}

export default new NotificationService();
