import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

type PlanId = 'weekly' | 'monthly' | 'annual';

interface PremiumPaywallProps {
  visible: boolean;
  onClose: () => void;
  onPrimaryAction?: (plan: PlanId) => void;
}

const planOptions: {
  id: PlanId;
  label: string;
  price: string;
  detail: string;
  subDetail: string;
  badge?: string;
}[] = [
  {
    id: 'weekly',
    label: 'Weekly',
    price: '$4.99',
    detail: '3-day free trial',
    subDetail: '$4.99 / week',
    badge: 'Popular',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$7.99',
    detail: 'Save 20% vs weekly',
    subDetail: '$7.99 / month',
  },
  {
    id: 'annual',
    label: 'Annually',
    price: '$33.99',
    detail: 'Best value',
    subDetail: '$2.83 / month',
  },
];

const featureItems = [
  {
    title: 'Focus Advisor',
    subtitle: 'AI recommends ideal focus and break timing.',
    available: true,
  },
  {
    title: 'Hard mode',
    subtitle: 'Confirm a reason before you end sessions early.',
    available: true,
  },
  {
    title: 'Distraction blocking reminders',
    subtitle: 'Extra nudges when you leave the app mid-session.',
    available: true,
  },
  {
    title: 'Early access to new features',
    subtitle: 'Be first to try experimental tools.',
    available: false,
  },
];

const PremiumPaywall: React.FC<PremiumPaywallProps> = ({
  visible,
  onClose,
  onPrimaryAction,
}) => {
  const [selectedPlan, setSelectedPlan] = React.useState<PlanId>('weekly');

  React.useEffect(() => {
    if (visible) {
      setSelectedPlan('weekly');
    }
  }, [visible]);

  const handlePrimary = () => {
    if (onPrimaryAction) {
      onPrimaryAction(selectedPlan);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.card}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <ImageBackground
                source={require('../assets/images/antonio-virgil-mnm1lGiHghU-unsplash.jpg')}
                style={styles.heroImage}
                imageStyle={styles.heroImageRadius}
              >
                <View style={styles.heroOverlay}>
                  <Pressable onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeText}>✕</Text>
                  </Pressable>
                  <View style={styles.heroCopy}>
                    <Text style={styles.heroTitle}>Premium required</Text>
                    <Text style={styles.heroSubtitle}>
                      Unlock SerenitySpark Premium to enable Focus Advisor, hard mode, and distraction blocking reminders.
                    </Text>
                  </View>
                </View>
              </ImageBackground>

              <View style={styles.content}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pro Benefits</Text>
                  <Text style={styles.sectionLink}>Benefits Comparison</Text>
                </View>

                <View style={styles.features}>
                  {featureItems.map(item => (
                    <View key={item.title} style={styles.featureRow}>
                      <View
                        style={[
                          styles.featureIcon,
                          item.available ? styles.iconAvailable : styles.iconLocked,
                        ]}
                      >
                        <Text style={styles.featureIconText}>
                          {item.available ? '✓' : '✕'}
                        </Text>
                      </View>
                      <View style={styles.featureTextGroup}>
                        <Text style={styles.featureTitle}>{item.title}</Text>
                        {item.subtitle ? (
                          <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
                        ) : null}
                      </View>
                      <Text style={[styles.featureStatus, item.available && styles.featureStatusOn]}>
                        {item.available ? 'Included' : 'Locked'}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.plansRow}>
                  {planOptions.map(plan => {
                    const selected = plan.id === selectedPlan;
                    return (
                      <Pressable
                        key={plan.id}
                        onPress={() => setSelectedPlan(plan.id)}
                        style={[styles.planCard, selected && styles.planCardSelected]}
                      >
                        {plan.badge ? (
                          <View style={styles.planBadge}>
                            <Text style={styles.planBadgeText}>{plan.badge}</Text>
                          </View>
                        ) : null}
                        <Text style={styles.planLabel}>{plan.label}</Text>
                        <Text style={styles.planPrice}>{plan.price}</Text>
                        <Text style={styles.planDetail}>{plan.detail}</Text>
                        <Text style={styles.planSubDetail}>{plan.subDetail}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable style={styles.primaryCta} onPress={handlePrimary}>
                  <Text style={styles.primaryCtaText}>Try For Free</Text>
                  <Text style={styles.primaryCtaArrow}>›</Text>
                </Pressable>
                <Text style={styles.trialNote}>
                  Try 3 days for free, then $4.99/week. Cancel anytime.
                </Text>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  safeArea: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#070910',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.lg,
  },
  heroImage: {
    height: 240,
    width: '100%',
    justifyContent: 'flex-end',
  },
  heroImageRadius: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    padding: theme.spacing.lg,
    justifyContent: 'flex-end',
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  heroCopy: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#D6D7DB',
    fontSize: 15,
    lineHeight: 21,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionLink: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  features: {
    backgroundColor: '#0C0F18',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAvailable: {
    backgroundColor: 'rgba(78,205,196,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.45)',
  },
  iconLocked: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featureIconText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  featureTextGroup: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  featureSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  featureStatus: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  featureStatusOn: {
    color: theme.colors.primary,
  },
  plansRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  planCard: {
    flex: 1,
    minWidth: 110,
    backgroundColor: '#0F121C',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  planCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(78,205,196,0.12)',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0C0C12',
  },
  planLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  planPrice: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  planDetail: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  planSubDetail: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#32c6f6',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#32c6f6',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  primaryCtaText: {
    color: theme.colors.background,
    fontSize: 17,
    fontWeight: '800',
  },
  primaryCtaArrow: {
    color: theme.colors.background,
    fontSize: 18,
    fontWeight: '800',
  },
  trialNote: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});

export default PremiumPaywall;
