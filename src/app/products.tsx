import { useState, useEffect, useRef } from 'react';
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
  Image,
  useWindowDimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { productStore, ProductItem, DiscountItem, StockLog } from '../lib/productStore';
import { outletStore, OutletItem } from '../lib/outletStore';
import { showAlert } from '../lib/alertStore';
import { getActiveSession } from '../lib/session';

interface DraggableCategoryRowProps {
  cat: string;
  idx: number;
  total: number;
  prodCount: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragMove: (from: number, to: number) => void;
}

function DraggableCategoryRow({
  cat,
  idx,
  total,
  prodCount,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onDragMove,
}: DraggableCategoryRowProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const totalRef = useRef(total);
  totalRef.current = total;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        pan.y.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        setIsDragging(false);
        const ROW_HEIGHT = 58;
        const slots = Math.round(gesture.dy / ROW_HEIGHT);
        const target = Math.max(0, Math.min(totalRef.current - 1, idxRef.current + slots));
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(() => {
          if (target !== idxRef.current) {
            onDragMove(idxRef.current, target);
          }
        });
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={{
        transform: [{ translateY: pan.y }],
        zIndex: isDragging ? 999 : 1,
        elevation: isDragging ? 8 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: isDragging ? 6 : 1 },
        shadowOpacity: isDragging ? 0.2 : 0.04,
        shadowRadius: isDragging ? 10 : 2,
      }}
    >
      <XStack
        backgroundColor={isDragging ? '#FFF7ED' : 'white'}
        p={12}
        br={12}
        borderWidth={1.5}
        borderColor={isDragging ? '#FF5722' : '#E4E4E7'}
        ai="center"
        jc="space-between"
      >
        <XStack ai="center" gap={10} f={1} pr={8}>
          {/* Drag Handle (Tahan & Geser / Drag and Drop) */}
          <View
            {...panResponder.panHandlers}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: isDragging ? '#FFCC80' : '#F4F4F5',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: isDragging ? '#FF5722' : '#E4E4E7',
            }}
          >
            <Ionicons name="reorder-two" size={20} color={isDragging ? '#FF5722' : '#71717A'} />
          </View>

          {/* Sequence Number Badge */}
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: idx === 0 ? '#FFF3E0' : '#F4F4F5',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: idx === 0 ? '#FFCC80' : '#E4E4E7',
            }}
          >
            <Text
              fontFamily="Geist_800ExtraBold"
              fontSize={11}
              color={idx === 0 ? '#FF5722' : '#71717A'}
            >
              #{idx + 1}
            </Text>
          </View>

          <YStack gap={1} f={1}>
            <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
              {cat}
            </Text>
            <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">
              {prodCount} Menu
            </Text>
          </YStack>
        </XStack>

        {/* Reorder Up/Down & Edit & Delete Actions */}
        <XStack ai="center" gap={6}>
          {/* Move Up Button */}
          <TouchableOpacity
            disabled={isFirst}
            onPress={onMoveUp}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: isFirst ? '#F4F4F5' : '#FFF7ED',
              borderWidth: 1,
              borderColor: isFirst ? '#E4E4E7' : '#FED7AA',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: isFirst ? 0.35 : 1,
            }}
          >
            <Ionicons
              name="arrow-up"
              size={16}
              color={isFirst ? '#A1A1AA' : '#EA580C'}
            />
          </TouchableOpacity>

          {/* Move Down Button */}
          <TouchableOpacity
            disabled={isLast}
            onPress={onMoveDown}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: isLast ? '#F4F4F5' : '#FFF7ED',
              borderWidth: 1,
              borderColor: isLast ? '#E4E4E7' : '#FED7AA',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: isLast ? 0.35 : 1,
            }}
          >
            <Ionicons
              name="arrow-down"
              size={16}
              color={isLast ? '#A1A1AA' : '#EA580C'}
            />
          </TouchableOpacity>

          {/* Edit Name Button */}
          {cat !== 'Umum' && (
            <TouchableOpacity
              onPress={onEdit}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#F4F4F5',
                borderWidth: 1,
                borderColor: '#E4E4E7',
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 2,
              }}
            >
              <Ionicons name="pencil" size={14} color="#52525B" />
            </TouchableOpacity>
          )}

          {/* Delete Category Button */}
          {cat !== 'Umum' && (
            <TouchableOpacity
              onPress={onDelete}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 2,
              }}
            >
              <Ionicons name="trash-outline" size={15} color="#EF4444" />
            </TouchableOpacity>
          )}
        </XStack>
      </XStack>
    </Animated.View>
  );
}

