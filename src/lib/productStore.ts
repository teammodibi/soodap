import { loadFromLocal, saveToLocal, addToSyncQueue, pullRemoteCatalog, KEYS } from './offlineDb';
import { getActiveSession } from './session';

export interface ProductVariant {
  id: string;
  name: string;
  sellingPrice: number;
  costPrice?: number;
  stock?: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelect?: number; // 1 for single select (radio), >1 for multi select (checkbox)
  options: ModifierOption[];
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  costPrice: number; // HPP / Modal
  stock: number;
  trackStock?: boolean; // false = Tanpa Stok (Unlimited), true = Lacak Stok Fisik
  description?: string;
  recipeNote?: string; // Catatan Resep & SOP Pembuatan Dapur (Internal)
  imageUri?: string; // Uri foto menu dari galeri/kamera
  iconName?: string; // Preset icon visual (misal: 'cafe-outline', 'restaurant-outline')
  colorHex?: string; // Warna badge visual (misal: '#FF5722', '#10B981')
  hasVariants?: boolean;
  variants?: ProductVariant[];
  modifierGroups?: ModifierGroup[];
  storeName?: string;
  userId?: string;
  availableOutlets?: string[]; // Array outlet yang menjual menu ini (default: semua)
  hiddenOutlets?: string[]; // Array outlet yang menyembunyikan menu ini
}

export type PromoScope = 'global_coupon' | 'menu_specific' | 'automatic_bill';

export interface DiscountItem {
  id: string;
  code: string;
  name: string;
  scope?: PromoScope; // 'global_coupon' | 'menu_specific' | 'automatic_bill'
  type: 'percentage' | 'fixed'; // Percentage (e.g. 10%) or Fixed (e.g. Rp 5.000)
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  appliedProductIds?: string[];
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  storeName?: string;
  userId?: string;
}

export const INITIAL_PRODUCTS: ProductItem[] = [];

export const INITIAL_CATEGORIES: string[] = [];

export const INITIAL_DISCOUNTS: DiscountItem[] = [];

export interface StockLog {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjust';
  amount: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
}

export interface ProductStoreState {
  products: ProductItem[];
  categories: string[];
  discounts: DiscountItem[];
  stockLogs: StockLog[];
}

function getUserKeys() {
  const session = getActiveSession();
  const userId = session?.userId ? `_${session.userId}` : '';
  return {
    products: `${KEYS.PRODUCTS}${userId}`,
    categories: `${KEYS.CATEGORIES}${userId}`,
    discounts: `${KEYS.DISCOUNTS}${userId}`,
  };
}

function loadAllProducts(): ProductItem[] {
  const userKey = getUserKeys().products;
  const p1 = loadFromLocal<ProductItem[]>(userKey, []);
  const p2 = loadFromLocal<ProductItem[]>(KEYS.PRODUCTS, []);
  const p3 = loadFromLocal<ProductItem[]>('soodap_products_backup', []);
  
  const map = new Map<string, ProductItem>();
  [...p1, ...p2, ...p3].forEach(p => {
    if (p && p.id && p.name) {
      map.set(p.id, p);
    }
  });

  return Array.from(map.values());
}

function loadAllCategories(products?: ProductItem[]): string[] {
  const userKey = getUserKeys().categories;
  const c1 = loadFromLocal<string[]>(userKey, []);
  const c2 = loadFromLocal<string[]>(KEYS.CATEGORIES, []);
  const c3 = loadFromLocal<string[]>('soodap_categories_backup', []);

  const prods = products || loadAllProducts();
  const prodCategories = prods.map(p => p.category).filter(Boolean);

  const initialStored = [...c1, ...c2, ...c3].filter(Boolean);
  const merged = Array.from(new Set([...initialStored, ...prodCategories].filter(Boolean)));

  if (merged.length === 0) {
    return ['Umum', 'Makanan', 'Minuman', 'Snack', 'Coffee'];
  }
  return merged;
}

function loadAllDiscounts(): DiscountItem[] {
  const userKey = getUserKeys().discounts;
  const d1 = loadFromLocal<DiscountItem[]>(userKey, []);
  const d2 = loadFromLocal<DiscountItem[]>(KEYS.DISCOUNTS, []);
  const d3 = loadFromLocal<DiscountItem[]>('soodap_discounts_backup', []);

  const map = new Map<string, DiscountItem>();
  [...d1, ...d2, ...d3].forEach(d => {
    if (d && d.id) {
      map.set(d.id, d);
    }
  });

  return Array.from(map.values());
}

