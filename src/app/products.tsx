import { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Input, TextArea, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import {
  Alert,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Switch,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { productStore, ProductItem, DiscountItem, StockLog } from '../lib/productStore';
import { showAlert } from '../lib/alertStore';

interface IngredientItem {
  name: string;
  cost: number;
}

export default function ProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'discounts'>('products');

  // Reactive Store State
  const [storeState, setStoreState] = useState(productStore.get());
  const { products, categories, discounts } = storeState;

  useEffect(() => {
    const unsubscribe = productStore.subscribe(() => {
      setStoreState(productStore.get());
    });
    return unsubscribe;
  }, []);

  // Product Tab Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Add Category State
  const [newCatName, setNewCatName] = useState('');

  // Add Discount State
  const [discountCode, setDiscountCode] = useState('');
  const [discountName, setDiscountName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');

  // Edit Product Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editTrackStock, setEditTrackStock] = useState(false);
  const [editStock, setEditStock] = useState('0');
  const [editDescription, setEditDescription] = useState('');
  const [editRecipeNote, setEditRecipeNote] = useState('');

  // Stock Adjustment Modal State
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockProduct, setStockProduct] = useState<ProductItem | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjust'>('in');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Custom Tamagui Delete Category Modal State
  const [deleteCatModalVisible, setDeleteCatModalVisible] = useState(false);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  // Add & Delete Discount Modal State
  const [addDiscountModalVisible, setAddDiscountModalVisible] = useState(false);
  const [deleteDiscountModalVisible, setDeleteDiscountModalVisible] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<DiscountItem | null>(null);

  function promptDeleteCategory(catName: string) {
    setCatToDelete(catName);
    setDeleteCatModalVisible(true);
  }

  function handleConfirmDeleteCategory() {
    if (!catToDelete) return;
    productStore.deleteCategory(catToDelete);
    setDeleteCatModalVisible(false);
    setCatToDelete(null);
  }

  function promptDeleteDiscount(discount: DiscountItem) {
    setDiscountToDelete(discount);
    setDeleteDiscountModalVisible(true);
  }

  function handleConfirmDeleteDiscount() {
    if (!discountToDelete) return;
    productStore.deleteDiscount(discountToDelete.id);
    setDeleteDiscountModalVisible(false);
    setDiscountToDelete(null);
  }

  function openStockAdjustModal(prod: ProductItem) {
    setStockProduct(prod);
    setAdjustType('in');
    setAdjustAmount('');
    setAdjustReason('');
    setStockModalVisible(true);
  }

  function handleSaveStockAdjust() {
    if (!stockProduct) return;
    const amountNum = parseInt(adjustAmount) || 0;
    if (amountNum <= 0 && adjustType !== 'adjust') {
      showAlert('Perhatian', 'Jumlah unit penyesuaian stok harus lebih dari 0.');
      return;
    }

    productStore.adjustStockWithLog(stockProduct.id, adjustType, amountNum, adjustReason);
    setStockModalVisible(false);
    showAlert('Sukses! 🎉', `Penyesuaian stok "${stockProduct.name}" telah dicatat dalam history.`);
  }

  function openEditProduct(prod: ProductItem) {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditCategory(prod.category);
    setEditSellingPrice(prod.sellingPrice.toString());
    setEditCostPrice(prod.costPrice.toString());
    setEditTrackStock(prod.trackStock ?? false);
    setEditStock(prod.stock.toString());
    setEditDescription(prod.description || '');
    setEditRecipeNote(prod.recipeNote || '');
    setEditModalVisible(true);
  }

  function handleSaveEditProduct() {
    if (!editingProduct) return;
    if (!editName.trim()) {
      showAlert('Perhatian', 'Nama Menu / Produk tidak boleh kosong.');
      return;
    }

    const sellNum = parseInt(editSellingPrice) || 0;
    const costNum = parseInt(editCostPrice) || 0;
    const finalStock = editTrackStock ? Math.max(0, parseInt(editStock) || 0) : 999;

    productStore.updateProduct(editingProduct.id, {
      name: editName.trim(),
      category: editCategory,
      sellingPrice: sellNum,
      costPrice: costNum,
      trackStock: editTrackStock,
      stock: finalStock,
      description: editDescription.trim(),
      recipeNote: editRecipeNote.trim(),
    });

    setEditModalVisible(false);
    showAlert('Sukses! 🎉', `Menu "${editName.trim()}" telah berhasil diperbarui.`);
  }

  function handleDeleteProduct() {
    if (!editingProduct) return;
    showAlert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus menu "${editingProduct.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Menu',
          style: 'destructive',
          onPress: () => {
            productStore.deleteProduct(editingProduct.id);
            setEditModalVisible(false);
            showAlert('Terhapus', `Menu "${editingProduct.name}" telah dihapus.`);
          },
        },
      ],
      'confirm'
    );
  }

  // Handlers
  function handleAddCategory() {
    if (!newCatName.trim()) {
      showAlert('Perhatian', 'Harap isi nama kategori.');
      return;
    }
    const success = productStore.addCategory(newCatName);
    if (!success) {
      showAlert('Perhatian', 'Kategori ini sudah ada.');
      return;
    }
    setNewCatName('');
    showAlert('Sukses! 🎉', `Kategori "${newCatName.trim()}" berhasil ditambahkan.`);
  }

  function confirmDeleteCategory(catName: string) {
    const prodCount = products.filter(p => p.category === catName).length;
    showAlert(
      '🗑️ Hapus Kategori',
      `Apakah Anda yakin ingin menghapus kategori "${catName}"?${prodCount > 0 ? `\n\n(Terdapat ${prodCount} menu dalam kategori ini)` : ''}`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Kategori',
          style: 'destructive',
          onPress: () => {
            productStore.deleteCategory(catName);
            showAlert('Terhapus', `Kategori "${catName}" telah dihapus.`);
          },
        },
      ],
      'confirm'
    );
  }

  function handleAddDiscount() {
    if (!discountCode.trim() || !discountName.trim() || !discountValue) {
      showAlert('Perhatian', 'Harap isi Kode Promo, Nama Diskon, dan Nilai Diskon.');
      return;
    }
    const valNum = parseInt(discountValue) || 0;
    if (valNum <= 0) {
      showAlert('Perhatian', 'Nilai diskon harus lebih dari 0.');
      return;
    }

    productStore.addDiscount({
      code: discountCode.trim().toUpperCase(),
      name: discountName.trim(),
      type: discountType,
      value: valNum,
      minPurchase: parseInt(minPurchase) || 0,
      isActive: true,
    });

    setDiscountCode('');
    setDiscountName('');
    setDiscountValue('');
    setMinPurchase('');
    setAddDiscountModalVisible(false);
    showAlert('Sukses! 🎉', 'Kode promo / diskon baru berhasil ditambahkan.');
  }

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7FB' }}>
      <YStack f={1} backgroundColor="#F6F7FB">
        
        {/* ── HEADER ── */}
        <XStack
          backgroundColor="white"
          px={16}
          pt={Platform.OS === 'ios' ? insets.top : Math.max(insets.top + 6, 12)}
          pb={12}
          ai="center"
          gap={12}
          borderBottomWidth={1}
          borderColor="#E4E4E7"
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#18181B" />
          </TouchableOpacity>
          <YStack f={1}>
            <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#18181B" numberOfLines={1}>
              Kelola Produk & Promo
            </Text>
            <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
              Atur menu, kategori & promo diskon
            </Text>
          </YStack>
        </XStack>

        {/* ── TAB NAVIGATION BAR ── */}
        <XStack backgroundColor="white" px={12} py={8} gap={6} borderBottomWidth={1} borderColor="#E4E4E7">
          <TouchableOpacity
            onPress={() => setActiveTab('products')}
            style={[styles.tabBtn, activeTab === 'products' && styles.tabBtnActive]}
          >
            <Text fontFamily="Geist_700Bold" fontSize={12} color={activeTab === 'products' ? 'white' : '#52525B'}>
              Daftar Menu ({products.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('categories')}
            style={[styles.tabBtn, activeTab === 'categories' && styles.tabBtnActive]}
          >
            <Text fontFamily="Geist_700Bold" fontSize={12} color={activeTab === 'categories' ? 'white' : '#52525B'}>
              Kategori ({categories.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('discounts')}
            style={[styles.tabBtn, activeTab === 'discounts' && styles.tabBtnActive]}
          >
            <Text fontFamily="Geist_700Bold" fontSize={12} color={activeTab === 'discounts' ? 'white' : '#52525B'}>
              Diskon ({discounts.length})
            </Text>
          </TouchableOpacity>
        </XStack>

        <ScrollView f={1} contentContainerStyle={{ padding: 16 }}>
          <YStack gap={16} maxWidth={750} alignSelf="center" w="100%">

            {/* ── TAB 1: DAFTAR MENU ── */}
            {activeTab === 'products' && (
              <YStack gap={14}>
                {/* Add Product Button Above List */}
                <TouchableOpacity
                  onPress={() => router.push('/add-product')}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#FF5722',
                    height: 44,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="white">
                    Tambah Menu Baru
                  </Text>
                </TouchableOpacity>

                {/* Search & Category Filter */}
                <YStack gap={10}>
                  <XStack backgroundColor="white" br={10} px={10} ai="center" height={40} borderWidth={1} borderColor="#E4E4E7">
                    <Ionicons name="search" size={16} color="#A1A1AA" />
                    <Input
                      f={1}
                      borderWidth={0}
                      backgroundColor="transparent"
                      placeholder="Cari nama menu..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      fontFamily="Geist_400Regular"
                      fontSize={13}
                    />
                  </XStack>

                  {/* ATURAN: Jika <= 6 gunakan CHIPS. Jika > 6 gunakan SELECT DROPDOWN */}
                  {categories.length <= 6 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <XStack gap={6}>
                        {['Semua', ...categories].map(cat => {
                          const isSelected = selectedCategory === cat;
                          return (
                            <TouchableOpacity
                              key={cat}
                              onPress={() => setSelectedCategory(cat)}
                              style={{
                                paddingHorizontal: 14,
                                paddingVertical: 6,
                                borderRadius: 8,
                                backgroundColor: isSelected ? '#FF5722' : 'white',
                                borderWidth: 1,
                                borderColor: isSelected ? '#FF5722' : '#E4E4E7',
                              }}
                            >
                              <Text fontFamily="Geist_700Bold" fontSize={12} color={isSelected ? 'white' : '#52525B'}>
                                {cat}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </XStack>
                    </ScrollView>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <XStack gap={6}>
                        {['Semua', ...categories].map(cat => {
                          const isSelected = selectedCategory === cat;
                          return (
                            <TouchableOpacity
                              key={cat}
                              onPress={() => setSelectedCategory(cat)}
                              style={{
                                paddingHorizontal: 14,
                                paddingVertical: 6,
                                borderRadius: 8,
                                backgroundColor: isSelected ? '#FF5722' : 'white',
                                borderWidth: 1,
                                borderColor: isSelected ? '#FF5722' : '#E4E4E7',
                              }}
                            >
                              <Text fontFamily="Geist_700Bold" fontSize={12} color={isSelected ? 'white' : '#52525B'}>
                                {cat}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </XStack>
                    </ScrollView>
                  )}
                </YStack>

                {/* Products Cards List */}
                <YStack gap={10}>
                  {filteredProducts.length === 0 ? (
                    <YStack backgroundColor="white" p={32} br={14} ai="center" gap={8} borderWidth={1} borderColor="#E4E4E7">
                      <Ionicons name="fast-food-outline" size={40} color="#D4D4D8" />
                      <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#A1A1AA">
                        Tidak ada menu yang ditemukan.
                      </Text>
                    </YStack>
                  ) : (
                    filteredProducts.map(prod => {
                      const margin = prod.sellingPrice > 0 ? Math.round(((prod.sellingPrice - prod.costPrice) / prod.sellingPrice) * 100) : 0;
                      
                      let catIconName: keyof typeof Ionicons.glyphMap = 'restaurant-outline';
                      const catLower = prod.category.toLowerCase();
                      if (catLower.includes('coffee') && !catLower.includes('non')) catIconName = 'cafe-outline';
                      else if (catLower.includes('non-coffee') || catLower.includes('minuman')) catIconName = 'wine-outline';
                      else if (catLower.includes('makanan') || catLower.includes('food')) catIconName = 'restaurant-outline';
                      else if (catLower.includes('snack') || catLower.includes('cemilan')) catIconName = 'fast-food-outline';
                      else if (catLower.includes('dessert')) catIconName = 'ice-cream-outline';

                      return (
                        <TouchableOpacity
                          key={prod.id}
                          onPress={() => openEditProduct(prod)}
                          activeOpacity={0.75}
                          style={{
                            backgroundColor: 'white',
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: '#E4E4E7',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          {/* Left Thumbnail Avatar / Icon Box */}
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 10,
                              backgroundColor: '#FFF3E0',
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: 12,
                            }}
                          >
                            <Ionicons name={catIconName} size={22} color="#FF5722" />
                          </View>

                          {/* Middle: Title, Category, Stock & Margin */}
                          <YStack f={1} gap={4} pr={8}>
                            <XStack ai="center" gap={6} flexWrap="wrap">
                              <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                                {prod.name}
                              </Text>
                              <View style={{ backgroundColor: '#F4F4F5', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                                <Text fontFamily="Geist_600SemiBold" fontSize={10} color="#71717A">
                                  {prod.category}
                                </Text>
                              </View>
                              {prod.stock === 0 && prod.trackStock !== false && (
                                <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                                  <Text fontFamily="Geist_700Bold" fontSize={10} color="#DC2626">
                                    Stok Habis
                                  </Text>
                                </View>
                              )}
                            </XStack>

                            <XStack ai="center" gap={8} flexWrap="wrap">
                              {/* Professional Stock Pill Button */}
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  openStockAdjustModal(prod);
                                }}
                                style={{
                                  backgroundColor: prod.stock === 0 && prod.trackStock !== false ? '#FEE2E2' : '#FAFAFA',
                                  borderWidth: 1,
                                  borderColor: '#E4E4E7',
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                  borderRadius: 6,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Ionicons name="cube-outline" size={12} color={prod.stock === 0 && prod.trackStock !== false ? '#EF4444' : '#FF5722'} />
                                <Text fontFamily="Geist_600SemiBold" fontSize={10} color="#52525B">
                                  Stok: <Text fontFamily="Geist_800ExtraBold" color={prod.stock === 0 && prod.trackStock !== false ? '#EF4444' : '#18181B'}>{prod.trackStock === false ? '∞' : `${prod.stock}`}</Text>
                                </Text>
                                <Ionicons name="swap-vertical" size={10} color="#71717A" />
                              </TouchableOpacity>

                              {/* Subtle Margin Badge */}
                              <View style={{ backgroundColor: '#E8FFF1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                <Text fontFamily="Geist_700Bold" fontSize={10} color="#10B981">
                                  Margin {margin}%
                                </Text>
                              </View>
                            </XStack>
                          </YStack>

                          {/* Right: Price & Chevron */}
                          <XStack ai="center" gap={8}>
                            <Text fontFamily="Geist_800ExtraBold" fontSize={15} color={prod.sellingPrice === 0 ? '#10B981' : '#FF5722'}>
                              {prod.sellingPrice === 0 ? 'Gratis' : `Rp ${prod.sellingPrice.toLocaleString('id-ID')}`}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#A1A1AA" />
                          </XStack>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </YStack>
              </YStack>
            )}

            {/* ── TAB 2: KELOLA KATEGORI ── */}
            {activeTab === 'categories' && (
              <YStack gap={20}>
                {/* 1. TOP: Form Add Category (Mobile Friendly Form) */}
                <YStack style={styles.cardGroup}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                    ➕ Tambah Kategori Baru
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A" mt={-4}>
                    Ketik nama kategori baru untuk mengelompokkan produk di kasir
                  </Text>
                  
                  <YStack gap={10} mt={6}>
                    <Input
                      backgroundColor="#FAFAFA"
                      borderColor="#E4E4E7"
                      borderWidth={1.5}
                      br={12}
                      placeholder="Contoh: Manual Brew, Mocktail, Dimsum..."
                      value={newCatName}
                      onChangeText={setNewCatName}
                      fontFamily="Geist_600SemiBold"
                      fontSize={14}
                      height={46}
                    />
                    <Button
                      size="$4"
                      br={12}
                      backgroundColor="#FF5722"
                      onPress={handleAddCategory}
                      height={46}
                    >
                      <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={14}>
                        + Tambah Kategori Baru
                      </Text>
                    </Button>
                  </YStack>
                </YStack>

                {/* 2. BOTTOM: List Categories (Daftar Kategori di Bawah - 2 Column Mobile Grid) */}
                <YStack gap={10}>
                  <XStack jc="space-between" ai="center">
                    <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                      Daftar Kategori ({categories.length})
                    </Text>
                    <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                      Kelompok menu aktif
                    </Text>
                  </XStack>

                  <XStack flexWrap="wrap" gap={10}>
                    {categories.map((cat, idx) => {
                      const prodCount = products.filter(p => p.category === cat).length;
                      return (
                        <XStack
                          key={idx}
                          backgroundColor="white"
                          px={14}
                          py={12}
                          br={14}
                          borderWidth={1}
                          borderColor="#E4E4E7"
                          ai="center"
                          jc="space-between"
                          style={{ width: '48.5%' }}
                        >
                          <YStack gap={2} f={1} pr={4}>
                            <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B" numberOfLines={1}>
                              {cat}
                            </Text>
                            <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">
                              {prodCount} Menu
                            </Text>
                          </YStack>

                          {cat !== 'Semua' && (
                            <TouchableOpacity
                              onPress={() => promptDeleteCategory(cat)}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 15,
                                backgroundColor: '#FEE2E2',
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <Ionicons name="trash-outline" size={15} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </XStack>
                      );
                    })}
                  </XStack>
                </YStack>
              </YStack>
            )}

            {/* ── TAB 3: KELOLA DISKON & PROMO ── */}
            {activeTab === 'discounts' && (
              <YStack gap={14}>
                {/* Add Voucher Button Above List */}
                <TouchableOpacity
                  onPress={() => setAddDiscountModalVisible(true)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#FF5722',
                    height: 44,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="white">
                    Tambah Voucher Diskon
                  </Text>
                </TouchableOpacity>

                {/* Section Title */}
                <XStack jc="space-between" ai="center" mt={4}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                    Daftar Voucher Diskon ({discounts.length})
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                    Voucher aktif di Kasir POS
                  </Text>
                </XStack>

                {/* List Active Discounts */}
                {discounts.map(disc => (
                  <XStack
                    key={disc.id}
                    backgroundColor="white"
                    p={14}
                    br={14}
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    jc="space-between"
                    ai="center"
                  >
                    <XStack ai="center" gap={12} f={1} pr={8}>
                      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: disc.isActive ? '#FFF3E0' : '#F4F4F5', justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="ticket" size={20} color={disc.isActive ? '#FF5722' : '#71717A'} />
                      </View>
                      <YStack f={1} gap={2}>
                        <XStack ai="center" gap={8} flexWrap="wrap">
                          <View style={{ backgroundColor: '#FF5722', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={10}>
                              {disc.code}
                            </Text>
                          </View>
                          <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                            {disc.name}
                          </Text>
                        </XStack>
                        <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                          Potongan: {disc.type === 'percentage' ? `${disc.value}%` : `Rp ${disc.value.toLocaleString('id-ID')}`}
                          {disc.minPurchase ? ` • Min. Belanja: Rp ${disc.minPurchase.toLocaleString('id-ID')}` : ''}
                        </Text>
                      </YStack>
                    </XStack>

                    <XStack ai="center" gap={10}>
                      <XStack ai="center" gap={4}>
                        <Text fontFamily="Geist_600SemiBold" fontSize={10} color={disc.isActive ? '#FF5722' : '#71717A'}>
                          {disc.isActive ? 'Aktif' : 'Non-aktif'}
                        </Text>
                        <Switch
                          value={disc.isActive}
                          onValueChange={() => productStore.toggleDiscount(disc.id)}
                          trackColor={{ false: '#E4E4E7', true: '#FFCC80' }}
                          thumbColor={disc.isActive ? '#FF5722' : '#FAFAFA'}
                        />
                      </XStack>

                      <TouchableOpacity
                        onPress={() => promptDeleteDiscount(disc)}
                        style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </XStack>
                  </XStack>
                ))}
              </YStack>
            )}

          </YStack>
        </ScrollView>

      </YStack>

      {/* ── MODAL EDIT & DETAIL PRODUK ── */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '88%', gap: 14 }}>
            <XStack jc="space-between" ai="center" pb={10} borderBottomWidth={1} borderColor="#F4F4F5">
              <YStack f={1} pr={8}>
                <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                  Edit & Detail Menu
                </Text>
                <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                  Perbarui informasi menu, harga jual, modal, stok, atau resep SOP
                </Text>
              </YStack>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F4F5', justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <YStack gap={14} pb={20}>
                {/* Nama Menu */}
                <YStack gap={4}>
                  <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                    Nama Menu / Produk *
                  </Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    br={10}
                    value={editName}
                    onChangeText={setEditName}
                    fontFamily="Geist_700Bold"
                    fontSize={14}
                    height={44}
                  />
                </YStack>

                {/* Kategori */}
                <YStack gap={6}>
                  <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                    Kategori Menu
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <XStack gap={6}>
                      {categories.map(cat => {
                        const isSelected = editCategory === cat;
                        return (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => setEditCategory(cat)}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 6,
                              borderRadius: 8,
                              backgroundColor: isSelected ? '#FF5722' : '#F4F4F5',
                              borderWidth: 1,
                              borderColor: isSelected ? '#FF5722' : '#E4E4E7',
                            }}
                          >
                            <Text fontFamily="Geist_700Bold" fontSize={12} color={isSelected ? 'white' : '#52525B'}>
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </XStack>
                  </ScrollView>
                </YStack>

                {/* Harga Jual & HPP Modal */}
                <XStack gap={12}>
                  <YStack f={1} gap={4}>
                    <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                      Harga Jual (Rp)
                    </Text>
                    <Input
                      backgroundColor="#FAFAFA"
                      borderWidth={1.5}
                      borderColor="#FF5722"
                      br={10}
                      keyboardType="number-pad"
                      value={editSellingPrice}
                      onChangeText={setEditSellingPrice}
                      fontFamily="Geist_800ExtraBold"
                      fontSize={15}
                      height={44}
                    />
                  </YStack>

                  <YStack f={1} gap={4}>
                    <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                      HPP / Modal awal (Rp)
                    </Text>
                    <Input
                      backgroundColor="#FAFAFA"
                      borderWidth={1}
                      borderColor="#E4E4E7"
                      br={10}
                      keyboardType="number-pad"
                      value={editCostPrice}
                      onChangeText={setEditCostPrice}
                      fontFamily="Geist_700Bold"
                      fontSize={15}
                      height={44}
                    />
                  </YStack>
                </XStack>

                {/* Financial Summary Card (Advanced View) */}
                {(() => {
                  const s = parseInt(editSellingPrice) || 0;
                  const c = parseInt(editCostPrice) || 0;
                  const p = s - c;
                  const m = s > 0 ? Math.round((p / s) * 100) : 0;
                  return (
                    <YStack backgroundColor="#E8FFF1" p={10} br={10} borderWidth={1} borderColor="#A7F3D0" gap={2}>
                      <XStack jc="space-between" ai="center">
                        <Text fontFamily="Geist_700Bold" fontSize={12} color="#065F46">
                          📊 Untung Bersih per Porsi:
                        </Text>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#059669">
                          Rp {p.toLocaleString('id-ID')} ({m}% Margin)
                        </Text>
                      </XStack>
                    </YStack>
                  );
                })()}

                {/* Lacak Stok Switch */}
                <YStack gap={8} backgroundColor="#FAFAFA" p={12} br={12} borderWidth={1} borderColor="#E4E4E7">
                  <XStack jc="space-between" ai="center">
                    <YStack f={1} pr={8}>
                      <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                        Lacak Stok Fisik
                      </Text>
                      <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                        {editTrackStock ? 'Stok dihitung per unit' : 'Tanpa Stok (∞ Porsi Fleksibel F&B)'}
                      </Text>
                    </YStack>
                    <Switch
                      value={editTrackStock}
                      onValueChange={setEditTrackStock}
                      trackColor={{ false: '#E4E4E7', true: '#FFCC80' }}
                      thumbColor={editTrackStock ? '#FF5722' : '#FAFAFA'}
                    />
                  </XStack>

                  {editTrackStock && (
                    <YStack gap={4} mt={4}>
                      <Text fontFamily="Geist_700Bold" fontSize={12} color="#3F3F46">
                        Jumlah Stok Fisik Sekarang
                      </Text>
                      <Input
                        backgroundColor="white"
                        borderWidth={1}
                        borderColor="#E4E4E7"
                        br={10}
                        keyboardType="number-pad"
                        value={editStock}
                        onChangeText={setEditStock}
                        fontFamily="Geist_800ExtraBold"
                        fontSize={15}
                        height={42}
                      />
                    </YStack>
                  )}
                </YStack>

                {/* Deskripsi Publik */}
                <YStack gap={4}>
                  <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                    Deskripsi / Catatan Menu (Publik / Struk)
                  </Text>
                  <TextArea
                    backgroundColor="#FAFAFA"
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    br={10}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    fontFamily="Geist_400Regular"
                    fontSize={13}
                    minHeight={60}
                    maxHeight={120}
                    p={10}
                  />
                </YStack>

                {/* Catatan Resep & SOP Dapur (Internal) */}
                <YStack gap={4}>
                  <Text fontFamily="Geist_700Bold" fontSize={13} color="#FF5722">
                    📝 Catatan Resep & SOP Pembuatan Dapur (Internal)
                  </Text>
                  <TextArea
                    backgroundColor="#FAFAFA"
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    br={10}
                    placeholder="Contoh: 30ml Espresso, 120ml Susu UHT, 20ml Gula Aren, 150g Es Batu"
                    value={editRecipeNote}
                    onChangeText={setEditRecipeNote}
                    fontFamily="Geist_400Regular"
                    fontSize={13}
                    minHeight={60}
                    maxHeight={120}
                    p={10}
                  />
                </YStack>

                {/* Action Buttons */}
                <XStack gap={10} mt={10}>
                  <Button
                    size="$4"
                    br={12}
                    backgroundColor="#FEE2E2"
                    onPress={handleDeleteProduct}
                    px={12}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text fontFamily="Geist_700Bold" color="#EF4444" fontSize={13}>
                      Hapus
                    </Text>
                  </Button>

                  <Button
                    f={1}
                    size="$4"
                    br={12}
                    backgroundColor="#F4F4F5"
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={14}>
                      Batal
                    </Text>
                  </Button>

                  <Button
                    f={2}
                    size="$4"
                    br={12}
                    backgroundColor="#FF5722"
                    onPress={handleSaveEditProduct}
                  >
                    <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={14}>
                      Simpan Perubahan
                    </Text>
                  </Button>
                </XStack>
              </YStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL ADJUSTMENT STOK & LOG AUDIT HISTORY ── */}
      <Modal visible={stockModalVisible} transparent animationType="slide" onRequestClose={() => setStockModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setStockModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '88%', gap: 14 }}>
            <XStack jc="space-between" ai="center" pb={10} borderBottomWidth={1} borderColor="#F4F4F5">
              <YStack f={1} pr={8}>
                <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                  📦 Penyesuaian Stok & Audit History
                </Text>
                <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                  Menu: {stockProduct?.name} • Stok Sekarang: {stockProduct?.trackStock === false ? '∞ (Fleksibel)' : `${stockProduct?.stock} Porsi`}
                </Text>
              </YStack>
              <TouchableOpacity
                onPress={() => setStockModalVisible(false)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F4F5', justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <YStack gap={14} pb={20}>
                {/* Tipe Penyesuaian Chips */}
                <YStack gap={6}>
                  <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                    Tipe Penyesuaian Stok *
                  </Text>
                  <XStack gap={8}>
                    <TouchableOpacity
                      onPress={() => setAdjustType('in')}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: adjustType === 'in' ? '#E8FFF1' : '#F4F4F5',
                        borderWidth: 1.5,
                        borderColor: adjustType === 'in' ? '#10B981' : '#E4E4E7',
                        alignItems: 'center',
                      }}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={12} color={adjustType === 'in' ? '#10B981' : '#52525B'}>
                        ➕ Restok Masuk
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setAdjustType('out')}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: adjustType === 'out' ? '#FEE2E2' : '#F4F4F5',
                        borderWidth: 1.5,
                        borderColor: adjustType === 'out' ? '#EF4444' : '#E4E4E7',
                        alignItems: 'center',
                      }}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={12} color={adjustType === 'out' ? '#EF4444' : '#52525B'}>
                        ➖ Keluar / Opname
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setAdjustType('adjust')}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: adjustType === 'adjust' ? '#FFF3E0' : '#F4F4F5',
                        borderWidth: 1.5,
                        borderColor: adjustType === 'adjust' ? '#FF5722' : '#E4E4E7',
                        alignItems: 'center',
                      }}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={12} color={adjustType === 'adjust' ? '#FF5722' : '#52525B'}>
                        ✏️ Set Stok Baru
                      </Text>
                    </TouchableOpacity>
                  </XStack>
                </YStack>

                {/* Input Jumlah Unit & Alasan */}
                <XStack gap={10}>
                  <YStack f={1} gap={4}>
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">
                      Jumlah Unit ({adjustType === 'adjust' ? 'Total Baru' : 'Jumlah + / -'}) *
                    </Text>
                    <Input
                      backgroundColor="#FAFAFA"
                      borderWidth={1.5}
                      borderColor="#FF5722"
                      br={10}
                      placeholder="Contoh: 10"
                      keyboardType="number-pad"
                      value={adjustAmount}
                      onChangeText={setAdjustAmount}
                      fontFamily="Geist_800ExtraBold"
                      fontSize={15}
                      height={44}
                    />
                  </YStack>

                  <YStack f={2} gap={4}>
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">
                      Alasan / Catatan Audit *
                    </Text>
                    <Input
                      backgroundColor="#FAFAFA"
                      borderWidth={1}
                      borderColor="#E4E4E7"
                      br={10}
                      placeholder="Contoh: Restok supplier, Rusak/Jatuh, Opname"
                      value={adjustReason}
                      onChangeText={setAdjustReason}
                      fontFamily="Geist_400Regular"
                      fontSize={13}
                      height={44}
                    />
                  </YStack>
                </XStack>

                <Button size="$4" br={12} backgroundColor="#FF5722" onPress={handleSaveStockAdjust}>
                  <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={14}>
                    Simpan Penyesuaian Stok & Catat Log
                  </Text>
                </Button>

                {/* Riwayat History Audit Log */}
                <YStack gap={8} mt={10} pt={10} borderTopWidth={1} borderColor="#F4F4F5">
                  <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#18181B">
                    📋 Riwayat History Audit Stok ({stockProduct ? storeState.stockLogs.filter(l => l.productId === stockProduct.id).length : 0})
                  </Text>

                  {(!stockProduct || storeState.stockLogs.filter(l => l.productId === stockProduct.id).length === 0) ? (
                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#A1A1AA" py={12} ta="center">
                      Belum ada catatan riwayat adjustment stok untuk menu ini.
                    </Text>
                  ) : (
                    storeState.stockLogs
                      .filter(l => l.productId === stockProduct.id)
                      .map(log => (
                        <XStack key={log.id} backgroundColor="#FAFAFA" p={10} br={10} borderWidth={1} borderColor="#E4E4E7" jc="space-between" ai="center">
                          <YStack f={1} pr={8} gap={2}>
                            <XStack ai="center" gap={6}>
                              <View style={{ backgroundColor: log.type === 'in' ? '#E8FFF1' : log.type === 'out' ? '#FEE2E2' : '#FFF3E0', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                                <Text fontFamily="Geist_700Bold" fontSize={10} color={log.type === 'in' ? '#10B981' : log.type === 'out' ? '#EF4444' : '#FF5722'}>
                                  {log.type === 'in' ? '+ RESTOK' : log.type === 'out' ? '- KELUAR' : 'OPNAME'}
                                </Text>
                              </View>
                              <Text fontFamily="Geist_700Bold" fontSize={12} color="#18181B">
                                {log.reason}
                              </Text>
                            </XStack>
                            <Text fontFamily="Geist_400Regular" fontSize={10} color="#71717A">
                              {log.timestamp} • Stok: {log.previousStock} → <Text fontFamily="Geist_700Bold" color="#18181B">{log.newStock}</Text>
                            </Text>
                          </YStack>

                          <Text fontFamily="Geist_800ExtraBold" fontSize={14} color={log.type === 'in' ? '#10B981' : log.type === 'out' ? '#EF4444' : '#FF5722'}>
                            {log.type === 'in' ? `+${log.amount}` : log.type === 'out' ? `-${log.amount}` : `${log.newStock}`}
                          </Text>
                        </XStack>
                      ))
                  )}
                </YStack>
              </YStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── CUSTOM TAMAGUI DELETE CATEGORY CONFIRMATION MODAL ── */}
      <Modal visible={deleteCatModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteCatModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDeleteCatModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380, alignItems: 'center', gap: 14 }}>
            {/* Warning Badge Icon */}
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="trash-bin-outline" size={30} color="#EF4444" />
            </View>

            <YStack ai="center" gap={6}>
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B" ta="center">
                Hapus Kategori?
              </Text>
              <Text fontFamily="Geist_400Regular" fontSize={13} color="#52525B" ta="center" lh={20}>
                Apakah Anda yakin ingin menghapus kategori <Text fontFamily="Geist_700Bold" color="#18181B">"{catToDelete}"</Text>?
                {catToDelete && products.filter(p => p.category === catToDelete).length > 0 ? (
                  `\n\n(Terdapat ${products.filter(p => p.category === catToDelete).length} menu dalam kategori ini)`
                ) : ''}
              </Text>
            </YStack>

            <XStack gap={10} w="100%" mt={6}>
              <Button
                f={1}
                size="$4"
                br={12}
                backgroundColor="#F4F4F5"
                onPress={() => setDeleteCatModalVisible(false)}
              >
                <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>
                  Batal
                </Text>
              </Button>

              <Button
                f={1.3}
                size="$4"
                br={12}
                backgroundColor="#EF4444"
                onPress={handleConfirmDeleteCategory}
              >
                <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                  Ya, Hapus Kategori
                </Text>
              </Button>
            </XStack>
          </View>
        </View>
      </Modal>

      {/* ── MODAL TAMBAH VOUCHER DISKON (MOBILE FRIENDLY FORM) ── */}
      <Modal visible={addDiscountModalVisible} transparent animationType="slide" onRequestClose={() => setAddDiscountModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddDiscountModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%', gap: 14 }}>
            <XStack jc="space-between" ai="center" pb={10} borderBottomWidth={1} borderColor="#F4F4F5">
              <YStack f={1} pr={8}>
                <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B">
                  ➕ Buat Voucher Diskon Baru
                </Text>
                <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                  Diskon dapat diterapkan pada transaksi kasir untuk pelanggan
                </Text>
              </YStack>
              <TouchableOpacity
                onPress={() => setAddDiscountModalVisible(false)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F4F5', justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <YStack gap={14} pb={20}>
                <YStack gap={4}>
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">
                    Kode Promo (Singkat) *
                  </Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderWidth={1.5}
                    borderColor="#E4E4E7"
                    br={12}
                    placeholder="Contoh: PROMO20, HEMAT5K..."
                    value={discountCode}
                    onChangeText={setDiscountCode}
                    fontFamily="Geist_800ExtraBold"
                    fontSize={14}
                    autoCapitalize="characters"
                    height={46}
                  />
                </YStack>

                <YStack gap={4}>
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">
                    Nama Promo / Voucher *
                  </Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    br={12}
                    placeholder="Contoh: Diskon Ulang Tahun 20%"
                    value={discountName}
                    onChangeText={setDiscountName}
                    fontFamily="Geist_600SemiBold"
                    fontSize={14}
                    height={46}
                  />
                </YStack>

                <YStack gap={6}>
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">
                    Tipe Diskon *
                  </Text>
                  <XStack gap={10}>
                    <TouchableOpacity
                      onPress={() => setDiscountType('percentage')}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: discountType === 'percentage' ? '#FFF3E0' : '#F4F4F5',
                        borderWidth: 1.5,
                        borderColor: discountType === 'percentage' ? '#FF5722' : '#E4E4E7',
                        alignItems: 'center',
                      }}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={12} color={discountType === 'percentage' ? '#FF5722' : '#52525B'}>
                        Persentase (%)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setDiscountType('fixed')}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: discountType === 'fixed' ? '#FFF3E0' : '#F4F4F5',
                        borderWidth: 1.5,
                        borderColor: discountType === 'fixed' ? '#FF5722' : '#E4E4E7',
                        alignItems: 'center',
                      }}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={12} color={discountType === 'fixed' ? '#FF5722' : '#52525B'}>
                        Nominal (Rp)
                      </Text>
                    </TouchableOpacity>
                  </XStack>
                </YStack>

                <YStack gap={4}>
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">
                    Nilai Diskon ({discountType === 'percentage' ? '%' : 'Rp'}) *
                  </Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderWidth={1.5}
                    borderColor="#FF5722"
                    br={12}
                    placeholder={discountType === 'percentage' ? 'Contoh: 15' : 'Contoh: 5000'}
                    keyboardType="number-pad"
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    fontFamily="Geist_800ExtraBold"
                    fontSize={15}
                    height={46}
                  />
                </YStack>

                <YStack gap={4}>
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">
                    Minimal Belanja (Rp) (Opsional)
                  </Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    br={12}
                    placeholder="Contoh: 50000 (Kosongkan jika tanpa minimal)"
                    keyboardType="number-pad"
                    value={minPurchase}
                    onChangeText={setMinPurchase}
                    fontFamily="Geist_400Regular"
                    fontSize={13}
                    height={46}
                  />
                </YStack>

                <Button size="$4" br={12} backgroundColor="#FF5722" onPress={handleAddDiscount} mt={6} height={46}>
                  <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={14}>
                    + Simpan Voucher Diskon
                  </Text>
                </Button>
              </YStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── CUSTOM TAMAGUI DELETE DISCOUNT CONFIRMATION MODAL ── */}
      <Modal visible={deleteDiscountModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteDiscountModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDeleteDiscountModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380, alignItems: 'center', gap: 14 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="ticket-outline" size={30} color="#EF4444" />
            </View>

            <YStack ai="center" gap={6}>
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B" ta="center">
                Hapus Voucher Diskon?
              </Text>
              <Text fontFamily="Geist_400Regular" fontSize={13} color="#52525B" ta="center" lh={20}>
                Apakah Anda yakin ingin menghapus voucher <Text fontFamily="Geist_700Bold" color="#18181B">"{discountToDelete?.name}" ({discountToDelete?.code})</Text>?
              </Text>
            </YStack>

            <XStack gap={10} w="100%" mt={6}>
              <Button
                f={1}
                size="$4"
                br={12}
                backgroundColor="#F4F4F5"
                onPress={() => setDeleteDiscountModalVisible(false)}
              >
                <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>
                  Batal
                </Text>
              </Button>

              <Button
                f={1.3}
                size="$4"
                br={12}
                backgroundColor="#EF4444"
                onPress={handleConfirmDeleteDiscount}
              >
                <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                  Ya, Hapus Voucher
                </Text>
              </Button>
            </XStack>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
  },
  tabBtnActive: {
    backgroundColor: '#FF5722',
  },
  cardGroup: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    gap: 10,
  },
});
