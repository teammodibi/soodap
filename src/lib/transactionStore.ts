import { loadFromLocal, saveToLocal, addToSyncQueue, KEYS } from './offlineDb';
import { getActiveSession } from './session';

export interface TransactionItem {
  id: string;
  storeName?: string;
  orderType: 'Dine In' | 'Takeaway' | 'Delivery';
  customerName: string;
  customerPhone?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
    note?: string;
  }[];
  subtotal: number;
  discountName?: string;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paidAmount: number;
  changeAmount: number;
  status: 'Completed' | 'Open Bill' | 'Refunded' | 'Void';
  cashierName: string;
  timestamp: string;
}

export const INITIAL_TRANSACTIONS: TransactionItem[] = [];

let state: TransactionItem[] = loadFromLocal<TransactionItem[]>(KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function persistTransactions() {
  saveToLocal(KEYS.TRANSACTIONS, state);
}

export const transactionStore = {
  get: () => state,
  subscribe: (cb: Listener) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  addTransaction: (trx: Omit<TransactionItem, 'id' | 'timestamp'>) => {
    const session = getActiveSession();
    const storeName = trx.storeName || session?.storeName || 'Ayam Kelawas';
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const created: TransactionItem = {
      ...trx,
      storeName,
      id: `NOTA-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: `${dateStr}, ${timeStr}`,
    };
    state = [created, ...state];
    persistTransactions();

    // Enqueue for background sync to Supabase
    addToSyncQueue({
      table: 'transactions',
      action: 'insert',
      payload: created,
    });

    listeners.forEach(cb => cb());
    return created;
  },
  voidTransaction: (id: string) => {
    state = state.map(t => (t.id === id ? { ...t, status: 'Void' as const } : t));
    persistTransactions();
    listeners.forEach(cb => cb());
  },
  settleOpenBill: (id: string, paymentMethod: string, paidAmount: number) => {
    state = state.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'Completed' as const,
          paymentMethod,
          paidAmount,
          changeAmount: Math.max(0, paidAmount - t.totalAmount),
        };
      }
      return t;
    });
    persistTransactions();
    listeners.forEach(cb => cb());
  },
};
