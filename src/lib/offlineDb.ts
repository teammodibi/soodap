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
  table: 'transactions' | 'products' | 'categories' | 'discounts' | 'expenses' | 'outlets';
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
          console.warn('[SyncEngine] Supabase insert transaction notice:', error.message);
          remainingQueue.push(item);
        } else {
          syncedCount++;
        }
      } else if (item.table === 'products') {
        if (item.action === 'insert' || item.action === 'update') {
          const storeName = item.payload.storeName || session?.storeName || 'Outlet Resto Utama';
          const userId = item.payload.userId || session?.userId || 'owner-1';
          const { error } = await supabase.from('products').upsert({
            id: item.payload.id,
            user_id: userId,
            store_name: storeName,
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
            available_outlets: item.payload.availableOutlets ? JSON.stringify(item.payload.availableOutlets) : null,
            hidden_outlets: item.payload.hiddenOutlets ? JSON.stringify(item.payload.hiddenOutlets) : null,
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.warn('[SyncEngine] Supabase insert/update product notice:', error.message);
            // If offline/table not ready, retain in queue if needed
            remainingQueue.push(item);
          } else {
            syncedCount++;
          }
        } else if (item.action === 'delete') {
          const { error } = await supabase.from('products').delete().eq('id', item.payload.id);
          if (error) {
            console.warn('[SyncEngine] Supabase delete product notice:', error.message);
            remainingQueue.push(item);
          } else {
            syncedCount++;
          }
        }
      } else if (item.table === 'categories') {
        if (item.action === 'insert' || item.action === 'update') {
          const userId = item.payload.userId || session?.userId || 'owner-1';
          const storeName = item.payload.storeName || session?.storeName || 'Outlet Resto Utama';
          const catId = `${userId}_${item.payload.name}`;
          
          const payload: any = {
            id: catId,
            user_id: userId,
            store_name: storeName,
            name: item.payload.name,
            sort_order: item.payload.sortOrder ?? 0,
            updated_at: new Date().toISOString(),
          };

          let { error } = await supabase.from('categories').upsert(payload);

          // Graceful fallback if sort_order column does not exist yet on Supabase PostgREST schema cache
          if (error && (error.message.includes('sort_order') || error.code === 'PGRST204')) {
            delete payload.sort_order;
            const retry = await supabase.from('categories').upsert(payload);
            error = retry.error;
          }

          if (error) {
            console.warn('[SyncEngine] Supabase upsert category notice:', error.message);
            remainingQueue.push(item);
          } else {
            syncedCount++;
          }
        } else if (item.action === 'delete') {
          const { error } = await supabase.from('categories').delete().match({
            name: item.payload.name,
            user_id: session?.userId || 'owner-1',
          });

          if (error) {
            console.warn('[SyncEngine] Supabase delete category notice:', error.message);
            remainingQueue.push(item);
          } else {
            syncedCount++;
          }
        }
      } else if (item.table === 'discounts') {
        if (item.action === 'insert' || item.action === 'update') {
          const userId = item.payload.userId || session?.userId || 'owner-1';
          const storeName = item.payload.storeName || session?.storeName || 'Outlet Resto Utama';
          const payload: any = {
            id: item.payload.id,
            user_id: userId,
            store_name: storeName,
            code: item.payload.code,
            name: item.payload.name,
            scope: item.payload.scope || 'global_coupon',
            type: item.payload.type || 'percentage',
            value: item.payload.value || 0,
            min_purchase: item.payload.minPurchase || 0,
            max_discount: item.payload.maxDiscount || 0,
            applied_product_ids: item.payload.appliedProductIds ? JSON.stringify(item.payload.appliedProductIds) : null,
            description: item.payload.description || '',
            is_active: item.payload.isActive ?? true,
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase.from('discounts').upsert(payload);
          if (error) {
            console.warn('[SyncEngine] Supabase upsert discount notice:', error.message);
            remainingQueue.push(item);
          } else {
            syncedCount++;
          }
        } else if (item.action === 'delete') {
          const { error } = await supabase.from('discounts').delete().eq('id', item.payload.id);
          if (error) {
            console.warn('[SyncEngine] Supabase delete discount notice:', error.message);
            remainingQueue.push(item);
          } else {
            syncedCount++;
          }
        }
      } else if (item.table === 'outlets') {
        if (item.action === 'insert' || item.action === 'update') {
          const { error } = await supabase.from('outlets').upsert({
            id: item.payload.id,
            user_id: item.payload.userId || session?.userId || 'owner-1',
            name: item.payload.name,
            address: item.payload.address || '',
            phone: item.payload.phone || '',
            updated_at: new Date().toISOString(),
          });
          if (error) {
            console.warn('[SyncEngine] Supabase upsert outlet notice:', error.message);
            remainingQueue.push(item);
          } else {
            syncedCount++;
          }
        } else if (item.action === 'delete') {
          const { error } = await supabase.from('outlets').delete().eq('id', item.payload.id);
          if (error) {
            console.warn('[SyncEngine] Supabase delete outlet notice:', error.message);
            remainingQueue.push(item);
          } else {
            syncedCount++;
          }
        }
      } else {
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

// ── PULL DATA FROM SUPABASE TO LOCAL ──
export async function pullRemoteCatalog(): Promise<{ products: any[]; categories: string[]; discounts: any[] } | null> {
  try {
    const session = getActiveSession();
    const userId = session?.userId;

    const [prodRes, catRes, discRes] = await Promise.all([
      userId
        ? supabase.from('products').select('*').eq('user_id', userId)
        : supabase.from('products').select('*'),
      userId
        ? supabase.from('categories').select('*').eq('user_id', userId)
        : supabase.from('categories').select('*'),
      userId
        ? supabase.from('discounts').select('*').eq('user_id', userId)
        : supabase.from('discounts').select('*'),
    ]);

    let remoteProducts: any[] = [];
    let remoteCategories: string[] = [];
    let remoteDiscounts: any[] = [];

    if (prodRes.data && prodRes.data.length > 0) {
      remoteProducts = prodRes.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        sellingPrice: p.selling_price || 0,
        costPrice: p.cost_price || 0,
        stock: p.stock || 0,
        trackStock: p.track_stock ?? false,
        description: p.description || '',
        recipeNote: p.recipe_note || '',
        imageUri: p.image_uri || '',
        iconName: p.icon_name || '',
        colorHex: p.color_hex || '',
        hasVariants: p.has_variants || false,
        variants: typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants || [],
        modifierGroups: typeof p.modifier_groups === 'string' ? JSON.parse(p.modifier_groups) : p.modifier_groups || [],
        availableOutlets: typeof p.available_outlets === 'string' ? JSON.parse(p.available_outlets) : p.available_outlets || ['all'],
        hiddenOutlets: typeof p.hidden_outlets === 'string' ? JSON.parse(p.hidden_outlets) : p.hidden_outlets || [],
      }));
    }

    if (catRes.data && catRes.data.length > 0) {
      const sortedCats = [...catRes.data].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      remoteCategories = sortedCats.map((c: any) => c.name).filter(Boolean);
    }

    if (discRes.data && discRes.data.length > 0) {
      remoteDiscounts = discRes.data.map((d: any) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        scope: d.scope || 'global_coupon',
        type: d.type || 'percentage',
        value: d.value || 0,
        minPurchase: d.min_purchase || 0,
        maxDiscount: d.max_discount || 0,
        appliedProductIds: typeof d.applied_product_ids === 'string' ? JSON.parse(d.applied_product_ids) : d.applied_product_ids || [],
        description: d.description || '',
        isActive: d.is_active ?? true,
        storeName: d.store_name,
        userId: d.user_id,
      }));
    }

    return { products: remoteProducts, categories: remoteCategories, discounts: remoteDiscounts };
  } catch (e) {
    console.warn('[OfflineDB] Error pulling remote catalog:', e);
    return null;
  }
}

export { KEYS };
