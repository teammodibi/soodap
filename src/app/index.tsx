import { useState, useRef, useEffect } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView, Spinner } from 'tamagui';
import { useRouter } from 'expo-router';
import {
  Alert,
  Image,
  TouchableOpacity,
  View,
  Platform,
  useWindowDimensions,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { clearActiveSession, getActiveSession } from '../lib/session';
import { showAlert as triggerGlobalAlert } from '../lib/alertStore';
import { orderStore } from '../lib/orderStore';
import { transactionStore } from '../lib/transactionStore';
import { productStore, ProductItem } from '../lib/productStore';

// Data Types
type Category = 'Semua' | 'Coffee' | 'Non-Coffee' | 'Makanan' | 'Snack' | 'Dessert';
type OrderType = 'Dine In' | 'Takeaway' | 'Delivery';
type NavTab = 'pos' | 'cart' | 'summary' | 'kds';

interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  stock: number;
  iconName: string;
  iconColor: string;
  imageSource?: any;
}

interface CartItem {
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

const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Pelanggan Umum (Walk-in)', phone: '-', isMember: false },
  { id: '2', name: 'Budi Santoso', phone: '0812-3456-7890', isMember: true },
  { id: '3', name: 'Siti Rahma', phone: '0856-7890-1234', isMember: true },
  { id: '4', name: 'Dimas Anggara', phone: '0878-1234-5678', isMember: false },
];

// Products from productStore
const SAMPLE_MENU: MenuItem[] = [];