interface IngredientItem {
  name: string;
  cost: number;
}

export default function ProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const cardWidth = isMobile ? '48.2%' : (width < 1024 ? '31.8%' : '23.8%');

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'discounts'>('products');

  // Reactive Store State
  const [storeState, setStoreState] = useState(productStore.get());
  const { products, discounts } = storeState;
  const categories = Array.from(
    new Set([...(storeState.categories || []), ...products.map(p => p.category).filter(Boolean)])
  );

  useEffect(() => {
    productStore.syncWithSupabase();
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

  // Outlet Info
  const session = getActiveSession();
  const currentOutletName = session?.storeName || 'Ayam Kelawas';
  const [allOutlets, setAllOutlets] = useState<OutletItem[]>(() => outletStore.get());

  useEffect(() => {
    const unsub = outletStore.subscribe(() => {
      setAllOutlets(outletStore.get());
    });
    return unsub;
  }, []);

  // Stock Adjustment Modal State
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockProduct, setStockProduct] = useState<ProductItem | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjust'>('in');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Custom Tamagui Delete Category Modal State
  const [deleteCatModalVisible, setDeleteCatModalVisible] = useState(false);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  // Custom Rename Category Modal State
  const [renameCatModalVisible, setRenameCatModalVisible] = useState(false);
  const [catToRename, setCatToRename] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Delete Discount Modal State
  const [deleteDiscountModalVisible, setDeleteDiscountModalVisible] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<DiscountItem | null>(null);
  const [promoFilter, setPromoFilter] = useState<'all' | 'global_coupon' | 'menu_specific' | 'automatic_bill'>('all');

  function promptRenameCategory(catName: string) {
    setCatToRename(catName);
    setRenameInput(catName);
    setRenameCatModalVisible(true);
  }

  function handleSaveRenameCategory() {
    if (!catToRename) return;
    const trimmed = renameInput.trim();
    if (!trimmed) {
      showAlert('Perhatian', 'Nama kategori tidak boleh kosong.');
      return;
    }
    if (trimmed === catToRename) {
      setRenameCatModalVisible(false);
      return;
    }
    if (categories.includes(trimmed)) {
      showAlert('Perhatian', `Kategori "${trimmed}" sudah ada. Gunakan nama lain.`);
      return;
    }

    const success = productStore.renameCategory(catToRename, trimmed);
    if (success) {
      setRenameCatModalVisible(false);
      showAlert('Sukses! 🎉', `Nama kategori "${catToRename}" berhasil diubah menjadi "${trimmed}".`);
    }
  }

  function promptDeleteCategory(catName: string) {
    setCatToDelete(catName);
    setDeleteCatModalVisible(true);
  }

  function handleConfirmDeleteCategory() {
    if (!catToDelete) return;
    productStore.deleteCategory(catToDelete);
    setDeleteCatModalVisible(false);
    setCatToDelete(null);
    showAlert('Kategori Dihapus', `Kategori "${catToDelete}" telah dihapus dan menunya dipindahkan ke "Umum".`);
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

  function formatNumberWithDots(val: string): string {
    const digitsOnly = val.replace(/\D/g, '');
    if (!digitsOnly) return '';
    return parseInt(digitsOnly, 10).toLocaleString('id-ID');
  }

  function openEditProduct(prod: ProductItem) {
    router.push({
      pathname: '/add-product',
      params: { editId: prod.id },
    });
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



  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <YStack f={1} backgroundColor="#FFFFFF">

        {/* ── HEADER (SERAGAM DENGAN FORM TAMBAH) ── */}
        <XStack
          backgroundColor="white"
          px={16}
          py={12}
          pt={insets.top + 8}
          borderBottomWidth={1}
          borderColor="#F4F4F5"
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
              Kelola Produk & Promo
            </Text>
          </XStack>

          <View style={{ width: 70 }} />
        </XStack>

        {/* ── TAB NAVIGATION MENU BAR (3 CENTERED MENU TABS: DAFTAR MENU | KATEGORI | DISKON & PROMO) ── */}
        <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#E4E4E7' }}>
          <XStack
            maxWidth={650}
            w="100%"
            alignSelf="center"
            px={8}
          >
            <TouchableOpacity
              onPress={() => setActiveTab('products')}
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
                fontFamily={activeTab === 'products' ? 'Geist_800ExtraBold' : 'Geist_600SemiBold'}
                fontSize={13}
                color={activeTab === 'products' ? '#FF5722' : '#71717A'}
                numberOfLines={1}
              >
                Daftar Menu ({products.length})
              </Text>
              {activeTab === 'products' && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 12,
                    right: 12,
                    height: 3,
                    backgroundColor: '#FF5722',
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                  }}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('categories')}
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
                fontFamily={activeTab === 'categories' ? 'Geist_800ExtraBold' : 'Geist_600SemiBold'}
                fontSize={13}
                color={activeTab === 'categories' ? '#FF5722' : '#71717A'}
                numberOfLines={1}
              >
                Kategori ({categories.length})
              </Text>
              {activeTab === 'categories' && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 12,
                    right: 12,
                    height: 3,
                    backgroundColor: '#FF5722',
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                  }}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('discounts')}
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
                fontFamily={activeTab === 'discounts' ? 'Geist_800ExtraBold' : 'Geist_600SemiBold'}
                fontSize={13}
                color={activeTab === 'discounts' ? '#FF5722' : '#71717A'}
                numberOfLines={1}
              >
                Diskon & Promo ({discounts.length})
              </Text>
              {activeTab === 'discounts' && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 12,
                    right: 12,
                    height: 3,
                    backgroundColor: '#FF5722',
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                  }}
                />
              )}
            </TouchableOpacity>
          </XStack>
        </View>

        <ScrollView f={1} contentContainerStyle={{ padding: 16, paddingBottom: activeTab === 'categories' ? 140 : 40 }}>
          <YStack gap={16} maxWidth={750} alignSelf="center" w="100%">

            {/* ── TAB 1: DAFTAR MENU ── */}
            {activeTab === 'products' && (
              products.length === 0 ? (
                /* EMPTY STATE: Hide search & filters, center + Tambah Menu Baru button */
                <YStack
                  backgroundColor="white"
                  p={36}
                  br={16}
                  ai="center"
                  jc="center"
                  gap={14}
                  borderWidth={1}
                  borderColor="#E4E4E7"
                  my={10}
                >
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: '#FFF3E0',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="fast-food-outline" size={36} color="#FF5722" />
                  </View>

                  <YStack ai="center" gap={4} maxWidth={320}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={17} color="#18181B" ta="center">
                      Belum Ada Menu Resto
                    </Text>
                    <Text fontFamily="Geist_400Regular" fontSize={13} color="#71717A" ta="center" lh={18}>
                      Mulai tambahkan menu makanan, minuman, atau produk jualan resto Anda untuk mulai transaksi kasir.
                    </Text>
                  </YStack>

                  <Button
                    backgroundColor="#FF5722"
                    pressStyle={{ backgroundColor: '#E64A19' }}
                    br={12}
                    px={22}
                    h={46}
                    onPress={() => router.push('/add-product')}
                    icon={<Ionicons name="add-circle-outline" size={20} color="white" />}
                    mt={4}
                  >
                    <Text fontFamily="Geist_700Bold" fontSize={14} color="white">
                      Tambah Menu Baru
                    </Text>
                  </Button>
                </YStack>
              ) : (
                /* POPULATED STATE: Show + Tambah Menu button, search bar, category chips, and product cards */
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
                        placeholderTextColor="$gray10"
                        color="$gray12"
                        style={{ color: '#18181B' }}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        fontFamily="Geist_400Regular"
                        fontSize={13}
                      />
                    </XStack>

                    {/* Category Filter Chips */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <XStack gap={6}>
                        {['Semua', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))].map(cat => {
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
                  </YStack>

                  {/* Products Grid Cards */}
                  {filteredProducts.length === 0 ? (
                    <YStack backgroundColor="white" p={24} br={14} ai="center" gap={8} borderWidth={1} borderColor="#E4E4E7">
                      <Ionicons name="search-outline" size={32} color="#D4D4D8" />
                      <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#A1A1AA">
                        Tidak ada menu yang sesuai dengan pencarian "{searchQuery}".
                      </Text>
                    </YStack>
                  ) : (
                    <XStack flexWrap="wrap" gap={10} jc="space-between">
                      {filteredProducts.map(prod => {
                        const isHiddenInCurrent = prod.hiddenOutlets && prod.hiddenOutlets.includes(currentOutletName);
                        const isSpecificOutlet = prod.availableOutlets && prod.availableOutlets.length > 0 && !prod.availableOutlets.includes('all');
                        const isOutOfStock = prod.stock <= 0 && prod.trackStock !== false;

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
                            activeOpacity={0.85}
                            style={{
                              width: isMobile ? '48%' : (width < 1024 ? '31%' : '23%'),
                              backgroundColor: 'white',
                              borderRadius: 14,
                              padding: 10,
                              borderWidth: 1,
                              borderColor: isHiddenInCurrent ? '#FCA5A5' : isOutOfStock ? '#FCA5A5' : '#E4E4E7',
                              gap: 4,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.03,
                              shadowRadius: 4,
                              elevation: 1,
                              opacity: isHiddenInCurrent ? 0.75 : 1,
                            }}
                          >
                            {/* Image Container with Stock Overlay (Exactly like POS) */}
                            <View
                              style={{
                                width: '100%',
                                height: isMobile ? 110 : 130,
                                borderRadius: 10,
                                overflow: 'hidden',
                                backgroundColor: '#F4F4F5',
                                position: 'relative',
                              }}
                            >
                              {prod.imageUri ? (
                                <Image
                                  source={{ uri: prod.imageUri }}
                                  style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                                />
                              ) : (
                                <YStack f={1} jc="center" ai="center" backgroundColor={prod.colorHex || '#FF5722'}>
                                  <Ionicons
                                    name={(prod.iconName as any) || catIconName}
                                    size={32}
                                    color="white"
                                  />
                                </YStack>
                              )}

                              {/* Stock Badge Overlay (Top Right) - Jelas & Informatif */}
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  openStockAdjustModal(prod);
                                }}
                                activeOpacity={0.8}
                                style={{
                                  position: 'absolute',
                                  top: 6,
                                  right: 6,
                                  backgroundColor: isOutOfStock
                                    ? '#EF4444'
                                    : prod.trackStock === false
                                    ? 'rgba(0,0,0,0.65)'
                                    : prod.stock <= 5
                                    ? '#F59E0B'
                                    : 'rgba(0,0,0,0.65)',
                                  paddingHorizontal: 7,
                                  paddingVertical: 3,
                                  borderRadius: 6,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 3,
                                }}
                              >
                                <Ionicons
                                  name={
                                    isOutOfStock
                                      ? 'alert-circle'
                                      : prod.trackStock === false
                                      ? 'infinite-outline'
                                      : 'cube-outline'
                                  }
                                  size={11}
                                  color="white"
                                />
                                <Text fontFamily="Geist_700Bold" fontSize={10} color="white">
                                  {prod.trackStock === false
                                    ? 'Stok: ∞'
                                    : isOutOfStock
                                    ? 'Stok: Habis'
                                    : `Stok: ${prod.stock}`}
                                </Text>
                              </TouchableOpacity>

                              {/* Outlet Status Badge Overlay (Top Left) */}
                              {isHiddenInCurrent ? (
                                <View
                                  style={{
                                    position: 'absolute',
                                    top: 6,
                                    left: 6,
                                    backgroundColor: '#DC2626',
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 6,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 2,
                                  }}
                                >
                                  <Ionicons name="eye-off" size={10} color="white" />
                                  <Text fontFamily="Geist_800ExtraBold" fontSize={9} color="white">
                                    Hidden
                                  </Text>
                                </View>
                              ) : isSpecificOutlet ? (
                                <View
                                  style={{
                                    position: 'absolute',
                                    top: 6,
                                    left: 6,
                                    backgroundColor: '#F59E0B',
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Text fontFamily="Geist_800ExtraBold" fontSize={9} color="white">
                                    1 Cabang
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            {/* Product Name & Category (Exactly like POS) */}
                            <YStack gap={1} mt={4}>
                              <Text
                                fontFamily="Geist_700Bold"
                                fontSize={13}
                                color={isOutOfStock ? '#71717A' : '#18181B'}
                                numberOfLines={1}
                              >
                                {prod.name}
                              </Text>
                              <Text fontFamily="Geist_700Bold" fontSize={11} color="#27272A">
                                {prod.category}
                              </Text>
                            </YStack>

                            {/* Bottom Row: Price & Clean Edit Button */}
                            <XStack jc="space-between" ai="center" mt={4}>
                              <Text
                                fontFamily="Geist_800ExtraBold"
                                fontSize={13}
                                color={isOutOfStock ? '#9CA3AF' : '#FF5722'}
                              >
                                {prod.sellingPrice === 0 ? 'Gratis' : `Rp ${prod.sellingPrice.toLocaleString('id-ID')}`}
                              </Text>

                              {/* Tombol Edit Menu */}
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  openEditProduct(prod);
                                }}
                                style={{
                                  height: 28,
                                  paddingHorizontal: 10,
                                  borderRadius: 14,
                                  backgroundColor: '#FFF3E0',
                                  borderWidth: 1,
                                  borderColor: '#FFCC80',
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Ionicons name="pencil" size={12} color="#FF5722" />
                                <Text fontFamily="Geist_700Bold" fontSize={11} color="#FF5722">
                                  Edit
                                </Text>
                              </TouchableOpacity>
                            </XStack>
                          </TouchableOpacity>
                        );
                      })}
                    </XStack>
                  )}
                </YStack>
              )
            )}

            {/* ── TAB 2: KELOLA KATEGORI (BERSIH & MODERN) ── */}
            {activeTab === 'categories' && (
              <YStack gap={16}>
                {/* Form Tambah Kategori Baru */}
                <YStack backgroundColor="white" p={16} br={14} borderWidth={1} borderColor="#E4E4E7" gap={10}>
                  <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                    Tambah Kategori Baru
                  </Text>
                  <XStack gap={8} ai="center">
                    <Input
                      f={1}
                      backgroundColor="#F9FAFB"
                      borderColor="#D4D4D8"
                      borderWidth={1}
                      br={10}
                      placeholder="Nama kategori baru..."
                      placeholderTextColor="$gray10"
                      value={newCatName}
                      onChangeText={setNewCatName}
                      fontFamily="Geist_600SemiBold"
                      fontSize={13}
                      height={44}
                      style={{ color: '#18181B' }}
                    />
                    <Button
                      br={10}
                      backgroundColor="#FF5722"
                      onPress={handleAddCategory}
                      height={44}
                      px={16}
                    >
                      <XStack ai="center" gap={4}>
                        <Ionicons name="add" size={16} color="white" />
                        <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                          Tambah
                        </Text>
                      </XStack>
                    </Button>
                  </XStack>
                </YStack>

                {/* Daftar Kategori dengan Fitur Drag & Drop & Urutan */}
                <YStack gap={10}>
                  <XStack jc="space-between" ai="center" px={2}>
                    <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                      Daftar Kategori ({categories.length})
                    </Text>
                    <Text fontFamily="Geist_500Medium" fontSize={12} color="#71717A">
                      Total {products.length} Menu
                    </Text>
                  </XStack>

                  <YStack gap={8}>
                    {categories.map((cat, idx) => {
                      const prodCount = products.filter(p => p.category === cat).length;
                      const isFirst = idx === 0;
                      const isLast = idx === categories.length - 1;

                      return (
                        <DraggableCategoryRow
                          key={`${cat}_${idx}`}
                          cat={cat}
                          idx={idx}
                          total={categories.length}
                          prodCount={prodCount}
                          isFirst={isFirst}
                          isLast={isLast}
                          onMoveUp={() => productStore.moveCategory(idx, idx - 1)}
                          onMoveDown={() => productStore.moveCategory(idx, idx + 1)}
                          onEdit={() => promptRenameCategory(cat)}
                          onDelete={() => promptDeleteCategory(cat)}
                          onDragMove={(from, to) => productStore.moveCategory(from, to)}
                        />
                      );
                    })}
                  </YStack>
                </YStack>
              </YStack>
            )}

            {/* ── TAB 3: KELOLA DISKON & PROMO ── */}
            {activeTab === 'discounts' && (
              <YStack gap={14}>
                {/* Add Voucher Button Above List -> Navigates to dedicated /add-discount */}
                <TouchableOpacity
                  onPress={() => router.push('/add-discount')}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#FF5722',
                    height: 46,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="white">
                    Tambah Diskon & Promo
                  </Text>
                </TouchableOpacity>

                {/* Scope Filter Chips */}
                {discounts.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {[
                      { key: 'all', label: `Semua (${discounts.length})` },
                      { key: 'global_coupon', label: `🎟️ Kupon (${discounts.filter(d => d.scope === 'global_coupon').length})` },
                      { key: 'menu_specific', label: `🍛 Diskon Menu (${discounts.filter(d => d.scope === 'menu_specific').length})` },
                      { key: 'automatic_bill', label: `⚡ Otomatis (${discounts.filter(d => d.scope === 'automatic_bill').length})` },
                    ].map(filter => {
                      const isSel = promoFilter === filter.key;
                      return (
                        <TouchableOpacity
                          key={filter.key}
                          onPress={() => setPromoFilter(filter.key as any)}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 7,
                            borderRadius: 16,
                            backgroundColor: isSel ? '#FF5722' : 'white',
                            borderWidth: 1,
                            borderColor: isSel ? '#FF5722' : '#E4E4E7',
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={12} color={isSel ? 'white' : '#52525B'}>
                            {filter.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {/* Section Title */}
                <XStack jc="space-between" ai="center" mt={2}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                    Daftar Promo ({discounts.filter(d => promoFilter === 'all' || d.scope === promoFilter).length})
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                    Aktif di Kasir POS
                  </Text>
                </XStack>

                {/* Empty State jika belum ada promo */}
                {discounts.length === 0 ? (
                  <YStack
                    backgroundColor="white"
                    p={32}
                    br={16}
                    ai="center"
                    jc="center"
                    gap={12}
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    my={6}
                  >
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: '#FFF3E0',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="ticket-outline" size={32} color="#FF5722" />
                    </View>

                    <YStack ai="center" gap={4} maxWidth={320}>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B" ta="center">
                        Belum Ada Diskon & Promo
                      </Text>
                      <Text fontFamily="Geist_400Regular" fontSize={13} color="#71717A" ta="center" lh={18}>
                        Buat kupon voucher atau diskon langsung menu untuk menarik lebih banyak pelanggan dan meningkatkan omzet resto.
                      </Text>
                    </YStack>

                    <Button
                      backgroundColor="#FF5722"
                      pressStyle={{ backgroundColor: '#E64A19' }}
                      br={12}
                      px={20}
                      h={44}
                      onPress={() => router.push('/add-discount')}
                      icon={<Ionicons name="add-circle-outline" size={18} color="white" />}
                      mt={4}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={13} color="white">
                        Buat Promo Pertama
                      </Text>
                    </Button>
                  </YStack>
                ) : discounts.filter(d => promoFilter === 'all' || d.scope === promoFilter).length === 0 ? (
                  <YStack
                    backgroundColor="white"
                    p={24}
                    br={14}
                    ai="center"
                    jc="center"
                    gap={6}
                    borderWidth={1}
                    borderColor="#E4E4E7"
                  >
                    <Ionicons name="filter-outline" size={24} color="#A1A1AA" />
                    <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#71717A">
                      Tidak ada promo untuk kategori filter ini.
                    </Text>
                  </YStack>
                ) : (
                  /* List Active Discounts */
                  discounts
                    .filter(d => promoFilter === 'all' || d.scope === promoFilter)
                    .map(disc => {
                      const scopeLabel =
                        disc.scope === 'menu_specific'
                          ? `🍛 ${disc.appliedProductIds?.length || 0} Menu`
                          : disc.scope === 'automatic_bill'
                          ? '⚡ Otomatis'
                          : '🎟️ Kupon';

                      return (
                        <XStack
                          key={disc.id}
                          backgroundColor={disc.isActive ? 'white' : '#FAFAFA'}
                          p={14}
                          br={14}
                          borderWidth={1}
                          borderColor={disc.isActive ? '#E4E4E7' : '#E4E4E7'}
                          jc="space-between"
                          ai="center"
                          opacity={disc.isActive ? 1 : 0.75}
                        >
                          <TouchableOpacity
                            onPress={() => router.push({ pathname: '/add-discount', params: { editId: disc.id } })}
                            activeOpacity={0.7}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 }}
                          >
                            <View
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 10,
                                backgroundColor: disc.isActive ? '#FFF3E0' : '#F4F4F5',
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <Ionicons
                                name={disc.scope === 'menu_specific' ? 'restaurant' : disc.scope === 'automatic_bill' ? 'flash' : 'ticket'}
                                size={20}
                                color={disc.isActive ? '#FF5722' : '#71717A'}
                              />
                            </View>

                            <YStack f={1} gap={3}>
                              <XStack ai="center" gap={6} flexWrap="wrap">
                                <View style={{ backgroundColor: disc.isActive ? '#FF5722' : '#71717A', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 }}>
                                  <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={10}>
                                    {disc.code}
                                  </Text>
                                </View>
                                <View style={{ backgroundColor: '#F4F4F5', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 }}>
                                  <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={10}>
                                    {scopeLabel}
                                  </Text>
                                </View>
                                <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                                  {disc.name}
                                </Text>
                              </XStack>
                              <Text fontFamily="Geist_500Medium" fontSize={12} color="#71717A">
                                Potongan: {disc.type === 'percentage' ? `${disc.value}%` : `Rp ${disc.value.toLocaleString('id-ID')}`}
                                {disc.minPurchase ? ` • Min. Belanja: Rp ${disc.minPurchase.toLocaleString('id-ID')}` : ''}
                              </Text>
                            </YStack>
                          </TouchableOpacity>

                          <XStack ai="center" gap={8}>
                            {/* Copy Code Button for Kupon */}
                            {disc.scope === 'global_coupon' && (
                              <TouchableOpacity
                                onPress={() => showAlert('Kode Kupon Disalin 📋', `Kode voucher "${disc.code}" siap digunakan atau dibagikan ke pelanggan.`)}
                                style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#FFF3E0', borderWidth: 1, borderColor: '#FED7AA', justifyContent: 'center', alignItems: 'center' }}
                              >
                                <Ionicons name="copy-outline" size={13} color="#FF5722" />
                              </TouchableOpacity>
                            )}

                            {/* Edit Button */}
                            <TouchableOpacity
                              onPress={() => router.push({ pathname: '/add-discount', params: { editId: disc.id } })}
                              style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#F4F4F5', borderWidth: 1, borderColor: '#E4E4E7', justifyContent: 'center', alignItems: 'center' }}
                            >
                              <Ionicons name="pencil" size={13} color="#52525B" />
                            </TouchableOpacity>

                            {/* Toggle Active */}
                            <XStack ai="center" gap={4}>
                              <Switch
                                value={disc.isActive}
                                onValueChange={() => productStore.toggleDiscount(disc.id)}
                                trackColor={{ false: '#E4E4E7', true: '#FFCC80' }}
                                thumbColor={disc.isActive ? '#FF5722' : '#FAFAFA'}
                              />
                            </XStack>

                            {/* Delete Button */}
                            <TouchableOpacity
                              onPress={() => promptDeleteDiscount(disc)}
                              style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}
                            >
                              <Ionicons name="trash-outline" size={14} color="#EF4444" />
                            </TouchableOpacity>
                          </XStack>
                        </XStack>
                      );
                    })
                )}
              </YStack>
            )}

          </YStack>
        </ScrollView>

        {/* ── FIXED LIVE PREVIEW DI BAGIAN BAWAH KELOLA KATEGORI ── */}
        {activeTab === 'categories' && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTopWidth: 1,
              borderColor: '#E4E4E7',
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom + 8, 16),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 12,
              zIndex: 100,
            }}
          >
            <XStack ai="center" gap={6} mb={10}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
              <Text fontFamily="Geist_800ExtraBold" fontSize={12} color="#18181B">
                Preview Kategori di Kasir POS
              </Text>
            </XStack>

            {categories.length <= 6 ? (
              /* MODE CHIPS (≤ 6 KATEGORI) */
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                {/* Semua Category Chip */}
                <View
                  style={{
                    height: 32,
                    paddingHorizontal: 14,
                    borderRadius: 16,
                    backgroundColor: '#FF5722',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="white">
                    Semua
                  </Text>
                </View>

                {/* Ordered Category Chips */}
                {categories.map((cat, idx) => (
                  <View
                    key={`preview_chip_${cat}_${idx}`}
                    style={{
                      height: 32,
                      paddingHorizontal: 14,
                      borderRadius: 16,
                      backgroundColor: '#F4F4F5',
                      borderWidth: 1,
                      borderColor: '#E4E4E7',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">
                      {cat}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              /* MODE SELECT / DROPDOWN (> 6 KATEGORI) */
              <View
                style={{
                  height: 38,
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#D4D4D8',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <XStack ai="center" gap={8}>
                  <Ionicons name="filter-circle" size={18} color="#FF5722" />
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="#18181B">
                    Pilih Kategori: Semua
                  </Text>
                </XStack>
                <Ionicons name="chevron-down" size={16} color="#71717A" />
              </View>
            )}
          </View>
        )}

      </YStack>



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

      {/* ── MODAL EDIT / RENAME NAMA KATEGORI ── */}
      <Modal visible={renameCatModalVisible} transparent animationType="fade" onRequestClose={() => setRenameCatModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRenameCatModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380, gap: 14 }}>
            <XStack jc="space-between" ai="center">
              <XStack ai="center" gap={8}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="pencil" size={18} color="#FF5722" />
                </View>
                <YStack>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                    Ganti Nama Kategori
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                    Perbarui nama kategori "{catToRename}"
                  </Text>
                </YStack>
              </XStack>
              <TouchableOpacity
                onPress={() => setRenameCatModalVisible(false)}
                style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F4F4F5', justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="close" size={16} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <YStack gap={6} mt={4}>
              <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">
                Nama Kategori Baru *
              </Text>
              <Input
                backgroundColor="#FAFAFA"
                borderWidth={1}
                borderColor="#E4E4E7"
                br={10}
                value={renameInput}
                onChangeText={setRenameInput}
                fontFamily="Geist_700Bold"
                fontSize={14}
                height={44}
                placeholder="Nama kategori baru..."
              />
              <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                Seluruh menu dalam kategori ini akan otomatis diperbarui.
              </Text>
            </YStack>

            <XStack gap={10} mt={6}>
              <Button
                f={1}
                size="$4"
                br={12}
                backgroundColor="#F4F4F5"
                onPress={() => setRenameCatModalVisible(false)}
              >
                <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>
                  Batal
                </Text>
              </Button>

              <Button
                f={1.3}
                size="$4"
                br={12}
                backgroundColor="#FF5722"
                onPress={handleSaveRenameCategory}
              >
                <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                  Simpan Nama
                </Text>
              </Button>
            </XStack>
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
                  `\n\n🛡️ ${products.filter(p => p.category === catToDelete).length} menu di kategori ini aman & akan otomatis dipindahkan ke kategori "Umum".`
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
