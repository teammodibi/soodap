import { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Input, TextArea, ScrollView } from 'tamagui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Pressable,
  Modal,
  Switch,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { productStore, DiscountItem, PromoScope, ProductItem } from '../lib/productStore';
import { getActiveSession } from '../lib/session';

export default function AddDiscountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string }>();
  const isEditMode = Boolean(params.editId);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Reactive Store State
  const [storeState, setStoreState] = useState(productStore.get());
  const { products, categories, discounts } = storeState;

  useEffect(() => {
    const unsubscribe = productStore.subscribe(() => {
      setStoreState(productStore.get());
    });
    return unsubscribe;
  }, []);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [scope, setScope] = useState<PromoScope>('global_coupon');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [appliedProductIds, setAppliedProductIds] = useState<string[]>([]);
  const [showAdvancedRules, setShowAdvancedRules] = useState(false);

  // Menu Selection Modal / Filter State
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('Semua');

  // Custom Alert
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'warning',
  });

  function showAlert(
    title: string,
    message: string,
    type: 'success' | 'warning' | 'error' = 'warning',
    onConfirm?: () => void
  ) {
    setCustomAlert({ visible: true, title, message, type, onConfirm });
  }

  // Prepopulate if editing existing discount
  useEffect(() => {
    if (params.editId) {
      const disc = productStore.get().discounts.find(d => d.id === params.editId);
      if (disc) {
        setName(disc.name);
        setCode(disc.code);
        setScope(disc.scope || 'global_coupon');
        setDiscountType(disc.type);
        setDiscountValue(disc.value.toString());
        setMinPurchase(disc.minPurchase ? disc.minPurchase.toLocaleString('id-ID') : '');
        setMaxDiscount(disc.maxDiscount ? disc.maxDiscount.toLocaleString('id-ID') : '');
        setDescription(disc.description || '');
        setIsActive(disc.isActive);
        setAppliedProductIds(disc.appliedProductIds || []);
        if (disc.minPurchase || disc.maxDiscount || disc.description) {
          setShowAdvancedRules(true);
        }
      }
    }
  }, [params.editId]);

  function formatNumberWithDots(val: string): string {
    const digitsOnly = val.replace(/\D/g, '');
    if (!digitsOnly) return '';
    return parseInt(digitsOnly, 10).toLocaleString('id-ID');
  }

  function generateRandomCode() {
    const prefix = name.trim() ? name.trim().substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') : 'PROMO';
    const num = Math.floor(100 + Math.random() * 900);
    setCode(`${prefix || 'PROMO'}${num}`);
  }

  const numVal = parseInt(discountValue.replace(/\D/g, '')) || 0;
  const numMinPurchase = parseInt(minPurchase.replace(/\D/g, '')) || 0;
  const numMaxDiscount = parseInt(maxDiscount.replace(/\D/g, '')) || 0;

  // Toggle selection for a product
  function toggleProductSelection(prodId: string) {
    setAppliedProductIds(prev =>
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  }

  function handleSelectAllVisibleProducts(visibleProds: ProductItem[]) {
    const visibleIds = visibleProds.map(p => p.id);
    const allSelected = visibleIds.every(id => appliedProductIds.includes(id));
    if (allSelected) {
      setAppliedProductIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setAppliedProductIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  }

  function handleSaveDiscount() {
    if (!name.trim()) {
      showAlert('Perhatian', 'Nama Promo / Diskon tidak boleh kosong.');
      return;
    }

    if (scope === 'global_coupon' && !code.trim()) {
      showAlert('Perhatian', 'Kode Voucher Kupon tidak boleh kosong untuk tipe kupon.');
      return;
    }

    if (numVal <= 0) {
      showAlert('Perhatian', 'Nilai diskon harus lebih besar dari 0.');
      return;
    }

    if (discountType === 'percentage' && numVal > 100) {
      showAlert('Perhatian', 'Diskon persentase tidak boleh lebih dari 100%.');
      return;
    }

    if (scope === 'menu_specific' && appliedProductIds.length === 0) {
      showAlert('Perhatian', 'Harap pilih minimal satu menu untuk diskon langsung menu.');
      return;
    }

    const session = getActiveSession();
    const storeName = session?.storeName || 'Outlet Resto Utama';
    const userId = session?.userId || 'owner-1';

    const discountPayload: Omit<DiscountItem, 'id'> = {
      name: name.trim(),
      code: scope === 'global_coupon' ? code.trim().toUpperCase() : (code.trim().toUpperCase() || `PROMO_${Date.now().toString().slice(-4)}`),
      scope,
      type: discountType,
      value: numVal,
      minPurchase: numMinPurchase > 0 ? numMinPurchase : undefined,
      maxDiscount: numMaxDiscount > 0 ? numMaxDiscount : undefined,
      appliedProductIds: scope === 'menu_specific' ? appliedProductIds : undefined,
      description: description.trim() || undefined,
      isActive,
      storeName,
      userId,
    };

    if (isEditMode && params.editId) {
      productStore.updateDiscount(params.editId, discountPayload);
      showAlert(
        'Promo Berhasil Diperbarui! 🎉',
        `Perubahan pada promo "${name.trim()}" telah disimpan.`,
        'success',
        () => {
          router.back();
        }
      );
      return;
    }

    productStore.addDiscount(discountPayload);
    showAlert(
      'Promo Berhasil Dibuat! 🎉',
      `Promo "${name.trim()}" telah aktif dan siap digunakan di Kasir POS.`,
      'success',
      () => {
        router.back();
      }
    );
  }

  // Filtered products for modal selection
  const allOrderedCategories = Array.from(new Set(['Semua', ...categories]));
  const filteredProductsForSelection = products.filter(p => {
    const matchCat = selectedMenuCategory === 'Semua' || p.category === selectedMenuCategory;
    const matchSearch =
      !menuSearchQuery ||
      p.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(menuSearchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Example product for preview
  const sampleProduct: ProductItem =
    products.find(p => appliedProductIds.includes(p.id)) ||
    products[0] || {
      id: 'sample_1',
      name: 'Kopi Susu Gula Aren Spesial',
      category: 'Coffee',
      sellingPrice: 25000,
      costPrice: 10000,
      stock: 99,
      trackStock: false,
    };

  const originalPrice = sampleProduct.sellingPrice;
  let sampleDiscountAmount =
    discountType === 'percentage' ? Math.round((originalPrice * numVal) / 100) : numVal;
  if (numMaxDiscount > 0 && sampleDiscountAmount > numMaxDiscount) {
    sampleDiscountAmount = numMaxDiscount;
  }
  const sampleDiscountedPrice = Math.max(0, originalPrice - sampleDiscountAmount);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        {/* ── HEADER BAR ── */}
        <XStack
          backgroundColor="white"
          px={isMobile ? 16 : 24}
          py={12}
          pt={insets.top + 8}
          borderBottomWidth={1}
          borderColor="#F4F4F5"
          ai="center"
          jc="space-between"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}
          >
            <Ionicons name="chevron-back" size={24} color="#FF5722" />
            <Text fontFamily="Geist_700Bold" fontSize={15} color="#FF5722">
              Kembali
            </Text>
          </TouchableOpacity>

          <Text fontFamily="Geist_800ExtraBold" fontSize={17} color="#18181B">
            {isEditMode ? 'Edit Diskon & Promo' : 'Tambah Diskon & Promo'}
          </Text>

          <View style={{ width: 70 }} />
        </XStack>

        {/* ── UNDERLINE TAB BAR (TIDAK BOXED, PERSIS SEPERTI KELOLA MENU DEPAN) ── */}
        <XStack
          backgroundColor="white"
          borderBottomWidth={1}
          borderColor="#F4F4F5"
          px={isMobile ? 12 : 24}
        >
          {/* Tab 1: Kupon Voucher */}
          <TouchableOpacity
            onPress={() => setScope('global_coupon')}
            activeOpacity={0.7}
            style={{
              flex: 1,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Text
              fontFamily={scope === 'global_coupon' ? 'Geist_800ExtraBold' : 'Geist_600SemiBold'}
              fontSize={14}
              color={scope === 'global_coupon' ? '#FF5722' : '#71717A'}
              numberOfLines={1}
            >
              Kupon Voucher
            </Text>
            {scope === 'global_coupon' && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 8,
                  right: 8,
                  height: 3,
                  backgroundColor: '#FF5722',
                  borderTopLeftRadius: 3,
                  borderTopRightRadius: 3,
                }}
              />
            )}
          </TouchableOpacity>

          {/* Tab 2: Diskon Menu */}
          <TouchableOpacity
            onPress={() => setScope('menu_specific')}
            activeOpacity={0.7}
            style={{
              flex: 1,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Text
              fontFamily={scope === 'menu_specific' ? 'Geist_800ExtraBold' : 'Geist_600SemiBold'}
              fontSize={14}
              color={scope === 'menu_specific' ? '#FF5722' : '#71717A'}
              numberOfLines={1}
            >
              Diskon Menu
            </Text>
            {scope === 'menu_specific' && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 8,
                  right: 8,
                  height: 3,
                  backgroundColor: '#FF5722',
                  borderTopLeftRadius: 3,
                  borderTopRightRadius: 3,
                }}
              />
            )}
          </TouchableOpacity>

          {/* Tab 3: Otomatis Nota */}
          <TouchableOpacity
            onPress={() => setScope('automatic_bill')}
            activeOpacity={0.7}
            style={{
              flex: 1,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Text
              fontFamily={scope === 'automatic_bill' ? 'Geist_800ExtraBold' : 'Geist_600SemiBold'}
              fontSize={14}
              color={scope === 'automatic_bill' ? '#FF5722' : '#71717A'}
              numberOfLines={1}
            >
              Otomatis Nota
            </Text>
            {scope === 'automatic_bill' && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 8,
                  right: 8,
                  height: 3,
                  backgroundColor: '#FF5722',
                  borderTopLeftRadius: 3,
                  borderTopRightRadius: 3,
                }}
              />
            )}
          </TouchableOpacity>
        </XStack>

        {/* ── FORM CONTAINER (CLEAN FLAT LAYOUT, TANPA NESTED BOXED CARDS) ── */}
        <ScrollView
          f={1}
          backgroundColor="white"
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          <YStack
            gap={18}
            maxWidth={650}
            alignSelf="center"
            w="100%"
            px={isMobile ? 16 : 24}
            py={18}
            backgroundColor="white"
          >
            {/* 1. NAMA PROMO */}
            <YStack gap={6}>
              <Text fontFamily="Geist_700Bold" fontSize={15} color="#18181B">
                Nama Promo / Diskon *
              </Text>
              <Input
                backgroundColor="#FAFAFA"
                borderWidth={1}
                borderColor="#E4E4E7"
                br={12}
                placeholder="Contoh: Promo Kopi Merdeka 20%, Diskon Pelajar"
                value={name}
                onChangeText={setName}
                fontFamily="Geist_600SemiBold"
                fontSize={15}
                height={48}
              />
            </YStack>

            {/* 2. KODE VOUCHER (Khusus Kupon) */}
            {scope === 'global_coupon' && (
              <YStack gap={6}>
                <XStack jc="space-between" ai="center">
                  <Text fontFamily="Geist_700Bold" fontSize={15} color="#18181B">
                    Kode Voucher Kupon *
                  </Text>
                  <TouchableOpacity onPress={generateRandomCode}>
                    <Text fontFamily="Geist_700Bold" fontSize={13} color="#FF5722">
                      🎲 Acak Kode
                    </Text>
                  </TouchableOpacity>
                </XStack>
                <Input
                  backgroundColor="#FAFAFA"
                  borderWidth={1}
                  borderColor="#E4E4E7"
                  br={12}
                  placeholder="Contoh: HEMAT10, KOPI20, JUMATBERKAH"
                  value={code}
                  onChangeText={val => setCode(val.toUpperCase())}
                  autoCapitalize="characters"
                  fontFamily="Geist_800ExtraBold"
                  fontSize={15}
                  height={48}
                />
              </YStack>
            )}

            {/* 3. MENU YANG DIDISKON (Khusus Diskon Menu Tertentu) */}
            {scope === 'menu_specific' && (
              <YStack gap={10}>
                <XStack jc="space-between" ai="center">
                  <YStack>
                    <Text fontFamily="Geist_700Bold" fontSize={15} color="#18181B">
                      Pilih Menu Terdiskon *
                    </Text>
                    <Text fontFamily="Geist_500Medium" fontSize={12} color="#71717A">
                      {appliedProductIds.length} dari {products.length} menu terpilih
                    </Text>
                  </YStack>

                  <Button
                    size="$3"
                    br={10}
                    backgroundColor="#FFF3E0"
                    borderWidth={1}
                    borderColor="#FFCC80"
                    onPress={() => setMenuModalVisible(true)}
                  >
                    <XStack ai="center" gap={4}>
                      <Ionicons name="list" size={16} color="#FF5722" />
                      <Text fontFamily="Geist_700Bold" fontSize={13} color="#FF5722">
                        Pilih Menu ({appliedProductIds.length})
                      </Text>
                    </XStack>
                  </Button>
                </XStack>

                {/* List Selected Menu Badges */}
                {appliedProductIds.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {appliedProductIds.map(prodId => {
                      const prod = products.find(p => p.id === prodId);
                      if (!prod) return null;
                      return (
                        <View
                          key={prodId}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            backgroundColor: '#FFF7ED',
                            borderWidth: 1,
                            borderColor: '#FED7AA',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 10,
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={13} color="#EA580C">
                            {prod.name}
                          </Text>
                          <TouchableOpacity onPress={() => toggleProductSelection(prodId)}>
                            <Ionicons name="close-circle" size={18} color="#EA580C" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <View
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: '#FEF2F2',
                      borderWidth: 1,
                      borderColor: '#FECACA',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Text fontFamily="Geist_700Bold" fontSize={13} color="#B91C1C">
                      Belum ada menu yang dipilih
                    </Text>
                    <Text fontFamily="Geist_500Medium" fontSize={12} color="#7F1D1D" ta="center">
                      Tekan tombol "Pilih Menu" di atas untuk menentukan menu yang mendapat diskon ini.
                    </Text>
                  </View>
                )}
              </YStack>
            )}

            {/* 4. NILAI DISKON DENGAN TOGGLE RINGKAS */}
            <YStack gap={8}>
              <Text fontFamily="Geist_700Bold" fontSize={15} color="#18181B">
                Besaran Potongan Diskon *
              </Text>

              <XStack gap={8} ai="center">
                {/* Toggle % / Rp */}
                <XStack backgroundColor="#F4F4F5" br={10} p={3}>
                  <TouchableOpacity
                    onPress={() => setDiscountType('percentage')}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 8,
                      backgroundColor: discountType === 'percentage' ? '#FF5722' : 'transparent',
                    }}
                  >
                    <Text
                      fontFamily="Geist_800ExtraBold"
                      fontSize={14}
                      color={discountType === 'percentage' ? 'white' : '#52525B'}
                    >
                      %
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDiscountType('fixed')}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 8,
                      backgroundColor: discountType === 'fixed' ? '#FF5722' : 'transparent',
                    }}
                  >
                    <Text
                      fontFamily="Geist_800ExtraBold"
                      fontSize={14}
                      color={discountType === 'fixed' ? 'white' : '#52525B'}
                    >
                      Rp
                    </Text>
                  </TouchableOpacity>
                </XStack>

                {/* Input Nilai */}
                <Input
                  f={1}
                  backgroundColor="#FAFAFA"
                  borderWidth={1}
                  borderColor="#E4E4E7"
                  br={12}
                  placeholder={discountType === 'percentage' ? 'Contoh: 20' : 'Contoh: 10.000'}
                  keyboardType="numeric"
                  value={discountType === 'fixed' ? formatNumberWithDots(discountValue) : discountValue}
                  onChangeText={setDiscountValue}
                  fontFamily="Geist_800ExtraBold"
                  fontSize={16}
                  height={48}
                />
              </XStack>

              {/* Quick Preset Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingTop: 2 }}>
                {(discountType === 'percentage'
                  ? [5, 10, 15, 20, 25, 50]
                  : [2000, 5000, 10000, 15000, 20000, 50000]
                ).map(preset => {
                  const isPresetActive = numVal === preset;
                  const label = discountType === 'percentage' ? `${preset}%` : `Rp ${preset.toLocaleString('id-ID')}`;
                  return (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => setDiscountValue(preset.toString())}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: isPresetActive ? '#FF5722' : '#F4F4F5',
                        borderWidth: 1,
                        borderColor: isPresetActive ? '#FF5722' : '#E4E4E7',
                      }}
                    >
                      <Text
                        fontFamily="Geist_700Bold"
                        fontSize={12}
                        color={isPresetActive ? 'white' : '#52525B'}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </YStack>

            {/* 5. ACCORDION: SYARAT & ATURAN TAMBAHAN (OPSIONAL) */}
            <YStack gap={10} mt={2}>
              <TouchableOpacity
                onPress={() => setShowAdvancedRules(!showAdvancedRules)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: showAdvancedRules ? '#FFF7ED' : '#FAFAFA',
                  borderWidth: 1,
                  borderColor: showAdvancedRules ? '#FFCC80' : '#E4E4E7',
                }}
              >
                <XStack ai="center" gap={8}>
                  <Ionicons
                    name="options-outline"
                    size={18}
                    color={showAdvancedRules ? '#FF5722' : '#52525B'}
                  />
                  <Text
                    fontFamily="Geist_700Bold"
                    fontSize={14}
                    color={showAdvancedRules ? '#EA580C' : '#18181B'}
                  >
                    Syarat & Batas Promo (Opsional)
                  </Text>
                  {(numMinPurchase > 0 || numMaxDiscount > 0 || description.trim().length > 0) && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#FF5722',
                      }}
                    />
                  )}
                </XStack>

                <XStack ai="center" gap={4}>
                  <Text
                    fontFamily="Geist_500Medium"
                    fontSize={12}
                    color={showAdvancedRules ? '#EA580C' : '#71717A'}
                  >
                    {showAdvancedRules ? 'Tutup' : 'Buka'}
                  </Text>
                  <Ionicons
                    name={showAdvancedRules ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={showAdvancedRules ? '#EA580C' : '#71717A'}
                  />
                </XStack>
              </TouchableOpacity>

              {showAdvancedRules && (
                <YStack
                  gap={14}
                  p={14}
                  br={14}
                  backgroundColor="#FAFAFA"
                  borderWidth={1}
                  borderColor="#E4E4E7"
                >
                  {/* Batas Maksimal Potongan (Khusus %) */}
                  {discountType === 'percentage' && (
                    <YStack gap={6}>
                      <YStack gap={1}>
                        <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                          Batas Maksimal Potongan (Maks. Diskon)
                        </Text>
                        <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                          Batas potongan diskon tertinggi (mentok) agar resto tidak rugi saat pesanan besar.
                        </Text>
                      </YStack>
                      <Input
                        backgroundColor="white"
                        borderWidth={1}
                        borderColor="#E4E4E7"
                        br={10}
                        placeholder="Contoh: 25.000 (Kosongkan jika tanpa batas)"
                        keyboardType="numeric"
                        value={formatNumberWithDots(maxDiscount)}
                        onChangeText={setMaxDiscount}
                        fontFamily="Geist_600SemiBold"
                        fontSize={14}
                        height={44}
                      />
                    </YStack>
                  )}

                  {/* Minimal Belanja */}
                  <YStack gap={6}>
                    <YStack gap={1}>
                      <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                        Minimal Total Belanja Transaksi
                      </Text>
                      <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                        Syarat belanja minimum agar promo ini aktif di nota kasir.
                      </Text>
                    </YStack>
                    <Input
                      backgroundColor="white"
                      borderWidth={1}
                      borderColor="#E4E4E7"
                      br={10}
                      placeholder="Contoh: 50.000 (Kosongkan jika tanpa syarat belanja)"
                      keyboardType="numeric"
                      value={formatNumberWithDots(minPurchase)}
                      onChangeText={setMinPurchase}
                      fontFamily="Geist_600SemiBold"
                      fontSize={14}
                      height={44}
                    />
                  </YStack>

                  {/* Deskripsi / Catatan Promo */}
                  <YStack gap={6}>
                    <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                      Catatan / Keterangan Promo
                    </Text>
                    <TextArea
                      backgroundColor="white"
                      borderWidth={1}
                      borderColor="#E4E4E7"
                      br={10}
                      placeholder="Contoh: Berlaku khusus makan di tempat (Dine In)."
                      value={description}
                      onChangeText={setDescription}
                      fontFamily="Geist_500Medium"
                      fontSize={13}
                      minHeight={54}
                    />
                  </YStack>
                </YStack>
              )}
            </YStack>

            {/* 6. STATUS PROMO AKTIF */}
            <XStack
              jc="space-between"
              ai="center"
              py={2}
            >
              <YStack gap={2} f={1} pr={10}>
                <Text fontFamily="Geist_700Bold" fontSize={15} color="#18181B">
                  Status Promo Aktif
                </Text>
                <Text fontFamily="Geist_500Medium" fontSize={12} color="#71717A">
                  Promo aktif dapat langsung digunakan di Kasir POS.
                </Text>
              </YStack>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#E4E4E7', true: '#FF5722' }}
                thumbColor="white"
              />
            </XStack>

            {/* ── RINGKASAN LIVE PREVIEW PROMO (COMPACT & SLEEK) ── */}
            <YStack gap={8} pt={4}>
              <XStack jc="space-between" ai="center">
                <XStack ai="center" gap={6}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                  <Text fontFamily="Geist_700Bold" fontSize={14} color="#71717A">
                    Preview Tampilan di POS
                  </Text>
                </XStack>
                <Text fontFamily="Geist_700Bold" fontSize={12} color="#FF5722">
                  {scope === 'global_coupon' ? 'Kupon Voucher' : scope === 'menu_specific' ? 'Diskon Menu' : 'Otomatis Nota'}
                </Text>
              </XStack>

              {/* Compact Ticket Preview (Kupon) */}
              {scope === 'global_coupon' && (
                <XStack
                  backgroundColor="#FFF7ED"
                  p={12}
                  br={12}
                  borderWidth={1.5}
                  borderColor="#FFCC80"
                  borderStyle="dashed"
                  ai="center"
                  jc="space-between"
                >
                  <XStack ai="center" gap={10} f={1} pr={8}>
                    <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FF5722', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="ticket" size={20} color="white" />
                    </View>
                    <YStack f={1}>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#18181B" numberOfLines={1}>
                        {name.trim() || 'Nama Kupon'} ({code.trim() || 'KODE'})
                      </Text>
                      <Text fontFamily="Geist_500Medium" fontSize={12} color="#71717A">
                        {numMinPurchase > 0 ? `Min. Belanja Rp ${numMinPurchase.toLocaleString('id-ID')}` : 'Tanpa Min. Belanja'}
                      </Text>
                    </YStack>
                  </XStack>

                  <View style={{ backgroundColor: '#FF5722', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="white">
                      {discountType === 'percentage' ? `${numVal || 0}% OFF` : `-Rp ${(numVal || 0).toLocaleString('id-ID')}`}
                    </Text>
                  </View>
                </XStack>
              )}

              {/* Compact Menu Strike Price Preview (Menu Spesifik) */}
              {scope === 'menu_specific' && (
                <XStack
                  backgroundColor="#FFF7ED"
                  p={12}
                  br={12}
                  borderWidth={1.5}
                  borderColor="#FFCC80"
                  ai="center"
                  jc="space-between"
                >
                  <XStack ai="center" gap={10} f={1} pr={8}>
                    <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="restaurant" size={20} color="#FF5722" />
                    </View>
                    <YStack f={1}>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#18181B" numberOfLines={1}>
                        {sampleProduct.name}
                      </Text>
                      <XStack ai="center" gap={6}>
                        <Text
                          fontFamily="Geist_600SemiBold"
                          fontSize={12}
                          color="#A1A1AA"
                          style={{ textDecorationLine: 'line-through' }}
                        >
                          Rp {originalPrice.toLocaleString('id-ID')}
                        </Text>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#FF5722">
                          Rp {sampleDiscountedPrice.toLocaleString('id-ID')}
                        </Text>
                      </XStack>
                    </YStack>
                  </XStack>

                  <View style={{ backgroundColor: '#E8FFF1', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 }}>
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#10B981">
                      Hemat Rp {sampleDiscountAmount.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </XStack>
              )}

              {/* Compact Auto Bill Preview (Otomatis) */}
              {scope === 'automatic_bill' && (
                <XStack
                  backgroundColor="#F0FDF4"
                  p={12}
                  br={12}
                  borderWidth={1.5}
                  borderColor="#86EFAC"
                  ai="center"
                  jc="space-between"
                >
                  <XStack ai="center" gap={10} f={1} pr={8}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="flash" size={18} color="white" />
                    </View>
                    <YStack f={1}>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#15803D" numberOfLines={1}>
                        {name.trim() || 'Promo Otomatis Nota'}
                      </Text>
                      <Text fontFamily="Geist_500Medium" fontSize={12} color="#166534">
                        {numMinPurchase > 0 ? `Min. Belanja Rp ${numMinPurchase.toLocaleString('id-ID')}` : 'Otomatis di setiap transaksi'}
                      </Text>
                    </YStack>
                  </XStack>

                  <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#15803D">
                    {discountType === 'percentage' ? `-${numVal}%` : `-Rp ${(numVal || 0).toLocaleString('id-ID')}`}
                  </Text>
                </XStack>
              )}
            </YStack>

            {/* ── TOMBOL HAPUS PROMO (HANYA MUNCUL DI EDIT MODE) ── */}
            {isEditMode && (
              <Button
                backgroundColor="#FEE2E2"
                borderColor="#FECACA"
                borderWidth={1}
                br={12}
                h={48}
                mt={6}
                onPress={() => {
                  showAlert(
                    'Hapus Promo Ini?',
                    `Apakah Anda yakin ingin menghapus promo "${name}"? Tindakan ini tidak dapat dibatalkan.`,
                    'warning',
                    () => {
                      if (params.editId) {
                        productStore.deleteDiscount(params.editId);
                        router.back();
                      }
                    }
                  );
                }}
              >
                <XStack ai="center" gap={6}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text fontFamily="Geist_700Bold" color="#DC2626" fontSize={14}>
                    Hapus Promo Ini
                  </Text>
                </XStack>
              </Button>
            )}
          </YStack>
        </ScrollView>

        {/* ── FIXED BOTTOM ACTION BAR ── */}
        <View
          style={{
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderColor: '#F4F4F5',
            shadowColor: 'rgba(0, 0, 0, 0.06)',
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -3 },
            elevation: 8,
          }}
        >
          <XStack
            px={isMobile ? 16 : 24}
            py={12}
            pb={Math.max(insets.bottom + 8, 14)}
            gap={12}
            ai="center"
            maxWidth={650}
            alignSelf="center"
            w="100%"
          >
            <Button
              f={1}
              h={48}
              br={12}
              backgroundColor="#F4F4F5"
              onPress={() => router.back()}
            >
              <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={15}>
                Batal
              </Text>
            </Button>

            <Button
              f={2}
              h={48}
              br={12}
              backgroundColor="#FF5722"
              onPress={handleSaveDiscount}
            >
              <Text fontFamily="Geist_700Bold" color="white" fontSize={15}>
                {isEditMode ? 'Simpan Perubahan' : 'Buat Diskon & Promo'}
              </Text>
            </Button>
          </XStack>
        </View>

        {/* ── MODAL PILIH MENU UNTUK DISKON LANGSUNG MENU ── */}
        <Modal
          visible={menuModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setMenuModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuModalVisible(false)} />
            <View
              style={{
                backgroundColor: 'white',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 20,
                maxHeight: '85%',
                gap: 12,
              }}
            >
              <XStack jc="space-between" ai="center" pb={10} borderBottomWidth={1} borderColor="#F4F4F5">
                <YStack>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={17} color="#18181B">
                    Pilih Menu Terdiskon
                  </Text>
                  <Text fontFamily="Geist_500Medium" fontSize={13} color="#71717A">
                    {appliedProductIds.length} dari {products.length} menu terpilih
                  </Text>
                </YStack>
                <TouchableOpacity
                  onPress={() => setMenuModalVisible(false)}
                  style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#F4F4F5', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Ionicons name="close" size={20} color="#71717A" />
                </TouchableOpacity>
              </XStack>

              {/* Search Bar */}
              <XStack ai="center" backgroundColor="#F4F4F5" br={10} px={12} height={44}>
                <Ionicons name="search" size={18} color="#71717A" />
                <Input
                  f={1}
                  borderWidth={0}
                  backgroundColor="transparent"
                  placeholder="Cari nama menu..."
                  value={menuSearchQuery}
                  onChangeText={setMenuSearchQuery}
                  fontFamily="Geist_500Medium"
                  fontSize={14}
                  height={42}
                />
              </XStack>

              {/* Category Filter Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {allOrderedCategories.map(cat => {
                  const isSel = selectedMenuCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedMenuCategory(cat)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 16,
                        backgroundColor: isSel ? '#FF5722' : '#F4F4F5',
                      }}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={13} color={isSel ? 'white' : '#52525B'}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Select All / Deselect Quick Action */}
              <XStack jc="space-between" ai="center" px={2} pt={4}>
                <TouchableOpacity
                  onPress={() => handleSelectAllVisibleProducts(filteredProductsForSelection)}
                >
                  <Text fontFamily="Geist_700Bold" fontSize={13} color="#FF5722">
                    {filteredProductsForSelection.every(p => appliedProductIds.includes(p.id))
                      ? '✕ Batalkan Semua'
                      : '✓ Pilih Semua Menu Ini'}
                  </Text>
                </TouchableOpacity>
              </XStack>

              {/* Product List */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
                <YStack gap={8} py={4}>
                  {filteredProductsForSelection.map(prod => {
                    const isSelected = appliedProductIds.includes(prod.id);
                    const origP = prod.sellingPrice;
                    let discP = discountType === 'percentage' ? Math.round((origP * numVal) / 100) : numVal;
                    if (numMaxDiscount > 0 && discP > numMaxDiscount) discP = numMaxDiscount;
                    const finalP = Math.max(0, origP - discP);

                    return (
                      <TouchableOpacity
                        key={prod.id}
                        onPress={() => toggleProductSelection(prod.id)}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 12,
                          borderRadius: 12,
                          backgroundColor: isSelected ? '#FFF7ED' : 'white',
                          borderWidth: 1,
                          borderColor: isSelected ? '#FF5722' : '#E4E4E7',
                        }}
                      >
                        <XStack ai="center" gap={10} f={1} pr={8}>
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              backgroundColor: isSelected ? '#FF5722' : 'white',
                              borderWidth: 1.5,
                              borderColor: isSelected ? '#FF5722' : '#D4D4D8',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                          </View>
                          <YStack f={1}>
                            <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                              {prod.name}
                            </Text>
                            <XStack ai="center" gap={6} flexWrap="wrap" mt={1}>
                              <Text fontFamily="Geist_500Medium" fontSize={12} color="#71717A">
                                {prod.category} •
                              </Text>
                              {numVal > 0 ? (
                                <>
                                  <Text fontFamily="Geist_500Medium" fontSize={12} color="#A1A1AA" style={{ textDecorationLine: 'line-through' }}>
                                    Rp {origP.toLocaleString('id-ID')}
                                  </Text>
                                  <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#FF5722">
                                    Rp {finalP.toLocaleString('id-ID')}
                                  </Text>
                                  <Text fontFamily="Geist_700Bold" fontSize={11} color="#10B981">
                                    (Hemat Rp {discP.toLocaleString('id-ID')})
                                  </Text>
                                </>
                              ) : (
                                <Text fontFamily="Geist_700Bold" fontSize={12} color="#18181B">
                                  Rp {origP.toLocaleString('id-ID')}
                                </Text>
                              )}
                            </XStack>
                          </YStack>
                        </XStack>

                        <Text fontFamily="Geist_700Bold" fontSize={13} color={isSelected ? '#FF5722' : '#71717A'}>
                          {isSelected ? 'Terpilih' : '+ Pilih'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </YStack>
              </ScrollView>

              {/* Confirm Button */}
              <Button
                size="$4"
                h={48}
                br={12}
                backgroundColor="#FF5722"
                mt={6}
                onPress={() => setMenuModalVisible(false)}
              >
                <Text fontFamily="Geist_700Bold" color="white" fontSize={14}>
                  Selesai Memilih ({appliedProductIds.length} Menu)
                </Text>
              </Button>
            </View>
          </View>
        </Modal>

        {/* ── CUSTOM ALERT MODAL ── */}
        <Modal visible={customAlert.visible} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 22, width: '100%', maxWidth: 360, alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: customAlert.type === 'success' ? '#E8FFF1' : '#FFF3E0',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name={customAlert.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                  size={30}
                  color={customAlert.type === 'success' ? '#10B981' : '#FF5722'}
                />
              </View>
              <Text fontFamily="Geist_800ExtraBold" fontSize={17} color="#18181B" ta="center">
                {customAlert.title}
              </Text>
              <Text fontFamily="Geist_500Medium" fontSize={14} color="#52525B" ta="center">
                {customAlert.message}
              </Text>
              <Button
                backgroundColor="#FF5722"
                br={10}
                h={44}
                w="100%"
                mt={6}
                onPress={() => {
                  setCustomAlert(prev => ({ ...prev, visible: false }));
                  if (customAlert.onConfirm) customAlert.onConfirm();
                }}
              >
                <Text fontFamily="Geist_700Bold" color="white" fontSize={14}>
                  OK
                </Text>
              </Button>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
