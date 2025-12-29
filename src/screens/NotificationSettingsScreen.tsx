import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Gesture,
  GestureDetector,
  ScrollView as GHScrollView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useApp } from '../contexts/AppContext';
import NotificationService from '../services/NotificationService';
import { ReminderTime } from '../types';

const NotificationSettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { navigateToSettings } = useApp();

  const translateY = useSharedValue(0);
  const screenHeight = Dimensions.get('window').height;
  const panRef = React.useRef<any>(null);
  const scrollY = useSharedValue(0);

  const [showTimePicker, setShowTimePicker] = useState<
    'morning' | 'day' | 'evening' | null
  >(null);

  // Ensure settings have default values
  const notificationPeriods = settings.notificationPeriods || {
    morning: true,
    day: true,
    evening: true,
  };

  const reminderTimes = settings.reminderTimes || {
    morning: { hour: 8, minute: 0 },
    day: { hour: 13, minute: 0 },
    evening: { hour: 20, minute: 0 },
  };

  // Schedule notifications when settings change
  useEffect(() => {
    if (settings.notificationsEnabled) {
      scheduleReminders();
    } else {
      NotificationService.cancelAllScheduledReminders();
    }
  }, [
    settings.notificationsEnabled,
    settings.notificationPeriods,
    settings.reminderTimes,
  ]);

  const scheduleReminders = async () => {
    const messages = {
      morning: {
        title: t('notifications.morningTitle'),
        body: t('notifications.morningBody'),
      },
      day: {
        title: t('notifications.dayTitle'),
        body: t('notifications.dayBody'),
      },
      evening: {
        title: t('notifications.eveningTitle'),
        body: t('notifications.eveningBody'),
      },
    };

    await NotificationService.scheduleAllReminders(
      notificationPeriods,
      reminderTimes,
      messages,
    );
  };

  const onScroll = React.useCallback((event: any) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  }, []);

  const toggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const status = await NotificationService.getPermissionStatus();
      if (
        status === 'authorized' ||
        status === 'provisional' ||
        status === 'ephemeral'
      ) {
        updateSettings({ notificationsEnabled: true });
      } else {
        const granted = await NotificationService.prepare();
        if (granted) {
          updateSettings({ notificationsEnabled: true });
        } else {
          NotificationService.openSettings();
        }
      }
    } else {
      updateSettings({ notificationsEnabled: false });
    }
  };

  const toggleNotificationPeriod = (period: 'morning' | 'day' | 'evening') => {
    updateSettings({
      notificationPeriods: {
        ...notificationPeriods,
        [period]: !notificationPeriods[period],
      },
    });
  };

  const updateReminderTime = (
    period: 'morning' | 'day' | 'evening',
    time: ReminderTime,
  ) => {
    updateSettings({
      reminderTimes: {
        ...reminderTimes,
        [period]: time,
      },
    });
  };

  const formatTime = (time: ReminderTime): string => {
    const hours = time.hour % 12 || 12;
    const minutes = time.minute.toString().padStart(2, '0');
    const ampm = time.hour >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(null);
    }

    if (selectedDate && showTimePicker) {
      updateReminderTime(showTimePicker, {
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      });
    }
  };

  const getDateFromTime = (time: ReminderTime): Date => {
    const date = new Date();
    date.setHours(time.hour);
    date.setMinutes(time.minute);
    return date;
  };

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .withRef(panRef)
        .onUpdate(event => {
          'worklet';
          if (event.translationY <= 0) {
            translateY.value = 0;
            return;
          }
          if (scrollY.value > 0) {
            translateY.value = 0;
            return;
          }
          translateY.value = event.translationY;
        })
        .onEnd(event => {
          'worklet';
          const threshold = 80;
          const isScrollingContent = scrollY.value > 0;

          if (event.translationY <= 0 || isScrollingContent) {
            translateY.value = withTiming(0, { duration: 200 });
            return;
          }

          if (event.translationY > threshold) {
            translateY.value = withTiming(
              screenHeight,
              { duration: 220 },
              finished => {
                if (finished) {
                  runOnJS(navigateToSettings)();
                }
              },
            );
          } else {
            translateY.value = withTiming(0, { duration: 200 });
          }
        }),
    [navigateToSettings, translateY, screenHeight, scrollY],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const distance = translateY.value;
    const fadeDistance = screenHeight / 2;
    return {
      transform: [{ translateY: distance }],
      opacity: interpolate(
        Math.abs(distance),
        [0, fadeDistance],
        [1, 0.85],
        'clamp',
      ),
    };
  });

  const styles = createStyles(theme);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={navigateToSettings} style={styles.backButton}>
              <Text style={styles.backText}>← {t('settings.back')}</Text>
            </Pressable>
            <Text style={styles.title}>{t('notificationSettings.title')}</Text>
          </View>

          <GHScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            contentInsetAdjustmentBehavior="automatic"
            simultaneousHandlers={panRef}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {/* Main Toggle */}
            <View style={styles.section}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>
                    {t('notificationSettings.enableReminders')}
                  </Text>
                  <Text style={styles.settingDesc}>
                    {t('notificationSettings.enableRemindersDesc')}
                  </Text>
                </View>
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                  thumbColor={theme.colors.text}
                />
              </View>
            </View>

            {settings.notificationsEnabled && (
              <>
                {/* Morning Reminder */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    🌅 {t('notificationSettings.morningReminder')}
                  </Text>
                  <View style={styles.reminderCard}>
                    <View style={styles.reminderRow}>
                      <Text style={styles.settingLabel}>
                        {t('notificationSettings.enabled')}
                      </Text>
                      <Switch
                        value={notificationPeriods.morning}
                        onValueChange={() =>
                          toggleNotificationPeriod('morning')
                        }
                        trackColor={{
                          false: theme.colors.border,
                          true: theme.colors.primary,
                        }}
                        thumbColor={theme.colors.text}
                      />
                    </View>
                    {notificationPeriods.morning && (
                      <Pressable
                        style={styles.timeRow}
                        onPress={() => setShowTimePicker('morning')}
                      >
                        <Text style={styles.timeLabel}>
                          {t('notificationSettings.time')}
                        </Text>
                        <Text style={styles.timeValue}>
                          {formatTime(reminderTimes.morning)}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Day Reminder */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    ☀️ {t('notificationSettings.dayReminder')}
                  </Text>
                  <View style={styles.reminderCard}>
                    <View style={styles.reminderRow}>
                      <Text style={styles.settingLabel}>
                        {t('notificationSettings.enabled')}
                      </Text>
                      <Switch
                        value={notificationPeriods.day}
                        onValueChange={() => toggleNotificationPeriod('day')}
                        trackColor={{
                          false: theme.colors.border,
                          true: theme.colors.primary,
                        }}
                        thumbColor={theme.colors.text}
                      />
                    </View>
                    {notificationPeriods.day && (
                      <Pressable
                        style={styles.timeRow}
                        onPress={() => setShowTimePicker('day')}
                      >
                        <Text style={styles.timeLabel}>
                          {t('notificationSettings.time')}
                        </Text>
                        <Text style={styles.timeValue}>
                          {formatTime(reminderTimes.day)}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Evening Reminder */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    🌙 {t('notificationSettings.eveningReminder')}
                  </Text>
                  <View style={styles.reminderCard}>
                    <View style={styles.reminderRow}>
                      <Text style={styles.settingLabel}>
                        {t('notificationSettings.enabled')}
                      </Text>
                      <Switch
                        value={notificationPeriods.evening}
                        onValueChange={() =>
                          toggleNotificationPeriod('evening')
                        }
                        trackColor={{
                          false: theme.colors.border,
                          true: theme.colors.primary,
                        }}
                        thumbColor={theme.colors.text}
                      />
                    </View>
                    {notificationPeriods.evening && (
                      <Pressable
                        style={styles.timeRow}
                        onPress={() => setShowTimePicker('evening')}
                      >
                        <Text style={styles.timeLabel}>
                          {t('notificationSettings.time')}
                        </Text>
                        <Text style={styles.timeValue}>
                          {formatTime(reminderTimes.evening)}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </>
            )}

            {/* Info Section */}
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                {t('notificationSettings.info')}
              </Text>
            </View>
          </GHScrollView>

          {/* Time Picker Modal */}
          {showTimePicker && (
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>
                    {t('notificationSettings.selectTime')}
                  </Text>
                  <Pressable onPress={() => setShowTimePicker(null)}>
                    <Text style={styles.pickerDone}>
                      {t('notificationSettings.done')}
                    </Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={getDateFromTime(reminderTimes[showTimePicker])}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  themeVariant={
                    theme.colors.background === '#0D0D0D' ? 'dark' : 'light'
                  }
                />
              </View>
            </View>
          )}
        </SafeAreaView>
      </Animated.View>
    </GestureDetector>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scroll: {
      flex: 1,
    },
    header: {
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      marginBottom: theme.spacing.sm,
    },
    backText: {
      fontSize: 16,
      color: theme.colors.primary,
    },
    title: {
      fontSize: 28,
      fontWeight: '300',
      color: theme.colors.text,
    },
    content: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    settingInfo: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    settingLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    settingDesc: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    reminderCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
    reminderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    timeLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    timeValue: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    infoSection: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.lg,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    pickerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    pickerContainer: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      paddingBottom: theme.spacing.xl,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    pickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    pickerDone: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });

export default NotificationSettingsScreen;
