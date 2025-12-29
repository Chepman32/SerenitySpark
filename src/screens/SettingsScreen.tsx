import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Switch,
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
import { ThemeType } from '../constants/themes';
import NotificationService from '../services/NotificationService';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (BR)' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },
];

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, themeType, setTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { navigateToHome } = useApp();
  const [languageExpanded, setLanguageExpanded] = useState(false);

  const translateY = useSharedValue(0);
  const screenHeight = Dimensions.get('window').height;
  const panRef = React.useRef<any>(null);
  const scrollY = useSharedValue(0);

  // Sync notification toggle with actual system permission status
  React.useEffect(() => {
    const syncNotificationStatus = async () => {
      const status = await NotificationService.getPermissionStatus();
      const isGranted =
        status === 'authorized' ||
        status === 'provisional' ||
        status === 'ephemeral';

      // If system permissions are granted but app setting is off, sync it
      if (isGranted && !settings.notificationsEnabled) {
        updateSettings({ notificationsEnabled: true });
      }
      // If system permissions are denied but app setting is on, sync it
      if (!isGranted && settings.notificationsEnabled && status === 'denied') {
        updateSettings({ notificationsEnabled: false });
      }
    };

    syncNotificationStatus();
  }, []);

  // Ensure notificationPeriods has default values
  const notificationPeriods = settings.notificationPeriods || {
    morning: true,
    day: true,
    evening: true,
  };

  const currentLanguage =
    LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const onScroll = React.useCallback((event: any) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  }, []);

  const handleThemeSelect = (newTheme: ThemeType) => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const handleLanguageSelect = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLanguageExpanded(false);
  };

  const toggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const toggleHaptics = () => {
    updateSettings({ hapticsEnabled: !settings.hapticsEnabled });
  };

  const toggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      // Turning on - check permissions first
      const status = await NotificationService.getPermissionStatus();
      if (
        status === 'authorized' ||
        status === 'provisional' ||
        status === 'ephemeral'
      ) {
        updateSettings({ notificationsEnabled: true });
      } else {
        // Request permissions
        const granted = await NotificationService.prepare();
        if (granted) {
          updateSettings({ notificationsEnabled: true });
        } else {
          // Open settings if denied
          NotificationService.openSettings();
        }
      }
    } else {
      // Turning off
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
                  runOnJS(navigateToHome)();
                }
              },
            );
          } else {
            translateY.value = withTiming(0, { duration: 200 });
          }
        }),
    [navigateToHome, translateY, screenHeight, scrollY],
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

  const themeOptions: ThemeType[] = ['light', 'dark', 'solar', 'mono'];

  const styles = createStyles(theme);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={navigateToHome}>
              <Text style={styles.backButton}>← {t('settings.back')}</Text>
            </Pressable>
            <Text style={styles.title}>{t('settings.title')}</Text>
          </View>

          <GHScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            contentInsetAdjustmentBehavior="automatic"
            simultaneousHandlers={panRef}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {/* Theme Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.theme')}</Text>
              <View style={styles.themeGrid}>
                {themeOptions.map(themeOption => (
                  <Pressable
                    key={themeOption}
                    style={[
                      styles.themeOption,
                      themeType === themeOption && styles.themeOptionSelected,
                    ]}
                    onPress={() => handleThemeSelect(themeOption)}
                  >
                    <View
                      style={[
                        styles.themePreview,
                        getThemePreviewStyle(themeOption),
                      ]}
                    />
                    <Text
                      style={[
                        styles.themeLabel,
                        themeType === themeOption && styles.themeLabelSelected,
                      ]}
                    >
                      {t(`themes.${themeOption}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Language Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
              <Pressable
                style={styles.accordionHeader}
                onPress={() => setLanguageExpanded(!languageExpanded)}
              >
                <View style={styles.accordionHeaderContent}>
                  <Text style={styles.settingLabel}>
                    {currentLanguage.nativeName}
                  </Text>
                  <Text style={styles.accordionSubtext}>
                    {currentLanguage.name}
                  </Text>
                </View>
                <Text style={styles.accordionArrow}>
                  {languageExpanded ? '▲' : '▼'}
                </Text>
              </Pressable>

              {languageExpanded && (
                <View style={styles.languageList}>
                  {LANGUAGES.map(lang => (
                    <Pressable
                      key={lang.code}
                      style={[
                        styles.languageItem,
                        i18n.language === lang.code &&
                          styles.languageItemSelected,
                      ]}
                      onPress={() => handleLanguageSelect(lang.code)}
                    >
                      <View>
                        <Text
                          style={[
                            styles.languageNative,
                            i18n.language === lang.code &&
                              styles.languageTextSelected,
                          ]}
                        >
                          {lang.nativeName}
                        </Text>
                        <Text style={styles.languageName}>{lang.name}</Text>
                      </View>
                      {i18n.language === lang.code && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Sound Section */}
            <View style={styles.section}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{t('settings.sound')}</Text>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={toggleSound}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                  thumbColor={theme.colors.text}
                />
              </View>
            </View>

            {/* Haptics Section */}
            <View style={styles.section}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>
                    {t('settings.haptics')}
                  </Text>
                </View>
                <Switch
                  value={settings.hapticsEnabled}
                  onValueChange={toggleHaptics}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                  thumbColor={theme.colors.text}
                />
              </View>
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('settings.notifications')}
              </Text>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>
                    {t('settings.notificationsDesc')}
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

              {settings.notificationsEnabled && (
                <View style={styles.periodContainer}>
                  <Text style={styles.periodTitle}>
                    {t('settings.reminderPeriods')}
                  </Text>
                  <View style={styles.periodRow}>
                    <Pressable
                      style={[
                        styles.periodChip,
                        notificationPeriods.morning &&
                          styles.periodChipSelected,
                      ]}
                      onPress={() => toggleNotificationPeriod('morning')}
                    >
                      <Text
                        style={[
                          styles.periodChipText,
                          notificationPeriods.morning &&
                            styles.periodChipTextSelected,
                        ]}
                      >
                        🌅 {t('settings.morning')}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.periodChip,
                        notificationPeriods.day && styles.periodChipSelected,
                      ]}
                      onPress={() => toggleNotificationPeriod('day')}
                    >
                      <Text
                        style={[
                          styles.periodChipText,
                          notificationPeriods.day &&
                            styles.periodChipTextSelected,
                        ]}
                      >
                        ☀️ {t('settings.day')}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.periodChip,
                        notificationPeriods.evening &&
                          styles.periodChipSelected,
                      ]}
                      onPress={() => toggleNotificationPeriod('evening')}
                    >
                      <Text
                        style={[
                          styles.periodChipText,
                          notificationPeriods.evening &&
                            styles.periodChipTextSelected,
                        ]}
                      >
                        🌙 {t('settings.evening')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* About Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
              <Text style={styles.aboutText}>{t('settings.version')}</Text>
              <Text style={styles.aboutText}>{t('settings.description')}</Text>
              <Text style={[styles.aboutText, { marginTop: theme.spacing.md }]}>
                {t('settings.privacy')}
              </Text>
            </View>
          </GHScrollView>
        </SafeAreaView>
      </Animated.View>
    </GestureDetector>
  );
};

