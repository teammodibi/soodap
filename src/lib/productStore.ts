import { loadFromLocal, saveToLocal, addToSyncQueue, KEYS } from './offlineDb';
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
}

export interface DiscountItem {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed'; // Percentage (e.g. 10%) or Fixed (e.g. Rp 5.000)
  value: number;
  minPurchase?: number;
  isActive: boolean;
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

function loadAllCategories(): string[] {
  const userKey = getUserKeys().categories;
  const c1 = loadFromLocal<string[]>(userKey, []);
  const c2 = loadFromLocal<string[]>(KEYS.CATEGORIES, []);
  const c3 = loadFromLocal<string[]>('soodap_categories_backup', []);

  const set = new Set<string>([...c1, ...c2, ...c3].filter(Boolean));
  return Array.from(set);
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

let state: ProductStoreState = {
  products: loadAllProducts(),
  categories: loadAllCategories(),
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
    const created: ProductItem = { ...product, id: Date.now().toString() };
    state = { ...state, products: [created, ...state.products] };
    persistState();
    addToSyncQueue({ table: 'products', action: 'insert', payload: created });
    listeners.forEach(cb => cb());
    return created;
  },
  updateProduct: (id: string, updatedFields: Partial<Omit<ProductItem, 'id'>>) => {
    state = {
      ...state,
      products: state.products.map(p => (p.id === id ? { ...p, ...updatedFields } : p)),
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
    state = { ...state, categories: [...state.categories, trimmed] };
    persistState();
    listeners.forEach(cb => cb());
    return true;
  },
  deleteCategory: (catName: string) => {
    state = { ...state, categories: state.categories.filter(c => c !== catName) };
    persistState();
    listeners.forEach(cb => cb());
  },
  addDiscount: (discount: Omit<DiscountItem, 'id'>) => {
    const created: DiscountItem = { ...discount, id: Date.now().toString() };
    state = { ...state, discounts: [created, ...state.discounts] };
    persistState();
    listeners.forEach(cb => cb());
    return created;
  },
  toggleDiscount: (id: string) => {
    state = {
      ...state,
      discounts: state.discounts.map(d => (d.id === id ? { ...d, isActive: !d.isActive } : d)),
    };
    persistState();
    listeners.forEach(cb => cb());
  },
  deleteDiscount: (id: string) => {
    state = { ...state, discounts: state.discounts.filter(d => d.id !== id) };
    persistState();
    listeners.forEach(cb => cb());
  },
};
