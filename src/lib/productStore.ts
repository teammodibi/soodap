import { loadFromLocal, saveToLocal, KEYS } from './offlineDb';

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

export const INITIAL_CATEGORIES: string[] = [
  'Coffee', 'Non-Coffee', 'Makanan', 'Snack', 'Dessert'
];

export const INITIAL_DISCOUNTS: DiscountItem[] = [
  { id: '1', code: 'PROMO10', name: 'Diskon Member 10%', type: 'percentage', value: 10, minPurchase: 50000, isActive: true },
  { id: '2', code: 'HEMAT5K', name: 'Potongan Rp 5.000', type: 'fixed', value: 5000, minPurchase: 30000, isActive: true },
];

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

const loadedProducts = loadFromLocal<ProductItem[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
const loadedCategories = loadFromLocal<string[]>(KEYS.CATEGORIES, INITIAL_CATEGORIES);
const loadedDiscounts = loadFromLocal<DiscountItem[]>(KEYS.DISCOUNTS, INITIAL_DISCOUNTS);

let state: ProductStoreState = {
  products: loadedProducts,
  categories: loadedCategories,
  discounts: loadedDiscounts,
  stockLogs: [],
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function persistState() {
  saveToLocal(KEYS.PRODUCTS, state.products);
  saveToLocal(KEYS.CATEGORIES, state.categories);
  saveToLocal(KEYS.DISCOUNTS, state.discounts);
}

export const productStore = {
  get: () => state,
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
    listeners.forEach(cb => cb());
    return created;
  },
  updateProduct: (id: string, updatedFields: Partial<Omit<ProductItem, 'id'>>) => {
    state = {
      ...state,
      products: state.products.map(p => (p.id === id ? { ...p, ...updatedFields } : p)),
    };
    persistState();
    listeners.forEach(cb => cb());
  },
  deleteProduct: (id: string) => {
    state = {
      ...state,
      products: state.products.filter(p => p.id !== id),
    };
    persistState();
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
