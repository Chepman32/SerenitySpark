import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import StorageService from '../services/StorageService';
import { PremiumFeature, SubscriptionState } from '../types';

type SubscriptionContextValue = {
  state: SubscriptionState;
  loading: boolean;
  isPremium: boolean;
  hasFeature: (feature: PremiumFeature) => boolean;
  markPremium: (products?: string[]) => Promise<void>;
  registerPurchase: (productId: string) => Promise<void>;
  resetSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined,
);

const FEATURE_PRODUCT_MAP: Record<PremiumFeature, string[]> = {
  focusOptimizer: ['serenity.premium', 'serenity.premium.yearly'],
  distractionBlocking: ['serenity.premium', 'serenity.premium.yearly'],
  hardMode: ['serenity.premium', 'serenity.premium.yearly'],
  advancedAnalytics: ['serenity.premium', 'serenity.premium.yearly'],
  premiumThemes: ['serenity.premium', 'theme.pack'],
  liveActivities: ['serenity.premium', 'serenity.deepwork.pack'],
  backups: ['serenity.premium', 'serenity.deepwork.pack'],
  reports: ['serenity.premium', 'serenity.premium.yearly'],
  soundPacks: ['serenity.premium', 'focus.sounds.pack'],
};

const computeEntitlements = (products: string[]) => {
  const entitlements: Record<PremiumFeature, boolean> = {} as Record<
    PremiumFeature,
    boolean
  >;
  (Object.keys(FEATURE_PRODUCT_MAP) as PremiumFeature[]).forEach(feature => {
    const neededProducts = FEATURE_PRODUCT_MAP[feature];
    entitlements[feature] = products.some(product =>
      neededProducts.includes(product),
    );
  });
  return entitlements;
};

// All features are now free - no premium/paywall
const ALL_FEATURES_ENABLED: Record<PremiumFeature, boolean> = {
  focusOptimizer: true,
  distractionBlocking: true,
  hardMode: true,
  advancedAnalytics: true,
  premiumThemes: true,
  liveActivities: true,
  backups: true,
  reports: true,
  soundPacks: true,
};

export const SubscriptionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [state, setState] = useState<SubscriptionState>({
    isPremium: true, // Always premium - app is free
    activeProducts: ['serenity.premium'],
    entitlements: ALL_FEATURES_ENABLED,
    packs: {
      themePack: true,
      focusSoundsPack: true,
      deepWorkPack: true,
    },
    lastSynced: undefined,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate();
  }, []);

  const hydrate = async () => {
    const stored = await StorageService.getSubscriptionState();
    if (stored) {
      setState(stored);
    }
    setLoading(false);
  };

  const persist = async (next: SubscriptionState) => {
    setState(next);
    await StorageService.saveSubscriptionState(next);
  };

  const markPremium = useCallback(
    async (products: string[] = ['serenity.premium']) => {
      const entitlements = computeEntitlements(products);
      const next: SubscriptionState = {
        isPremium: true,
        activeProducts: products,
        entitlements,
        packs: {
          themePack: products.includes('theme.pack'),
          focusSoundsPack: products.includes('focus.sounds.pack'),
          deepWorkPack: products.includes('serenity.deepwork.pack'),
        },
        lastSynced: Date.now(),
      };
      await persist(next);
    },
    [],
  );

  const registerPurchase = useCallback(
    async (productId: string) => {
      const products = Array.from(
        new Set([...state.activeProducts, productId]),
      );
      const entitlements = computeEntitlements(products);
      const next: SubscriptionState = {
        ...state,
        isPremium:
          entitlements.focusOptimizer || entitlements.advancedAnalytics,
        activeProducts: products,
        entitlements,
        packs: {
          ...state.packs,
          themePack: state.packs.themePack || productId === 'theme.pack',
          focusSoundsPack:
            state.packs.focusSoundsPack || productId === 'focus.sounds.pack',
          deepWorkPack:
            state.packs.deepWorkPack || productId === 'serenity.deepwork.pack',
        },
        lastSynced: Date.now(),
      };
      await persist(next);
    },
    [state],
  );

  const resetSubscription = useCallback(async () => {
    const base: SubscriptionState = {
      isPremium: false,
      activeProducts: [],
      entitlements: computeEntitlements([]),
      packs: {
        themePack: false,
        focusSoundsPack: false,
        deepWorkPack: false,
      },
      lastSynced: Date.now(),
    };
    await persist(base);
  }, []);

  // All features are free - always return true
  const hasFeature = useCallback((_feature: PremiumFeature) => {
    return true;
  }, []);

  const value = useMemo(
    () => ({
      state,
      loading,
      isPremium: state.isPremium,
      hasFeature,
      markPremium,
      registerPurchase,
      resetSubscription,
    }),
    [
      state,
      loading,
      hasFeature,
      markPremium,
      registerPurchase,
      resetSubscription,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextValue => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};
