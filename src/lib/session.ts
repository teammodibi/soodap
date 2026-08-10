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

function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage !== null;
  } catch (e) {
    return false;
  }
}

export function setActiveSession(session: ActiveSession) {
  currentSession = session;
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem('soodap_session', JSON.stringify(session));
    } catch (e) {
      console.warn('Failed writing session to localStorage', e);
    }
  }
}

export function getActiveSession(): ActiveSession | null {
  if (!currentSession && isLocalStorageAvailable()) {
    try {
      const saved = localStorage.getItem('soodap_session');
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
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem('soodap_session');
    } catch (e) {
      console.warn('Failed clearing session from localStorage', e);
    }
  }
}