const getThemePreviewStyle = (themeType: ThemeType) => {
  const previewColors: Record<
    ThemeType,
    { backgroundColor: string; borderColor: string }
  > = {
    light: { backgroundColor: '#FFFFFF', borderColor: '#E0E0E0' },
    dark: { backgroundColor: '#0D0D0D', borderColor: '#333333' },
    solar: { backgroundColor: '#FFF8E7', borderColor: '#E8D5B5' },
    mono: { backgroundColor: '#2D2D2D', borderColor: '#505050' },
  };
  return previewColors[themeType];
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
      fontSize: 16,
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
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
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    themeOption: {
      width: '48%',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
    },
    themeOptionSelected: {
      borderColor: theme.colors.primary,
    },
    themePreview: {
      width: 60,
      height: 40,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      marginBottom: theme.spacing.sm,
    },
    themeLabel: {
      fontSize: 14,
      color: theme.colors.text,
    },
    themeLabelSelected: {
      fontWeight: '600',
      color: theme.colors.primary,
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
    },
    settingLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    aboutText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    accordionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    accordionHeaderContent: {
      flex: 1,
    },
    accordionSubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    accordionArrow: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.md,
    },
    languageList: {
      marginTop: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    languageItemSelected: {
      backgroundColor: theme.colors.primary + '20',
    },
    languageNative: {
      fontSize: 16,
      color: theme.colors.text,
    },
    languageName: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    languageTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    checkmark: {
      fontSize: 18,
      color: theme.colors.primary,
    },
    periodContainer: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    periodTitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    periodRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    periodChip: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    periodChipSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    periodChipText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    periodChipTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });

export default SettingsScreen;
