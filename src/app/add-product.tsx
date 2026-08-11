import { useState, useEffect, useRef } from 'react';
import { YStack, XStack, Text, Button, Input, TextArea, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Pressable,
  Modal,
  Switch,
  useWindowDimensions,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { productStore, ProductVariant, ModifierOption, ModifierGroup } from '../lib/productStore';

export default function AddProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const mainScrollViewRef = useRef<any>(null);

  // Store state
  const [storeState, setStoreState] = useState(productStore.get());
  const { categories } = storeState;

  useEffect(() => {
    const unsubscribe = productStore.subscribe(() => {
      setStoreState(productStore.get());
    });
    return unsubscribe;
  }, []);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Umum');
  const [catPickerVisible, setCatPickerVisible] = useState(false);
  const [visualType, setVisualType] = useState<'image' | 'icon'>('image');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState('restaurant-outline');
  const [selectedColor, setSelectedColor] = useState('#FF5722');

  // Varian Utama & Modifier State
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [activeCustomTab, setActiveCustomTab] = useState<'variants' | 'modifiers'>('variants');
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [varNameInput, setVarNameInput] = useState('');
  const [varPriceInput, setVarPriceInput] = useState('');
  const [varCostInput, setVarCostInput] = useState('');

  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupIsRequired, setGroupIsRequired] = useState(true);
  const [optNameInput, setOptNameInput] = useState('');
  const [optPriceInput, setOptPriceInput] = useState('');
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);

  function handleAddVariant() {
    const trimmed = varNameInput.trim();
    if (!trimmed) {
      showAlert('Perhatian', 'Harap isi Nama Varian (misal: Regular, Large, Hot, Ice).');
      return;
    }
    const price = parseInt(varPriceInput.replace(/\D/g, '')) || 0;
    const cost = parseInt(varCostInput.replace(/\D/g, '')) || 0;
    const newVariant: ProductVariant = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 5),
      name: trimmed,
      sellingPrice: price,
      costPrice: cost,
    };
    setVariants([...variants, newVariant]);
    setHasVariants(true);
    setVarNameInput('');
    setVarPriceInput('');
    setVarCostInput('');
  }

  function handleRemoveVariant(id: string) {
    const updated = variants.filter(v => v.id !== id);
    setVariants(updated);
    if (updated.length === 0) setHasVariants(false);
  }

  function handleApplyPresetVariant(type: 'size' | 'temp' | 'portion') {
    const baseP = sellNum > 0 ? sellNum : 15000;
    const baseC = costNum > 0 ? costNum : 0;
    let preset: ProductVariant[] = [];

    if (type === 'size') {
      preset = [
        { id: Date.now() + '_reg', name: 'Regular', sellingPrice: baseP, costPrice: baseC },
        { id: Date.now() + '_lrg', name: 'Large / Jumbo', sellingPrice: Math.round((baseP * 1.25) / 1000) * 1000, costPrice: Math.round((baseC * 1.2) / 1000) * 1000 },
      ];
    } else if (type === 'temp') {
      preset = [
        { id: Date.now() + '_ice', name: 'Dingin (Ice)', sellingPrice: baseP, costPrice: baseC },
        { id: Date.now() + '_hot', name: 'Panas (Hot)', sellingPrice: baseP, costPrice: baseC },
      ];
    } else if (type === 'portion') {
      preset = [
        { id: Date.now() + '_p1', name: 'Porsi Biasa', sellingPrice: baseP, costPrice: baseC },
        { id: Date.now() + '_p2', name: 'Porsi Double', sellingPrice: Math.round((baseP * 1.5) / 1000) * 1000, costPrice: Math.round((baseC * 1.4) / 1000) * 1000 },
      ];
    }
    setVariants([...variants, ...preset]);
    setHasVariants(true);
  }

  function handleAddModifierGroup() {
    const trimmed = groupNameInput.trim();
    if (!trimmed) {
      showAlert('Perhatian', 'Harap isi Nama Grup Opsi (misal: Level Pedas, Pilihan Nasi).');
      return;
    }
    const newGroup: ModifierGroup = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 5),
      name: trimmed,
      isRequired: groupIsRequired,
      options: [],
    };
    const updated = [...modifierGroups, newGroup];
    setModifierGroups(updated);
    setGroupNameInput('');
    setActiveGroupIndex(updated.length - 1);
  }

  function handleRemoveModifierGroup(index: number) {
    setModifierGroups(modifierGroups.filter((_, i) => i !== index));
    if (activeGroupIndex === index) setActiveGroupIndex(null);
  }

  function handleAddOptionToGroup(groupIndex: number) {
    const trimmed = optNameInput.trim();
    if (!trimmed) {
      showAlert('Perhatian', 'Harap isi Nama Opsi (misal: Level 1, Extra Nasi, Boba).');
      return;
    }
    const price = parseInt(optPriceInput.replace(/\D/g, '')) || 0;
    const newOption: ModifierOption = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 5),
      name: trimmed,
      price,
    };
    const updated = [...modifierGroups];
    updated[groupIndex].options.push(newOption);
    setModifierGroups(updated);
    setOptNameInput('');
    setOptPriceInput('');
  }

  function handleRemoveOptionFromGroup(groupIndex: number, optionId: string) {
    const updated = [...modifierGroups];
    updated[groupIndex].options = updated[groupIndex].options.filter(o => o.id !== optionId);
    setModifierGroups(updated);
  }

  // Photo Source Selection Modal State
  const [photoOptionsModalVisible, setPhotoOptionsModalVisible] = useState(false);

  // 1. Camera Handler
  async function handleTakePicture() {
    setPhotoOptionsModalVisible(false);
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert('Izin Kamera 📷', 'Harap izinkan akses Kamera di HP Anda untuk mengambil foto menu.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err: any) {
      console.log('Camera error:', err);
      showAlert('Kamera Error', 'Tidak dapat membuka kamera pada perangkat ini.');
    }
  }

  // 2. Gallery Handler (with Android ActivityNotFound fallback)
  async function handlePickFromGallery() {
    setPhotoOptionsModalVisible(false);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert('Izin Akses Galeri 📸', 'Harap izinkan akses Galeri Foto di HP Anda untuk memilih foto menu.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        legacy: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err: any) {
      console.log('Gallery legacy pick error, trying standard picker:', err);
      try {
        const fallbackResult = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.8,
        });
        if (!fallbackResult.canceled && fallbackResult.assets && fallbackResult.assets.length > 0) {
          setImageUri(fallbackResult.assets[0].uri);
        }
      } catch (e: any) {
        showAlert('Galeri Error 🖼️', 'Tidak dapat membuka picker galeri pada perangkat ini. Gunakan opsi Kamera.');
      }
    }
  }

  // Quick Add Category Modal State
  const [newCatModalVisible, setNewCatModalVisible] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  function handleSelectCategory(cat: string) {
    setCategory(cat);
    const lower = cat.toLowerCase();
    if (lower.includes('minum') || lower.includes('kopi') || lower.includes('drink') || lower.includes('tea') || lower.includes('coffee')) {
      setSelectedColor('#FF5722');
      setSelectedIcon('cafe-outline');
    } else if (lower.includes('makan') || lower.includes('nasi') || lower.includes('ayam') || lower.includes('food')) {
      setSelectedColor('#10B981');
      setSelectedIcon('restaurant-outline');
    } else if (lower.includes('snack') || lower.includes('cemil') || lower.includes('goreng')) {
      setSelectedColor('#F59E0B');
      setSelectedIcon('pizza-outline');
    } else if (lower.includes('es') || lower.includes('jus') || lower.includes('juice')) {
      setSelectedColor('#3B82F6');
      setSelectedIcon('wine-outline');
    } else if (lower.includes('kue') || lower.includes('dessert') || lower.includes('cake') || lower.includes('roti')) {
      setSelectedColor('#EC4899');
      setSelectedIcon('ice-cream-outline');
    }
  }

  function handleSaveNewCategoryDirect() {
    const trimmed = newCatInput.trim();
    if (!trimmed) {
      showAlert('Perhatian', 'Nama kategori tidak boleh kosong.');
      return;
    }
    const success = productStore.addCategory(trimmed);
    if (success) {
      setCategory(trimmed);
      setNewCatInput('');
      setNewCatModalVisible(false);
    } else {
      showAlert('Perhatian', 'Kategori ini sudah ada.');
    }
  }

  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');

  // Stock Fields: Default trackStock = false (Unlimited for F&B)
  const [trackStock, setTrackStock] = useState(false);
  const [stock, setStock] = useState('0');

  const [description, setDescription] = useState('');
  const [recipeNote, setRecipeNote] = useState('');
  const [showRecipeInput, setShowRecipeInput] = useState(false);

  // BOM / HPP Calculator State
  const [bomModalVisible, setBomModalVisible] = useState(false);
  const [showHelpTip, setShowHelpTip] = useState(false);
  const [bomIngredients, setBomIngredients] = useState<{ name: string; cost: number }[]>([]);
  const [ingName, setIngName] = useState('');
  const [ingCost, setIngCost] = useState('');

  // Custom Alert State
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'error' | 'success';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  function showAlert(title: string, message: string, type: 'warning' | 'error' | 'success' = 'warning', onConfirm?: () => void) {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
      onConfirm,
    });
  }

  function closeAlert() {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  }

  function formatNumberWithDots(val: string): string {
    const digitsOnly = val.replace(/\D/g, '');
    if (!digitsOnly) return '';
    return parseInt(digitsOnly, 10).toLocaleString('id-ID');
  }

  // Calculations
  const sellNum = parseInt(sellingPrice.replace(/\D/g, '')) || 0;
  const costNum = parseInt(costPrice.replace(/\D/g, '')) || 0;
  const profit = sellNum - costNum;
  const marginPercent = sellNum > 0 ? ((profit / sellNum) * 100).toFixed(1) : '0';

  // Add BOM Ingredient
  function handleAddBomIngredient() {
    if (!ingName.trim()) return;
    const c = parseInt(ingCost.replace(/\D/g, '')) || 0;
    const updated = [...bomIngredients, { name: ingName.trim(), cost: c }];
    setBomIngredients(updated);
    setIngName('');
    setIngCost('');

    const totalCost = updated.reduce((sum, item) => sum + item.cost, 0);
    setCostPrice(totalCost > 0 ? totalCost.toLocaleString('id-ID') : '');
  }

  function handleRemoveBomIngredient(index: number) {
    const updated = bomIngredients.filter((_, i) => i !== index);
    setBomIngredients(updated);

    const totalCost = updated.reduce((sum, item) => sum + item.cost, 0);
    setCostPrice(totalCost > 0 ? totalCost.toLocaleString('id-ID') : '');
  }

  function handleSaveProduct() {
    if (!name.trim()) {
      showAlert('Perhatian', 'Nama Menu / Produk tidak boleh kosong.');
      return;
    }
    if (sellNum < 0) {
      showAlert('Perhatian', 'Harga jual tidak boleh bernilai negatif.');
      return;
    }

    const finalStock = trackStock ? Math.max(0, parseInt(stock) || 0) : 999;

    const created = productStore.addProduct({
      name: name.trim(),
      category,
      sellingPrice: sellNum,
      costPrice: costNum,
      stock: finalStock,
      trackStock,
      description: description.trim(),
      recipeNote: recipeNote.trim(),
      imageUri: visualType === 'image' ? (imageUri || undefined) : undefined,
      iconName: selectedIcon,
      colorHex: selectedColor,
      hasVariants,
      variants: hasVariants ? variants : [],
      modifierGroups: modifierGroups,
    });

    showAlert(
      'Menu Berhasil Ditambahkan! 🎉',
      `Menu "${created.name}" dalam kategori ${created.category} telah disimpan dan langsung tersedia di Kasir POS.`,
      'success',
      () => {
        router.back();
      }
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        {/* ── HEADER BAR ── */}
        <XStack
          backgroundColor="white"
          px={isMobile ? 12 : 20}
          py={10}
          pt={insets.top + 8}
          borderBottomWidth={1}
          borderColor="#E4E4E7"
          ai="center"
          jc="space-between"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Ionicons name="chevron-back" size={22} color="#FF5722" />
            <Text fontFamily="Geist_700Bold" fontSize={14} color="#FF5722">
              Kembali
            </Text>
          </TouchableOpacity>

          <XStack ai="center" gap={6}>
            <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
              Tambah Menu Baru
            </Text>
          </XStack>

          <View style={{ width: 70 }} />
        </XStack>

        {/* ── FORM CONTAINER ── */}
        <ScrollView
          ref={mainScrollViewRef}
          f={1}
          px={isMobile ? 12 : 20}
          py={isMobile ? 12 : 20}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        >
        <YStack gap={18} maxWidth={650} alignSelf="center" w="100%">
          
          {/* Main Card */}
          <YStack
            backgroundColor="white"
            p={isMobile ? 16 : 24}
            br={16}
            borderWidth={isMobile ? 0 : 1}
            borderColor="#E4E4E7"
            shadowColor="rgba(0,0,0,0.04)"
            shadowRadius={12}
            gap={20}
          >
            
            {/* Title Info */}
            <YStack pb={12} borderBottomWidth={1} borderColor="#F4F4F5" gap={4}>
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B">
                Formulir Pendaftaran Menu
              </Text>
              <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                Lengkapi rincian produk untuk ditambahkan ke katalog resto
              </Text>
            </YStack>

            {/* Nama Produk Input */}
            <YStack gap={8}>
              <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                Nama Menu / Produk *
              </Text>
              <Input
                backgroundColor="#FAFAFA"
                borderWidth={1}
                borderColor="#D4D4D8"
                focusStyle={{ borderColor: '#FF5722', backgroundColor: 'white' }}
                br={10}
                placeholder="Contoh: Kopi Susu Soodap Large"
                placeholderTextColor="$gray10"
                color="$gray12"
                style={{ color: '#18181B' }}
                value={name}
                onChangeText={setName}
                fontFamily="Geist_600SemiBold"
                fontSize={14}
                height={48}
                px={14}
              />
            </YStack>

            {/* ── ADAPTIVE KATEGORI SELECTOR UI ── */}
            <YStack gap={8}>
              <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                Kategori Menu (Opsional)
              </Text>

              {/* Render Chips with 'Umum' fallback and + Kategori button */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <XStack gap={8} py={2}>
                  {Array.from(new Set(['Umum', ...categories])).map(cat => {
                    const isSelected = category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => handleSelectCategory(cat)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 10,
                          backgroundColor: isSelected ? '#FF5722' : '#F4F4F5',
                          borderWidth: 1,
                          borderColor: isSelected ? '#FF5722' : '#E4E4E7',
                        }}
                      >
                        <Text fontFamily="Geist_700Bold" fontSize={13} color={isSelected ? 'white' : '#52525B'}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => setNewCatModalVisible(true)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: '#FFF3E0',
                      borderWidth: 1,
                      borderColor: '#FF5722',
                      borderStyle: 'dashed',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="add" size={16} color="#FF5722" />
                    <Text fontFamily="Geist_700Bold" fontSize={13} color="#FF5722">
                      Kategori Baru
                    </Text>
                  </TouchableOpacity>
                </XStack>
              </ScrollView>
            </YStack>

            {/* Harga Jual Utama & HPP Modal (Row) */}
            <XStack gap={16} flexDirection={isMobile ? 'column' : 'row'}>
              <YStack f={1} gap={8}>
                <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                  Harga Jual Utama (Rp) *
                </Text>
                <Input
                  backgroundColor="#FAFAFA"
                  borderWidth={1}
                  borderColor="#D4D4D8"
                  focusStyle={{ borderColor: '#FF5722', backgroundColor: 'white' }}
                  br={10}
                  placeholder="Contoh: 15.000"
                  placeholderTextColor="$gray10"
                  color="$gray12"
                  style={{ color: '#18181B' }}
                  keyboardType="number-pad"
                  value={sellingPrice}
                  onChangeText={(txt) => setSellingPrice(formatNumberWithDots(txt))}
                  fontFamily="Geist_800ExtraBold"
                  fontSize={15}
                  height={48}
                  px={14}
                />
                {hasVariants && (
                  <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                    Saat Varian aktif, harga varian akan menggantikan harga ini di kasir.
                  </Text>
                )}
              </YStack>

              <YStack f={1} gap={8}>
                <XStack jc="space-between" ai="center">
                  <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                    HPP / Modal awal (Rp)
                  </Text>
                  <TouchableOpacity onPress={() => setBomModalVisible(true)}>
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#FF5722">
                      Hitung Modal Bahan
                    </Text>
                  </TouchableOpacity>
                </XStack>
                <Input
                  backgroundColor="#FAFAFA"
                  borderWidth={1}
                  borderColor="#D4D4D8"
                  focusStyle={{ borderColor: '#FF5722', backgroundColor: 'white' }}
                  br={10}
                  placeholder="Contoh: 8.500"
                  placeholderTextColor="$gray10"
                  color="$gray12"
                  style={{ color: '#18181B' }}
                  keyboardType="number-pad"
                  value={costPrice}
                  onChangeText={(txt) => setCostPrice(formatNumberWithDots(txt))}
                  fontFamily="Geist_700Bold"
                  fontSize={15}
                  height={48}
                  px={14}
                />
              </YStack>
            </XStack>

            {/* Live Profit Preview Box */}
            {sellNum > 0 && (
              <XStack
                backgroundColor={profit >= 0 ? '#E8FFF1' : '#FEE2E2'}
                p={12}
                br={12}
                borderWidth={1}
                borderColor={profit >= 0 ? '#6EE7B7' : '#FCA5A5'}
                jc="space-between"
                ai="center"
              >
                <YStack>
                  <Text fontFamily="Geist_700Bold" fontSize={12} color={profit >= 0 ? '#047857' : '#B91C1C'}>
                    Estimasi Margin Keuntungan
                  </Text>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color={profit >= 0 ? '#10B981' : '#EF4444'}>
                    Rp {profit.toLocaleString('id-ID')} / porsi
                  </Text>
                </YStack>

                <View
                  style={{
                    backgroundColor: profit >= 0 ? '#10B981' : '#EF4444',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text fontFamily="Geist_800ExtraBold" fontSize={12} color="white">
                    Profit Margin {marginPercent}%
                  </Text>
                </View>
              </XStack>
            )}

            {/* ── STOK FLEKSIBEL / LACAK STOK FISIK ── */}
            <YStack backgroundColor="#FAFAFA" p={16} br={14} borderWidth={1} borderColor="#E4E4E7" gap={14}>
              <XStack jc="space-between" ai="center">
                <YStack f={1} pr={10} gap={2}>
                  <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                    Lacak Stok Fisik (Opsional)
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A" lineHeight={18}>
                    Aktifkan jika produk memiliki stok fisik pasti yang dibatasi (misal: Porsi Ayam Goreng, Bahan Masak Fix, atau Minuman Botol/Kaleng).
                  </Text>
                </YStack>

                <Switch
                  value={trackStock}
                  onValueChange={setTrackStock}
                  trackColor={{ false: '#E4E4E7', true: '#FFCC80' }}
                  thumbColor={trackStock ? '#FF5722' : '#FAFAFA'}
                />
              </XStack>

              {!trackStock ? (
                /* MODUS TANPA STOK (UNLIMITED - DEFAULT FOR F&B) */
                <XStack backgroundColor="#FFF3E0" p={12} br={10} ai="center" gap={10} borderWidth={1} borderColor="#FFCC80">
                  <Ionicons name="infinite" size={22} color="#FF5722" />
                  <YStack f={1} gap={2}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#FF5722">
                      ∞ Tanpa Batas Stok (Fleksibel F&B)
                    </Text>
                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A" lineHeight={16}>
                      Menu siap dibuat kapan saja dari bahan baku. Kasir tidak akan dibatasi oleh stok habis.
                    </Text>
                  </YStack>
                </XStack>
              ) : (
                /* MODUS LACAK STOK FISIK (CUSTOM STOK INITIAL VALUE) */
                <YStack gap={8} pt={4}>
                  <YStack gap={2}>
                    <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                      Input Jumlah Stok Fisik Awal *
                    </Text>
                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                      Jumlah porsi ayam, bahan masak, atau botol yang siap dijual
                    </Text>
                  </YStack>
                  <XStack ai="center" gap={10}>
                    <TouchableOpacity
                      onPress={() => {
                        const current = parseInt(stock) || 0;
                        setStock(Math.max(0, current - 5).toString());
                      }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: '#F4F4F5',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#E4E4E7',
                      }}
                    >
                      <Ionicons name="remove" size={20} color="#3F3F46" />
                    </TouchableOpacity>

                    <Input
                      f={1}
                      backgroundColor="white"
                      borderWidth={1.5}
                      borderColor="#FF5722"
                      br={10}
                      textAlign="center"
                      keyboardType="number-pad"
                      placeholderTextColor="$gray10"
                      color="$gray12"
                      style={{ color: '#18181B' }}
                      value={stock}
                      onChangeText={setStock}
                      fontFamily="Geist_800ExtraBold"
                      fontSize={16}
                      height={44}
                    />

                    <TouchableOpacity
                      onPress={() => {
                        const current = parseInt(stock) || 0;
                        setStock((current + 5).toString());
                      }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: '#FF5722',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="add" size={20} color="white" />
                    </TouchableOpacity>
                  </XStack>
                </YStack>
              )}
            </YStack>

            {/* ── KUSTOMISASI TINGKAT LANJUT: VARIAN & EXTRA TOPPING ── */}
            <YStack backgroundColor="#FAFAFA" p={16} br={14} borderWidth={1} borderColor="#E4E4E7" gap={14}>
              <XStack jc="space-between" ai="center">
                <YStack f={1} pr={10} gap={2}>
                  <XStack ai="center" gap={6}>
                    <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                      Kustomisasi Menu (Opsional)
                    </Text>
                    {(variants.length > 0 || modifierGroups.length > 0) && (
                      <View style={{ backgroundColor: '#18181B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                        <Text fontFamily="Geist_700Bold" fontSize={11} color="white">
                          {(variants.length > 0 ? 1 : 0) + modifierGroups.length} Aktif
                        </Text>
                      </View>
                    )}
                  </XStack>
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A" lineHeight={16}>
                    Aktifkan jika menu membutuhkan ukuran/porsi berbeda (Varian) atau topping/ekstra tambahan.
                  </Text>
                </YStack>

                <Switch
                  value={showCustomOptions}
                  onValueChange={(val) => {
                    setShowCustomOptions(val);
                    if (!val) {
                      setHasVariants(false);
                    } else if (variants.length > 0) {
                      setHasVariants(true);
                    }
                  }}
                  trackColor={{ false: '#E4E4E7', true: '#FFCC80' }}
                  thumbColor={showCustomOptions ? '#FF5722' : '#FAFAFA'}
                />
              </XStack>

              {showCustomOptions && (
                <YStack gap={14} pt={4}>
                  {/* Tab Selector: Varian Utama vs Extra / Topping */}
                  <XStack backgroundColor="#F4F4F5" p={4} br={10} gap={4} borderWidth={1} borderColor="#E4E4E7">
                    <TouchableOpacity
                      onPress={() => setActiveCustomTab('variants')}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: activeCustomTab === 'variants' ? 'white' : 'transparent',
                        alignItems: 'center',
                        borderWidth: activeCustomTab === 'variants' ? 1 : 0,
                        borderColor: activeCustomTab === 'variants' ? '#D4D4D8' : 'transparent',
                      }}
                    >
                      <XStack ai="center" gap={6}>
                        <Text fontFamily="Geist_700Bold" fontSize={13} color={activeCustomTab === 'variants' ? '#18181B' : '#71717A'}>
                          Varian Utama
                        </Text>
                        {variants.length > 0 && (
                          <View style={{ backgroundColor: '#18181B', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text fontFamily="Geist_700Bold" fontSize={10} color="white">{variants.length}</Text>
                          </View>
                        )}
                      </XStack>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setActiveCustomTab('modifiers')}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: activeCustomTab === 'modifiers' ? 'white' : 'transparent',
                        alignItems: 'center',
                        borderWidth: activeCustomTab === 'modifiers' ? 1 : 0,
                        borderColor: activeCustomTab === 'modifiers' ? '#D4D4D8' : 'transparent',
                      }}
                    >
                      <XStack ai="center" gap={6}>
                        <Text fontFamily="Geist_700Bold" fontSize={13} color={activeCustomTab === 'modifiers' ? '#18181B' : '#71717A'}>
                          Extra & Topping
                        </Text>
                        {modifierGroups.length > 0 && (
                          <View style={{ backgroundColor: '#18181B', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text fontFamily="Geist_700Bold" fontSize={10} color="white">{modifierGroups.length}</Text>
                          </View>
                        )}
                      </XStack>
                    </TouchableOpacity>
                  </XStack>

                  {/* TAB 1: VARIAN UTAMA */}
                  {activeCustomTab === 'variants' && (
                    <YStack gap={10}>
                      {/* Tip Kejelasan Varian */}
                      <XStack backgroundColor="#F4F4F5" p={10} br={8} borderWidth={1} borderColor="#E4E4E7" ai="flex-start" gap={8}>
                        <Ionicons name="information-circle-outline" size={16} color="#71717A" style={{ marginTop: 2 }} />
                        <YStack f={1} gap={2}>
                          <Text fontFamily="Geist_700Bold" fontSize={12} color="#18181B">
                            Gunakan Varian Utama jika:
                          </Text>
                          <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A" lineHeight={15}>
                            Menu memiliki ukuran (Small/Large) atau suhu (Hot/Ice) dengan **HARGA TOTAL** tersendiri yang menggantikan harga utama.
                          </Text>
                        </YStack>
                      </XStack>

                      {/* Preset Cepat */}
                      <YStack gap={6}>
                        <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#52525B">
                          Template Cepat:
                        </Text>
                        <XStack gap={6} fw="wrap">
                          <TouchableOpacity
                            onPress={() => handleApplyPresetVariant('size')}
                            style={{ backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#E4E4E7' }}
                          >
                            <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">+ Ukuran (Regular & Large)</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleApplyPresetVariant('temp')}
                            style={{ backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#E4E4E7' }}
                          >
                            <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">+ Suhu (Panas & Dingin)</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleApplyPresetVariant('portion')}
                            style={{ backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#E4E4E7' }}
                          >
                            <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">+ Porsi (Biasa & Double)</Text>
                          </TouchableOpacity>
                        </XStack>
                      </YStack>

                      <YStack gap={8} p={12} backgroundColor="white" br={10} borderWidth={1} borderColor="#E4E4E7">
                        <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                          + Tambah Varian Baru
                        </Text>
                        <Input
                          placeholder="Nama Varian (misal: Large / Jumbo / Hot)"
                          value={varNameInput}
                          onChangeText={setVarNameInput}
                          backgroundColor="#F4F4F5"
                          br={8}
                          fontSize={13}
                          height={40}
                        />
                        <XStack gap={8}>
                          <Input
                            f={1}
                            placeholder="Harga Total Varian (Rp)"
                            value={varPriceInput}
                            onChangeText={(val) => setVarPriceInput(formatNumberWithDots(val))}
                            keyboardType="number-pad"
                            backgroundColor="#F4F4F5"
                            br={8}
                            fontSize={13}
                            height={40}
                          />
                          <Input
                            f={1}
                            placeholder="Modal/HPP Varian (Rp)"
                            value={varCostInput}
                            onChangeText={(val) => setVarCostInput(formatNumberWithDots(val))}
                            keyboardType="number-pad"
                            backgroundColor="#F4F4F5"
                            br={8}
                            fontSize={13}
                            height={40}
                          />
                        </XStack>
                        <TouchableOpacity
                          onPress={handleAddVariant}
                          style={{
                            backgroundColor: '#18181B',
                            paddingVertical: 10,
                            borderRadius: 8,
                            alignItems: 'center',
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={13} color="white">
                            + Tambahkan Varian
                          </Text>
                        </TouchableOpacity>
                      </YStack>

                      {/* List Varian */}
                      {variants.map((v) => (
                        <XStack key={v.id} backgroundColor="white" p={12} br={10} borderWidth={1} borderColor="#E4E4E7" ai="center" jc="space-between">
                          <YStack gap={2}>
                            <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                              {v.name}
                            </Text>
                            <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#18181B">
                              Rp {v.sellingPrice.toLocaleString('id-ID')} {v.costPrice ? `(Modal: Rp ${v.costPrice.toLocaleString('id-ID')})` : ''}
                            </Text>
                          </YStack>
                          <TouchableOpacity onPress={() => handleRemoveVariant(v.id)}>
                            <Ionicons name="trash-outline" size={18} color="#71717A" />
                          </TouchableOpacity>
                        </XStack>
                      ))}
                    </YStack>
                  )}

                  {/* TAB 2: EXTRA & TOPPING (MODIFIERS) */}
                  {activeCustomTab === 'modifiers' && (
                    <YStack gap={10}>
                      {/* Helper Tip Box */}
                      <XStack backgroundColor="#F4F4F5" p={10} br={8} borderWidth={1} borderColor="#E4E4E7" ai="flex-start" gap={8}>
                        <Ionicons name="information-circle-outline" size={16} color="#71717A" style={{ marginTop: 2 }} />
                        <YStack f={1} gap={2}>
                          <Text fontFamily="Geist_700Bold" fontSize={12} color="#18181B">
                            Gunakan Extra & Topping jika:
                          </Text>
                          <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A" lineHeight={15}>
                            Menu memiliki kustomisasi opsional atau tambahan ekstra dengan **HARGA TAMBAHAN (+Rp)** (misal: Level Pedas, Extra Nasi, Extra Keju).
                          </Text>
                        </YStack>
                      </XStack>

                      {/* Form Tambah Grup Opsi Baru */}
                      <YStack gap={10} p={12} backgroundColor="white" br={10} borderWidth={1} borderColor="#E4E4E7">
                        <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                          + Buat Grup Opsi Baru
                        </Text>
                        <Input
                          placeholder="Nama Grup (misal: Pilihan Nasi, Level Pedas, Topping)"
                          value={groupNameInput}
                          onChangeText={setGroupNameInput}
                          backgroundColor="#F4F4F5"
                          br={8}
                          fontSize={13}
                          height={40}
                        />
                        <XStack jc="space-between" ai="center" py={4}>
                          <Text fontFamily="Geist_500Medium" fontSize={12} color="#3F3F46">
                            Wajib Dipilih Kasir? (Misal Nasi/Level Pedas)
                          </Text>
                          <Switch
                            value={groupIsRequired}
                            onValueChange={setGroupIsRequired}
                            trackColor={{ false: '#E4E4E7', true: '#FFCC80' }}
                            thumbColor={groupIsRequired ? '#FF5722' : '#FAFAFA'}
                          />
                        </XStack>
                        <TouchableOpacity
                          onPress={handleAddModifierGroup}
                          style={{
                            backgroundColor: '#18181B',
                            paddingVertical: 10,
                            borderRadius: 8,
                            alignItems: 'center',
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={13} color="white">
                            + Tambah Grup Opsi
                          </Text>
                        </TouchableOpacity>
                      </YStack>

                      {/* List Grup Modifier */}
                      {modifierGroups.map((group, idx) => (
                        <YStack key={group.id} backgroundColor="white" p={14} br={10} borderWidth={1} borderColor="#E4E4E7" gap={10}>
                          <XStack jc="space-between" ai="center">
                            <XStack ai="center" gap={6}>
                              <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                                {group.name}
                              </Text>
                              <Text fontFamily="Geist_500Medium" fontSize={11} color="#3F3F46" style={{ backgroundColor: '#F4F4F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#E4E4E7' }}>
                                {group.isRequired ? 'Wajib Pilih 1' : 'Opsional'}
                              </Text>
                            </XStack>
                            <TouchableOpacity onPress={() => handleRemoveModifierGroup(idx)}>
                              <Ionicons name="trash-outline" size={18} color="#71717A" />
                            </TouchableOpacity>
                          </XStack>

                          {/* List Opsi dalam Grup */}
                          {group.options.map((opt) => (
                            <XStack key={opt.id} backgroundColor="#F9FAFB" p={8} px={12} br={8} jc="space-between" ai="center">
                              <Text fontFamily="Geist_500Medium" fontSize={13} color="#18181B">
                                • {opt.name}
                              </Text>
                              <XStack ai="center" gap={10}>
                                <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#18181B">
                                  {opt.price > 0 ? `+Rp ${opt.price.toLocaleString('id-ID')}` : 'Gratis'}
                                </Text>
                                <TouchableOpacity onPress={() => handleRemoveOptionFromGroup(idx, opt.id)}>
                                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                              </XStack>
                            </XStack>
                          ))}

                          {/* Form Tambah Opsi ke Grup Ini */}
                          <YStack gap={8} pt={4} style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                            <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#71717A">
                              + Tambah Pilihan Opsi ke "{group.name}":
                            </Text>
                            <XStack gap={6}>
                              <Input
                                f={2}
                                placeholder="Nama Pilihan (misal: Tanpa Nasi / Level 1)"
                                value={activeGroupIndex === idx ? optNameInput : ''}
                                onChangeText={(val) => {
                                  setActiveGroupIndex(idx);
                                  setOptNameInput(val);
                                }}
                                backgroundColor="#F4F4F5"
                                br={8}
                                fontSize={12}
                                height={36}
                              />
                              <Input
                                f={1}
                                placeholder="+Rp (0 jika gratis)"
                                value={activeGroupIndex === idx ? optPriceInput : ''}
                                onChangeText={(val) => {
                                  setActiveGroupIndex(idx);
                                  setOptPriceInput(formatNumberWithDots(val));
                                }}
                                keyboardType="number-pad"
                                backgroundColor="#F4F4F5"
                                br={8}
                                fontSize={12}
                                height={36}
                              />
                              <TouchableOpacity
                                onPress={() => handleAddOptionToGroup(idx)}
                                style={{
                                  backgroundColor: '#18181B',
                                  paddingHorizontal: 12,
                                  borderRadius: 8,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}
                              >
                                <Ionicons name="add" size={18} color="white" />
                              </TouchableOpacity>
                            </XStack>
                          </YStack>
                        </YStack>
                      ))}
                    </YStack>
                  )}
                </YStack>
              )}
            </YStack>

            {/* ── TAMPILAN VISUAL & FOTO MENU (OPSIONAL) ── */}
            <YStack gap={12} backgroundColor="#FAFAFA" p={16} br={14} borderWidth={1} borderColor="#E4E4E7">
              <YStack gap={2}>
                <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                  Tampilan Visual Menu (Opsional)
                </Text>
                <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                  Pilih tampilan kartu di kasir: Pakai Ikon Badge ATAU Unggah Foto.
                </Text>
              </YStack>

              {/* Segmented Switch Tab: Foto Produk (Priority) vs Ikon & Warna (Fallback) */}
              <XStack backgroundColor="#E4E4E7" p={3} br={10} gap={4}>
                <TouchableOpacity
                  onPress={() => setVisualType('image')}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: 'center',
                    borderRadius: 8,
                    backgroundColor: visualType === 'image' ? 'white' : 'transparent',
                  }}
                >
                  <XStack ai="center" gap={6}>
                    <Ionicons name="camera-outline" size={16} color={visualType === 'image' ? '#FF5722' : '#71717A'} />
                    <Text fontFamily="Geist_700Bold" fontSize={13} color={visualType === 'image' ? '#FF5722' : '#71717A'}>
                      Foto Produk (Utama)
                    </Text>
                  </XStack>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setVisualType('icon')}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: 'center',
                    borderRadius: 8,
                    backgroundColor: visualType === 'icon' ? 'white' : 'transparent',
                  }}
                >
                  <XStack ai="center" gap={6}>
                    <Ionicons name="color-palette-outline" size={16} color={visualType === 'icon' ? '#FF5722' : '#71717A'} />
                    <Text fontFamily="Geist_700Bold" fontSize={13} color={visualType === 'icon' ? '#FF5722' : '#71717A'}>
                      Ikon & Warna
                    </Text>
                  </XStack>
                </TouchableOpacity>
              </XStack>

              {visualType === 'image' ? (
                /* OPTION 1 (PRIORITY): IMAGE UPLOAD SELECTOR */
                <YStack gap={10} pt={4}>
                  <XStack gap={14} ai="center" p={12} backgroundColor="white" br={12} borderWidth={1} borderColor="#E4E4E7">
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 12,
                        backgroundColor: imageUri ? 'white' : '#F4F4F5',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: '#E4E4E7',
                      }}
                    >
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={{ width: 60, height: 60 }} resizeMode="cover" />
                      ) : (
                        <Ionicons name="image-outline" size={28} color="#A1A1AA" />
                      )}
                    </View>

                    <YStack f={1} gap={6}>
                      <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                        {imageUri ? 'Foto Produk Terpilih' : 'Unggah Foto Menu Produk'}
                      </Text>
                      <XStack gap={8} ai="center">
                        <TouchableOpacity
                          onPress={() => setPhotoOptionsModalVisible(true)}
                          style={{
                            backgroundColor: '#FF5722',
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Ionicons name="camera" size={14} color="white" />
                          <Text fontFamily="Geist_700Bold" fontSize={12} color="white">
                            {imageUri ? 'Ganti Foto' : 'Unggah Foto'}
                          </Text>
                        </TouchableOpacity>

                        {imageUri && (
                          <TouchableOpacity
                            onPress={() => setImageUri(null)}
                            style={{
                              backgroundColor: '#FEF2F2',
                              paddingHorizontal: 10,
                              paddingVertical: 7,
                              borderRadius: 8,
                            }}
                          >
                            <Text fontFamily="Geist_700Bold" fontSize={12} color="#EF4444">
                              Hapus Foto
                            </Text>
                          </TouchableOpacity>
                        )}
                      </XStack>
                    </YStack>
                  </XStack>
                </YStack>
              ) : (
                /* OPTION 2 (FALLBACK): ICON & COLOR BADGE SELECTOR */
                <YStack gap={12} pt={4}>
                  {/* Icon Card Preview */}
                  <XStack gap={12} ai="center" p={10} backgroundColor="white" br={12} borderWidth={1} borderColor="#E4E4E7">
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: selectedColor,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name={selectedIcon as any} size={24} color="white" />
                    </View>
                    <YStack f={1}>
                      <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                        Pratinjau Badge Kasir
                      </Text>
                      <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">
                        Tampil warna & ikon di kartu menu kasir.
                      </Text>
                    </YStack>
                  </XStack>

                  {/* Preset Colors (12 Vibrant Palette Options) */}
                  <YStack gap={6}>
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#52525B">
                      Pilih Warna Accent Badge
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <XStack gap={10} py={2}>
                        {[
                          '#FF5722', // Soodap Orange
                          '#EF4444', // Merah Pedas
                          '#F59E0B', // Amber Gold
                          '#10B981', // Emerald Green
                          '#14B8A6', // Teal Matcha
                          '#06B6D4', // Cyan Ice
                          '#3B82F6', // Ocean Blue
                          '#6366F1', // Indigo Soda
                          '#8B5CF6', // Taro Purple
                          '#EC4899', // Berry Pink
                          '#D97706', // Caramel Toast
                          '#475569', // Slate Gray
                        ].map(color => (
                          <TouchableOpacity
                            key={color}
                            onPress={() => setSelectedColor(color)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: color,
                              borderWidth: selectedColor === color ? 3 : 0,
                              borderColor: '#18181B',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            {selectedColor === color && (
                              <Ionicons name="checkmark" size={16} color="white" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </XStack>
                    </ScrollView>
                  </YStack>

                  {/* Preset Icons (9 F&B Icon Categories) */}
                  <YStack gap={6}>
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#52525B">
                      Pilih Ikon Kategori F&B
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <XStack gap={8}>
                        {[
                          { id: 'restaurant-outline', label: 'Makanan' },
                          { id: 'cafe-outline', label: 'Kopi/Minuman' },
                          { id: 'pizza-outline', label: 'Snack' },
                          { id: 'wine-outline', label: 'Jus/Es' },
                          { id: 'ice-cream-outline', label: 'Dessert' },
                          { id: 'beer-outline', label: 'Boba/Soda' },
                          { id: 'flame-outline', label: 'Menu Pedas' },
                          { id: 'leaf-outline', label: 'Sehat/Veggie' },
                          { id: 'fish-outline', label: 'Seafood' },
                        ].map(item => {
                          const isSel = selectedIcon === item.id;
                          return (
                            <TouchableOpacity
                              key={item.id}
                              onPress={() => setSelectedIcon(item.id)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 10,
                                backgroundColor: isSel ? selectedColor : '#FFFFFF',
                                borderWidth: 1,
                                borderColor: isSel ? selectedColor : '#E4E4E7',
                              }}
                            >
                              <Ionicons name={item.id as any} size={16} color={isSel ? 'white' : '#52525B'} />
                              <Text fontFamily="Geist_700Bold" fontSize={12} color={isSel ? 'white' : '#52525B'}>
                                {item.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </XStack>
                    </ScrollView>
                  </YStack>
                </YStack>
              )}
            </YStack>

            {/* Deskripsi Menu (Opsional) */}
            <YStack gap={8}>
              <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                Deskripsi / Catatan Menu (Publik / Struk)
              </Text>
              <TextArea
                backgroundColor="#FAFAFA"
                borderWidth={1}
                borderColor="#D4D4D8"
                focusStyle={{ borderColor: '#FF5722', backgroundColor: 'white' }}
                br={10}
                placeholder="Contoh: Ayam goreng khas Soodap dipadu dengan kremes renyah & sambal bawang pedas."
                placeholderTextColor="$gray10"
                color="$gray12"
                style={{ color: '#18181B' }}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                fontFamily="Geist_400Regular"
                fontSize={13}
                minHeight={80}
                maxHeight={220}
                p={12}
                onFocus={() => {
                  setTimeout(() => {
                    mainScrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 150);
                }}
              />
            </YStack>

            {/* Catatan Resep & SOP Dapur (Internal Opsional - Collapsible) */}
            {!showRecipeInput && !recipeNote ? (
              <TouchableOpacity
                onPress={() => {
                  setShowRecipeInput(true);
                  setTimeout(() => {
                    mainScrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 150);
                }}
                style={{
                  backgroundColor: '#FAFAFA',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E4E4E7',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <XStack ai="center" gap={8}>
                  <Ionicons name="receipt-outline" size={18} color="#FF5722" />
                  <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                    Catatan Resep & SOP Dapur
                  </Text>
                  <View style={{ backgroundColor: '#F4F4F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={10} color="#71717A">
                      Opsional
                    </Text>
                  </View>
                </XStack>

                <Ionicons name="add-circle-outline" size={20} color="#FF5722" />
              </TouchableOpacity>
            ) : (
              <YStack gap={8} backgroundColor="#FAFAFA" p={12} br={12} borderWidth={1} borderColor="#E4E4E7">
                <XStack jc="space-between" ai="center">
                  <XStack ai="center" gap={6} f={1} pr={8}>
                    <Ionicons name="receipt-outline" size={16} color="#FF5722" />
                    <YStack f={1}>
                      <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                        Catatan Resep & SOP Dapur (Internal)
                      </Text>
                      <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                        Takaran & instruksi masak khusus dibaca oleh staff/barista
                      </Text>
                    </YStack>
                  </XStack>

                  <TouchableOpacity
                    onPress={() => {
                      setRecipeNote('');
                      setShowRecipeInput(false);
                    }}
                    style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                  >
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                      Sembunyikan
                    </Text>
                  </TouchableOpacity>
                </XStack>

                <TextArea
                  backgroundColor="white"
                  borderWidth={1}
                  borderColor="#E4E4E7"
                  br={10}
                  placeholder={`Contoh SOP Resep Panjang:\n1. 30ml Espresso Single Shot\n2. 120ml Susu Fresh Milk\n3. 20ml Gula Aren Cair\n4. 150g Es Batu Crystal`}
                  placeholderTextColor="$gray10"
                  color="$gray12"
                  style={{ color: '#18181B' }}
                  textAlignVertical="top"
                  value={recipeNote}
                  onChangeText={(txt) => {
                    setRecipeNote(txt);
                  }}
                  fontFamily="Geist_400Regular"
                  fontSize={13}
                  minHeight={110}
                  maxHeight={360}
                  p={12}
                  onFocus={() => {
                    setTimeout(() => {
                      mainScrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                />
              </YStack>
            )}

            <YStack pb={100} />
          </YStack>
        </YStack>
      </ScrollView>

      {/* ── FIXED BOTTOM ACTION BAR ── */}
      <XStack
        backgroundColor="white"
        px={isMobile ? 14 : 20}
        py={12}
        pb={Math.max(insets.bottom + 8, 14)}
        borderTopWidth={1}
        borderColor="#E4E4E7"
        gap={12}
        shadowColor="rgba(0, 0, 0, 0.08)"
        shadowRadius={16}
        shadowOffset={{ width: 0, height: -4 }}
        elevation={8}
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
          pressStyle={{ backgroundColor: '#E4E4E7' }}
          onPress={() => router.back()}
        >
          <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={14}>
            Batal
          </Text>
        </Button>

        <Button
          f={2}
          h={48}
          br={12}
          backgroundColor="#FF5722"
          pressStyle={{ backgroundColor: '#E64A19' }}
          onPress={handleSaveProduct}
          icon={<Ionicons name="checkmark-circle" size={18} color="white" />}
        >
          <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={14}>
            Simpan & Publikasikan
          </Text>
        </Button>
      </XStack>

      {/* ── MODAL PICKER KATEGORI (JIKA KATEGORI > 6) ── */}
      <Modal visible={catPickerVisible} transparent animationType="slide" onRequestClose={() => setCatPickerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCatPickerVisible(false)} />
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' }}>
            <XStack jc="space-between" ai="center" pb={12} borderBottomWidth={1} borderColor="#F4F4F5">
              <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                Pilih Kategori Menu
              </Text>
              <TouchableOpacity onPress={() => setCatPickerVisible(false)}>
                <Ionicons name="close" size={22} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <ScrollView py={10}>
              <YStack gap={8}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      setCatPickerVisible(false);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: category === cat ? '#FFF3E0' : '#FAFAFA',
                      borderWidth: 1,
                      borderColor: category === cat ? '#FF5722' : '#E4E4E7',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text fontFamily="Geist_700Bold" fontSize={14} color={category === cat ? '#FF5722' : '#18181B'}>
                      {cat}
                    </Text>
                    {category === cat && <Ionicons name="checkmark-circle" size={18} color="#FF5722" />}
                  </TouchableOpacity>
                ))}
              </YStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL KALKULATOR HPP / BOM ── */}
      <Modal visible={bomModalVisible} transparent animationType="slide" onRequestClose={() => setBomModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setBomModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%', gap: 14 }}>
            <XStack jc="space-between" ai="flex-start" pb={10} borderBottomWidth={1} borderColor="#F4F4F5">
              <YStack f={1} pr={8} gap={4}>
                <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                  Hitung Modal & Bahan Baku per Porsi
                </Text>
                
                <XStack ai="center" gap={10} flexWrap="wrap">
                  <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                    Rincian modal resep & kemasan
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => setShowHelpTip(!showHelpTip)}
                    style={{
                      backgroundColor: showHelpTip ? '#FFF3E0' : '#F4F4F5',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: showHelpTip ? '#FF5722' : '#E4E4E7',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Ionicons
                      name={showHelpTip ? 'close-circle-outline' : 'information-circle-outline'}
                      size={14}
                      color={showHelpTip ? '#FF5722' : '#52525B'}
                    />
                    <Text fontFamily="Geist_700Bold" fontSize={11} color={showHelpTip ? '#FF5722' : '#52525B'}>
                      {showHelpTip ? 'Tutup Petunjuk' : 'Petunjuk Bantuan'}
                    </Text>
                  </TouchableOpacity>
                </XStack>
              </YStack>

              <TouchableOpacity
                onPress={() => setBomModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F4F4F5',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            {/* Guidance Tip Box (ON-DEMAND ONLY) */}
            {showHelpTip && (
              <YStack backgroundColor="#FFF3E0" p={10} br={10} borderWidth={1} borderColor="#FFCC80" gap={3}>
                <Text fontFamily="Geist_700Bold" fontSize={11} color="#FF5722">
                  💡 Petunjuk Hitung Modal per Porsi:
                </Text>
                <Text fontFamily="Geist_400Regular" fontSize={11} color="#52525B" lh={15}>
                  • Minuman: Bahan per cup + Cup, Sedotan, Plastik{'\n'}
                  • Makanan Batch (Masak Sekali Banyak): Bagi biaya total dengan porsi (Contoh: Gas Elpiji Rp 20rb untuk 20 porsi = Rp 1.000 / porsi)
                </Text>
              </YStack>
            )}

            {/* Input Bar (Clean & Spacious 2-Row Layout) */}
            <YStack gap={10} backgroundColor="#FAFAFA" p={12} br={14} borderWidth={1} borderColor="#E4E4E7">
              <YStack gap={4}>
                <Text fontFamily="Geist_700Bold" fontSize={12} color="#3F3F46">
                  Nama Bahan Baku / Operasional Porsi
                </Text>
                <Input
                  backgroundColor="white"
                  borderColor="#E4E4E7"
                  br={10}
                  placeholder="Contoh: Gas Elpiji / porsi, Daging 150g, Cup 16oz"
                  placeholderTextColor="$gray10"
                  color="$gray12"
                  style={{ color: '#18181B' }}
                  value={ingName}
                  onChangeText={setIngName}
                  fontFamily="Geist_600SemiBold"
                  fontSize={13}
                  height={42}
                />
              </YStack>

              <XStack gap={10} ai="flex-end">
                <YStack f={1} gap={4}>
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="#3F3F46">
                    Biaya per Porsi (Rp)
                  </Text>
                  <Input
                    backgroundColor="white"
                    borderColor="#E4E4E7"
                    br={10}
                    placeholder="Contoh: 4.500"
                    placeholderTextColor="$gray10"
                    color="$gray12"
                    style={{ color: '#18181B' }}
                    keyboardType="number-pad"
                    value={ingCost}
                    onChangeText={(txt) => setIngCost(formatNumberWithDots(txt))}
                    fontFamily="Geist_700Bold"
                    fontSize={13}
                    height={42}
                  />
                </YStack>

                <Button
                  height={42}
                  br={10}
                  px={14}
                  backgroundColor="#FF5722"
                  onPress={handleAddBomIngredient}
                >
                  <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                    + Tambah Bahan
                  </Text>
                </Button>
              </XStack>
            </YStack>

            {/* List Ingredients */}
            <ScrollView style={{ maxHeight: 200 }}>
              <YStack gap={6}>
                {bomIngredients.length === 0 ? (
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#A1A1AA" ta="center" py={20}>
                    Belum ada bahan baku ditambahkan.
                  </Text>
                ) : (
                  bomIngredients.map((item, idx) => (
                    <XStack key={idx} backgroundColor="#FAFAFA" p={10} br={10} borderWidth={1} borderColor="#F4F4F5" jc="space-between" ai="center">
                      <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#18181B">{item.name}</Text>
                      <XStack ai="center" gap={10}>
                        <Text fontFamily="Geist_700Bold" fontSize={13} color="#FF5722">Rp {item.cost.toLocaleString('id-ID')}</Text>
                        <TouchableOpacity onPress={() => handleRemoveBomIngredient(idx)}>
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </XStack>
                    </XStack>
                  ))
                )}
              </YStack>
            </ScrollView>

            {/* Summary */}
            <YStack backgroundColor="#FFF3E0" p={14} br={12} borderWidth={1} borderColor="#FFCC80" gap={6}>
              <XStack jc="space-between">
                <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#71717A">Total HPP / Modal per Porsi:</Text>
                <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#FF5722">
                  Rp {(parseInt(costPrice) || 0).toLocaleString('id-ID')}
                </Text>
              </XStack>
            </YStack>

            <Button size="$4" br={12} backgroundColor="#FF5722" onPress={() => setBomModalVisible(false)}>
              <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={14}>
                Gunakan Nilai HPP Ini (Rp {(parseInt(costPrice) || 0).toLocaleString('id-ID')})
              </Text>
            </Button>
          </View>
        </View>
      </Modal>

      {/* ── QUICK ADD CATEGORY MODAL ── */}
      <Modal visible={newCatModalVisible} transparent animationType="fade" onRequestClose={() => setNewCatModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setNewCatModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, width: '100%', maxWidth: 360, gap: 14 }}>
            <XStack ai="center" jc="space-between">
              <Text fontFamily="Geist_800ExtraBold" fontSize={17} color="#18181B">
                Buat Kategori Baru 🏷️
              </Text>
              <TouchableOpacity onPress={() => setNewCatModalVisible(false)}>
                <Ionicons name="close" size={20} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <YStack gap={6}>
              <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                Nama Kategori
              </Text>
              <Input
                backgroundColor="#FAFAFA"
                borderWidth={1.5}
                borderColor="#FF5722"
                br={10}
                placeholder="Misal: Minuman, Snack, Makanan"
                placeholderTextColor="$gray10"
                color="$gray12"
                style={{ color: '#18181B' }}
                value={newCatInput}
                onChangeText={setNewCatInput}
                fontFamily="Geist_600SemiBold"
                fontSize={14}
                height={44}
                autoFocus
              />
            </YStack>

            <XStack gap={10} mt={6}>
              <Button f={1} br={10} backgroundColor="#F4F4F5" onPress={() => setNewCatModalVisible(false)}>
                <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>
                  Batal
                </Text>
              </Button>
              <Button f={1} br={10} backgroundColor="#FF5722" onPress={handleSaveNewCategoryDirect}>
                <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={13}>
                  Simpan & Pilih
                </Text>
              </Button>
            </XStack>
          </View>
        </View>
      </Modal>

      {/* ── PHOTO SOURCE SELECTION MODAL ── */}
      <Modal visible={photoOptionsModalVisible} transparent animationType="slide" onRequestClose={() => setPhotoOptionsModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPhotoOptionsModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }}>
            <XStack jc="space-between" ai="center">
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B">
                Pilih Sumber Foto Menu
              </Text>
              <TouchableOpacity onPress={() => setPhotoOptionsModalVisible(false)}>
                <Ionicons name="close" size={22} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <YStack gap={12}>
              <TouchableOpacity
                onPress={handleTakePicture}
                activeOpacity={0.7}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E4E4E7',
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <YStack gap={4}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#18181B">
                    Ambil Foto Baru (Kamera)
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                    Jepret langsung foto makanan/minuman dengan Kamera HP
                  </Text>
                </YStack>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickFromGallery}
                activeOpacity={0.7}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E4E4E7',
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <YStack gap={4}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#18181B">
                    Pilih Foto dari Galeri HP
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                    Pilih gambar dari album / galeri perangkat Anda
                  </Text>
                </YStack>
              </TouchableOpacity>
            </YStack>

            <Button br={12} backgroundColor="#F4F4F5" onPress={() => setPhotoOptionsModalVisible(false)}>
              <Text fontFamily="Geist_700Bold" color="#71717A" fontSize={14}>
                Batal
              </Text>
            </Button>
          </View>
        </View>
      </Modal>

      {/* ── CUSTOM ALERT MODAL ── */}
      <Modal visible={customAlert.visible} transparent animationType="fade" onRequestClose={closeAlert}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAlert} />
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, width: '100%', maxWidth: 360, alignItems: 'center', gap: 12 }}>
            <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: customAlert.type === 'success' ? '#E8FFF1' : '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={customAlert.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={32} color={customAlert.type === 'success' ? '#10B981' : '#FF5722'} />
            </View>

            <YStack ai="center" gap={4}>
              <Text fontFamily="Geist_800ExtraBold" fontSize={17} color="#18181B" ta="center">
                {customAlert.title}
              </Text>
              <Text fontFamily="Geist_400Regular" fontSize={13} color="#71717A" ta="center">
                {customAlert.message}
              </Text>
            </YStack>

            <Button
              w="100%"
              size="$4"
              br={12}
              backgroundColor="#FF5722"
              onPress={() => {
                const cb = customAlert.onConfirm;
                closeAlert();
                if (cb) cb();
              }}
              mt={6}
            >
              <Text fontFamily="Geist_700Bold" color="white" fontSize={14}>
                OK, Mengerti
              </Text>
            </Button>
          </View>
        </View>
      </Modal>
    </View>
    </KeyboardAvoidingView>
  );
}
