import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Switch,
  Modal,
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
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useApp } from '../contexts/AppContext';
import NotificationService from '../services/NotificationService';
import CircularTimeRangePicker from '../components/CircularTimeRangePicker';
import { NotificationPeriod } from '../types';

const NotificationSettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { navigateToSettings } = useApp();

  const translateY = useSharedValue(0);
  const screenHeight = Dimensions.get('window').height;
  const panRef = React.useRef<any>(null);
  const scrollY = useSharedValue(0);

  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<NotificationPeriod | null>(
    null,
  );
  const [tempPeriod, setTempPeriod] = useState<{
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  }>({
    startHour: 9,
    startMinute: 0,
    endHour: 21,
    endMinute: 0,
  });

  const notificationPeriods = settings.customNotificationPeriods || [];

  useEffect(() => {
    if (settings.notificationsEnabled && notificationPeriods.length > 0) {
      scheduleReminders();
    } else {
      NotificationService.cancelAllScheduledReminders();
    }
  }, [settings.notificationsEnabled, settings.customNotificationPeriods]);

  const scheduleReminders = async () => {
    await NotificationService.cancelAllScheduledReminders();
    const enabledPeriods = notificationPeriods.filter((p) => p.enabled);
    for (const period of enabledPeriods) {
      await NotificationService.scheduleDailyReminder(
        period.id,
        t('notifications.dayTitle'),
        t('notifications.dayBody'),
        { hour: period.startHour, minute: period.startMinute },
      );
    }
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

  const generateId = () => {
    return `period_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const openAddPeriodModal = () => {
    setEditingPeriod(null);
    setTempPeriod({
      startHour: 9,
      startMinute: 0,
      endHour: 21,
      endMinute: 0,
    });
    setShowTimePickerModal(true);
  };

  const openEditPeriodModal = (period: NotificationPeriod) => {
    setEditingPeriod(period);
    setTempPeriod({
      startHour: period.startHour,
      startMinute: period.startMinute,
      endHour: period.endHour,
      endMinute: period.endMinute,
    });
    setShowTimePickerModal(true);
  };

  const handleTimeChange = useCallback(
    (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
      setTempPeriod({ startHour, startMinute, endHour, endMinute });
    },
    [],
  );

  const savePeriod = () => {
    if (editingPeriod) {
      const updatedPeriods = notificationPeriods.map((p) =>
        p.id === editingPeriod.id
          ? { ...p, ...tempPeriod }
          : p,
      );
      updateSettings({ customNotificationPeriods: updatedPeriods });
    } else {
      const newPeriod: NotificationPeriod = {
        id: generateId(),
        ...tempPeriod,
        enabled: true,
      };
      updateSettings({
        customNotificationPeriods: [...notificationPeriods, newPeriod],
      });
    }
    setShowTimePickerModal(false);
  };

  const deletePeriod = (periodId: string) => {
    const updatedPeriods = notificationPeriods.filter((p) => p.id !== periodId);
    updateSettings({ customNotificationPeriods: updatedPeriods });
  };

  const togglePeriod = (periodId: string) => {
    const updatedPeriods = notificationPeriods.map((p) =>
      p.id === periodId ? { ...p, enabled: !p.enabled } : p,
    );
    updateSettings({ customNotificationPeriods: updatedPeriods });
  };

  const formatTimeRange = (period: NotificationPeriod): string => {
    const formatHour = (hour: number, minute: number) => {
      const h = hour % 12 || 12;
      const m = minute.toString().padStart(2, '0');
      const ampm = hour >= 12 ? 'PM' : 'AM';
      return `${h}:${m} ${ampm}`;
    };
    return `${formatHour(period.startHour, period.startMinute)} - ${formatHour(
      period.endHour,
      period.endMinute,
    )}`;
  };

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .withRef(panRef)
        .onUpdate((event) => {
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
        .onEnd((event) => {
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
              (finished) => {
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

            {/* Notification Periods List */}
            {settings.notificationsEnabled && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {t('notificationSettings.reminderPeriods', 'Reminder Periods')}
                  </Text>
                  <Pressable
                    style={styles.addButton}
                    onPress={openAddPeriodModal}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </Pressable>
                </View>

                {notificationPeriods.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      {t('notificationSettings.noPeriods', 'No reminder periods set. Tap + to add one.')}
                    </Text>
                  </View>
                ) : (
                  notificationPeriods.map((period) => (
                    <View key={period.id} style={styles.periodCard}>
                      <Pressable
                        style={styles.periodInfo}
                        onPress={() => openEditPeriodModal(period)}
                      >
                        <Text style={styles.periodTime}>
                          {formatTimeRange(period)}
                        </Text>
                        <Text style={styles.periodHint}>
                          {t('notificationSettings.tapToEdit', 'Tap to edit')}
                        </Text>
                      </Pressable>
                      <View style={styles.periodActions}>
                        <Switch
                          value={period.enabled}
                          onValueChange={() => togglePeriod(period.id)}
                          trackColor={{
                            false: theme.colors.border,
                            true: theme.colors.primary,
                          }}
                          thumbColor={theme.colors.text}
                        />
                        <Pressable
                          style={styles.deleteButton}
                          onPress={() => deletePeriod(period.id)}
                        >
                          <Text style={styles.deleteButtonText}>-</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Info Section */}
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                {t('notificationSettings.info')}
              </Text>
            </View>
          </GHScrollView>

          {/* Time Picker Modal */}
          <Modal
            visible={showTimePickerModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowTimePickerModal(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setShowTimePickerModal(false)}
            >
              <Pressable onPress={() => {}}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Pressable onPress={() => setShowTimePickerModal(false)}>
                      <Text style={styles.modalCancel}>
                        {t('common.cancel')}
                      </Text>
                    </Pressable>
                    <Text style={styles.modalTitle}>
                      {editingPeriod
                        ? t('notificationSettings.editPeriod', 'Edit Period')
                        : t('notificationSettings.addPeriod', 'Add Period')}
                    </Text>
                    <Pressable onPress={savePeriod}>
                      <Text style={styles.modalSave}>{t('common.save')}</Text>
                    </Pressable>
                  </View>

                  <CircularTimeRangePicker
                    startHour={tempPeriod.startHour}
                    startMinute={tempPeriod.startMinute}
                    endHour={tempPeriod.endHour}
                    endMinute={tempPeriod.endMinute}
                    onTimeChange={handleTimeChange}
                  />

                  <Text style={styles.modalHint}>
                    {t(
                      'notificationSettings.dragHint',
                      'Drag the handles to set your notification window',
                    )}
                  </Text>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
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
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    addButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: 24,
      fontWeight: '400',
      color: theme.colors.background,
      lineHeight: 28,
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
    emptyState: {
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    periodCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    periodInfo: {
      flex: 1,
    },
    periodTime: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    periodHint: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    periodActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    deleteButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteButtonText: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.background,
      lineHeight: 22,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      paddingBottom: theme.spacing.xxl,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    modalCancel: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    modalSave: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    modalHint: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
  });

export default NotificationSettingsScreen;