const initialLoadedProducts = loadAllProducts();
let state: ProductStoreState = {
  products: initialLoadedProducts,
  categories: loadAllCategories(initialLoadedProducts),
  discounts: loadAllDiscounts(),
  stockLogs: [],
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function persistState() {
  const userKeys = getUserKeys();

  // Save to User-Scoped Key
  saveToLocal(userKeys.products, state.products);
  saveToLocal(userKeys.categories, state.categories);
  saveToLocal(userKeys.discounts, state.discounts);

  // Save to Global Key
  saveToLocal(KEYS.PRODUCTS, state.products);
  saveToLocal(KEYS.CATEGORIES, state.categories);
  saveToLocal(KEYS.DISCOUNTS, state.discounts);

  // Save to Hard Backup Key
  saveToLocal('soodap_products_backup', state.products);
  saveToLocal('soodap_categories_backup', state.categories);
  saveToLocal('soodap_discounts_backup', state.discounts);
}

export const productStore = {
  get: () => {
    // Auto-recover from backup storage if state in memory is empty
    if (state.products.length === 0) {
      const reloaded = loadAllProducts();
      if (reloaded.length > 0) {
        state.products = reloaded;
        state.categories = loadAllCategories();
        state.discounts = loadAllDiscounts();
      }
    }
    return state;
  },
  reloadFromStorage: () => {
    state = {
      ...state,
      products: loadAllProducts(),
      categories: loadAllCategories(),
      discounts: loadAllDiscounts(),
    };
    listeners.forEach(cb => cb());
  },
  set: (newState: Partial<ProductStoreState>) => {
    state = { ...state, ...newState };
    persistState();
    listeners.forEach(cb => cb());
  },
  subscribe: (cb: Listener) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  addProduct: (product: Omit<ProductItem, 'id'>) => {
    const session = getActiveSession();
    const storeName = product.storeName || session?.storeName || 'Outlet Resto Utama';
    const userId = product.userId || session?.userId || 'owner-1';

    const created: ProductItem = {
      ...product,
      id: Date.now().toString(),
      storeName,
      userId,
    };
    const nextCategories = product.category && !state.categories.includes(product.category)
      ? [...state.categories, product.category]
      : state.categories;

    state = {
      ...state,
      products: [created, ...state.products],
      categories: nextCategories,
    };
    persistState();
    addToSyncQueue({ table: 'products', action: 'insert', payload: created });
    listeners.forEach(cb => cb());
    return created;
  },
  updateProduct: (id: string, updatedFields: Partial<Omit<ProductItem, 'id'>>) => {
    const updatedCategory = updatedFields.category;
    const nextCategories = updatedCategory && !state.categories.includes(updatedCategory)
      ? [...state.categories, updatedCategory]
      : state.categories;

    state = {
      ...state,
      products: state.products.map(p => (p.id === id ? { ...p, ...updatedFields } : p)),
      categories: nextCategories,
    };
    persistState();
    const updatedItem = state.products.find(p => p.id === id);
    if (updatedItem) {
      addToSyncQueue({ table: 'products', action: 'update', payload: updatedItem });
    }
    listeners.forEach(cb => cb());
  },
  deleteProduct: (id: string) => {
    state = {
      ...state,
      products: state.products.filter(p => p.id !== id),
    };
    persistState();
    addToSyncQueue({ table: 'products', action: 'delete', payload: { id } });
    listeners.forEach(cb => cb());
  },
  updateStock: (id: string, delta: number) => {
    state = {
      ...state,
      products: state.products.map(p => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)),
    };
    persistState();
    listeners.forEach(cb => cb());
  },
  adjustStockWithLog: (productId: string, type: 'in' | 'out' | 'adjust', amount: number, reason: string) => {
    const prod = state.products.find(p => p.id === productId);
    if (!prod) return;

    const previousStock = prod.stock;
    let newStock = previousStock;

    if (type === 'in') {
      newStock = previousStock + amount;
    } else if (type === 'out') {
      newStock = Math.max(0, previousStock - amount);
    } else if (type === 'adjust') {
      newStock = Math.max(0, amount);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const timestamp = `${dateStr}, ${timeStr}`;

    const newLog: StockLog = {
      id: Date.now().toString(),
      productId,
      type,
      amount,
      previousStock,
      newStock,
      reason: reason.trim() || (type === 'in' ? 'Restok Masuk' : type === 'out' ? 'Penyesuaian Keluar' : 'Koreksi Stok'),
      timestamp,
    };

    state = {
      ...state,
      products: state.products.map(p => (p.id === productId ? { ...p, stock: newStock } : p)),
      stockLogs: [newLog, ...(state.stockLogs || [])],
    };

    persistState();
    listeners.forEach(cb => cb());
  },
  addCategory: (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed || state.categories.includes(trimmed)) return false;
    const nextCategories = [...state.categories, trimmed];
    state = { ...state, categories: nextCategories };
    persistState();
    const session = getActiveSession();
    const storeName = session?.storeName || 'Outlet Resto Utama';
    const userId = session?.userId || 'owner-1';
    addToSyncQueue({
      table: 'categories',
      action: 'insert',
      payload: { name: trimmed, sortOrder: nextCategories.length - 1, storeName, userId },
    });
    listeners.forEach(cb => cb());
    return true;
  },
  moveCategory: (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= state.categories.length || toIndex >= state.categories.length) {
      return false;
    }
    const updated = [...state.categories];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    state = { ...state, categories: updated };
    persistState();

    const session = getActiveSession();
    const storeName = session?.storeName || 'Outlet Resto Utama';
    const userId = session?.userId || 'owner-1';

    updated.forEach((catName, idx) => {
      addToSyncQueue({
        table: 'categories',
        action: 'insert',
        payload: { name: catName, sortOrder: idx, storeName, userId },
      });
    });

    listeners.forEach(cb => cb());
    return true;
  },
  reorderCategories: (newCategories: string[]) => {
    state = { ...state, categories: newCategories };
    persistState();

    const session = getActiveSession();
    const storeName = session?.storeName || 'Outlet Resto Utama';
    const userId = session?.userId || 'owner-1';

    newCategories.forEach((catName, idx) => {
      addToSyncQueue({
        table: 'categories',
        action: 'insert',
        payload: { name: catName, sortOrder: idx, storeName, userId },
      });
    });

    listeners.forEach(cb => cb());
  },
  renameCategory: (oldName: string, newName: string) => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedOld === trimmedNew) return false;
    if (state.categories.includes(trimmedNew)) return false;

    const session = getActiveSession();
    const storeName = session?.storeName || 'Outlet Resto Utama';
    const userId = session?.userId || 'owner-1';

    const updatedCategories = state.categories.map(c => (c === trimmedOld ? trimmedNew : c));
    const updatedProducts = state.products.map(p => (p.category === trimmedOld ? { ...p, category: trimmedNew } : p));

    state = {
      ...state,
      categories: updatedCategories,
      products: updatedProducts,
    };
    persistState();

    const newIndex = updatedCategories.indexOf(trimmedNew);
    addToSyncQueue({
      table: 'categories',
      action: 'delete',
      payload: { name: trimmedOld, storeName, userId },
    });
    addToSyncQueue({
      table: 'categories',
      action: 'insert',
      payload: { name: trimmedNew, sortOrder: newIndex, storeName, userId },
    });

    updatedProducts.filter(p => p.category === trimmedNew).forEach(p => {
      addToSyncQueue({
        table: 'products',
        action: 'update',
        payload: p,
      });
    });

    listeners.forEach(cb => cb());
    return true;
  },
  deleteCategory: (catName: string) => {
    const session = getActiveSession();
    const storeName = session?.storeName || 'Outlet Resto Utama';
    const userId = session?.userId || 'owner-1';

    const updatedProducts = state.products.map(p => (p.category === catName ? { ...p, category: 'Umum' } : p));
    const updatedCategories = state.categories.filter(c => c !== catName);

    state = {
      ...state,
      categories: updatedCategories,
      products: updatedProducts,
    };
    persistState();

    addToSyncQueue({
      table: 'categories',
      action: 'delete',
      payload: { name: catName, storeName, userId },
    });

    updatedProducts.filter(p => p.category === 'Umum').forEach(p => {
      addToSyncQueue({
        table: 'products',
        action: 'update',
        payload: p,
      });
    });

    listeners.forEach(cb => cb());
  },
  toggleHideProductForOutlet: (productId: string, outletName: string) => {
    state = {
      ...state,
      products: state.products.map(p => {
        if (p.id !== productId) return p;
        const currentHidden = p.hiddenOutlets || [];
        const isHidden = currentHidden.includes(outletName);
        const updatedHidden = isHidden
          ? currentHidden.filter(o => o !== outletName)
          : [...currentHidden, outletName];
        return { ...p, hiddenOutlets: updatedHidden };
      }),
    };
    persistState();
    const updatedProd = state.products.find(p => p.id === productId);
    if (updatedProd) {
      addToSyncQueue({ table: 'products', action: 'update', payload: updatedProd });
    }
    listeners.forEach(cb => cb());
  },
  syncWithSupabase: async () => {
    try {
      const remote = await pullRemoteCatalog();
      if (!remote) return;

      let changed = false;

      // Merge remote categories
      if (remote.categories && remote.categories.length > 0) {
        const mergedCategories = Array.from(new Set([...state.categories, ...remote.categories].filter(Boolean)));
        if (mergedCategories.length !== state.categories.length) {
          state.categories = mergedCategories;
          changed = true;
        }
      }

      // Merge remote products
      if (remote.products && remote.products.length > 0) {
        const productMap = new Map<string, ProductItem>();
        // Add remote products first
        remote.products.forEach(p => {
          if (p && p.id) productMap.set(p.id, p);
        });
        // Override / keep local products (offline-first priority)
        state.products.forEach(p => {
          if (p && p.id) productMap.set(p.id, p);
        });

        const mergedProducts = Array.from(productMap.values());
        if (mergedProducts.length !== state.products.length) {
          state.products = mergedProducts;
          changed = true;
        }
      }

      // Merge remote discounts
      if (remote.discounts && remote.discounts.length > 0) {
        const discountMap = new Map<string, DiscountItem>();
        // Add remote discounts first
        remote.discounts.forEach(d => {
          if (d && d.id) discountMap.set(d.id, d);
        });
        // Override / keep local discounts (offline-first priority)
        state.discounts.forEach(d => {
          if (d && d.id) discountMap.set(d.id, d);
        });

        const mergedDiscounts = Array.from(discountMap.values());
        if (mergedDiscounts.length !== state.discounts.length) {
          state.discounts = mergedDiscounts;
          changed = true;
        }
      }

      if (changed) {
        persistState();
        listeners.forEach(cb => cb());
      }
    } catch (e) {
      console.warn('[ProductStore] Remote sync warning:', e);
    }
  },
  addDiscount: (discount: Omit<DiscountItem, 'id'>) => {
    const session = getActiveSession();
    const storeName = session?.storeName || 'Outlet Resto Utama';
    const userId = session?.userId || 'owner-1';
    const created: DiscountItem = { ...discount, id: Date.now().toString(), storeName, userId };
    state = { ...state, discounts: [created, ...state.discounts] };
    persistState();
    addToSyncQueue({ table: 'discounts', action: 'insert', payload: created });
    listeners.forEach(cb => cb());
    return created;
  },
  updateDiscount: (id: string, updatedFields: Partial<Omit<DiscountItem, 'id'>>) => {
    state = {
      ...state,
      discounts: state.discounts.map(d => (d.id === id ? { ...d, ...updatedFields } : d)),
    };
    persistState();
    const updatedDisc = state.discounts.find(d => d.id === id);
    if (updatedDisc) {
      addToSyncQueue({ table: 'discounts', action: 'update', payload: updatedDisc });
    }
    listeners.forEach(cb => cb());
  },
  toggleDiscount: (id: string) => {
    state = {
      ...state,
      discounts: state.discounts.map(d => (d.id === id ? { ...d, isActive: !d.isActive } : d)),
    };
    persistState();
    const updatedDisc = state.discounts.find(d => d.id === id);
    if (updatedDisc) {
      addToSyncQueue({ table: 'discounts', action: 'update', payload: updatedDisc });
    }
    listeners.forEach(cb => cb());
  },
  deleteDiscount: (id: string) => {
    state = { ...state, discounts: state.discounts.filter(d => d.id !== id) };
    persistState();
    addToSyncQueue({ table: 'discounts', action: 'delete', payload: { id } });
    listeners.forEach(cb => cb());
  },
};

// Background initial sync from Supabase when connected
setTimeout(() => {
  productStore.syncWithSupabase();
}, 1000);