const CATEGORIES: Category[] = ['Semua', 'Coffee', 'Non-Coffee', 'Makanan', 'Snack', 'Dessert'];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Reactive Product Store State
  const [productState, setProductState] = useState(productStore.get());

  useEffect(() => {
    const unsubscribe = productStore.subscribe(() => {
      setProductState(productStore.get());
    });
    return unsubscribe;
  }, []);

  const menuItems: MenuItem[] = (productState.products || []).map((p: ProductItem) => ({
    id: p.id,
    name: p.name,
    category: p.category as any,
    price: p.sellingPrice,
    stock: p.stock,
    iconName: 'restaurant-outline',
    iconColor: '#FF5722',
  }));

  function setMenuItems(updater: (prev: MenuItem[]) => MenuItem[]) {
    // Adapter if needed for stock updates
  }

  // State Management
  const [activeTab, setActiveTab] = useState<NavTab>('pos');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('Dine In');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'EDC' | 'Transfer'>('Tunai');
  const [cashAmount, setCashAmount] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = orderStore.subscribe(() => {
      const state = orderStore.get();
      setCart(state.cart);
      setOrderType(state.orderType);
      setSelectedCustomer(state.customer);
    });
    return unsubscribe;
  }, []);

  // Stock Replenishment State
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<MenuItem | null>(null);
  const [additionalStockInput, setAdditionalStockInput] = useState('');
  const stockSlideAnim = useRef(new Animated.Value(500)).current;

  // Direct Quantity Edit State
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [selectedQtyItem, setSelectedQtyItem] = useState<CartItem | MenuItem | null>(null);
  const [qtyInputText, setQtyInputText] = useState('');
  const qtySlideAnim = useRef(new Animated.Value(500)).current;

  // Custom Alert Modal State
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    type?: 'warning' | 'error' | 'success' | 'info' | 'confirm';
    iconName?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBgColor?: string;
    title: string;
    message: string;
    buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
  }>({
    visible: false,
    title: '',
    message: '',
  });

  function showAlert(config: {
    type?: 'warning' | 'error' | 'success' | 'info' | 'confirm';
    iconName?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBgColor?: string;
    title: string;
    message: string;
    buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
  }) {
    setCustomAlert({
      ...config,
      visible: true,
    });
  }

  function closeAlert() {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  }

  // Outlet Management State
  const initialSession = getActiveSession();
  const initialStoreName = initialSession?.storeName || 'Outlet Resto Saya';

  const [outlets, setOutlets] = useState([
    { id: '1', name: initialStoreName, address: initialSession?.address || 'Alamat Utama Outlet Resto' },
  ]);
  const [selectedOutlet, setSelectedOutlet] = useState(initialStoreName);
  const [outletModalVisible, setOutletModalVisible] = useState(false);
  const [isAddingOutlet, setIsAddingOutlet] = useState(false);
  const [newOutletName, setNewOutletName] = useState('');
  const [newOutletAddress, setNewOutletAddress] = useState('');

  // Shift Recap SubTab State
  const [recapSubTab, setRecapSubTab] = useState<'sales' | 'expenses'>('sales');
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(INITIAL_CUSTOMERS[0]);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerIsMember, setNewCustomerIsMember] = useState(false);

  // Animation Refs
  const outletSlideAnim = useRef(new Animated.Value(500)).current;
  const paymentSlideAnim = useRef(new Animated.Value(500)).current;
  const customerSlideAnim = useRef(new Animated.Value(500)).current;

  function openCustomerModal() {
    setIsAddingCustomer(false);
    setCustomerSearchQuery('');
    setCustomerModalVisible(true);
    customerSlideAnim.setValue(500);
    Animated.spring(customerSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function closeCustomerModal(onComplete?: () => void) {
    Animated.timing(customerSlideAnim, {
      toValue: 500,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCustomerModalVisible(false);
      if (onComplete) onComplete();
    });
  }

  function handleSaveNewCustomer() {
    if (!newCustomerName.trim()) {
      showAlert({
        type: 'warning',
        iconName: 'alert-circle',
        iconColor: '#F59E0B',
        iconBgColor: '#FEF3C7',
        title: 'Perhatian',
        message: 'Nama pelanggan tidak boleh kosong.',
      });
      return;
    }
    const created: Customer = {
      id: Date.now().toString(),
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || '-',
      isMember: newCustomerIsMember,
    };
    setCustomers(prev => [created, ...prev]);
    setSelectedCustomer(created);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerIsMember(false);
    setIsAddingCustomer(false);
    closeCustomerModal(() => {
      showAlert({
        type: 'success',
        iconName: 'person-add-outline',
        iconColor: '#10B981',
        iconBgColor: '#E8FFF1',
        title: 'Pelanggan Ditambahkan! 🎉',
        message: `Pelanggan "${created.name}" berhasil dibuat dan dipilih untuk transaksi ini.`,
      });
    });
  }

  function openStockModal(item: MenuItem) {
    setSelectedStockItem(item);
    setAdditionalStockInput('');
    setStockModalVisible(true);
    stockSlideAnim.setValue(500);
    Animated.spring(stockSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function closeStockModal(onComplete?: () => void) {
    Animated.timing(stockSlideAnim, {
      toValue: 500,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStockModalVisible(false);
      setSelectedStockItem(null);
      if (onComplete) onComplete();
    });
  }

  function handleSaveStock(autoAdd: boolean = false) {
    if (!selectedStockItem) return;
    const addedQty = parseInt(additionalStockInput) || 0;
    if (addedQty <= 0) {
      showAlert({
        type: 'warning',
        iconName: 'alert-circle',
        iconColor: '#F59E0B',
        iconBgColor: '#FEF3C7',
        title: 'Perhatian',
        message: 'Masukkan jumlah stok tambahan yang valid (minimal 1).',
      });
      return;
    }
    const updatedStock = selectedStockItem.stock + addedQty;
    const updatedItem = { ...selectedStockItem, stock: updatedStock };

    productStore.updateStock(selectedStockItem.id, addedQty);

    setCart(prevCart =>
      prevCart.map(ci =>
        ci.menuItem.id === selectedStockItem.id
          ? { ...ci, menuItem: updatedItem }
          : ci
      )
    );

    closeStockModal(() => {
      showAlert({
        type: 'success',
        iconName: 'cube-outline',
        iconColor: '#FF5722',
        iconBgColor: '#FFF3E0',
        title: 'Stok Diperbaharui! 🎉',
        message: `Stok ${updatedItem.name} ditambah ${addedQty}. Stok saat ini: ${updatedItem.stock}.`,
        buttons: [
          {
            text: 'Selesai',
            style: 'default',
            onPress: () => {
              if (autoAdd) addToCart(updatedItem);
            },
          },
        ],
      });
    });
  }

  function promptStockUpdate(item: MenuItem, title: string, message: string) {
    showAlert({
      type: 'warning',
      iconName: 'alert-circle',
      iconColor: '#FF5722',
      iconBgColor: '#FFF3E0',
      title,
      message,
      buttons: [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Perbaharui Stok',
          style: 'default',
          onPress: () => openStockModal(item),
        },
      ],
    });
  }

  function openQtyModal(item: MenuItem | CartItem) {
    const menuItem = 'menuItem' in item ? item.menuItem : item;
    const currentCartItem = cart.find(ci => ci.menuItem.id === menuItem.id);
    const initialQty = currentCartItem ? currentCartItem.quantity : 1;

    setSelectedQtyItem(currentCartItem || menuItem);
    setQtyInputText(initialQty.toString());
    setQtyModalVisible(true);
    qtySlideAnim.setValue(500);
    Animated.spring(qtySlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function closeQtyModal(onComplete?: () => void) {
    Animated.timing(qtySlideAnim, {
      toValue: 500,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setQtyModalVisible(false);
      setSelectedQtyItem(null);
      if (onComplete) onComplete();
    });
  }

  function setCartQuantity(itemId: string, targetQty: number) {
    const currentMenu = menuItems.find(m => m.id === itemId);
    if (!currentMenu) return;

    if (targetQty <= 0) {
      setCart(prev => prev.filter(ci => ci.menuItem.id !== itemId));
      return;
    }

    if (currentMenu.stock <= 0) {
      promptStockUpdate(
        currentMenu,
        'Stok Habis! 🚫',
        `Stok untuk "${currentMenu.name}" saat ini 0. Harap perbaharui stok.`
      );
      return;
    }

    if (targetQty > currentMenu.stock) {
      showAlert({
        type: 'warning',
        iconName: 'alert-circle',
        iconColor: '#FF5722',
        iconBgColor: '#FFF3E0',
        title: 'Batas Stok Tercapai! ⚠️',
        message: `Stok yang tersedia untuk "${currentMenu.name}" hanya ${currentMenu.stock} item. Ingin menyesuaikan kuantitas ke ${currentMenu.stock} atau perbaharui stok?`,
        buttons: [
          {
            text: `Atur Max (${currentMenu.stock})`,
            style: 'cancel',
            onPress: () => {
              setCart(prevCart => {
                const existingIndex = prevCart.findIndex(ci => ci.menuItem.id === itemId);
                if (existingIndex > -1) {
                  const updated = [...prevCart];
                  updated[existingIndex].quantity = currentMenu.stock;
                  return updated;
                }
                return [...prevCart, { menuItem: currentMenu, quantity: currentMenu.stock }];
              });
            },
          },
          {
            text: 'Perbaharui Stok',
            style: 'default',
            onPress: () => openStockModal(currentMenu),
          },
        ],
      });
      return;
    }

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(ci => ci.menuItem.id === itemId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity = targetQty;
        return updated;
      }
      return [...prevCart, { menuItem: currentMenu, quantity: targetQty }];
    });
  }

  function handleSaveQuantity() {
    if (!selectedQtyItem) return;
    const itemId = 'menuItem' in selectedQtyItem ? selectedQtyItem.menuItem.id : selectedQtyItem.id;
    const targetQty = parseInt(qtyInputText) || 0;

    closeQtyModal(() => {
      setCartQuantity(itemId, targetQty);
    });
  }

  function openOutletModal() {
    setIsAddingOutlet(false);
    setOutletModalVisible(true);
    outletSlideAnim.setValue(500);
    Animated.spring(outletSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function closeOutletModal(onComplete?: () => void) {
    Animated.timing(outletSlideAnim, {
      toValue: 500,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setOutletModalVisible(false);
      if (onComplete) onComplete();
    });
  }

  function openPaymentModal() {
    if (cart.length === 0) return;
    orderStore.set({
      cart,
      orderType,
      customer: selectedCustomer,
      selectedOutlet,
    });
    router.push('/payment');
  }

  function closePaymentModal(onComplete?: () => void) {
    Animated.timing(paymentSlideAnim, {
      toValue: 500,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setPaymentModalVisible(false);
      if (onComplete) onComplete();
    });
  }

  function handleAddOutlet() {
    if (!newOutletName.trim()) {
      showAlert({
        type: 'warning',
        iconName: 'alert-circle',
        iconColor: '#F59E0B',
        iconBgColor: '#FEF3C7',
        title: 'Perhatian',
        message: 'Nama outlet tidak boleh kosong.',
      });
      return;
    }
    const newObj = {
      id: Date.now().toString(),
      name: newOutletName.trim(),
      address: newOutletAddress.trim() || 'Alamat belum diatur',
    };
    setOutlets(prev => [...prev, newObj]);
    setSelectedOutlet(newObj.name);
    setNewOutletName('');
    setNewOutletAddress('');
    setIsAddingOutlet(false);
    closeOutletModal(() => {
      showAlert({
        type: 'success',
        iconName: 'checkmark-circle-outline',
        iconColor: '#10B981',
        iconBgColor: '#E8FFF1',
        title: 'Berhasil! 🎉',
        message: `Outlet "${newObj.name}" berhasil ditambahkan dan dipilih.`,
      });
    });
  }

  // Sidebar Animation
  const sidebarAnim = useRef(new Animated.Value(-280)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  function openSidebar() {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.spring(sidebarAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }

  function closeSidebar() {
    Animated.parallel([
      Animated.spring(sidebarAnim, { toValue: -280, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSidebarOpen(false));
  }

  // Logout Handler
  async function handleLogout() {
    (globalThis as any).isBypassed = false;
    clearActiveSession();
    await supabase.auth.signOut();
    router.replace('/login');
  }

  function confirmLogout() {
    closeSidebar();
    setTimeout(() => {
      triggerGlobalAlert(
        'Keluar Akun 🚪',
        'Apakah Anda yakin ingin keluar dari aplikasi Soodap POS?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Keluar',
            style: 'destructive',
            onPress: handleLogout,
          },
        ],
        'confirm'
      );
    }, 250);
  }

  // Cart Functions
  function addToCart(item: MenuItem) {
    const currentItem = menuItems.find(m => m.id === item.id) || item;
    const existingIndex = cart.findIndex(ci => ci.menuItem.id === currentItem.id);
    const qtyInCart = existingIndex > -1 ? cart[existingIndex].quantity : 0;

    if (currentItem.stock <= 0) {
      promptStockUpdate(
        currentItem,
        'Stok Habis! 🚫',
        `Stok untuk "${currentItem.name}" saat ini habis (0). Harap perbaharui stok jika mau dimasukkan ke keranjang.`
      );
      return;
    }

    if (qtyInCart >= currentItem.stock) {
      promptStockUpdate(
        currentItem,
        'Batas Stok Tercapai! ⚠️',
        `Jumlah "${currentItem.name}" di keranjang sudah mencapai batas stok (${currentItem.stock} item). Harap perbaharui stok jika ingin menambah lagi.`
      );
      return;
    }

    setCart(prevCart => {
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prevCart, { menuItem: currentItem, quantity: 1 }];
    });
  }

  function updateQuantity(itemId: string, delta: number) {
    const currentItem = menuItems.find(m => m.id === itemId);
    const existingIndex = cart.findIndex(ci => ci.menuItem.id === itemId);
    const qtyInCart = existingIndex > -1 ? cart[existingIndex].quantity : 0;

    if (delta > 0 && currentItem) {
      if (currentItem.stock <= 0) {
        promptStockUpdate(
          currentItem,
          'Stok Habis! 🚫',
          `Stok untuk "${currentItem.name}" saat ini habis (0). Harap perbaharui stok jika mau dimasukkan ke keranjang.`
        );
        return;
      }
      if (qtyInCart >= currentItem.stock) {
        promptStockUpdate(
          currentItem,
          'Batas Stok Tercapai! ⚠️',
          `Jumlah "${currentItem.name}" di keranjang sudah mencapai batas stok (${currentItem.stock} item). Harap perbaharui stok jika ingin menambah lagi.`
        );
        return;
      }
    }

    setCart(prevCart => {
      return prevCart
        .map(ci => {
          if (ci.menuItem.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  }

  function clearCart() {
    if (cart.length === 0) return;
    showAlert({
      type: 'confirm',
      iconName: 'trash-bin-outline',
      iconColor: '#EF4444',
      iconBgColor: '#FEE2E2',
      title: 'Kosongkan Keranjang?',
      message: 'Apakah Anda yakin ingin menghapus semua item dari keranjang pesanan?',
      buttons: [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Kosongkan',
          style: 'destructive',
          onPress: () => setCart([]),
        },
      ],
    });
  }

  // Calculations
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const taxAndService = Math.round(subtotal * 0.1); // 10% tax
  const grandTotal = subtotal + taxAndService;

  // Filtered Menu Items
  const filteredMenu = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle Payment Finish
  function handleProcessPayment() {
    const cashNum = parseInt(cashAmount) || 0;
    
    // Validation for cash payment method
    if (paymentMethod === 'Tunai' && cashNum < grandTotal) {
      const shortage = grandTotal - cashNum;
      showAlert({
        type: 'warning',
        iconName: 'alert-circle',
        iconColor: '#EF4444',
        iconBgColor: '#FEE2E2',
        title: 'Uang Tunai Kurang! ⚠️',
        message: `Uang yang dimasukkan (Rp ${cashNum.toLocaleString('id-ID')}) kurang Rp ${shortage.toLocaleString('id-ID')} dari total pembayaran (Rp ${grandTotal.toLocaleString('id-ID')}).`,
      });
      return;
    }

    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      // Deduct stock based on purchased items
      cart.forEach(ci => {
        productStore.updateStock(ci.menuItem.id, -ci.quantity);
      });

      const changeAmount = paymentMethod === 'Tunai' ? Math.max(0, cashNum - grandTotal) : 0;
      const custName = selectedCustomer.name;

      // Add to transactionStore
      transactionStore.addTransaction({
        orderType,
        customerName: custName,
        customerPhone: selectedCustomer.phone,
        items: cart.map(ci => ({
          name: ci.menuItem.name,
          quantity: ci.quantity,
          price: ci.menuItem.price,
          subtotal: ci.menuItem.price * ci.quantity,
          note: ci.note,
        })),
        subtotal,
        discountName: undefined,
        discountAmount: 0,
        taxAmount: taxAndService,
        totalAmount: grandTotal,
        paymentMethod,
        paidAmount: paymentMethod === 'Tunai' ? cashNum : grandTotal,
        changeAmount,
        status: 'Completed',
        cashierName: 'Kasir 1',
      });

      closePaymentModal(() => {
        setCart([]);
        setCashAmount('');
        setRefNumber('');
        setPaymentMethod('Tunai');
        setActiveTab('pos');
        showAlert({
          type: 'success',
          iconName: 'checkmark-done-circle-outline',
          iconColor: '#10B981',
          iconBgColor: '#E8FFF1',
          title: 'Transaksi Berhasil! 🎉',
          message: `Pelanggan: ${custName}\nMetode: ${paymentMethod}${paymentMethod === 'Tunai' ? `\nKembalian: Rp ${changeAmount.toLocaleString('id-ID')}` : ''}\n\nStok produk telah diperbaharui & pesanan dikirim ke dapur.`,
        });
      });
    }, 1200);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <YStack f={1} backgroundColor="#FAFAFA">
        
        {/* ── TOP BRAND BAR (ULTRA CLEAN & UNCLUTTERED) ── */}
        <XStack 
          backgroundColor="white" 
          px={16}
          pt={Platform.OS === 'ios' ? insets.top : Math.max(insets.top + 6, 12)}
          pb={10}
          ai="center" 
          jc="space-between" 
          borderBottomWidth={1} 
          borderColor="#E4E4E7"
        >
          {/* Left: Hamburger + Logo */}
          <XStack ai="center" gap={10}>
            <TouchableOpacity
              onPress={openSidebar}
              style={{ padding: 4 }}
            >
              <Ionicons name="menu" size={24} color="#18181B" />
            </TouchableOpacity>

            <Image
              source={require('../../assets/images/logo.png')}
              style={{ width: 110, height: 34, resizeMode: 'contain' }}
            />
          </XStack>

          {/* Top Right: Neutral & Easy to click Riwayat Pesanan button */}
          <TouchableOpacity
            onPress={() => router.push('/transactions')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              backgroundColor: '#F4F4F5',
              borderWidth: 1,
              borderColor: '#E4E4E7',
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="receipt-outline" size={17} color="#3F3F46" />
            <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#18181B">
              Riwayat Pesanan
            </Text>
          </TouchableOpacity>
        </XStack>

        {/* ── MAIN CONTENT AREA ── */}
        <YStack f={1}>

          {/* 1. KATALOG POS VIEW */}
          {activeTab === 'pos' && (
            <XStack f={1}>
              {/* Product Catalog */}
              <YStack f={1} p={14} gap={10}>
                
                {/* Search Bar */}
                <XStack gap={8} ai="center">
                  <XStack
                    f={1}
                    backgroundColor="white"
                    br={10}
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    px={12}
                    height={40}
                    ai="center"
                  >
                    <Ionicons name="search" size={16} color="#A1A1AA" style={{ marginRight: 8 }} />
                    <Input
                      f={1}
                      borderWidth={0}
                      backgroundColor="transparent"
                      placeholder="Cari makanan / minuman..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      fontFamily="Geist_400Regular"
                      fontSize={13}
                      padding={0}
                      height={38}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color="#A1A1AA" />
                      </TouchableOpacity>
                    )}
                  </XStack>
                </XStack>

                {/* Horizontal Category Chips Bar */}
                <View style={{ height: 38, marginVertical: 2 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ alignItems: 'center', gap: 6, paddingRight: 10 }}
                  >
                    {CATEGORIES.map(cat => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setSelectedCategory(cat)}
                          style={{
                            height: 34,
                            paddingHorizontal: 14,
                            borderRadius: 17,
                            backgroundColor: isSelected ? '#FF5722' : 'white',
                            borderWidth: 1,
                            borderColor: isSelected ? '#FF5722' : '#E4E4E7',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            fontFamily="Geist_700Bold"
                            fontSize={12}
                            color={isSelected ? 'white' : '#27272A'}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Product Grid */}
                <ScrollView
                  f={1}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 140 }}
                >
                  {filteredMenu.length === 0 ? (
                    <YStack f={1} ai="center" jc="center" py={60} px={24} gap={16}>
                      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="restaurant-outline" size={40} color="#FF5722" />
                      </View>
                      <YStack ai="center" gap={6}>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B" ta="center">
                          Belum Ada Menu Resto
                        </Text>
                        <Text fontFamily="Geist_500Medium" fontSize={13} color="#71717A" ta="center" maxWidth={300}>
                          Mulai tambahkan menu makanan, minuman, atau produk jualan resto Anda untuk mulai menerima transaksi kasir.
                        </Text>
                      </YStack>
                      <Button
                        backgroundColor="#FF5722"
                        pressStyle={{ backgroundColor: '#E64A19' }}
                        br={12}
                        px={20}
                        h={46}
                        onPress={() => router.push('/products')}
                        icon={<Ionicons name="add-circle-outline" size={20} color="white" />}
                      >
                        <Text fontFamily="Geist_700Bold" fontSize={14} color="white">
                          + Tambah Menu Pertama
                        </Text>
                      </Button>
                    </YStack>
                  ) : (
                    <View style={styles.productGrid}>
                      {filteredMenu.map(item => {
                        const cartItem = cart.find(ci => ci.menuItem.id === item.id);
                        const qtyInCart = cartItem ? cartItem.quantity : 0;
                        const isOutOfStock = item.stock <= 0;
                        const isMaxStockInCart = qtyInCart >= item.stock && item.stock > 0;

                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => addToCart(item)}
                            activeOpacity={0.85}
                            style={[
                              styles.productCard,
                              { width: isMobile ? '48%' : '31%' },
                              isOutOfStock && { opacity: 0.7, borderColor: '#FCA5A5' }
                            ]}
                          >
                            {/* Image Container with Stock & In-Cart Badge Overlay */}
                            <View style={{ width: '100%', height: isMobile ? 110 : 130, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F4F4F5', position: 'relative' }}>
                              {item.imageSource ? (
                                <Image
                                  source={item.imageSource}
                                  style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                                />
                              ) : (
                                <YStack f={1} jc="center" ai="center" backgroundColor={`${item.iconColor}15`}>
                                  <Ionicons name={item.iconName as any} size={28} color={item.iconColor} />
                                </YStack>
                              )}

                              {/* Stock Badge Overlay (Top Right) - Tap to Perbaharui Stok */}
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  openStockModal(item);
                                }}
                                activeOpacity={0.8}
                                style={{
                                  position: 'absolute',
                                  top: 6,
                                  right: 6,
                                  backgroundColor: isOutOfStock ? '#EF4444' : item.stock <= 5 ? '#F59E0B' : 'rgba(0,0,0,0.65)',
                                  paddingHorizontal: 7,
                                  paddingVertical: 3,
                                  borderRadius: 6,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 3
                                }}
                              >
                                <Ionicons name={isOutOfStock ? 'alert-circle' : 'cube-outline'} size={10} color="white" />
                                <Text fontFamily="Geist_700Bold" fontSize={10} color="white">
                                  {isOutOfStock ? 'Stok Habis' : `Stok ${item.stock}`}
                                </Text>
                              </TouchableOpacity>

                              {/* In-Cart Badge Overlay (Top Left) */}
                              {qtyInCart > 0 && (
                                <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: '#FF5722', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 3 }}>
                                  <Ionicons name="cart" size={11} color="white" />
                                  <Text fontFamily="Geist_800ExtraBold" fontSize={10} color="white">
                                    {qtyInCart}x
                                  </Text>
                                </View>
                              )}
                            </View>

                            <YStack gap={1} mt={6}>
                              <Text fontFamily="Geist_700Bold" fontSize={13} color={isOutOfStock ? '#71717A' : '#18181B'} numberOfLines={1}>
                                {item.name}
                              </Text>
                              <Text fontFamily="Geist_700Bold" fontSize={11} color="#27272A">
                                {item.category}
                              </Text>
                            </YStack>

                            <XStack jc="space-between" ai="center" mt={4}>
                              <Text fontFamily="Geist_800ExtraBold" fontSize={13} color={isOutOfStock ? '#9CA3AF' : '#FF5722'}>
                                Rp {item.price.toLocaleString('id-ID')}
                              </Text>

                              {/* Direct Inline Stepper [-] QTY [+] */}
                              {qtyInCart === 0 ? (
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                  }}
                                  style={{
                                    paddingHorizontal: isOutOfStock ? 8 : 0,
                                    height: 28,
                                    minWidth: 28,
                                    borderRadius: 14,
                                    backgroundColor: isOutOfStock ? '#FEE2E2' : '#FF5722',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: isOutOfStock ? 1 : 0,
                                    borderColor: '#FCA5A5',
                                    shadowColor: isOutOfStock ? 'transparent' : '#FF5722',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3,
                                    elevation: isOutOfStock ? 0 : 2,
                                  }}
                                >
                                  {isOutOfStock ? (
                                    <Text fontFamily="Geist_700Bold" fontSize={10} color="#DC2626">
                                      + Stok
                                    </Text>
                                  ) : (
                                    <Ionicons name="add" size={18} color="white" />
                                  )}
                                </TouchableOpacity>
                              ) : (
                                <XStack
                                  ai="center"
                                  gap={4}
                                  backgroundColor="#FFF3E0"
                                  px={4}
                                  py={2}
                                  br={14}
                                  borderWidth={1.5}
                                  borderColor="#FF5722"
                                >
                                  <TouchableOpacity
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(item.id, -1);
                                    }}
                                    activeOpacity={0.7}
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: 12,
                                      backgroundColor: 'white',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      borderWidth: 1,
                                      borderColor: '#FF5722',
                                    }}
                                  >
                                    <Ionicons name="remove" size={14} color="#FF5722" />
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      openQtyModal(item);
                                    }}
                                    activeOpacity={0.7}
                                  >
                                    <Text
                                      fontFamily="Geist_800ExtraBold"
                                      fontSize={12}
                                      color="#FF5722"
                                      px={6}
                                    >
                                      {qtyInCart}
                                    </Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      addToCart(item);
                                    }}
                                    activeOpacity={0.7}
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: 12,
                                      backgroundColor: isMaxStockInCart ? '#A1A1AA' : '#FF5722',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Ionicons name="add" size={14} color="white" />
                                  </TouchableOpacity>
                                </XStack>
                              )}
                            </XStack>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </ScrollView>

                {/* Floating Bottom Cart Bar (Prominent Active Cart Indicator) */}
                {totalItemCount > 0 && (
                  <TouchableOpacity
                    onPress={() => setActiveTab('cart')}
                    activeOpacity={0.92}
                    style={styles.mobileFloatingCartBar}
                  >
                    <XStack ai="center" gap={10} f={1}>
                      <View style={{ backgroundColor: '#FF5722', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="cart" size={14} color="white" />
                        <Text color="white" fontFamily="Geist_800ExtraBold" fontSize={12}>
                          {totalItemCount}
                        </Text>
                      </View>
                      <YStack>
                        <Text color="white" fontFamily="Geist_700Bold" fontSize={13}>
                          Total Item: {totalItemCount} item
                        </Text>
                        <Text color="#D4D4D8" fontFamily="Geist_400Regular" fontSize={11}>
                          Klik untuk lihat detail pesanan
                        </Text>
                      </YStack>
                    </XStack>

                    <XStack ai="center" gap={6} backgroundColor="#FF5722" px={14} py={8} br={12}>
                      <Text color="white" fontFamily="Geist_800ExtraBold" fontSize={13}>
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </Text>
                      <Ionicons name="arrow-forward" size={15} color="white" />
                    </XStack>
                  </TouchableOpacity>
                )}

              </YStack>

              {/* Desktop/Tablet Side Cart */}
              {!isMobile && (
                <YStack
                  w={360}
                  backgroundColor="white"
                  borderLeftWidth={1}
                  borderColor="#E4E4E7"
                  p={16}
                  jc="space-between"
                >
                  <YStack gap={10}>
                    <XStack jc="space-between" ai="center">
                      <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                        Pesanan Aktif
                      </Text>
                      {cart.length > 0 && (
                        <TouchableOpacity onPress={clearCart}>
                          <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#EF4444">
                            Kosongkan
                          </Text>
                        </TouchableOpacity>
                      )}
                    </XStack>

                    <XStack backgroundColor="#F4F4F5" p={3} br={10} gap={3}>
                      {(['Dine In', 'Takeaway', 'Delivery'] as OrderType[]).map(type => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setOrderType(type)}
                          style={{
                            flex: 1,
                            paddingVertical: 6,
                            alignItems: 'center',
                            borderRadius: 7,
                            backgroundColor: orderType === type ? '#FF5722' : 'transparent',
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={12} color={orderType === type ? 'white' : '#71717A'}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </XStack>
                  </YStack>

                  <ScrollView f={1} my={10} showsVerticalScrollIndicator={false}>
                    {cart.length === 0 ? (
                      <YStack f={1} jc="center" ai="center" py={40} gap={8}>
                        <Ionicons name="cart-outline" size={42} color="#D4D4D8" />
                        <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#A1A1AA" ta="center">
                          Keranjang kosong. Pilih menu.
                        </Text>
                      </YStack>
                    ) : (
                      <YStack gap={8}>
                        {cart.map(item => (
                          <XStack key={item.menuItem.id} backgroundColor="#FAFAFA" p={10} br={12} borderWidth={1} borderColor="#F4F4F5" jc="space-between" ai="center">
                            <YStack f={1} mr={8}>
                              <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B" numberOfLines={1}>{item.menuItem.name}</Text>
                              <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#FF5722">Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}</Text>
                            </YStack>
                            <XStack ai="center" gap={6} backgroundColor="white" p={3} br={8} borderWidth={1} borderColor="#E4E4E7">
                              <TouchableOpacity onPress={() => updateQuantity(item.menuItem.id, -1)}>
                                <View style={{ width: 22, height: 22, borderRadius: 5, backgroundColor: '#F4F4F5', justifyContent: 'center', alignItems: 'center' }}>
                                  <Ionicons name="remove" size={14} color="#3F3F46" />
                                </View>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => openQtyModal(item)} activeOpacity={0.7}>
                                <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#FF5722' }}>
                                  <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#FF5722">{item.quantity}</Text>
                                </View>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => updateQuantity(item.menuItem.id, 1)}>
                                <View style={{ width: 22, height: 22, borderRadius: 5, backgroundColor: '#FF5722', justifyContent: 'center', alignItems: 'center' }}>
                                  <Ionicons name="add" size={14} color="white" />
                                </View>
                              </TouchableOpacity>
                            </XStack>
                          </XStack>
                        ))}
                      </YStack>
                    )}
                  </ScrollView>

                  <YStack gap={8} pt={10} borderTopWidth={1} borderColor="#E4E4E7">
                    <YStack gap={4}>
                      <XStack jc="space-between">
                        <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">Subtotal</Text>
                        <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#18181B">Rp {subtotal.toLocaleString('id-ID')}</Text>
                      </XStack>
                      <XStack jc="space-between">
                        <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">PB1 (10%)</Text>
                        <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#18181B">Rp {taxAndService.toLocaleString('id-ID')}</Text>
                      </XStack>
                      <XStack jc="space-between" mt={2}>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#18181B">Total</Text>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={17} color="#FF5722">Rp {grandTotal.toLocaleString('id-ID')}</Text>
                      </XStack>
                    </YStack>
                    <Button size="$4" br={12} backgroundColor={cart.length > 0 ? '#FF5722' : '#E4E4E7'} disabled={cart.length === 0} onPress={openPaymentModal}>
                      <Text fontFamily="Geist_700Bold" color="white" fontSize={14}>Bayar Sekarang ({totalItemCount} Item)</Text>
                    </Button>
                  </YStack>
                </YStack>
              )}
            </XStack>
          )}

          {/* 2. CART / PESANAN VIEW (MOBILE ONLY TAB) */}
          {activeTab === 'cart' && (
            <YStack f={1} backgroundColor="white" p={16} jc="space-between">
              <YStack gap={10}>
                <XStack jc="space-between" ai="center">
                  <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B">
                    Detail Pesanan Aktif
                  </Text>
                  {cart.length > 0 && (
                    <TouchableOpacity onPress={clearCart}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#EF4444">
                        Kosongkan
                      </Text>
                    </TouchableOpacity>
                  )}
                </XStack>

                {/* Order Type Switcher */}
                <XStack backgroundColor="#F4F4F5" p={3} br={10} gap={3}>
                  {(['Dine In', 'Takeaway', 'Delivery'] as OrderType[]).map(type => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setOrderType(type)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        alignItems: 'center',
                        borderRadius: 8,
                        backgroundColor: orderType === type ? '#FF5722' : 'transparent',
                      }}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={13} color={orderType === type ? 'white' : '#71717A'}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </XStack>
              </YStack>

              {/* Item List */}
              <ScrollView f={1} my={14} showsVerticalScrollIndicator={false}>
                {cart.length === 0 ? (
                  <YStack f={1} jc="center" ai="center" py={60} gap={10}>
                    <Ionicons name="bag-handle-outline" size={54} color="#D4D4D8" />
                    <Text fontFamily="Geist_600SemiBold" fontSize={14} color="#A1A1AA" ta="center">
                      Belum ada item di keranjang.{'\n'}Pilih menu dari tab Kasir.
                    </Text>
                  </YStack>
                ) : (
                  <YStack gap={10}>
                    {cart.map(item => (
                      <XStack key={item.menuItem.id} backgroundColor="#FAFAFA" p={12} br={14} borderWidth={1} borderColor="#F4F4F5" jc="space-between" ai="center">
                        <YStack f={1} mr={10}>
                          <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">{item.menuItem.name}</Text>
                          <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#FF5722">Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}</Text>
                        </YStack>
                        <XStack ai="center" gap={8} backgroundColor="white" p={4} br={10} borderWidth={1} borderColor="#E4E4E7">
                          <TouchableOpacity onPress={() => updateQuantity(item.menuItem.id, -1)}>
                            <View style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: '#F4F4F5', justifyContent: 'center', alignItems: 'center' }}>
                              <Ionicons name="remove" size={16} color="#3F3F46" />
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => openQtyModal(item)} activeOpacity={0.7}>
                            <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1.5, borderColor: '#FF5722' }}>
                              <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#FF5722">{item.quantity}</Text>
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => updateQuantity(item.menuItem.id, 1)}>
                            <View style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: '#FF5722', justifyContent: 'center', alignItems: 'center' }}>
                              <Ionicons name="add" size={16} color="white" />
                            </View>
                          </TouchableOpacity>
                        </XStack>
                      </XStack>
                    ))}
                  </YStack>
                )}
              </ScrollView>

              {/* Total & Pay */}
              <YStack gap={10} pt={12} borderTopWidth={1} borderColor="#E4E4E7">
                <YStack gap={4}>
                  <XStack jc="space-between">
                    <Text fontFamily="Geist_400Regular" fontSize={13} color="#71717A">Subtotal</Text>
                    <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#18181B">Rp {subtotal.toLocaleString('id-ID')}</Text>
                  </XStack>
                  <XStack jc="space-between">
                    <Text fontFamily="Geist_400Regular" fontSize={13} color="#71717A">PB1 & Service (10%)</Text>
                    <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#18181B">Rp {taxAndService.toLocaleString('id-ID')}</Text>
                  </XStack>
                  <XStack jc="space-between" mt={4}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">Total</Text>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#FF5722">Rp {grandTotal.toLocaleString('id-ID')}</Text>
                  </XStack>
                </YStack>

                <Button size="$5" br={14} backgroundColor={cart.length > 0 ? '#FF5722' : '#E4E4E7'} disabled={cart.length === 0} onPress={openPaymentModal}>
                  <Text fontFamily="Geist_700Bold" color="white" fontSize={16}>Bayar Sekarang ({totalItemCount} Item)</Text>
                </Button>
              </YStack>
            </YStack>
          )}

          {/* 3. SHIFT OMSET VIEW */}
          {activeTab === 'summary' && (
            <ScrollView f={1} p={16}>
              <YStack gap={16} maxWidth={800} alignSelf="center" w="100%">
                {/* Header Title Section */}
                <YStack gap={2}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={20} color="#18181B">
                    Rekap Kas Shift Kasir
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                    Perhitungan penjualan kotor, pengeluaran kasir & setoran kas laci
                  </Text>
                </YStack>

                {/* ── SINGLE UNIFIED SHIFT RECAP CARD ── */}
                <YStack backgroundColor="white" p={16} br={20} borderWidth={1} borderColor="#E4E4E7" gap={12}>
                  {/* Top Hero: Setoran Kas Laci */}
                  <XStack jc="space-between" ai="center" p={14} backgroundColor="#F8FAFC" br={14} borderWidth={1} borderColor="#E2E8F0">
                    <YStack gap={2}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#64748B">
                        Setoran Kas Laci (Net Cash)
                      </Text>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={24} color="#0F172A">
                        Rp 1.960.000
                      </Text>
                    </YStack>
                    <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                      <Text fontFamily="Geist_700Bold" fontSize={11} color="#0284C7">
                        Wajib Ada Di Laci
                      </Text>
                    </View>
                  </XStack>

                  {/* Bottom 2 Breakdown Columns */}
                  <XStack gap={10}>
                    {/* Total Penjualan */}
                    <YStack f={1} p={12} backgroundColor="#FAFAFA" br={12} borderWidth={1} borderColor="#F4F4F5" gap={2}>
                      <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">
                        Total Penjualan
                      </Text>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                        Rp 2.450.000
                      </Text>
                      <Text fontFamily="Geist_400Regular" fontSize={10} color="#A1A1AA">
                        84 Pesanan Selesai
                      </Text>
                    </YStack>

                    {/* Pengeluaran Resto */}
                    <TouchableOpacity
                      onPress={() => router.push('/expenses')}
                      style={{ flex: 1 }}
                      activeOpacity={0.8}
                    >
                      <YStack p={12} backgroundColor="#FEF2F2" br={12} borderWidth={1} borderColor="#FEE2E2" gap={2}>
                        <Text fontFamily="Geist_500Medium" fontSize={11} color="#991B1B">
                          Pengeluaran Resto
                        </Text>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#EF4444">
                          - Rp 490.000
                        </Text>
                        <Text fontFamily="Geist_600SemiBold" fontSize={10} color="#991B1B">
                          3 Nota Pengeluaran
                        </Text>
                      </YStack>
                    </TouchableOpacity>
                  </XStack>
                </YStack>

                {/* ── QUICK OPERATIONAL BREAKDOWN GRID ── */}
                <XStack gap={10}>
                  {/* Metode Pembayaran */}
                  <YStack f={1} backgroundColor="white" p={12} br={14} borderWidth={1} borderColor="#E4E4E7" gap={6}>
                    <XStack ai="center" gap={6}>
                      <Ionicons name="card-outline" size={14} color="#52525B" />
                      <Text fontFamily="Geist_700Bold" fontSize={11} color="#52525B">
                        Metode Pembayaran
                      </Text>
                    </XStack>
                    <YStack gap={2}>
                      <XStack jc="space-between">
                        <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">💵 Tunai (Laci):</Text>
                        <Text fontFamily="Geist_700Bold" fontSize={11} color="#18181B">Rp 1.150.000</Text>
                      </XStack>
                      <XStack jc="space-between">
                        <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">📱 QRIS / EDC:</Text>
                        <Text fontFamily="Geist_700Bold" fontSize={11} color="#18181B">Rp 1.300.000</Text>
                      </XStack>
                    </YStack>
                  </YStack>

                  {/* Tipe Pesanan */}
                  <YStack f={1} backgroundColor="white" p={12} br={14} borderWidth={1} borderColor="#E4E4E7" gap={6}>
                    <XStack ai="center" gap={6}>
                      <Ionicons name="restaurant-outline" size={14} color="#52525B" />
                      <Text fontFamily="Geist_700Bold" fontSize={11} color="#52525B">
                        Kanal Pesanan
                      </Text>
                    </XStack>
                    <YStack gap={2}>
                      <XStack jc="space-between">
                        <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">🍽️ Dine In (58):</Text>
                        <Text fontFamily="Geist_700Bold" fontSize={11} color="#18181B">Rp 1.680.000</Text>
                      </XStack>
                      <XStack jc="space-between">
                        <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">🥡 Takeaway (26):</Text>
                        <Text fontFamily="Geist_700Bold" fontSize={11} color="#18181B">Rp 770.000</Text>
                      </XStack>
                    </YStack>
                  </YStack>
                </XStack>

                {/* PROMINENT BANNER BUTTON: CATAT PENGELUARAN */}
                <TouchableOpacity
                  onPress={() => router.push('/expenses')}
                  style={styles.bannerExpenseBtn}
                  activeOpacity={0.88}
                >
                  <XStack ai="center" jc="space-between">
                    <XStack ai="center" gap={12} f={1} pr={8}>
                      <View style={styles.bannerIconBadge}>
                        <Ionicons name="receipt" size={22} color="#EF4444" />
                      </View>
                      <YStack f={1}>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="white">
                          + CATAT PENGELUARAN RESTO
                        </Text>
                        <Text fontFamily="Geist_500Medium" fontSize={11} color="#FEE2E2" numberOfLines={1}>
                          Belanja Harian/Mingguan 🛒 • Scan Struk 📸 • Suara 🎙️
                        </Text>
                      </YStack>
                    </XStack>
                    <Ionicons name="chevron-forward" size={20} color="white" />
                  </XStack>
                </TouchableOpacity>

                {/* ── SEGMENTED ACTIVITY SWITCHER: PESANAN VS PENGELUARAN ── */}
                <YStack backgroundColor="white" p={14} br={16} borderWidth={1} borderColor="#E4E4E7" gap={12}>
                  {/* Segmented Switcher Tabs */}
                  <XStack backgroundColor="#F4F4F5" p={3} br={10} gap={4}>
                    <TouchableOpacity
                      onPress={() => setRecapSubTab('sales')}
                      style={{
                        flex: 1,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: recapSubTab === 'sales' ? 'white' : 'transparent',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        fontFamily={recapSubTab === 'sales' ? 'Geist_700Bold' : 'Geist_500Medium'}
                        fontSize={12}
                        color={recapSubTab === 'sales' ? '#18181B' : '#71717A'}
                      >
                        📦 Menu Terlaris (84)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setRecapSubTab('expenses')}
                      style={{
                        flex: 1,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: recapSubTab === 'expenses' ? 'white' : 'transparent',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        fontFamily={recapSubTab === 'expenses' ? 'Geist_700Bold' : 'Geist_500Medium'}
                        fontSize={12}
                        color={recapSubTab === 'expenses' ? '#EF4444' : '#71717A'}
                      >
                        💸 Pengeluaran Resto (3)
                      </Text>
                    </TouchableOpacity>
                  </XStack>

                  {/* SubTab Content 1: Menu Terlaris & Pesanan */}
                  {recapSubTab === 'sales' ? (
                    <YStack gap={8}>
                      {[
                        { name: 'Kopi Susu Soodap', qty: 38, total: 'Rp 836.000', cat: 'Minuman' },
                        { name: 'Nasi Goreng Soodap', qty: 24, total: 'Rp 768.000', cat: 'Makanan' },
                        { name: 'Croissant Butter', qty: 18, total: 'Rp 432.000', cat: 'Pastry' },
                        { name: 'Matcha Latte Ice', qty: 14, total: 'Rp 364.000', cat: 'Minuman' },
                      ].map((item, idx) => (
                        <XStack key={idx} p={10} backgroundColor="#FAFAFA" br={10} jc="space-between" ai="center">
                          <YStack>
                            <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                              {item.name}
                            </Text>
                            <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                              {item.cat} • {item.qty} Porsi Terjual
                            </Text>
                          </YStack>
                          <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#10B981">
                            {item.total}
                          </Text>
                        </XStack>
                      ))}

                      <TouchableOpacity
                        onPress={() => router.push('/transactions')}
                        style={{ alignSelf: 'center', paddingTop: 4 }}
                      >
                        <Text fontFamily="Geist_700Bold" fontSize={12} color="#FF5722">
                          Lihat Riwayat Pesanan Lengkap →
                        </Text>
                      </TouchableOpacity>
                    </YStack>
                  ) : (
                    /* SubTab Content 2: Pengeluaran Kasir */
                    <YStack gap={8}>
                      {[
                        { title: 'Beli Galon Air & Es Batu 10 Plastik', desc: 'Bahan Baku • Manual Input (09:30)', amount: '- Rp 85.000' },
                        { title: 'Nota Susu UHT 2 Karton (Pasar)', desc: 'Bahan Baku • Scan Struk 📸 (10:15)', amount: '- Rp 340.000' },
                        { title: 'Beli Gas LPG 3kg & Alat Kebersihan', desc: 'Operasional • Suara 🎙️ (13:40)', amount: '- Rp 65.000' },
                      ].map((item, idx) => (
                        <XStack key={idx} p={10} backgroundColor="#FAFAFA" br={10} jc="space-between" ai="center">
                          <YStack f={1} pr={8}>
                            <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                              {item.title}
                            </Text>
                            <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                              {item.desc}
                            </Text>
                          </YStack>
                          <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#EF4444">
                            {item.amount}
                          </Text>
                        </XStack>
                      ))}

                      <TouchableOpacity
                        onPress={() => router.push('/expenses')}
                        style={{ alignSelf: 'center', paddingTop: 4 }}
                      >
                        <Text fontFamily="Geist_700Bold" fontSize={12} color="#FF5722">
                          Kelola Semua Pengeluaran →
                        </Text>
                      </TouchableOpacity>
                    </YStack>
                  )}
                </YStack>

              </YStack>
            </ScrollView>
          )}

          {/* 4. KITCHEN DISPLAY (KDS) VIEW */}
          {activeTab === 'kds' && (
            <ScrollView f={1} p={16}>
              <YStack gap={16} maxWidth={900} alignSelf="center" w="100%">
                <XStack jc="space-between" ai="center">
                  <Text fontFamily="Geist_800ExtraBold" fontSize={20} color="#18181B">
                    Antrean Dapur (KDS)
                  </Text>
                  <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                    <Text fontFamily="Geist_700Bold" fontSize={11} color="#D97706">
                      2 Menunggu
                    </Text>
                  </View>
                </XStack>

                <XStack gap={12} flexWrap="wrap">
                  <YStack w={isMobile ? '100%' : 260} backgroundColor="white" p={14} br={14} borderWidth={1} borderColor="#E4E4E7" gap={10}>
                    <XStack jc="space-between" ai="center">
                      <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#FF5722">#102 • Dine In</Text>
                      <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#EF4444">5 mnt lalu</Text>
                    </XStack>
                    <YStack gap={4}>
                      <Text fontFamily="Geist_700Bold" fontSize={13}>2x Kopi Susu Soodap</Text>
                      <Text fontFamily="Geist_700Bold" fontSize={13}>1x Nasi Goreng Soodap</Text>
                    </YStack>
                    <Button size="$3" br={10} backgroundColor="#10B981" onPress={() => showAlert({ type: 'info', iconName: 'restaurant-outline', iconColor: '#10B981', iconBgColor: '#E8FFF1', title: 'Pesanan Siap! 👨‍🍳', message: 'Notifikasi telah dikirimkan ke kasir.' })}>
                      <Text fontFamily="Geist_700Bold" color="white" fontSize={12}>Tandai Siap Saji</Text>
                    </Button>
                  </YStack>
                </XStack>
              </YStack>
            </ScrollView>
          )}

        </YStack>

        {/* ── BOTTOM NAVIGATION BAR (EXTENDS TO PHYSICAL BOTTOM EDGE) ── */}
        <XStack style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          
          {/* Tab 1: Kasir POS */}
          <TouchableOpacity
            onPress={() => setActiveTab('pos')}
            style={styles.bottomNavTab}
          >
            <Ionicons
              name={activeTab === 'pos' ? 'cart' : 'cart-outline'}
              size={22}
              color={activeTab === 'pos' ? '#FF5722' : '#71717A'}
            />
            <Text
              fontFamily="Geist_700Bold"
              fontSize={11}
              color={activeTab === 'pos' ? '#FF5722' : '#71717A'}
              mt={2}
            >
              Kasir
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Pesanan / Cart */}
          <TouchableOpacity
            onPress={() => setActiveTab('cart')}
            style={styles.bottomNavTab}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons
                name={activeTab === 'cart' ? 'receipt' : 'receipt-outline'}
                size={22}
                color={activeTab === 'cart' ? '#FF5722' : '#71717A'}
              />
              {totalItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text color="white" fontFamily="Geist_800ExtraBold" fontSize={9}>
                    {totalItemCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              fontFamily="Geist_700Bold"
              fontSize={11}
              color={activeTab === 'cart' ? '#FF5722' : '#71717A'}
              mt={2}
            >
              Pesanan
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Omset */}
          <TouchableOpacity
            onPress={() => setActiveTab('summary')}
            style={styles.bottomNavTab}
          >
            <Ionicons
              name={activeTab === 'summary' ? 'stats-chart' : 'stats-chart-outline'}
              size={22}
              color={activeTab === 'summary' ? '#FF5722' : '#71717A'}
            />
            <Text
              fontFamily="Geist_700Bold"
              fontSize={11}
              color={activeTab === 'summary' ? '#FF5722' : '#71717A'}
              mt={2}
            >
              Laporan
            </Text>
          </TouchableOpacity>

          {/* Tab 4: Dapur */}
          <TouchableOpacity
            onPress={() => setActiveTab('kds')}
            style={styles.bottomNavTab}
          >
            <Ionicons
              name={activeTab === 'kds' ? 'restaurant' : 'restaurant-outline'}
              size={22}
              color={activeTab === 'kds' ? '#FF5722' : '#71717A'}
            />
            <Text
              fontFamily="Geist_700Bold"
              fontSize={11}
              color={activeTab === 'kds' ? '#FF5722' : '#71717A'}
              mt={2}
            >
              Dapur
            </Text>
          </TouchableOpacity>

        </XStack>

        {/* ── SLIDE-UP OUTLET SELECTOR / ADD OUTLET SHEET ── */}
        <Modal
          visible={outletModalVisible}
          transparent
          animationType="none"
          onRequestClose={() => closeOutletModal()}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closeOutletModal()}
            />
            <Animated.View
              style={[
                styles.modalSheetPanel,
                {
                  transform: [{ translateY: outletSlideAnim }],
                  paddingBottom: Math.max(insets.bottom, 20),
                  gap: 14,
                }
              ]}
            >
              <View style={styles.sheetHandle} />

              {!isAddingOutlet ? (
                /* --- LIST OUTLETS VIEW --- */
                <YStack gap={12}>
                  <XStack jc="space-between" ai="center">
                    <YStack>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B">
                        Pilih Outlet
                      </Text>
                      <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                        Kelola atau berpindah ke outlet lain
                      </Text>
                    </YStack>
                    <TouchableOpacity onPress={() => closeOutletModal()} style={{ padding: 4 }}>
                      <Ionicons name="close" size={22} color="#52525B" />
                    </TouchableOpacity>
                  </XStack>

                  {/* List of Outlets */}
                  <YStack gap={8} mah={280}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      <YStack gap={8}>
                        {outlets.map((item) => {
                          const isSelected = item.name === selectedOutlet;
                          return (
                            <TouchableOpacity
                              key={item.id}
                              onPress={() => {
                                closeOutletModal(() => setSelectedOutlet(item.name));
                              }}
                              activeOpacity={0.8}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 12,
                                borderRadius: 12,
                                backgroundColor: isSelected ? '#FFF3E0' : '#FAFAFA',
                                borderWidth: 1,
                                borderColor: isSelected ? '#FF5722' : '#E4E4E7',
                              }}
                            >
                              <XStack ai="center" gap={10} f={1}>
                                <View
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    backgroundColor: isSelected ? '#FF5722' : '#F4F4F5',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                  }}
                                >
                                  <Ionicons
                                    name="storefront"
                                    size={18}
                                    color={isSelected ? 'white' : '#71717A'}
                                  />
                                </View>
                                <YStack f={1}>
                                  <Text
                                    fontFamily="Geist_700Bold"
                                    fontSize={14}
                                    color={isSelected ? '#FF5722' : '#18181B'}
                                  >
                                    {item.name}
                                  </Text>
                                  <Text
                                    fontFamily="Geist_400Regular"
                                    fontSize={11}
                                    color="#71717A"
                                    numberOfLines={1}
                                  >
                                    {item.address}
                                  </Text>
                                </YStack>
                              </XStack>

                              {isSelected && (
                                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                                  <Ionicons name="checkmark" size={14} color="white" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </YStack>
                    </ScrollView>
                  </YStack>

                  {/* Button: Add New Outlet */}
                  <Button
                    size="$4"
                    br={12}
                    backgroundColor="#FF5722"
                    onPress={() => setIsAddingOutlet(true)}
                    mt={4}
                  >
                    <XStack ai="center" gap={6}>
                      <Ionicons name="add-circle" size={18} color="white" />
                      <Text fontFamily="Geist_700Bold" color="white" fontSize={14}>
                        Tambah Outlet Baru
                      </Text>
                    </XStack>
                  </Button>
                </YStack>
              ) : (
                /* --- FORM TAMBAH OUTLET BARU --- */
                <YStack gap={12}>
                  <XStack jc="space-between" ai="center">
                    <XStack ai="center" gap={8}>
                      <TouchableOpacity onPress={() => setIsAddingOutlet(false)} style={{ padding: 4 }}>
                        <Ionicons name="arrow-back" size={20} color="#18181B" />
                      </TouchableOpacity>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B">
                        Tambah Outlet Baru
                      </Text>
                    </XStack>
                    <TouchableOpacity onPress={() => closeOutletModal()} style={{ padding: 4 }}>
                      <Ionicons name="close" size={22} color="#52525B" />
                    </TouchableOpacity>
                  </XStack>

                  <YStack gap={10} mt={4}>
                    <YStack gap={4}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                        Nama Outlet *
                      </Text>
                      <Input
                        backgroundColor="#FAFAFA"
                        borderWidth={1}
                        borderColor="#E4E4E7"
                        br={10}
                        placeholder="Contoh: Outlet PIK 2"
                        value={newOutletName}
                        onChangeText={setNewOutletName}
                        fontFamily="Geist_400Regular"
                        fontSize={13}
                        height={42}
                      />
                    </YStack>

                    <YStack gap={4}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                        Alamat Outlet (Opsional)
                      </Text>
                      <Input
                        backgroundColor="#FAFAFA"
                        borderWidth={1}
                        borderColor="#E4E4E7"
                        br={10}
                        placeholder="Contoh: Ruko Beach Theme Park No. 8, PIK 2"
                        value={newOutletAddress}
                        onChangeText={setNewOutletAddress}
                        fontFamily="Geist_400Regular"
                        fontSize={13}
                        height={42}
                      />
                    </YStack>

                    <XStack gap={8} mt={6}>
                      <Button
                        f={1}
                        size="$4"
                        br={12}
                        backgroundColor="#F4F4F5"
                        onPress={() => setIsAddingOutlet(false)}
                      >
                        <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>
                          Batal
                        </Text>
                      </Button>
                      <Button
                        f={1}
                        size="$4"
                        br={12}
                        backgroundColor="#10B981"
                        onPress={handleAddOutlet}
                      >
                        <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                          Simpan Outlet
                        </Text>
                      </Button>
                    </XStack>
                  </YStack>
                </YStack>
              )}
            </Animated.View>
          </View>
        </Modal>

        {/* ── MODAL PERBAHARUI STOK (QUICK STOCK REPLENISHMENT) ── */}
        <Modal
          visible={stockModalVisible}
          transparent
          animationType="none"
          onRequestClose={() => closeStockModal()}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeStockModal()} />
            <Animated.View
              style={[
                styles.modalSheetPanel,
                { transform: [{ translateY: stockSlideAnim }], paddingBottom: Math.max(insets.bottom + 16, 24) }
              ]}
            >
              <View style={styles.sheetHandle} />

              {selectedStockItem && (
                <YStack gap={14} mt={6}>
                  <XStack jc="space-between" ai="center">
                    <XStack ai="center" gap={8}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="cube" size={20} color="#FF5722" />
                      </View>
                      <YStack>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                          Perbaharui Stok Produk
                        </Text>
                        <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                          {selectedStockItem.name} • {selectedStockItem.category}
                        </Text>
                      </YStack>
                    </XStack>

                    <TouchableOpacity onPress={() => closeStockModal()} style={{ padding: 4 }}>
                      <Ionicons name="close" size={22} color="#52525B" />
                    </TouchableOpacity>
                  </XStack>

                  {/* Current Stock Banner */}
                  <XStack backgroundColor="#FAFAFA" p={12} br={12} borderWidth={1} borderColor="#E4E4E7" ai="center" jc="space-between">
                    <YStack gap={2}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">Stok Saat Ini</Text>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={18} color={selectedStockItem.stock === 0 ? '#EF4444' : '#18181B'}>
                        {selectedStockItem.stock} item
                      </Text>
                    </YStack>
                    <View style={{ backgroundColor: selectedStockItem.stock === 0 ? '#FEE2E2' : '#E8FFF1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text fontFamily="Geist_700Bold" fontSize={11} color={selectedStockItem.stock === 0 ? '#DC2626' : '#10B981'}>
                        {selectedStockItem.stock === 0 ? 'Stok Habis' : 'Tersedia'}
                      </Text>
                    </View>
                  </XStack>

                  {/* Quick Preset Buttons */}
                  <YStack gap={6}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                      Tambah Stok Cepat:
                    </Text>
                    <XStack gap={6}>
                      {[5, 10, 20, 50, 100].map(amount => (
                        <TouchableOpacity
                          key={amount}
                          onPress={() => setAdditionalStockInput(amount.toString())}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: additionalStockInput === amount.toString() ? '#FF5722' : '#F4F4F5',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: additionalStockInput === amount.toString() ? '#FF5722' : '#E4E4E7',
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={12} color={additionalStockInput === amount.toString() ? 'white' : '#27272A'}>
                            +{amount}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </XStack>
                  </YStack>

                  {/* Input Custom Stock */}
                  <YStack gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                      Atau Masukkan Jumlah Tambahan Stok Manual:
                    </Text>
                    <Input
                      backgroundColor="#FAFAFA"
                      borderWidth={1}
                      borderColor="#E4E4E7"
                      br={10}
                      placeholder="Contoh: 15"
                      keyboardType="number-pad"
                      value={additionalStockInput}
                      onChangeText={setAdditionalStockInput}
                      fontFamily="Geist_600SemiBold"
                      fontSize={14}
                      height={44}
                    />
                  </YStack>

                  {/* Actions */}
                  <XStack gap={10} mt={6}>
                    <Button
                      f={1}
                      size="$4"
                      br={12}
                      backgroundColor="#F4F4F5"
                      onPress={() => closeStockModal()}
                    >
                      <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>
                        Batal
                      </Text>
                    </Button>
                    <Button
                      f={1.5}
                      size="$4"
                      br={12}
                      backgroundColor="#FF5722"
                      onPress={() => handleSaveStock(true)}
                    >
                      <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                        Simpan & Masukkan Cart
                      </Text>
                    </Button>
                  </XStack>
                </YStack>
              )}
            </Animated.View>
          </View>
        </Modal>

        {/* ── MODAL INPUT KUANTITAS PESANAN (DIRECT QUANTITY EDIT) ── */}
        <Modal
          visible={qtyModalVisible}
          transparent
          animationType="none"
          onRequestClose={() => closeQtyModal()}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeQtyModal()} />
            <Animated.View
              style={[
                styles.modalSheetPanel,
                { transform: [{ translateY: qtySlideAnim }], paddingBottom: Math.max(insets.bottom + 16, 24) }
              ]}
            >
              <View style={styles.sheetHandle} />

              {selectedQtyItem && (() => {
                const menuItem = 'menuItem' in selectedQtyItem ? selectedQtyItem.menuItem : selectedQtyItem;
                return (
                  <YStack gap={14} mt={6}>
                    <XStack jc="space-between" ai="center">
                      <XStack ai="center" gap={8}>
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="basket" size={20} color="#FF5722" />
                        </View>
                        <YStack>
                          <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                            Input Kuantitas Pesanan
                          </Text>
                          <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                            {menuItem.name} • Rp {menuItem.price.toLocaleString('id-ID')}
                          </Text>
                        </YStack>
                      </XStack>

                      <TouchableOpacity onPress={() => closeQtyModal()} style={{ padding: 4 }}>
                        <Ionicons name="close" size={22} color="#52525B" />
                      </TouchableOpacity>
                    </XStack>

                    {/* Available Stock Info */}
                    <XStack backgroundColor="#FAFAFA" p={10} br={10} borderWidth={1} borderColor="#E4E4E7" ai="center" jc="space-between">
                      <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#52525B">Stok Tersedia</Text>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={13} color={menuItem.stock <= 5 ? '#EF4444' : '#10B981'}>
                        {menuItem.stock} item
                      </Text>
                    </XStack>

                    {/* Quick Bulk Preset Buttons */}
                    <YStack gap={6}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                        Pilih Kuantitas Instan (Pemesanan Banyak):
                      </Text>
                      <XStack gap={6}>
                        {[1, 5, 10, 20, 50, 100].map(amount => (
                          <TouchableOpacity
                            key={amount}
                            onPress={() => setQtyInputText(amount.toString())}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              borderRadius: 10,
                              backgroundColor: qtyInputText === amount.toString() ? '#FF5722' : '#F4F4F5',
                              alignItems: 'center',
                              borderWidth: 1,
                              borderColor: qtyInputText === amount.toString() ? '#FF5722' : '#E4E4E7',
                            }}
                          >
                            <Text fontFamily="Geist_700Bold" fontSize={12} color={qtyInputText === amount.toString() ? 'white' : '#27272A'}>
                              {amount}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </XStack>
                    </YStack>

                    {/* Manual Numeric Input */}
                    <YStack gap={4}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                        Atau Masukkan Kuantitas Manual:
                      </Text>
                      <Input
                        backgroundColor="#FAFAFA"
                        borderWidth={1.5}
                        borderColor="#FF5722"
                        br={10}
                        placeholder="Contoh: 25"
                        keyboardType="number-pad"
                        value={qtyInputText}
                        onChangeText={setQtyInputText}
                        fontFamily="Geist_800ExtraBold"
                        fontSize={18}
                        textAlign="center"
                        height={46}
                      />
                    </YStack>

                    {/* Action Buttons */}
                    <XStack gap={10} mt={6}>
                      <Button
                        f={1}
                        size="$4"
                        br={12}
                        backgroundColor="#F4F4F5"
                        onPress={() => closeQtyModal()}
                      >
                        <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>
                          Batal
                        </Text>
                      </Button>
                      <Button
                        f={1.5}
                        size="$4"
                        br={12}
                        backgroundColor="#FF5722"
                        onPress={handleSaveQuantity}
                      >
                        <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                          Simpan Kuantitas
                        </Text>
                      </Button>
                    </XStack>
                  </YStack>
                );
              })()}
            </Animated.View>
          </View>
        </Modal>

        {/* ── MODAL PILIH / TAMBAH PELANGGAN ── */}
        <Modal
          visible={customerModalVisible}
          transparent
          animationType="none"
          onRequestClose={() => closeCustomerModal()}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeCustomerModal()} />
            <Animated.View
              style={[
                styles.modalSheetPanel,
                { transform: [{ translateY: customerSlideAnim }], paddingBottom: Math.max(insets.bottom + 16, 24) }
              ]}
            >
              <View style={styles.sheetHandle} />

              <YStack gap={14} mt={6}>
                {/* Modal Header */}
                <XStack jc="space-between" ai="center">
                  <XStack ai="center" gap={8}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="people" size={20} color="#FF5722" />
                    </View>
                    <YStack>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                        {isAddingCustomer ? 'Tambah Pelanggan Baru' : 'Pilih Pelanggan'}
                      </Text>
                      <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                        {isAddingCustomer ? 'Isi data pelanggan untuk disimpan' : 'Pilih pelanggan untuk transaksi ini'}
                      </Text>
                    </YStack>
                  </XStack>

                  <TouchableOpacity onPress={() => closeCustomerModal()} style={{ padding: 4 }}>
                    <Ionicons name="close" size={22} color="#52525B" />
                  </TouchableOpacity>
                </XStack>

                {/* VIEW 1: CUSTOMER LIST & SEARCH */}
                {!isAddingCustomer ? (
                  <YStack gap={12}>
                    {/* Search & Add New Bar */}
                    <XStack gap={8} ai="center">
                      <XStack f={1} backgroundColor="#F4F4F5" br={10} px={10} ai="center" height={40}>
                        <Ionicons name="search" size={16} color="#A1A1AA" />
                        <Input
                          f={1}
                          borderWidth={0}
                          backgroundColor="transparent"
                          placeholder="Cari nama atau no. HP..."
                          value={customerSearchQuery}
                          onChangeText={setCustomerSearchQuery}
                          fontFamily="Geist_400Regular"
                          fontSize={13}
                        />
                      </XStack>

                      <TouchableOpacity
                        onPress={() => setIsAddingCustomer(true)}
                        style={{
                          backgroundColor: '#FF5722',
                          paddingHorizontal: 12,
                          height: 40,
                          borderRadius: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Ionicons name="person-add" size={15} color="white" />
                        <Text fontFamily="Geist_700Bold" fontSize={12} color="white">
                          + Baru
                        </Text>
                      </TouchableOpacity>
                    </XStack>

                    {/* Customer Item List */}
                    <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                      <YStack gap={8}>
                        {customers
                          .filter(c =>
                            c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                            (c.phone && c.phone.includes(customerSearchQuery))
                          )
                          .map(cust => {
                            const isSelected = selectedCustomer.id === cust.id;
                            return (
                              <TouchableOpacity
                                key={cust.id}
                                onPress={() => {
                                  setSelectedCustomer(cust);
                                  closeCustomerModal();
                                }}
                                activeOpacity={0.7}
                              >
                                <XStack
                                  backgroundColor={isSelected ? '#FFF3E0' : '#FAFAFA'}
                                  p={12}
                                  br={12}
                                  borderWidth={1.5}
                                  borderColor={isSelected ? '#FF5722' : '#E4E4E7'}
                                  jc="space-between"
                                  ai="center"
                                >
                                  <XStack ai="center" gap={10} f={1}>
                                    <View
                                      style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 18,
                                        backgroundColor: isSelected
                                          ? '#FF5722'
                                          : cust.isMember
                                          ? '#FEF3C7'
                                          : '#F4F4F5',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <Ionicons
                                        name={cust.isMember ? 'star' : 'person'}
                                        size={18}
                                        color={isSelected ? 'white' : cust.isMember ? '#D97706' : '#71717A'}
                                      />
                                    </View>
                                    <YStack f={1}>
                                      <XStack ai="center" gap={6}>
                                        <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                                          {cust.name}
                                        </Text>
                                        {cust.isMember && (
                                          <View style={{ backgroundColor: '#FF5722', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                                            <Text color="white" fontFamily="Geist_800ExtraBold" fontSize={9}>
                                              MEMBER
                                            </Text>
                                          </View>
                                        )}
                                      </XStack>
                                      <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                                        No. HP: {cust.phone}
                                      </Text>
                                    </YStack>
                                  </XStack>

                                  {isSelected && (
                                    <Ionicons name="checkmark-circle" size={22} color="#FF5722" />
                                  )}
                                </XStack>
                              </TouchableOpacity>
                            );
                          })}
                      </YStack>
                    </ScrollView>
                  </YStack>
                ) : (
                  /* VIEW 2: FORM TAMBAH PELANGGAN BARU */
                  <YStack gap={12}>
                    <YStack gap={4}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                        Nama Lengkap Pelanggan *
                      </Text>
                      <Input
                        backgroundColor="#FAFAFA"
                        borderWidth={1}
                        borderColor="#E4E4E7"
                        br={10}
                        placeholder="Contoh: Maya Indah"
                        value={newCustomerName}
                        onChangeText={setNewCustomerName}
                        fontFamily="Geist_600SemiBold"
                        fontSize={14}
                        height={44}
                      />
                    </YStack>

                    <YStack gap={4}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                        Nomor Telepon / WhatsApp (Opsional)
                      </Text>
                      <Input
                        backgroundColor="#FAFAFA"
                        borderWidth={1}
                        borderColor="#E4E4E7"
                        br={10}
                        placeholder="Contoh: 081234567890"
                        keyboardType="phone-pad"
                        value={newCustomerPhone}
                        onChangeText={setNewCustomerPhone}
                        fontFamily="Geist_400Regular"
                        fontSize={14}
                        height={44}
                      />
                    </YStack>

                    {/* Member Checkbox Switch */}
                    <TouchableOpacity
                      onPress={() => setNewCustomerIsMember(!newCustomerIsMember)}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: newCustomerIsMember ? '#FFF3E0' : '#FAFAFA',
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: newCustomerIsMember ? '#FF5722' : '#E4E4E7',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <XStack ai="center" gap={10}>
                        <Ionicons
                          name={newCustomerIsMember ? 'star' : 'star-outline'}
                          size={20}
                          color={newCustomerIsMember ? '#FF5722' : '#71717A'}
                        />
                        <YStack>
                          <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                            Daftarkan sebagai Member VIP
                          </Text>
                          <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                            Pelanggan akan mendapat poin & diskon khusus member
                          </Text>
                        </YStack>
                      </XStack>

                      <Ionicons
                        name={newCustomerIsMember ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={newCustomerIsMember ? '#FF5722' : '#A1A1AA'}
                      />
                    </TouchableOpacity>

                    {/* Form Action Buttons */}
                    <XStack gap={10} mt={6}>
                      <Button
                        f={1}
                        size="$4"
                        br={12}
                        backgroundColor="#F4F4F5"
                        onPress={() => setIsAddingCustomer(false)}
                      >
                        <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>
                          Batal
                        </Text>
                      </Button>
                      <Button
                        f={1.5}
                        size="$4"
                        br={12}
                        backgroundColor="#FF5722"
                        onPress={handleSaveNewCustomer}
                      >
                        <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                          Simpan Pelanggan
                        </Text>
                      </Button>
                    </XStack>
                  </YStack>
                )}
              </YStack>
            </Animated.View>
          </View>
        </Modal>

        {/* ── CUSTOM ALERT / CONFIRMATION MODAL ── */}
        <Modal
          visible={customAlert.visible}
          transparent
          animationType="fade"
          onRequestClose={closeAlert}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeAlert} />
            <Animated.View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                padding: 24,
                width: '100%',
                maxWidth: 380,
                alignItems: 'center',
                gap: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 24,
                elevation: 16,
                borderWidth: 1,
                borderColor: '#F4F4F5',
              }}
            >
              {/* Icon Badge Container */}
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: customAlert.iconBgColor || '#FFF3E0',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 4,
                }}
              >
                <Ionicons
                  name={customAlert.iconName || 'alert-circle'}
                  size={32}
                  color={customAlert.iconColor || '#FF5722'}
                />
              </View>

              {/* Text Info */}
              <YStack ai="center" gap={6} px={4}>
                <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B" ta="center">
                  {customAlert.title}
                </Text>
                <Text fontFamily="Geist_400Regular" fontSize={13} color="#52525B" ta="center" lh={20}>
                  {customAlert.message}
                </Text>
              </YStack>

              {/* Action Buttons */}
              <XStack gap={10} w="100%" mt={8}>
                {(customAlert.buttons && customAlert.buttons.length > 0
                  ? customAlert.buttons
                  : [{ text: 'OK', style: 'default' as const }]
                ).map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  return (
                    <Button
                      key={idx}
                      f={1}
                      size="$4"
                      br={12}
                      backgroundColor={
                        isCancel
                          ? '#F4F4F5'
                          : isDestructive
                          ? '#EF4444'
                          : '#FF5722'
                      }
                      onPress={() => {
                        closeAlert();
                        if (btn.onPress) btn.onPress();
                      }}
                    >
                      <Text
                        fontFamily="Geist_700Bold"
                        color={isCancel ? '#52525B' : 'white'}
                        fontSize={13}
                      >
                        {btn.text}
                      </Text>
                    </Button>
                  );
                })}
              </XStack>
            </Animated.View>
          </View>
        </Modal>

        {/* ── SIDEBAR DRAWER ── */}
        {sidebarOpen && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Dim Overlay */}
            <Animated.View
              style={[styles.sidebarOverlay, { opacity: overlayAnim }]}
              pointerEvents="auto"
            >
              <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
            </Animated.View>

            {/* Drawer Panel */}
            <Animated.View
              style={[
                styles.sidebarPanel,
                { transform: [{ translateX: sidebarAnim }], paddingTop: insets.top + 16 }
              ]}
            >
              {/* Header */}
              <XStack jc="space-between" ai="center" px={20} mb={20}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={{ width: 120, height: 36, resizeMode: 'contain' }}
                />
                <TouchableOpacity onPress={closeSidebar} style={{ padding: 4 }}>
                  <Ionicons name="close" size={22} color="#52525B" />
                </TouchableOpacity>
              </XStack>

              {/* Outlet Selector Card inside Sidebar */}
              <TouchableOpacity
                onPress={() => {
                  closeSidebar();
                  setTimeout(() => openOutletModal(), 250);
                }}
                activeOpacity={0.8}
                style={{
                  marginHorizontal: 20,
                  marginBottom: 16,
                  backgroundColor: '#FAFAFA',
                  padding: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#E4E4E7',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <XStack ai="center" gap={10}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#E8FFF1', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="storefront" size={18} color="#10B981" />
                  </View>
                  <YStack>
                    <Text fontFamily="Geist_400Regular" fontSize={10} color="#71717A">
                      Outlet Aktif:
                    </Text>
                    <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                      {selectedOutlet}
                    </Text>
                  </YStack>
                </XStack>
                <Ionicons name="swap-horizontal" size={16} color="#71717A" />
              </TouchableOpacity>

              {/* Section Label */}
              <Text
                fontFamily="Geist_600SemiBold"
                fontSize={10}
                color="#A1A1AA"
                px={20}
                mb={6}
                letterSpacing={0.8}
              >
                MANAJEMEN
              </Text>

              {/* Menu Items */}
              {[
                { icon: 'fast-food-outline' as const, label: 'Kelola Menu', color: '#3F3F46', bg: '#F4F4F5', onPress: () => { closeSidebar(); setTimeout(() => router.push('/products'), 250); } },
                { icon: 'card-outline' as const, label: 'Metode Pembayaran', color: '#3F3F46', bg: '#F4F4F5', onPress: () => { closeSidebar(); setTimeout(() => router.push('/payment-methods'), 250); } },
                { icon: 'receipt-outline' as const, label: 'Riwayat Transaksi', color: '#3F3F46', bg: '#F4F4F5', onPress: () => { closeSidebar(); setTimeout(() => router.push('/transactions'), 250); } },
                { icon: 'wallet-outline' as const, label: 'Pengeluaran Resto', color: '#EF4444', bg: '#FEF2F2', onPress: () => { closeSidebar(); setTimeout(() => router.push('/expenses'), 250); } },
                { icon: 'time-outline' as const, label: 'Rekap Kas Shift', color: '#3F3F46', bg: '#F4F4F5', onPress: () => { closeSidebar(); setTimeout(() => setActiveTab('summary'), 250); } },
                { icon: 'people-outline' as const, label: 'Karyawan', color: '#3F3F46', bg: '#F4F4F5', onPress: () => { closeSidebar(); setTimeout(() => router.push('/employees'), 250); } },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.sidebarMenuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sidebarMenuIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={19} color={item.color} />
                  </View>
                  <Text fontFamily="Geist_600SemiBold" fontSize={14} color="#18181B" f={1}>
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color="#D4D4D8" />
                </TouchableOpacity>
              ))}

              {/* Divider */}
              <View style={styles.sidebarDivider} />

              {/* Section Label */}
              <Text
                fontFamily="Geist_600SemiBold"
                fontSize={10}
                color="#A1A1AA"
                px={20}
                mb={6}
                letterSpacing={0.8}
              >
                SISTEM
              </Text>

              {[
                { icon: 'settings-outline' as const, label: 'Pengaturan', color: '#3F3F46', bg: '#F4F4F5', onPress: () => { closeSidebar(); setTimeout(() => router.push('/settings'), 250); } },
                { icon: 'desktop-outline' as const, label: 'Back Office', color: '#3F3F46', bg: '#F4F4F5', onPress: () => { closeSidebar(); } },
                { icon: 'log-out-outline' as const, label: 'Keluar / Logout', color: '#EF4444', bg: '#FEF2F2', onPress: confirmLogout },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.sidebarMenuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sidebarMenuIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={19} color={item.color} />
                  </View>
                  <Text
                    fontFamily="Geist_600SemiBold"
                    fontSize={14}
                    color={item.color === '#EF4444' ? '#EF4444' : '#18181B'}
                    f={1}
                  >
                    {item.label}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color={item.color === '#EF4444' ? '#FCA5A5' : '#D4D4D8'}
                  />
                </TouchableOpacity>
              ))}

              {/* Bottom: Tagline & Version */}
              <View style={{ flex: 1 }} />
              <View style={[styles.sidebarDivider, { marginBottom: 0 }]} />
              <YStack
                px={24}
                pt={14}
                pb={Math.max(insets.bottom, 20)}
                gap={2}
              >
                <Text fontFamily="Geist_700Bold" fontSize={12} color="#71717A">
                  Bisnis Lancar, Senyum Lebar
                </Text>
                <Text fontFamily="Geist_400Regular" fontSize={11} color="#A1A1AA">
                  Soodap POS • Versi 1.0.0
                </Text>
              </YStack>
            </Animated.View>
          </View>
        )}

      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheetPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E4E7',
    alignSelf: 'center',
    marginBottom: 4,
  },
  bannerExpenseBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickManageMenuBtn: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FF5722',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  topIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  topProfileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF5722',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    paddingBottom: 140,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  mobileFloatingCartBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#18181B',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E4E4E7',
    flexDirection: 'row',
    paddingVertical: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  bottomNavTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF5722',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  // ── SIDEBAR STYLES ──
  sidebarOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sidebarPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  sidebarCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  sidebarMenuIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#F4F4F5',
    marginHorizontal: 20,
    marginVertical: 12,
  },
});
