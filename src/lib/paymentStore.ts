export interface PaymentMethodItem {
  id: string;
  name: string;
  type: 'Tunai' | 'QRIS' | 'EDC' | 'Transfer' | 'E-Wallet';
  description?: string;
  iconName: string;
  iconColor: string;
  isActive: boolean;
  accountNumber?: string;
  accountName?: string;
}

export const INITIAL_PAYMENT_METHODS: PaymentMethodItem[] = [
  { id: '1', name: 'Tunai', type: 'Tunai', description: 'Uang Tunai / Cash Pas & Kembalian', iconName: 'cash-outline', iconColor: '#10B981', isActive: true },
  { id: '2', name: 'QRIS Statis / Dinamis', type: 'QRIS', description: 'GoPay, OVO, Dana, ShopeePay, LinkAja & Mobile Banking', iconName: 'qr-code-outline', iconColor: '#FF5722', isActive: true },
  { id: '3', name: 'Mesin EDC Bank', type: 'EDC', description: 'Kartu Debit & Kredit Mandiri, BCA, BRI', iconName: 'card-outline', iconColor: '#3B82F6', isActive: true },
  { id: '4', name: 'Transfer Bank Direct', type: 'Transfer', description: 'BCA 892-019-2341 a.n Soodap Resto', iconName: 'swap-horizontal-outline', iconColor: '#8B5CF6', isActive: true, accountNumber: '892-019-2341', accountName: 'Soodap Resto' },
  { id: '5', name: 'E-Wallet Transfer', type: 'E-Wallet', description: 'Pembayaran dompet digital kasir', iconName: 'wallet-outline', iconColor: '#EC4899', isActive: false },
];

let state: PaymentMethodItem[] = INITIAL_PAYMENT_METHODS;

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const paymentStore = {
  get: () => state,
  subscribe: (cb: Listener) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  getActiveMethods: () => state.filter(m => m.isActive),
  toggleMethod: (id: string) => {
    state = state.map(m => (m.id === id ? { ...m, isActive: !m.isActive } : m));
    listeners.forEach(cb => cb());
  },
  addMethod: (method: Omit<PaymentMethodItem, 'id' | 'isActive'>) => {
    const created: PaymentMethodItem = {
      ...method,
      id: Date.now().toString(),
      isActive: true,
    };
    state = [...state, created];
    listeners.forEach(cb => cb());
    return created;
  },
  deleteMethod: (id: string) => {
    state = state.filter(m => m.id !== id);
    listeners.forEach(cb => cb());
  },
};
