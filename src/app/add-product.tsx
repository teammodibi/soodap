import { useState, useEffect, useRef } from 'react';
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
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { productStore, ProductVariant, ModifierOption, ModifierGroup } from '../lib/productStore';
import { outletStore, OutletItem } from '../lib/outletStore';
import { getActiveSession } from '../lib/session';

export default function AddProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string }>();
  const isEditMode = Boolean(params.editId);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const mainScrollViewRef = useRef<any>(null);

  // Store state
  const [storeState, setStoreState] = useState(productStore.get());
  const { categories } = storeState;
  const allCategories = Array.from(new Set(['Umum', ...categories]));

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

  // Outlet Availability State (Single Selection)
  const session = getActiveSession();
  const defaultOutletName = session?.storeName || 'Ayam Kelawas';
  const [allOutlets, setAllOutlets] = useState<OutletItem[]>(() => outletStore.get());
  const [isAvailableAllOutlets, setIsAvailableAllOutlets] = useState(true);
  const [selectedAvailableOutlet, setSelectedAvailableOutlet] = useState<string>(defaultOutletName);

  useEffect(() => {
    const unsub = outletStore.subscribe(() => {
      setAllOutlets(outletStore.get());
    });
    return unsub;
  }, []);

  // Prepopulate form when editing existing product
  useEffect(() => {
    if (params.editId) {
      const prod = productStore.get().products.find(p => p.id === params.editId);
      if (prod) {
        setName(prod.name);
        setCategory(prod.category);
        setSellingPrice(prod.sellingPrice > 0 ? prod.sellingPrice.toLocaleString('id-ID') : '');
        setCostPrice(prod.costPrice > 0 ? prod.costPrice.toLocaleString('id-ID') : '');
        setTrackStock(prod.trackStock ?? false);
        setStock(prod.stock !== undefined ? prod.stock.toString() : '0');
        setDescription(prod.description || '');
        setRecipeNote(prod.recipeNote || '');
        setShowRecipeInput(Boolean(prod.recipeNote));
        setVisualType(prod.imageUri ? 'image' : 'icon');
        setImageUri(prod.imageUri || null);
        setSelectedIcon(prod.iconName || 'restaurant-outline');
        setSelectedColor(prod.colorHex || '#FF5722');
        const hasVar = Boolean(prod.hasVariants || (prod.variants && prod.variants.length > 0));
        setHasVariants(hasVar);
        setVariants(prod.variants || []);
        setModifierGroups(prod.modifierGroups || []);
        setShowCustomOptions(hasVar || Boolean(prod.modifierGroups && prod.modifierGroups.length > 0));
        const isAll = !prod.availableOutlets || prod.availableOutlets.includes('all') || prod.availableOutlets.length === 0;
        setIsAvailableAllOutlets(isAll);
        setSelectedAvailableOutlet(
          prod.availableOutlets && !prod.availableOutlets.includes('all') && prod.availableOutlets[0]
            ? prod.availableOutlets[0]
            : defaultOutletName
        );
      }
    }
  }, [params.editId]);

  // AI Description Assistant State
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const generateCulinaryDescriptions = (productName: string, productCategory: string): string[] => {
    const lowerName = productName.toLowerCase();
    const lowerCat = productCategory.toLowerCase();

    const isBeverage =
      lowerCat.includes('minum') ||
      lowerCat.includes('kopi') ||
      lowerCat.includes('tea') ||
      lowerCat.includes('coffee') ||
      lowerCat.includes('jus') ||
      lowerCat.includes('boba') ||
      lowerName.includes('es ') ||
      lowerName.includes('kopi') ||
      lowerName.includes('latte') ||
      lowerName.includes('tea') ||
      lowerName.includes('jus');

    const isSnack =
      lowerCat.includes('snack') ||
      lowerCat.includes('camilan') ||
      lowerCat.includes('kentang') ||
      lowerCat.includes('roti') ||
      lowerName.includes('kentang') ||
      lowerName.includes('gorengan') ||
      lowerName.includes('toast');

    const isPedas =
      lowerName.includes('pedas') ||
      lowerName.includes('sambal') ||
      lowerName.includes('mercon') ||
      lowerName.includes('geprek') ||
      lowerName.includes('balado') ||
      lowerName.includes('rica');

    const isBakar =
      lowerName.includes('bakar') ||
      lowerName.includes('panggang') ||
      lowerName.includes('grill') ||
      lowerName.includes('bbq');

    const isGoreng =
      lowerName.includes('goreng') ||
      lowerName.includes('crispy') ||
      lowerName.includes('kremes') ||
      lowerName.includes('kriuk');

    if (isBeverage) {
      return [
        `Racikan ${productName} segar dengan perpaduan rasa yang pas, disajikan dingin untuk menyegarkan harimu.`,
        `${productName} spesial khas resto dengan aroma memikat dan kesegaran autentik di setiap tegukan.`,
        `Sensasi kesegaran premium ${productName}, pilihan terbaik pelepas dahaga dan teman santai setiap saat.`,
      ];
    }

    if (isSnack) {
      return [
        `Camilan renyah ${productName} dengan bumbu gurih meresap, teman ngemil sempurna kapan saja.`,
        `${productName} lezat dengan tekstur renyah dan rasa gurih yang pas bikin susah berhenti ngunyah.`,
        `Kudapan favorit ${productName} yang dibuat fresh setiap hari, cocok dinikmati bersama teman dan keluarga.`,
      ];
    }

    if (isPedas) {
      return [
        `${productName} dengan sensasi pedas mantap berpadu bumbu rempah tradisional yang gurih dan bikin nagih.`,
        `Olahan ${productName} dengan sambal pedas nampol khas resto, disajikan hangat dengan cita rasa istimewa.`,
        `Pilihan utama pencinta pedas! ${productName} pedas gurih meresap sampai ke dalam setiap gigitan.`,
      ];
    }

    if (isBakar) {
      return [
        `${productName} panggang bumbu bakar karamelisasi kecap rempah yang harum meresap sempurna.`,
        `${productName} dengan aroma asap bakar khas dan lumuran bumbu marinasi otentik yang empuk dan lezat.`,
        `Sajian ${productName} bakar pilihan dengan rasa manis gurih meresap dan tekstur juicy yang menggoda.`,
      ];
    }

    if (isGoreng) {
      return [
        `${productName} renyah di luar dan juicy di dalam, digoreng keemasan dengan racikan bumbu rempah rahasia.`,
        `${productName} gurih garing berpadu kremes renyah, nikmat disajikan hangat bersama hidangan utama.`,
        `Kenikmatan ${productName} garing krispi dengan bumbu meresap sempurna sampai ke serat terdalam.`,
      ];
    }

    return [
      `Menu spesial ${productName} dimasak dengan bahan pilihan berkualitas dan racikan bumbu khas dapur kami.`,
      `Sajian istimewa ${productName} dengan rasa otentik yang lezat, gurih, dan siap memanjakan lidah Anda.`,
      `${productName} favorit pelanggan! Porsi pas dan cita rasa nikmat yang selalu dirindukan setiap saat.`,
    ];
  };

  const handleRequestAiDescription = () => {
    const trimmedName = name.trim();
    const trimmedCat = category.trim();

    if (!trimmedName || !trimmedCat) {
      showAlert(
        'Isi Nama Menu & Kategori Terlebih Dahulu',
        'Untuk membuat saran deskripsi AI yang akurat, mohon lengkapi Nama Menu dan Kategori terlebih dahulu.',
        'warning'
      );
      return;
    }

    setIsGeneratingAi(true);
    setAiModalVisible(true);

    setTimeout(() => {
      const generated = generateCulinaryDescriptions(trimmedName, trimmedCat);
      setAiSuggestions(generated);
      setIsGeneratingAi(false);
    }, 450);
  };

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
        { id: Date.now() + '_reg', name: 'Reguler', sellingPrice: baseP, costPrice: baseC },
        { id: Date.now() + '_lrg', name: 'Jumbo / Large', sellingPrice: Math.round((baseP * 1.25) / 1000) * 1000, costPrice: Math.round((baseC * 1.2) / 1000) * 1000 },
      ];
    } else if (type === 'temp') {
      preset = [
        { id: Date.now() + '_ice', name: 'Dingin (Ice)', sellingPrice: baseP, costPrice: baseC },
        { id: Date.now() + '_hot', name: 'Panas (Hot)', sellingPrice: baseP, costPrice: baseC },
      ];
    } else if (type === 'portion') {
      preset = [
        { id: Date.now() + '_p1', name: 'Porsi Biasa', sellingPrice: baseP, costPrice: baseC },
        { id: Date.now() + '_p2', name: 'Porsi Double / Kenyang', sellingPrice: Math.round((baseP * 1.5) / 1000) * 1000, costPrice: Math.round((baseC * 1.4) / 1000) * 1000 },
      ];
    }
    setVariants([...variants, ...preset]);
    setHasVariants(true);
  }

  function handleApplyPresetModifier(type: 'rice_egg' | 'spicy' | 'cheese_sauce' | 'sweetness') {
    let newGroup: ModifierGroup | null = null;
    const now = Date.now().toString();

    if (type === 'rice_egg') {
      newGroup = {
        id: now + '_addon',
        name: 'Tambahan Pelengkap (Add-on)',
        isRequired: false,
        options: [
          { id: now + '_rice', name: 'Tambah Nasi Putih', price: 5000 },
          { id: now + '_egg', name: 'Tambah Telur Ceplok/Dadar', price: 4000 },
          { id: now + '_krupuk', name: 'Tambah Kerupuk', price: 2000 },
        ],
      };
    } else if (type === 'spicy') {
      newGroup = {
        id: now + '_spicy',
        name: 'Pilihan Tingkat Kepedasan',
        isRequired: true,
        options: [
          { id: now + '_lv0', name: 'Tidak Pedas', price: 0 },
          { id: now + '_lv1', name: 'Sedang', price: 0 },
          { id: now + '_lv2', name: 'Sangat Pedas', price: 0 },
        ],
      };
    } else if (type === 'cheese_sauce') {
      newGroup = {
        id: now + '_top',
        name: 'Extra Topping & Saus',
        isRequired: false,
        options: [
          { id: now + '_chz', name: 'Extra Keju Melt / Slice', price: 4000 },
          { id: now + '_sauce', name: 'Extra Saus BBQ / Mayo', price: 3000 },
          { id: now + '_sambal', name: 'Extra Sambal Bawang', price: 3000 },
        ],
      };
    } else if (type === 'sweetness') {
      newGroup = {
        id: now + '_sweet',
        name: 'Level Gula & Es (Minuman)',
        isRequired: true,
        options: [
          { id: now + '_norm', name: 'Normal Sweet & Ice', price: 0 },
          { id: now + '_less', name: 'Less Sugar (50% Gula)', price: 0 },
          { id: now + '_noice', name: 'Less Ice / No Ice', price: 0 },
        ],
      };
    }

    if (newGroup) {
      setModifierGroups([...modifierGroups, newGroup]);
    }
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

    if (isEditMode && params.editId) {
      productStore.updateProduct(params.editId, {
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
        availableOutlets: isAvailableAllOutlets ? ['all'] : [selectedAvailableOutlet],
      });

      showAlert(
        'Menu Berhasil Diperbarui! 🎉',
        `Perubahan pada menu "${name.trim()}" telah disimpan dan disinkronkan ke Kasir POS.`,
        'success',
        () => {
          router.back();
        }
      );
      return;
    }

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
      availableOutlets: isAvailableAllOutlets ? ['all'] : [selectedAvailableOutlet],
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
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Ionicons name="chevron-back" size={22} color="#FF5722" />
            <Text fontFamily="Geist_700Bold" fontSize={14} color="#FF5722">
              Kembali
            </Text>
          </TouchableOpacity>

          <XStack ai="center" gap={6}>
            <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
              {isEditMode ? 'Edit Menu / Produk' : 'Tambah Menu Baru'}
            </Text>
          </XStack>

          <View style={{ width: 70 }} />
        </XStack>

        {/* ── FORM CONTAINER ── */}
        <ScrollView
          ref={mainScrollViewRef}
          f={1}
          backgroundColor="white"
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        >
          <YStack
            gap={20}
            maxWidth={650}
            alignSelf="center"
            w="100%"
            px={isMobile ? 16 : 24}
            py={isMobile ? 16 : 24}
            backgroundColor="white"
          >
            {/* Nama Produk Input */}
            <YStack gap={8}>
              <YStack gap={2}>
                <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                  Nama Menu / Produk *
                </Text>
                <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                  Lengkapi rincian produk untuk ditambahkan ke katalog resto
                </Text>
              </YStack>
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

            {/* ── ADAPTIVE KATEGORI SELECTOR UI (CHIPS JIKA <= 6, SELECT JIKA > 6) ── */}
            <YStack gap={8}>
              <XStack jc="space-between" ai="center">
                <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                  Kategori Menu *
                </Text>
                {allCategories.length <= 6 && (
                  <TouchableOpacity
                    onPress={() => setNewCatModalVisible(true)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: '#FFF3E0',
                      borderWidth: 1,
                      borderColor: '#FF5722',
                      borderStyle: 'dashed',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Ionicons name="add-circle" size={14} color="#FF5722" />
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#FF5722">
                      Kategori Baru
                    </Text>
                  </TouchableOpacity>
                )}
              </XStack>

              {allCategories.length <= 6 ? (
                /* CHIPS KE SAMPING (HORIZONTAL SCROLL) */
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <XStack gap={8} py={2}>
                    {allCategories.map(cat => {
                      const isSelected = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => handleSelectCategory(cat)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 9,
                            borderRadius: 10,
                            backgroundColor: isSelected ? '#FF5722' : '#F4F4F5',
                            borderWidth: 1,
                            borderColor: isSelected ? '#FF5722' : '#E4E4E7',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          {isSelected && <Ionicons name="checkmark-circle" size={14} color="white" />}
                          <Text fontFamily="Geist_700Bold" fontSize={13} color={isSelected ? 'white' : '#52525B'}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </XStack>
                </ScrollView>
              ) : (
                /* SELECT / DROPDOWN JIKA KATEGORI > 6 */
                <XStack gap={8} ai="center">
                  <TouchableOpacity
                    onPress={() => setCatPickerVisible(true)}
                    style={{
                      flex: 1,
                      height: 48,
                      backgroundColor: '#FAFAFA',
                      borderWidth: 1,
                      borderColor: '#D4D4D8',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <XStack ai="center" gap={8}>
                      <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                        {category || 'Pilih Kategori Menu'}
                      </Text>
                    </XStack>
                    <Ionicons name="chevron-down" size={18} color="#71717A" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setNewCatModalVisible(true)}
                    style={{
                      height: 48,
                      paddingHorizontal: 14,
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
                    <Ionicons name="add" size={18} color="#FF5722" />
                    <Text fontFamily="Geist_700Bold" fontSize={13} color="#FF5722">
                      Kategori Baru
                    </Text>
                  </TouchableOpacity>
                </XStack>
              )}
            </YStack>

            {/* Harga Jual Utama & Biaya Modal Bahan */}
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
                  placeholder="15.000"
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
                {hasVariants && variants.length > 0 && (
                  <XStack backgroundColor="#FFF7ED" p={8} br={8} borderWidth={1} borderColor="#FFEDD5" gap={6} ai="center">
                    <Ionicons name="information-circle" size={16} color="#EA580C" />
                    <Text fontFamily="Geist_500Medium" fontSize={11} color="#C2410C" f={1}>
                      Pilihan ukuran aktif: Kasir akan menggunakan harga sesuai ukuran yang dipilih pelanggan.
                    </Text>
                  </XStack>
                )}
              </YStack>

              <YStack f={1} gap={8}>
                <XStack jc="space-between" ai="center">
                  <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                    Biaya Modal Bahan (Opsional)
                  </Text>
                  <TouchableOpacity onPress={() => setBomModalVisible(true)}>
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#FF5722">
                      Hitung Bahan Baku
                    </Text>
                  </TouchableOpacity>
                </XStack>
                <Input
                  backgroundColor="#FAFAFA"
                  borderWidth={1}
                  borderColor="#D4D4D8"
                  focusStyle={{ borderColor: '#FF5722', backgroundColor: 'white' }}
                  br={10}
                  placeholder="8.500"
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
                    Estimasi Untung Bersih (Harga - Modal)
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
                    Untung {marginPercent}%
                  </Text>
                </View>
              </XStack>
            )}

            {/* ── TAMPILAN VISUAL & FOTO MENU ── */}
            <YStack gap={12} backgroundColor="#FAFAFA" p={14} br={12} borderWidth={1} borderColor="#E4E4E7">
              <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                Tampilan Visual Menu
              </Text>

              {/* Segmented 2-Tab Selector: Foto Produk vs Ikon & Warna (Mutually Exclusive) */}
              <XStack backgroundColor="#E4E4E7" p={3} br={10} gap={4}>
                <TouchableOpacity
                  onPress={() => setVisualType('image')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    alignItems: 'center',
                    borderRadius: 8,
                    backgroundColor: visualType === 'image' ? 'white' : 'transparent',
                    borderWidth: visualType === 'image' ? 1 : 0,
                    borderColor: visualType === 'image' ? '#D4D4D8' : 'transparent',
                  }}
                >
                  <XStack ai="center" gap={6}>
                    <Ionicons name="camera" size={15} color={visualType === 'image' ? '#FF5722' : '#71717A'} />
                    <Text
                      fontFamily="Geist_700Bold"
                      fontSize={12}
                      color={visualType === 'image' ? '#FF5722' : '#71717A'}
                    >
                      Foto Produk
                    </Text>
                  </XStack>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setVisualType('icon');
                    setImageUri(null);
                  }}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    alignItems: 'center',
                    borderRadius: 8,
                    backgroundColor: visualType === 'icon' ? 'white' : 'transparent',
                    borderWidth: visualType === 'icon' ? 1 : 0,
                    borderColor: visualType === 'icon' ? '#D4D4D8' : 'transparent',
                  }}
                >
                  <XStack ai="center" gap={6}>
                    <Ionicons name="color-palette" size={15} color={visualType === 'icon' ? '#FF5722' : '#71717A'} />
                    <Text
                      fontFamily="Geist_700Bold"
                      fontSize={12}
                      color={visualType === 'icon' ? '#FF5722' : '#71717A'}
                    >
                      Ikon & Warna
                    </Text>
                  </XStack>
                </TouchableOpacity>
              </XStack>

              {/* TAB 1: MODE FOTO PRODUK */}
              {visualType === 'image' ? (
                <XStack gap={12} ai="center" p={10} backgroundColor="white" br={10} borderWidth={1} borderColor="#E4E4E7">
                  <TouchableOpacity
                    onPress={() => setPhotoOptionsModalVisible(true)}
                    activeOpacity={0.8}
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 10,
                      backgroundColor: imageUri ? 'white' : '#F4F4F5',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#E4E4E7',
                      overflow: 'hidden',
                    }}
                  >
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={{ width: 54, height: 54 }} resizeMode="cover" />
                    ) : (
                      <Ionicons name="image-outline" size={24} color="#A1A1AA" />
                    )}
                  </TouchableOpacity>

                  <YStack f={1} gap={4}>
                    <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                      {imageUri ? 'Foto Siap Digunakan' : 'Belum Ada Foto'}
                    </Text>
                    <XStack gap={8} ai="center">
                      <TouchableOpacity
                        onPress={() => setPhotoOptionsModalVisible(true)}
                        style={{
                          backgroundColor: '#FF5722',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Ionicons name="camera" size={13} color="white" />
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
                            paddingVertical: 6,
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
              ) : (
                /* TAB 2: MODE IKON & WARNA */
                <YStack gap={10}>
                  {/* Icon Card Preview */}
                  <XStack gap={12} ai="center" p={10} backgroundColor="white" br={10} borderWidth={1} borderColor="#E4E4E7">
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: selectedColor,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name={selectedIcon as any} size={22} color="white" />
                    </View>
                    <YStack f={1}>
                      <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                        Pratinjau Badge Kasir
                      </Text>
                      <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                        Ikon & warna yang tampil pada menu kasir
                      </Text>
                    </YStack>
                  </XStack>

                  {/* Colors */}
                  <YStack gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                      Warna Badge:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <XStack gap={8} py={2}>
                        {[
                          '#FF5722', '#EF4444', '#F59E0B', '#10B981', '#14B8A6',
                          '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#475569',
                        ].map(color => (
                          <TouchableOpacity
                            key={color}
                            onPress={() => setSelectedColor(color)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: color,
                              borderWidth: selectedColor === color ? 2.5 : 0,
                              borderColor: '#18181B',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            {selectedColor === color && <Ionicons name="checkmark" size={14} color="white" />}
                          </TouchableOpacity>
                        ))}
                      </XStack>
                    </ScrollView>
                  </YStack>

                  {/* Icons */}
                  <YStack gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                      Pilihan Ikon:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <XStack gap={6}>
                        {[
                          { id: 'restaurant-outline', label: 'Makanan' },
                          { id: 'cafe-outline', label: 'Kopi' },
                          { id: 'pizza-outline', label: 'Snack' },
                          { id: 'wine-outline', label: 'Minuman' },
                          { id: 'ice-cream-outline', label: 'Dessert' },
                          { id: 'flame-outline', label: 'Pedas' },
                          { id: 'leaf-outline', label: 'Sehat' },
                        ].map(item => {
                          const isSel = selectedIcon === item.id;
                          return (
                            <TouchableOpacity
                              key={item.id}
                              onPress={() => setSelectedIcon(item.id)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 8,
                                backgroundColor: isSel ? selectedColor : '#FFFFFF',
                                borderWidth: 1,
                                borderColor: isSel ? selectedColor : '#E4E4E7',
                              }}
                            >
                              <Ionicons name={item.id as any} size={14} color={isSel ? 'white' : '#52525B'} />
                              <Text fontFamily="Geist_700Bold" fontSize={11} color={isSel ? 'white' : '#52525B'}>
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
              <XStack jc="space-between" ai="center">
                <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                  Deskripsi / Catatan Menu
                </Text>

                <TouchableOpacity
                  onPress={handleRequestAiDescription}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: '#FFF7ED',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#FFEDD5',
                  }}
                >
                  <Ionicons name="sparkles" size={13} color="#EA580C" />
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="#EA580C">
                    Saran AI
                  </Text>
                </TouchableOpacity>
              </XStack>

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
              />
            </YStack>

            {/* ── STOK FLEKSIBEL / LACAK STOK FISIK ── */}
            <YStack backgroundColor="#FAFAFA" p={16} br={14} borderWidth={1} borderColor="#E4E4E7" gap={14}>
              <XStack jc="space-between" ai="center">
                <YStack f={1} pr={10} gap={2}>
                  <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                    Lacak Stok Fisik
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A" lineHeight={16}>
                    Biarkan mati jika menu selalu siap dibuat (tanpa batasan porsi).
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
                  <Ionicons name="infinite" size={20} color="#FF5722" />
                  <YStack f={1} gap={2}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#FF5722">
                      ∞ Stok Selalu Tersedia (Bebas Dipesan)
                    </Text>
                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A" lineHeight={15}>
                      Menu dibuat on-demand tanpa batasan kuota stok.
                    </Text>
                  </YStack>
                </XStack>
              ) : (
                /* MODUS LACAK STOK FISIK (CUSTOM STOK INITIAL VALUE) */
                <YStack gap={8} pt={4}>
                  <YStack gap={2}>
                    <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                      Jumlah Stok Awal *
                    </Text>
                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                      Jumlah porsi atau unit barang yang siap dijual saat ini.
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

            {/* ── PILIHAN UKURAN & TOPPING (RINGKAS & BERSIH) ── */}
            <YStack backgroundColor="#FAFAFA" p={14} br={12} borderWidth={1} borderColor="#E4E4E7" gap={12}>
              <XStack jc="space-between" ai="center">
                <YStack f={1} pr={8}>
                  <XStack ai="center" gap={6}>
                    <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                      Ukuran & Topping Tambahan
                    </Text>
                    {(variants.length > 0 || modifierGroups.length > 0) && (
                      <View style={{ backgroundColor: '#18181B', paddingHorizontal: 7, paddingVertical: 1, borderRadius: 8 }}>
                        <Text fontFamily="Geist_700Bold" fontSize={10} color="white">
                          {(variants.length > 0 ? 1 : 0) + modifierGroups.reduce((acc, g) => acc + g.options.length, 0)} Aktif
                        </Text>
                      </View>
                    )}
                  </XStack>
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                    Pilihan ukuran (Reguler/Jumbo) atau pelengkap (+ Nasi, Telur).
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
                <YStack gap={10} pt={2}>
                  {/* Segmented Switch: Ukuran vs Topping */}
                  <XStack backgroundColor="#E4E4E7" p={3} br={8} gap={4}>
                    <TouchableOpacity
                      onPress={() => setActiveCustomTab('variants')}
                      style={{
                        flex: 1,
                        paddingVertical: 6,
                        borderRadius: 6,
                        backgroundColor: activeCustomTab === 'variants' ? 'white' : 'transparent',
                        alignItems: 'center',
                      }}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={12} color={activeCustomTab === 'variants' ? '#18181B' : '#71717A'}>
                        Ukuran & Porsi {variants.length > 0 ? `(${variants.length})` : ''}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setActiveCustomTab('modifiers')}
                      style={{
                        flex: 1,
                        paddingVertical: 6,
                        borderRadius: 6,
                        backgroundColor: activeCustomTab === 'modifiers' ? 'white' : 'transparent',
                        alignItems: 'center',
                      }}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={12} color={activeCustomTab === 'modifiers' ? '#18181B' : '#71717A'}>
                        Topping & Tambahan {modifierGroups.length > 0 ? `(${modifierGroups.reduce((acc, g) => acc + g.options.length, 0)})` : ''}
                      </Text>
                    </TouchableOpacity>
                  </XStack>

                  {/* TAB 1: UKURAN & PORSI */}
                  {activeCustomTab === 'variants' && (
                    <YStack gap={10}>
                      {/* Form Tambah Ukuran (Atas-Bawah Rapi & Jelas) */}
                      <YStack gap={8} p={12} backgroundColor="white" br={10} borderWidth={1} borderColor="#E4E4E7">
                        <YStack gap={4}>
                          <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#18181B">
                            Nama Ukuran / Porsi
                          </Text>
                          <Input
                            placeholder="Contoh: Regular / Jumbo / Dingin"
                            placeholderTextColor="$gray10"
                            value={varNameInput}
                            onChangeText={setVarNameInput}
                            backgroundColor="#F9FAFB"
                            borderWidth={1}
                            borderColor="#D4D4D8"
                            br={8}
                            fontSize={13}
                            height={40}
                            style={{ color: '#18181B' }}
                          />
                        </YStack>

                        <YStack gap={4}>
                          <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#18181B">
                            Harga Jual Total (Rp)
                          </Text>
                          <Input
                            placeholder="Contoh: 18.000 (Harga jual ukuran ini)"
                            placeholderTextColor="$gray10"
                            value={varPriceInput}
                            onChangeText={(val) => setVarPriceInput(formatNumberWithDots(val))}
                            keyboardType="number-pad"
                            backgroundColor="#F9FAFB"
                            borderWidth={1}
                            borderColor="#D4D4D8"
                            br={8}
                            fontSize={13}
                            height={40}
                            style={{ color: '#18181B' }}
                          />
                        </YStack>

                        <TouchableOpacity
                          onPress={handleAddVariant}
                          style={{
                            backgroundColor: '#FF5722',
                            paddingVertical: 10,
                            borderRadius: 8,
                            alignItems: 'center',
                            marginTop: 2,
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={13} color="white">
                            + Tambahkan Ukuran / Porsi
                          </Text>
                        </TouchableOpacity>
                      </YStack>

                      {/* Template Cepat */}
                      <XStack gap={6} ai="center" flexWrap="wrap">
                        <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">
                          Template:
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleApplyPresetVariant('size')}
                          style={{ backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#D4D4D8' }}
                        >
                          <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">+ Reguler & Jumbo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleApplyPresetVariant('temp')}
                          style={{ backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#D4D4D8' }}
                        >
                          <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">+ Panas & Dingin</Text>
                        </TouchableOpacity>
                      </XStack>

                      {/* List Ukuran */}
                      {variants.map((v) => (
                        <XStack key={v.id} backgroundColor="white" p={10} br={8} borderWidth={1} borderColor="#E4E4E7" ai="center" jc="space-between">
                          <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                            {v.name}
                          </Text>
                          <XStack ai="center" gap={10}>
                            <Text fontFamily="Geist_700Bold" fontSize={12} color="#FF5722">
                              Rp {v.sellingPrice.toLocaleString('id-ID')}
                            </Text>
                            <TouchableOpacity onPress={() => handleRemoveVariant(v.id)}>
                              <Ionicons name="trash-outline" size={16} color="#71717A" />
                            </TouchableOpacity>
                          </XStack>
                        </XStack>
                      ))}
                    </YStack>
                  )}

                  {/* TAB 2: TOPPING & TAMBAHAN */}
                  {activeCustomTab === 'modifiers' && (
                    <YStack gap={10}>
                      {/* Form Tambah Topping / Opsi (Atas-Bawah Rapi & Jelas) */}
                      <YStack gap={8} p={12} backgroundColor="white" br={10} borderWidth={1} borderColor="#E4E4E7">
                        <YStack gap={4}>
                          <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#18181B">
                            Nama Topping / Pilihan Rasa
                          </Text>
                          <Input
                            placeholder="Contoh: + Nasi Putih / + Telur / Sedang"
                            placeholderTextColor="$gray10"
                            value={optNameInput}
                            onChangeText={setOptNameInput}
                            backgroundColor="#F9FAFB"
                            borderWidth={1}
                            borderColor="#D4D4D8"
                            br={8}
                            fontSize={13}
                            height={40}
                            style={{ color: '#18181B' }}
                          />
                        </YStack>

                        <YStack gap={4}>
                          <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#18181B">
                            Tambahan Harga (Rp)
                          </Text>
                          <Input
                            placeholder="Contoh: 5.000 (Isi 0 jika gratis / tidak ubah harga)"
                            placeholderTextColor="$gray10"
                            value={optPriceInput}
                            onChangeText={(val) => setOptPriceInput(formatNumberWithDots(val))}
                            keyboardType="number-pad"
                            backgroundColor="#F9FAFB"
                            borderWidth={1}
                            borderColor="#D4D4D8"
                            br={8}
                            fontSize={13}
                            height={40}
                            style={{ color: '#18181B' }}
                          />
                        </YStack>

                        <TouchableOpacity
                          onPress={() => {
                            const trimmed = optNameInput.trim();
                            if (!trimmed) {
                              showAlert('Perhatian', 'Harap isi nama pilihan atau topping.');
                              return;
                            }
                            const price = parseInt(optPriceInput.replace(/\D/g, '')) || 0;
                            const now = Date.now().toString();
                            const updated = [...modifierGroups];
                            if (updated.length === 0) {
                              updated.push({
                                id: now + '_grp',
                                name: 'Topping & Pilihan Rasa',
                                isRequired: false,
                                options: [{ id: now + '_opt', name: trimmed, price }],
                              });
                            } else {
                              updated[0].options.push({
                                id: now + '_' + Math.random().toString(36).substring(2, 5),
                                name: trimmed,
                                price,
                              });
                            }
                            setModifierGroups(updated);
                            setOptNameInput('');
                            setOptPriceInput('');
                          }}
                          style={{
                            backgroundColor: '#FF5722',
                            paddingVertical: 10,
                            borderRadius: 8,
                            alignItems: 'center',
                            marginTop: 2,
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={13} color="white">
                            + Tambahkan Pilihan Ini
                          </Text>
                        </TouchableOpacity>
                      </YStack>

                      {/* Template Cepat */}
                      <XStack gap={6} ai="center" flexWrap="wrap">
                        <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">
                          Template:
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleApplyPresetModifier('rice_egg')}
                          style={{ backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#D4D4D8' }}
                        >
                          <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">+ Nasi & Telur (+Rp)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleApplyPresetModifier('spicy')}
                          style={{ backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#D4D4D8' }}
                        >
                          <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">+ Level Pedas (Gratis / Rp 0)</Text>
                        </TouchableOpacity>
                      </XStack>

                      {/* List Topping & Pilihan Rasa */}
                      {modifierGroups.map((group, gIdx) => (
                        <YStack key={group.id} gap={6}>
                          {group.options.map((opt) => (
                            <XStack key={opt.id} backgroundColor="white" p={10} br={8} borderWidth={1} borderColor="#E4E4E7" ai="center" jc="space-between">
                              <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#18181B">
                                {opt.name}
                              </Text>
                              <XStack ai="center" gap={10}>
                                <Text fontFamily="Geist_700Bold" fontSize={12} color={opt.price > 0 ? '#16A34A' : '#71717A'}>
                                  {opt.price > 0 ? `+Rp ${opt.price.toLocaleString('id-ID')}` : 'Gratis (Rp 0)'}
                                </Text>
                                <TouchableOpacity onPress={() => handleRemoveOptionFromGroup(gIdx, opt.id)}>
                                  <Ionicons name="trash-outline" size={16} color="#71717A" />
                                </TouchableOpacity>
                              </XStack>
                            </XStack>
                          ))}
                        </YStack>
                      ))}
                    </YStack>
                  )}
                </YStack>
              )}
            </YStack>

            {/* ── KETERSEDIAAN DI CABANG / OUTLET ── */}
            <YStack backgroundColor="#FAFAFA" p={14} br={12} borderWidth={1} borderColor="#E4E4E7" gap={12}>
              <XStack jc="space-between" ai="center">
                <YStack f={1} pr={8}>
                  <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                    Ketersediaan Menu di Cabang
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                    {isAvailableAllOutlets
                      ? 'Tersedia di semua cabang resto'
                      : `Khusus dijual di 1 cabang: ${selectedAvailableOutlet}`}
                  </Text>
                </YStack>

                <Switch
                  value={isAvailableAllOutlets}
                  onValueChange={(val) => {
                    setIsAvailableAllOutlets(val);
                    if (!val && !selectedAvailableOutlet) {
                      setSelectedAvailableOutlet(defaultOutletName);
                    }
                  }}
                  trackColor={{ false: '#E4E4E7', true: '#FFCC80' }}
                  thumbColor={isAvailableAllOutlets ? '#FF5722' : '#FAFAFA'}
                />
              </XStack>

              {!isAvailableAllOutlets && (
                <YStack gap={8} pt={4}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#52525B">
                    Pilih 1 cabang yang menjual menu ini:
                  </Text>
                  <YStack gap={6}>
                    {allOutlets.map((ot) => {
                      const isSelected = selectedAvailableOutlet === ot.name;
                      return (
                        <TouchableOpacity
                          key={ot.id}
                          onPress={() => setSelectedAvailableOutlet(ot.name)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isSelected ? '#FFF7ED' : 'white',
                            padding: 10,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: isSelected ? '#FF5722' : '#E4E4E7',
                          }}
                        >
                          <YStack f={1} pr={8}>
                            <Text fontFamily="Geist_700Bold" fontSize={13} color={isSelected ? '#EA580C' : '#18181B'}>
                              {ot.name}
                            </Text>
                            <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                              {ot.address}
                            </Text>
                          </YStack>
                          <Ionicons
                            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                            size={20}
                            color={isSelected ? '#FF5722' : '#A1A1AA'}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </YStack>
                </YStack>
              )}
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

            {/* ── TOMBOL HAPUS MENU (HANYA MUNCUL DI EDIT MODE) ── */}
            {isEditMode && (
              <Button
                backgroundColor="#FEE2E2"
                borderColor="#FECACA"
                borderWidth={1}
                br={12}
                h={48}
                mt={8}
                onPress={() => {
                  showAlert(
                    'Hapus Menu Ini?',
                    `Apakah Anda yakin ingin menghapus "${name}"? Tindakan ini tidak dapat dibatalkan.`,
                    'warning',
                    () => {
                      if (params.editId) {
                        productStore.deleteProduct(params.editId);
                        router.back();
                      }
                    }
                  );
                }}
              >
                <XStack ai="center" gap={6}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text fontFamily="Geist_700Bold" color="#DC2626" fontSize={14}>
                    Hapus Menu Ini
                  </Text>
                </XStack>
              </Button>
            )}

            <YStack pb={80} />
          </YStack>
        </ScrollView>

        {/* ── FIXED BOTTOM ACTION BAR ── */}
        <XStack
          backgroundColor="white"
          px={isMobile ? 16 : 24}
          py={12}
          pb={Math.max(insets.bottom + 8, 14)}
          borderTopWidth={1}
          borderColor="#F4F4F5"
          gap={12}
          shadowColor="rgba(0, 0, 0, 0.05)"
          shadowRadius={12}
          shadowOffset={{ width: 0, height: -3 }}
          elevation={4}
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
            {isEditMode ? 'Simpan Perubahan' : 'Simpan & Publikasikan'}
          </Text>
        </Button>
      </XStack>

      {/* ── MODAL PICKER KATEGORI (JIKA KATEGORI > 6) ── */}
      <Modal visible={catPickerVisible} transparent animationType="slide" onRequestClose={() => setCatPickerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCatPickerVisible(false)} />
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%', gap: 12 }}>
            <XStack jc="space-between" ai="center" pb={12} borderBottomWidth={1} borderColor="#F4F4F5">
              <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                Pilih Kategori Menu ({allCategories.length} Kategori)
              </Text>
              <TouchableOpacity onPress={() => setCatPickerVisible(false)}>
                <Ionicons name="close" size={22} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <TouchableOpacity
              onPress={() => {
                setCatPickerVisible(false);
                setNewCatModalVisible(true);
              }}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor: '#FFF3E0',
                borderWidth: 1,
                borderColor: '#FF5722',
                borderStyle: 'dashed',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Ionicons name="add-circle" size={18} color="#FF5722" />
              <Text fontFamily="Geist_700Bold" fontSize={13} color="#FF5722">
                + Tambah Kategori Baru
              </Text>
            </TouchableOpacity>

            <ScrollView py={4}>
              <YStack gap={8}>
                {allCategories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      handleSelectCategory(cat);
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
                    placeholder="4.500"
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

      {/* ── PHOTO SOURCE SELECTION MODAL (TANPA OVERLAY HITAM) ── */}
      <Modal visible={photoOptionsModalVisible} transparent animationType="slide" onRequestClose={() => setPhotoOptionsModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPhotoOptionsModalVisible(false)} />
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              gap: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 16,
              borderTopWidth: 1,
              borderColor: '#F4F4F5',
            }}
          >
            <XStack jc="space-between" ai="center" pb={4}>
              <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                Pilih Sumber Foto Menu
              </Text>
              <TouchableOpacity onPress={() => setPhotoOptionsModalVisible(false)}>
                <Ionicons name="close" size={22} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <YStack gap={10}>
              <TouchableOpacity
                onPress={handleTakePicture}
                activeOpacity={0.7}
                style={{
                  backgroundColor: '#FAFAFA',
                  borderWidth: 1,
                  borderColor: '#E4E4E7',
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="camera" size={20} color="#FF5722" />
                </View>
                <YStack f={1} gap={2}>
                  <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                    Ambil Foto Baru (Kamera)
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                    Jepret langsung foto makanan/minuman dengan Kamera HP
                  </Text>
                </YStack>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickFromGallery}
                activeOpacity={0.7}
                style={{
                  backgroundColor: '#FAFAFA',
                  borderWidth: 1,
                  borderColor: '#E4E4E7',
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="image" size={20} color="#3B82F6" />
                </View>
                <YStack f={1} gap={2}>
                  <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                    Pilih Foto dari Galeri HP
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                    Pilih gambar dari album / galeri perangkat Anda
                  </Text>
                </YStack>
              </TouchableOpacity>
            </YStack>

            <Button br={10} h={44} backgroundColor="#F4F4F5" onPress={() => setPhotoOptionsModalVisible(false)}>
              <Text fontFamily="Geist_700Bold" color="#71717A" fontSize={13}>
                Batal
              </Text>
            </Button>
          </View>
        </View>
      </Modal>

      {/* ── AI DESCRIPTION SUGGESTIONS MODAL ── */}
      <Modal visible={aiModalVisible} transparent animationType="slide" onRequestClose={() => setAiModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAiModalVisible(false)} />
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              gap: 14,
              maxHeight: '75%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 16,
              borderTopWidth: 1,
              borderColor: '#F4F4F5',
            }}
          >
            <XStack jc="space-between" ai="center" pb={4}>
              <XStack ai="center" gap={6}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="sparkles" size={16} color="#EA580C" />
                </View>
                <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                  Saran Deskripsi AI
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setAiModalVisible(false)}>
                <Ionicons name="close" size={22} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
              Pilih salah satu deskripsi kuliner untuk "{name}" ({category}):
            </Text>

            {isGeneratingAi ? (
              <YStack py={30} ai="center" jc="center" gap={10}>
                <ActivityIndicator size="small" color="#FF5722" />
                <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#71717A">
                  Meracik kata-kata menggugah selera...
                </Text>
              </YStack>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <YStack gap={10} py={4}>
                  {aiSuggestions.map((sug, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setDescription(sug);
                        setAiModalVisible(false);
                      }}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: '#FAFAFA',
                        borderWidth: 1,
                        borderColor: '#E4E4E7',
                        borderRadius: 12,
                        padding: 14,
                        gap: 8,
                      }}
                    >
                      <XStack jc="space-between" ai="center">
                        <View style={{ backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Text fontFamily="Geist_700Bold" fontSize={10} color="#EA580C">
                            Opsi #{idx + 1}
                          </Text>
                        </View>
                        <XStack ai="center" gap={4}>
                          <Text fontFamily="Geist_700Bold" fontSize={11} color="#FF5722">
                            Gunakan Teks Ini
                          </Text>
                          <Ionicons name="checkmark-circle-outline" size={14} color="#FF5722" />
                        </XStack>
                      </XStack>
                      <Text fontFamily="Geist_400Regular" fontSize={13} color="#18181B" lineHeight={18}>
                        "{sug}"
                      </Text>
                    </TouchableOpacity>
                  ))}
                </YStack>
              </ScrollView>
            )}

            <Button br={10} h={44} backgroundColor="#F4F4F5" onPress={() => setAiModalVisible(false)}>
              <Text fontFamily="Geist_700Bold" color="#71717A" fontSize={13}>
                Tutup
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
