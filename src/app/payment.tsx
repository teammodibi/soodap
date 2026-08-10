import { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView, Spinner } from 'tamagui';
import { useRouter } from 'expo-router';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { orderStore, Customer } from '../lib/orderStore';
import { paymentStore } from '../lib/paymentStore';

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Order State from Store
  const [orderState, setOrderState] = useState(orderStore.get());
  const { cart, orderType, customer, selectedOutlet, customersList } = orderState;

  // Payment Methods State from Store
  const [activePaymentMethods, setActivePaymentMethods] = useState(paymentStore.getActiveMethods());

  useEffect(() => {
    const unsubscribeOrder = orderStore.subscribe(() => {
      setOrderState(orderStore.get());
    });
    const unsubscribePayment = paymentStore.subscribe(() => {
      setActivePaymentMethods(paymentStore.getActiveMethods());
    });
    return () => {
      unsubscribeOrder();
      unsubscribePayment();
    };
  }, []);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<string>('Tunai');
  const [cashAmount, setCashAmount] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Customer Picker Modal State
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerIsMember, setNewCustomerIsMember] = useState(false);

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

  // Calculations
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const taxAndService = Math.round(subtotal * 0.1); // 10% tax
  const grandTotal = subtotal + taxAndService;

  const cashNum = parseInt(cashAmount) || 0;
  const isCashShort = paymentMethod === 'Tunai' && cashNum < grandTotal;

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
    orderStore.set({
      customersList: [created, ...customersList],
      customer: created,
    });
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerIsMember(false);
    setIsAddingCustomer(false);
    setCustomerModalVisible(false);

    showAlert({
      type: 'success',
      iconName: 'person-add-outline',
      iconColor: '#10B981',
      iconBgColor: '#E8FFF1',
      title: 'Pelanggan Ditambahkan! 🎉',
      message: `Pelanggan "${created.name}" berhasil dibuat dan dipilih.`,
    });
  }

  function handleProcessPayment() {
    if (cart.length === 0) {
      showAlert({
        type: 'warning',
        iconName: 'cart-outline',
        iconColor: '#F59E0B',
        iconBgColor: '#FEF3C7',
        title: 'Keranjang Kosong ⚠️',
        message: 'Tidak ada item yang akan dibayar. Silakan pilih menu di kasir.',
      });
      return;
    }

    if (paymentMethod === 'Tunai' && cashNum < grandTotal) {
      const shortage = grandTotal - cashNum;
      showAlert({
        type: 'warning',
        iconName: 'alert-circle',
        iconColor: '#EF4444',
        iconBgColor: '#FEE2E2',
        title: 'Uang Tunai Kurang! ⚠️',
        message: `Uang yang dimasukkan (Rp ${cashNum.toLocaleString('id-ID')}) kurang Rp ${shortage.toLocaleString('id-ID')} dari total tagihan (Rp ${grandTotal.toLocaleString('id-ID')}).`,
      });
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const changeAmount = paymentMethod === 'Tunai' ? Math.max(0, cashNum - grandTotal) : 0;
      const custName = customer.name;

      orderStore.clearCart();

      showAlert({
        type: 'success',
        iconName: 'checkmark-done-circle-outline',
        iconColor: '#10B981',
        iconBgColor: '#E8FFF1',
        title: 'Transaksi Berhasil! 🎉',
        message: `Pelanggan: ${custName}\nMetode: ${paymentMethod}${paymentMethod === 'Tunai' ? `\nKembalian: Rp ${changeAmount.toLocaleString('id-ID')}` : ''}\n\nStruk dicetak & pesanan dikirim ke dapur.`,
        buttons: [
          {
            text: 'Kembali ke Kasir',
            style: 'default',
            onPress: () => {
              router.replace('/');
            },
          },
        ],
      });
    }, 1200);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      {/* ── HEADER BAR ── */}
      <XStack
        backgroundColor="white"
        px={16}
        py={12}
        pt={insets.top + 8}
        borderBottomWidth={1}
        borderColor="#E4E4E7"
        ai="center"
        jc="space-between"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons name="arrow-back" size={22} color="#FF5722" />
          <Text fontFamily="Geist_700Bold" fontSize={14} color="#FF5722">
            Kembali ke Kasir
          </Text>
        </TouchableOpacity>

        <XStack ai="center" gap={8}>
          <Ionicons name="card" size={20} color="#FF5722" />
          <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
            Halaman Pembayaran
          </Text>
        </XStack>

        <View style={{ backgroundColor: '#E8FFF1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
          <Text fontFamily="Geist_700Bold" fontSize={11} color="#10B981">
            {selectedOutlet}
          </Text>
        </View>
      </XStack>

      {/* ── MAIN CONTENT AREA ── */}
      <ScrollView f={1} p={16} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <XStack
          gap={16}
          flexDirection={isMobile ? 'column' : 'row'}
          maxWidth={1000}
          alignSelf="center"
          w="100%"
        >
          {/* ── LEFT COLUMN: RINGKASAN PESANAN & PELANGGAN ── */}
          <YStack f={isMobile ? undefined : 1} gap={14}>
            {/* Customer Card */}
            <YStack backgroundColor="white" p={14} br={16} borderWidth={1} borderColor="#E4E4E7" gap={10}>
              <XStack jc="space-between" ai="center">
                <Text fontFamily="Geist_700Bold" fontSize={13} color="#71717A">
                  Informasi Pelanggan
                </Text>
                <TouchableOpacity onPress={() => setCustomerModalVisible(true)}>
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="#FF5722">
                    Ubah Pelanggan {'>'}
                  </Text>
                </TouchableOpacity>
              </XStack>

              <XStack ai="center" gap={10} backgroundColor="#FAFAFA" p={10} br={12} borderWidth={1} borderColor="#F4F4F5">
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: customer.isMember ? '#FFF3E0' : '#F4F4F5',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons
                    name={customer.isMember ? 'star' : 'person'}
                    size={20}
                    color={customer.isMember ? '#FF5722' : '#71717A'}
                  />
                </View>
                <YStack f={1}>
                  <XStack ai="center" gap={6}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#18181B">
                      {customer.name}
                    </Text>
                    {customer.isMember && (
                      <View style={{ backgroundColor: '#FF5722', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                        <Text color="white" fontFamily="Geist_800ExtraBold" fontSize={9}>
                          MEMBER VIP
                        </Text>
                      </View>
                    )}
                  </XStack>
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                    {customer.phone !== '-' ? customer.phone : 'Pelanggan Umum (Walk-in)'}
                  </Text>
                </YStack>

                <View style={{ backgroundColor: '#FFF3E0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text fontFamily="Geist_700Bold" fontSize={11} color="#FF5722">
                    {orderType}
                  </Text>
                </View>
              </XStack>
            </YStack>

            {/* Order Items Summary Card */}
            <YStack backgroundColor="white" p={14} br={16} borderWidth={1} borderColor="#E4E4E7" gap={10}>
              <XStack jc="space-between" ai="center">
                <Text fontFamily="Geist_700Bold" fontSize={13} color="#71717A">
                  Rincian Item ({totalItemCount} Item)
                </Text>
              </XStack>

              {cart.length === 0 ? (
                <YStack py={24} ai="center" gap={6}>
                  <Ionicons name="cart-outline" size={36} color="#D4D4D8" />
                  <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#A1A1AA">
                    Belum ada menu di keranjang.
                  </Text>
                </YStack>
              ) : (
                <YStack gap={8}>
                  {cart.map(item => (
                    <XStack
                      key={item.menuItem.id}
                      backgroundColor="#FAFAFA"
                      p={10}
                      br={12}
                      borderWidth={1}
                      borderColor="#F4F4F5"
                      jc="space-between"
                      ai="center"
                    >
                      <YStack f={1} mr={8}>
                        <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B" numberOfLines={1}>
                          {item.menuItem.name}
                        </Text>
                        <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                          {item.quantity}x @ Rp {item.menuItem.price.toLocaleString('id-ID')}
                        </Text>
                      </YStack>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#FF5722">
                        Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}
                      </Text>
                    </XStack>
                  ))}
                </YStack>
              )}

              {/* Price Breakdown */}
              <YStack pt={10} borderTopWidth={1} borderColor="#E4E4E7" gap={4}>
                <XStack jc="space-between">
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">Subtotal</Text>
                  <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#18181B">Rp {subtotal.toLocaleString('id-ID')}</Text>
                </XStack>
                <XStack jc="space-between">
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">PB1 & Service (10%)</Text>
                  <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#18181B">Rp {taxAndService.toLocaleString('id-ID')}</Text>
                </XStack>
                <XStack jc="space-between" mt={4} pt={6} borderTopWidth={1} borderColor="#F4F4F5">
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">Total Tagihan</Text>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#FF5722">Rp {grandTotal.toLocaleString('id-ID')}</Text>
                </XStack>
              </YStack>
            </YStack>
          </YStack>

          {/* ── RIGHT COLUMN: METODE PEMBAYARAN & PROCESS ── */}
          <YStack f={isMobile ? undefined : 1.1} gap={14}>
            <YStack backgroundColor="white" p={16} br={16} borderWidth={1} borderColor="#E4E4E7" gap={14}>
              {/* Payment Method Switcher */}
              <YStack gap={6}>
                <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                  Pilih Metode Pembayaran
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <XStack gap={8} py={2}>
                    {activePaymentMethods.map(method => {
                      const isSelected = paymentMethod === method.type || paymentMethod === method.name;
                      return (
                        <TouchableOpacity
                          key={method.id}
                          onPress={() => setPaymentMethod(method.type)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: 'center',
                            flexDirection: 'row',
                            gap: 6,
                            backgroundColor: isSelected ? '#FF5722' : '#F4F4F5',
                            borderWidth: 1,
                            borderColor: isSelected ? '#FF5722' : '#E4E4E7',
                          }}
                        >
                          <Ionicons
                            name={method.iconName as any}
                            size={16}
                            color={isSelected ? 'white' : '#52525B'}
                          />
                          <Text fontFamily="Geist_800ExtraBold" fontSize={13} color={isSelected ? 'white' : '#3F3F46'}>
                            {method.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </XStack>
                </ScrollView>
              </YStack>

              {/* Dynamic Inputs according to Payment Method */}
              {paymentMethod === 'Tunai' ? (
                <YStack gap={12}>
                  {/* Uang Diterima Input */}
                  <YStack gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                      Nominal Uang Tunai Diterima (Rp)
                    </Text>
                    <Input
                      backgroundColor="#FAFAFA"
                      borderWidth={1.5}
                      borderColor={cashAmount && cashNum < grandTotal ? '#EF4444' : '#FF5722'}
                      br={10}
                      placeholder="Contoh: 100000"
                      keyboardType="number-pad"
                      value={cashAmount}
                      onChangeText={setCashAmount}
                      fontFamily="Geist_800ExtraBold"
                      fontSize={20}
                      textAlign="center"
                      height={48}
                    />
                  </YStack>

                  {/* Preset Nominal Buttons */}
                  <YStack gap={6}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                      Pilihan Uang Cepat (Instan):
                    </Text>
                    <XStack gap={6} flexWrap="wrap">
                      <TouchableOpacity
                        onPress={() => setCashAmount(grandTotal.toString())}
                        style={{
                          flex: 1,
                          minWidth: 70,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: cashAmount === grandTotal.toString() ? '#FF5722' : '#F4F4F5',
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: cashAmount === grandTotal.toString() ? '#FF5722' : '#E4E4E7',
                        }}
                      >
                        <Text fontFamily="Geist_700Bold" fontSize={12} color={cashAmount === grandTotal.toString() ? 'white' : '#27272A'}>
                          Uang Pas
                        </Text>
                      </TouchableOpacity>

                      {[50000, 100000, 200000, 500000].map(val => (
                        <TouchableOpacity
                          key={val}
                          onPress={() => setCashAmount(val.toString())}
                          style={{
                            flex: 1,
                            minWidth: 70,
                            paddingVertical: 8,
                            borderRadius: 8,
                            backgroundColor: cashAmount === val.toString() ? '#FF5722' : '#F4F4F5',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: cashAmount === val.toString() ? '#FF5722' : '#E4E4E7',
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={12} color={cashAmount === val.toString() ? 'white' : '#27272A'}>
                            {(val / 1000).toLocaleString('id-ID')}k
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </XStack>
                  </YStack>

                  {/* Real-time Kembalian Status Banner */}
                  {(() => {
                    if (!cashAmount) {
                      return (
                        <XStack backgroundColor="#FAFAFA" p={10} br={10} ai="center" jc="center">
                          <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                            Tekan tombol uang cepat di atas atau masukkan jumlah uang tunai.
                          </Text>
                        </XStack>
                      );
                    }
                    if (cashNum < grandTotal) {
                      const shortage = grandTotal - cashNum;
                      return (
                        <XStack backgroundColor="#FEE2E2" p={12} br={12} borderWidth={1} borderColor="#FCA5A5" ai="center" jc="space-between">
                          <XStack ai="center" gap={6}>
                            <Ionicons name="alert-circle" size={18} color="#EF4444" />
                            <Text fontFamily="Geist_700Bold" fontSize={13} color="#B91C1C">
                              Uang Tunai Kurang
                            </Text>
                          </XStack>
                          <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#EF4444">
                            - Rp {shortage.toLocaleString('id-ID')}
                          </Text>
                        </XStack>
                      );
                    }
                    const change = cashNum - grandTotal;
                    return (
                      <XStack backgroundColor="#E8FFF1" p={12} br={12} borderWidth={1} borderColor="#6EE7B7" ai="center" jc="space-between">
                        <XStack ai="center" gap={6}>
                          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                          <Text fontFamily="Geist_700Bold" fontSize={14} color="#047857">
                            Kembalian Pembeli
                          </Text>
                        </XStack>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#10B981">
                          Rp {change.toLocaleString('id-ID')}
                        </Text>
                      </XStack>
                    );
                  })()}
                </YStack>
              ) : paymentMethod === 'QRIS' ? (
                <YStack backgroundColor="#FFF3E0" p={16} br={14} borderWidth={1} borderColor="#FFCC80" ai="center" gap={8}>
                  <Ionicons name="qr-code" size={48} color="#FF5722" />
                  <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#18181B" ta="center">
                    QRIS Standar Pembayaran Nasional
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A" ta="center" lh={18}>
                    Tampilkan kode QR pada layar / EDC kepada pembeli. Sistem secara otomatis memverifikasi saat transaksi selesai.
                  </Text>
                </YStack>
              ) : (
                <YStack gap={4}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                    Nomor Referensi Struk Bank / Approval Code (Opsional)
                  </Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    br={10}
                    placeholder="Contoh: REF-984210"
                    value={refNumber}
                    onChangeText={setRefNumber}
                    fontFamily="Geist_600SemiBold"
                    fontSize={14}
                    height={44}
                  />
                </YStack>
              )}

              {/* Main Submit Payment Button */}
              <Button
                size="$5"
                br={14}
                backgroundColor={isCashShort ? '#A1A1AA' : '#10B981'}
                onPress={handleProcessPayment}
                disabled={isProcessing || isCashShort || cart.length === 0}
                icon={isProcessing ? <Spinner color="white" /> : undefined}
                mt={6}
              >
                <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={16}>
                  {isProcessing
                    ? 'Memproses Struk...'
                    : isCashShort
                    ? 'Uang Tunai Masih Kurang'
                    : `Selesaikan Pembayaran (Rp ${grandTotal.toLocaleString('id-ID')})`}
                </Text>
              </Button>
            </YStack>
          </YStack>
        </XStack>
      </ScrollView>

      {/* ── MODAL PILIH / TAMBAH PELANGGAN ── */}
      <Modal
        visible={customerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCustomerModalVisible(false)} />
          <View style={[styles.modalSheetPanel, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.sheetHandle} />
            <YStack gap={14} mt={6}>
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

                <TouchableOpacity onPress={() => setCustomerModalVisible(false)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={22} color="#52525B" />
                </TouchableOpacity>
              </XStack>

              {!isAddingCustomer ? (
                <YStack gap={12}>
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

                  <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                    <YStack gap={8}>
                      {customersList
                        .filter(c =>
                          c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                          (c.phone && c.phone.includes(customerSearchQuery))
                        )
                        .map(cust => {
                          const isSelected = customer.id === cust.id;
                          return (
                            <TouchableOpacity
                              key={cust.id}
                              onPress={() => {
                                orderStore.set({ customer: cust });
                                setCustomerModalVisible(false);
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
                          Pelanggan mendapat poin & diskon khusus
                        </Text>
                      </YStack>
                    </XStack>

                    <Ionicons
                      name={newCustomerIsMember ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={newCustomerIsMember ? '#FF5722' : '#A1A1AA'}
                    />
                  </TouchableOpacity>

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
          </View>
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

            <YStack ai="center" gap={6} px={4}>
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B" ta="center">
                {customAlert.title}
              </Text>
              <Text fontFamily="Geist_400Regular" fontSize={13} color="#52525B" ta="center" lh={20}>
                {customAlert.message}
              </Text>
            </YStack>

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
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheetPanel: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E4E7',
    alignSelf: 'center',
    marginBottom: 12,
  },
});
