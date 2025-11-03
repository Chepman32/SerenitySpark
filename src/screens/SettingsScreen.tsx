import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { useSettings } from '../contexts/SettingsContext';
import { useApp } from '../contexts/AppContext';
import AudioService from '../services/AudioService';

const SettingsScreen: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { navigateToHome } = useApp();

  const natureTracks = AudioService.getAvailableTracks('nature');
  const musicTracks = AudioService.getAvailableTracks('music');

  const handleNatureTrackSelect = (trackId: string) => {
    updateSettings({ defaultNatureTrack: trackId });
  };

  const handleMusicTrackSelect = (trackId: string) => {
    updateSettings({ defaultMusicTrack: trackId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={navigateToHome}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Preferences</Text>

          <Text style={styles.label}>Nature Sound</Text>
          {natureTracks.map(track => (
            <Pressable
              key={track.id}
              style={[
                styles.option,
                settings.defaultNatureTrack === track.id &&
                  styles.optionSelected,
              ]}
              onPress={() => handleNatureTrackSelect(track.id)}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.defaultNatureTrack === track.id &&
                    styles.optionTextSelected,
                ]}
              >
                {track.name}
              </Text>
              {settings.defaultNatureTrack === track.id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
          ))}

          <Text style={[styles.label, { marginTop: theme.spacing.lg }]}>
            Music Track
          </Text>
          {musicTracks.map(track => (
            <Pressable
              key={track.id}
              style={[
                styles.option,
                settings.defaultMusicTrack === track.id &&
                  styles.optionSelected,
              ]}
              onPress={() => handleMusicTrackSelect(track.id)}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.defaultMusicTrack === track.id &&
                    styles.optionTextSelected,
                ]}
              >
                {track.name}
              </Text>
              {settings.defaultMusicTrack === track.id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>SerenitySpark v1.0.0</Text>
          <Text style={styles.aboutText}>
            A gesture-driven meditation app for mindful moments.
          </Text>
          <Text style={[styles.aboutText, { marginTop: theme.spacing.md }]}>
            Privacy: All your data stays on your device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
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
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  optionSelected: {
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  optionTextSelected: {
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: theme.colors.text,
  },
  aboutText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default SettingsScreen;
