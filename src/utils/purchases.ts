import { Capacitor } from '@capacitor/core';

// Product IDs — must match App Store Connect configuration
export const PRODUCT_IDS = {
  lifetime: 'studybuddy_lifetime',
  annual: 'studybuddy_annual',
  monthly: 'studybuddy_monthly',
} as const;

export type PlanType = keyof typeof PRODUCT_IDS;

// StoreKit integration via Capacitor plugin
// Uses @capgo/native-purchases for direct StoreKit 2 access
let storeKitAvailable = false;
let NativePurchases: any = null;

async function loadPlugin() {
  if (Capacitor.isNativePlatform()) {
    try {
      const mod = await import('@capgo/native-purchases');
      NativePurchases = mod.NativePurchases;
      storeKitAvailable = true;
    } catch {
      storeKitAvailable = false;
    }
  }
}

// Initialize on module load
const initPromise = loadPlugin();

export async function initializePurchases(): Promise<void> {
  await initPromise;
}

export function isStoreAvailable(): boolean {
  return storeKitAvailable;
}

export async function purchaseProduct(plan: PlanType): Promise<boolean> {
  await initPromise;
  const productId = PRODUCT_IDS[plan];

  if (!storeKitAvailable || !NativePurchases) {
    // On web, fall back to localStorage flag for development
    if (!Capacitor.isNativePlatform()) {
      localStorage.setItem('isPremium', 'true');
      return true;
    }
    throw new Error('In-app purchases are not available on this device.');
  }

  try {
    const result = await NativePurchases.purchaseProduct({ productIdentifier: productId });
    if (result && result.transactionId) {
      localStorage.setItem('isPremium', 'true');
      return true;
    }
    return false;
  } catch (error: any) {
    if (error?.code === 'USER_CANCELLED') {
      return false;
    }
    throw error;
  }
}

export async function restorePurchases(): Promise<boolean> {
  await initPromise;

  if (!storeKitAvailable || !NativePurchases) {
    if (!Capacitor.isNativePlatform()) {
      return localStorage.getItem('isPremium') === 'true';
    }
    throw new Error('In-app purchases are not available on this device.');
  }

  try {
    const result = await NativePurchases.restorePurchases();
    if (result?.activeSubscriptions?.length > 0 || result?.nonConsumables?.length > 0) {
      localStorage.setItem('isPremium', 'true');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function checkPremiumStatus(): boolean {
  return localStorage.getItem('isPremium') === 'true';
}
