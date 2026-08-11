import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface ActiveSession {
  userId: string;
  name: string;
  role: string;
  storeName?: string;
  businessCategory?: string;
  address?: string;
  phone?: string;
  email?: string;
  paperSize?: '58mm' | '80mm';
  taxPercent?: string;
  headerNote?: string;
  footerNote?: string;
  isSetupCompleted?: boolean;
  loginMethod: 'pin' | 'supabase_owner';
  loginTime: string;
}

let currentSession: ActiveSession | null = null;
let isInitialized = false;

export async function initSession(): Promise<ActiveSession | null> {
  if (isInitialized && currentSession) return currentSession;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('soodap_session');
      if (saved) currentSession = JSON.parse(saved);
    } else {
      const saved = await AsyncStorage.getItem('soodap_session');
      if (saved) currentSession = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed reading session from storage', e);
  }
  isInitialized = true;
  return currentSession;
}

export function setActiveSession(session: ActiveSession) {
  currentSession = session;
  isInitialized = true;
  
  const jsonStr = JSON.stringify(session);
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('soodap_session', jsonStr);
    } catch (e) {
      console.warn('Failed writing session to localStorage', e);
    }
  } else {
    AsyncStorage.setItem('soodap_session', jsonStr).catch((e) => {
      console.warn('Failed writing session to AsyncStorage', e);
    });
  }

  // Trigger product store reload to restore user's saved products
  try {
    const { productStore } = require('./productStore');
    productStore?.reloadFromStorage?.();
  } catch (e) {
    // Ignore require error if circular
  }
}

export function getActiveSession(): ActiveSession | null {
  if (!currentSession && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem('soodap_session');
      if (saved) {
        currentSession = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed reading session from localStorage', e);
    }
  }
  return currentSession;
}

export function clearActiveSession() {
  currentSession = null;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem('soodap_session');
    } catch (e) {
      console.warn('Failed clearing session from localStorage', e);
    }
  } else {
    AsyncStorage.removeItem('soodap_session').catch((e) => {
      console.warn('Failed clearing session from AsyncStorage', e);
    });
  }
}
