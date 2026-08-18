import { loadFromLocal, saveToLocal, addToSyncQueue } from './offlineDb';
import { getActiveSession } from './session';
import { supabase } from './supabase';

export interface OutletItem {
  id: string;
  name: string;
  address: string;
  phone?: string;
  userId?: string;
  createdAt?: string;
}

let state: OutletItem[] = [];

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function persistOutlets() {
  saveToLocal('soodap_outlets', state);
}

function initOutlets() {
  const session = getActiveSession();
  const defaultName = session?.storeName || 'Ayam Kelawas';
  const defaultAddress = session?.address || 'Alamat Utama Outlet';

  state = loadFromLocal<OutletItem[]>('soodap_outlets', [
    { id: '1', name: defaultName, address: defaultAddress },
  ]);

  if (state.length === 0) {
    state = [{ id: '1', name: defaultName, address: defaultAddress }];
    persistOutlets();
  } else if (session?.storeName && state.length > 0) {
    // Update main branch with latest session details if still default
    if (state[0].id === '1') {
      state[0].name = session.storeName;
      if (session.address) state[0].address = session.address;
      persistOutlets();
    }
  }
}

// Initial trigger
initOutlets();

export const outletStore = {
  get: (): OutletItem[] => {
    if (state.length === 0) {
      initOutlets();
    }
    return state;
  },
  subscribe: (cb: Listener) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  addOutlet: (outlet: { name: string; address?: string; phone?: string }) => {
    const session = getActiveSession();
    const userId = session?.userId || 'owner-1';
    const created: OutletItem = {
      id: Date.now().toString(),
      name: outlet.name.trim(),
      address: outlet.address?.trim() || 'Alamat belum diatur',
      phone: outlet.phone?.trim() || '',
      userId,
      createdAt: new Date().toISOString(),
    };
    state = [...state, created];
    persistOutlets();
    addToSyncQueue({ table: 'outlets', action: 'insert', payload: created });
    listeners.forEach(cb => cb());
    return created;
  },
  updateOutlet: (id: string, updatedFields: Partial<Omit<OutletItem, 'id'>>) => {
    state = state.map(o => (o.id === id ? { ...o, ...updatedFields } : o));
    persistOutlets();
    const updated = state.find(o => o.id === id);
    if (updated) {
      addToSyncQueue({ table: 'outlets', action: 'update', payload: updated });
    }
    listeners.forEach(cb => cb());
  },
  deleteOutlet: (id: string) => {
    state = state.filter(o => o.id !== id);
    persistOutlets();
    addToSyncQueue({ table: 'outlets', action: 'delete', payload: { id } });
    listeners.forEach(cb => cb());
  },
  syncWithSupabase: async () => {
    try {
      const session = getActiveSession();
      const userId = session?.userId;
      const { data, error } = userId
        ? await supabase.from('outlets').select('*').eq('user_id', userId)
        : await supabase.from('outlets').select('*');

      if (!error && data && data.length > 0) {
        const outletMap = new Map<string, OutletItem>();
        data.forEach((o: any) => {
          outletMap.set(o.id || o.name, {
            id: o.id || Date.now().toString(),
            name: o.name,
            address: o.address || '',
            phone: o.phone || '',
            userId: o.user_id,
          });
        });
        state.forEach(o => {
          outletMap.set(o.id || o.name, o);
        });
        state = Array.from(outletMap.values());
        persistOutlets();
        listeners.forEach(cb => cb());
      }
    } catch (e) {
      console.warn('[OutletStore] Error syncing with Supabase:', e);
    }
  },
};
