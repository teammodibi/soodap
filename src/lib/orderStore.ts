export type Category = 'Semua' | 'Coffee' | 'Non-Coffee' | 'Makanan' | 'Snack' | 'Dessert';

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  stock: number;
  iconName: string;
  iconColor: string;
  imageSource?: any;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  isMember?: boolean;
}

export interface OrderState {
  cart: CartItem[];
  orderType: 'Dine In' | 'Takeaway' | 'Delivery';
  customer: Customer;
  selectedOutlet: string;
  customersList: Customer[];
}

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Pelanggan Umum (Walk-in)', phone: '-', isMember: false },
  { id: '2', name: 'Budi Santoso', phone: '0812-3456-7890', isMember: true },
  { id: '3', name: 'Siti Rahma', phone: '0856-7890-1234', isMember: true },
  { id: '4', name: 'Dimas Anggara', phone: '0878-1234-5678', isMember: false },
];

import { getActiveSession } from './session';

let currentOrderState: OrderState = {
  cart: [],
  orderType: 'Dine In',
  customer: INITIAL_CUSTOMERS[0],
  selectedOutlet: getActiveSession()?.storeName || 'Outlet Saya',
  customersList: INITIAL_CUSTOMERS,
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const orderStore = {
  get: () => currentOrderState,
  set: (newState: Partial<OrderState>) => {
    currentOrderState = { ...currentOrderState, ...newState };
    listeners.forEach(cb => cb());
  },
  subscribe: (cb: Listener) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  clearCart: () => {
    currentOrderState = {
      ...currentOrderState,
      cart: [],
    };
    listeners.forEach(cb => cb());
  },
};
