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

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage !== null;
  } catch (e) {
    return false;
  }
}

// ── LOCAL STORAGE HELPERS ──
export function loadFromLocal<T>(key: string, fallback: T): T {
  if (!isStorageAvailable()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    console.warn(`[OfflineDB] Error reading ${key} from local storage:`, e);
    return fallback;
  }
}

export function saveToLocal<T>(key: string, data: T): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[OfflineDB] Error saving ${key} to local storage:`, e);
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
