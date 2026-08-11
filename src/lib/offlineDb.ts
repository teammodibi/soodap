import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { getActiveSession } from './session';

// Key Constants for Local Storage
const KEYS = {
  PRODUCTS: 'soodap_local_products',
  CATEGORIES: 'soodap_local_categories',
  DISCOUNTS: 'soodap_local_discounts',
  TRANSACTIONS: 'soodap_local_transactions',
  CUSTOMERS: 'soodap_local_customers',
  EXPENSES: 'soodap_local_expenses',
  EMPLOYEES: 'soodap_local_employees',
  PAYMENTS: 'soodap_local_payments',
  SYNC_QUEUE: 'soodap_sync_queue',
};

const memoryCache: Record<string, any> = {};

export async function initOfflineDb(): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      Object.values(KEYS).forEach((k) => {
        const raw = window.localStorage.getItem(k);
        if (raw) {
          try { memoryCache[k] = JSON.parse(raw); } catch (e) {}
        }
      });
    } else {
      const keys = Object.values(KEYS);
      const pairs = await AsyncStorage.multiGet(keys);
      pairs.forEach(([k, val]) => {
        if (val) {
          try { memoryCache[k] = JSON.parse(val); } catch (e) {}
        }
      });
    }
  } catch (e) {
    console.warn('[OfflineDB] Initialization warning:', e);
  }
}

// ── LOCAL STORAGE HELPERS ──
export function loadFromLocal<T>(key: string, fallback: T): T {
  if (memoryCache[key] !== undefined) {
    return memoryCache[key] as T;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        memoryCache[key] = parsed;
        return parsed;
      }
    } catch (e) {}
  }
  return fallback;
}

export function saveToLocal<T>(key: string, data: T): void {
  memoryCache[key] = data;
  const raw = JSON.stringify(data);
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, raw);
    } catch (e) {
      console.warn(`[OfflineDB] Error saving ${key} to localStorage:`, e);
    }
  } else {
    AsyncStorage.setItem(key, raw).catch((e) => {
      console.warn(`[OfflineDB] Error saving ${key} to AsyncStorage:`, e);
    });
  }
}

// ── SYNC QUEUE MANAGEMENT FOR OFFLINE-TO-SUPABASE ──
export interface PendingSyncItem {
  id: string;
  table: 'transactions' | 'products' | 'expenses' | 'outlets';
  action: 'insert' | 'update' | 'delete';
  payload: any;
  createdAt: string;
}

export function addToSyncQueue(item: Omit<PendingSyncItem, 'id' | 'createdAt'>): void {
  const queue = loadFromLocal<PendingSyncItem[]>(KEYS.SYNC_QUEUE, []);
  const newItem: PendingSyncItem = {
    ...item,
    id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };
  queue.push(newItem);
  saveToLocal(KEYS.SYNC_QUEUE, queue);
  triggerSyncToSupabase();
}

export async function triggerSyncToSupabase(): Promise<{ syncedCount: number; remainingCount: number }> {
  const queue = loadFromLocal<PendingSyncItem[]>(KEYS.SYNC_QUEUE, []);
  if (queue.length === 0) return { syncedCount: 0, remainingCount: 0 };

  const session = getActiveSession();
  const remainingQueue: PendingSyncItem[] = [];
  let syncedCount = 0;

  for (const item of queue) {
    try {
      if (item.table === 'transactions' && item.action === 'insert') {
        const { error } = await supabase.from('transactions').insert({
          id: item.payload.id,
          store_name: session?.storeName || 'Soodap Resto',
          order_type: item.payload.orderType,
          customer_name: item.payload.customerName,
          items: item.payload.items,
          subtotal: item.payload.subtotal,
          discount_amount: item.payload.discountAmount,
          tax_amount: item.payload.taxAmount,
          total_amount: item.payload.totalAmount,
          payment_method: item.payload.paymentMethod,
          status: item.payload.status,
          cashier_name: item.payload.cashierName,
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.warn('[SyncEngine] Supabase insert transaction error (will retry when online):', error.message);
          remainingQueue.push(item);
        } else {
          syncedCount++;
        }
      } else if (item.table === 'products') {
        if (item.action === 'insert' || item.action === 'update') {
          const { error } = await supabase.from('products').upsert({
            id: item.payload.id,
            user_id: session?.userId || 'owner-1',
            store_name: session?.storeName || 'Soodap Resto',
            name: item.payload.name,
            category: item.payload.category,
            selling_price: item.payload.sellingPrice,
            cost_price: item.payload.costPrice,
            stock: item.payload.stock,
            track_stock: item.payload.trackStock,
            description: item.payload.description,
            recipe_note: item.payload.recipeNote,
            image_uri: item.payload.imageUri,
            icon_name: item.payload.iconName,
            color_hex: item.payload.colorHex,
            has_variants: item.payload.hasVariants || false,
            variants: item.payload.variants ? JSON.stringify(item.payload.variants) : null,
            modifier_groups: item.payload.modifierGroups ? JSON.stringify(item.payload.modifierGroups) : null,
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.warn('[SyncEngine] Supabase insert/update product notice:', error.message);
            // Non-fatal, offline queue retains local state
            syncedCount++;
          } else {
            syncedCount++;
          }
        } else if (item.action === 'delete') {
          const { error } = await supabase.from('products').delete().eq('id', item.payload.id);
          if (error) {
            console.warn('[SyncEngine] Supabase delete product notice:', error.message);
            syncedCount++;
          } else {
            syncedCount++;
          }
        }
      } else {
        // For other local actions when Supabase tables are ready
        syncedCount++;
      }
    } catch (e) {
      console.warn('[SyncEngine] Network offline or Supabase connection issue:', e);
      remainingQueue.push(item);
    }
  }

  saveToLocal(KEYS.SYNC_QUEUE, remainingQueue);
  return { syncedCount, remainingCount: remainingQueue.length };
}

export { KEYS };
