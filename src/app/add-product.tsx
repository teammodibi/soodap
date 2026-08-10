import { useState, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { productStore } from '../lib/productStore';

export default function AddProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

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
  const [category, setCategory] = useState(categories[0] || 'Coffee');
  const [catPickerVisible, setCatPickerVisible] = useState(false);

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

  // Calculations
  const sellNum = parseInt(sellingPrice) || 0;
  const costNum = parseInt(costPrice) || 0;
  const profit = sellNum - costNum;
  const marginPercent = sellNum > 0 ? ((profit / sellNum) * 100).toFixed(1) : '0';

  // Add BOM Ingredient
  function handleAddBomIngredient() {
    if (!ingName.trim()) return;
    const c = parseInt(ingCost) || 0;
    const updated = [...bomIngredients, { name: ingName.trim(), cost: c }];
    setBomIngredients(updated);
    setIngName('');
    setIngCost('');

    const totalCost = updated.reduce((sum, item) => sum + item.cost, 0);
    setCostPrice(totalCost.toString());
  }

  function handleRemoveBomIngredient(index: number) {
    const updated = bomIngredients.filter((_, i) => i !== index);
    setBomIngredients(updated);

    const totalCost = updated.reduce((sum, item) => sum + item.cost, 0);
    setCostPrice(totalCost.toString());
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
            Kembali
          </Text>
        </TouchableOpacity>

        <XStack ai="center" gap={8}>
          <Ionicons name="add-circle" size={22} color="#FF5722" />
          <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
            Tambah Menu Baru
          </Text>
        </XStack>

        <View style={{ width: 80 }} />
      </XStack>

      {/* ── FORM CONTAINER ── */}
      <ScrollView f={1} p={16} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <YStack gap={16} maxWidth={650} alignSelf="center" w="100%">
          
          {/* Main Card */}
          <YStack backgroundColor="white" p={20} br={16} borderWidth={1} borderColor="#E4E4E7" gap={16}>
            
            {/* Title Info */}
            <YStack pb={10} borderBottomWidth={1} borderColor="#F4F4F5" gap={2}>
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B">
                Formulir Pendaftaran Menu
              </Text>
              <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                Lengkapi rincian produk untuk ditambahkan ke katalog resto
              </Text>
            </YStack>

            {/* Foto / Gambar Produk */}
            <YStack gap={6}>
              <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                Foto / Gambar Menu (Opsional)
              </Text>
              <XStack gap={12} ai="center">
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    backgroundColor: '#FFF3E0',
                    borderWidth: 1.5,
                    borderColor: '#FFCC80',
                    borderStyle: 'dashed',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Ionicons name="camera-outline" size={26} color="#FF5722" />
                </View>

                <YStack f={1} gap={4}>
                  <TouchableOpacity
                    onPress={() => showAlert('Pilih Foto', 'Pilih foto dari Galeri / Kamera aktif. Ikon visual otomatis dipasang jika kosong.', 'success')}
                    style={{
                      backgroundColor: '#FF5722',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="cloud-upload-outline" size={16} color="white" />
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="white">
                      Unggah Foto Menu
                    </Text>
                  </TouchableOpacity>
                  <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                    Format PNG, JPG max 5MB. Ikon visual otomatis digunakan jika tidak diunggah.
                  </Text>
                </YStack>
              </XStack>
            </YStack>

            {/* Nama Produk Input */}
            <YStack gap={6}>
              <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                Nama Menu / Produk *
              </Text>
              <Input
                backgroundColor="#FAFAFA"
                borderWidth={1.5}
                borderColor="#E4E4E7"
                br={10}
                placeholder="Contoh: Kopi Susu Soodap Large"
                value={name}
                onChangeText={setName}
                fontFamily="Geist_600SemiBold"
                fontSize={14}
                height={46}
              />
            </YStack>

            {/* ── ADAPTIVE KATEGORI SELECTOR UI ── */}
            <YStack gap={6}>
              <XStack jc="space-between" ai="center">
                <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                  Kategori Menu *
                </Text>
                <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                  {categories.length <= 6 ? `${categories.length} Kategori (Modus Chips)` : `${categories.length} Kategori (Modus Dropdown)`}
                </Text>
              </XStack>

              {/* ATURAN: Jika <= 6 gunakan CHIPS. Jika > 6 gunakan SELECT DROPDOWN */}
              {categories.length <= 6 ? (
                /* ── CHIPS UI (<= 6 Kategori) ── */
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <XStack gap={8} py={2}>
                    {categories.map(cat => {
                      const isSelected = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setCategory(cat)}
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
                  </XStack>
                </ScrollView>
              ) : (
                /* ── SELECT DROPDOWN UI (> 6 Kategori) ── */
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCatPickerVisible(true)}
                  style={{
                    backgroundColor: '#FAFAFA',
                    borderWidth: 1.5,
                    borderColor: '#E4E4E7',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                    {category || 'Pilih Kategori Menu...'}
                  </Text>
                  <XStack ai="center" gap={6}>
                    <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text fontFamily="Geist_700Bold" fontSize={11} color="#FF5722">
                        {category}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#71717A" />
                  </XStack>
                </TouchableOpacity>
              )}
            </YStack>

            {/* Harga Jual & HPP Modal (Row) */}
            <XStack gap={12} flexDirection={isMobile ? 'column' : 'row'}>
              <YStack f={1} gap={6}>
                <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                  Harga Jual (Rp) *
                </Text>
                <Input
                  backgroundColor="#FAFAFA"
                  borderWidth={1.5}
                  borderColor="#FF5722"
                  br={10}
                  placeholder="Contoh: 22000"
                  keyboardType="number-pad"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  fontFamily="Geist_800ExtraBold"
                  fontSize={16}
                  height={46}
                />
              </YStack>

              <YStack f={1} gap={6}>
                <XStack jc="space-between" ai="center">
                  <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                    HPP / Modal awal (Rp)
                  </Text>
                  <TouchableOpacity onPress={() => setBomModalVisible(true)}>
                    <Text fontFamily="Geist_700Bold" fontSize={11} color="#FF5722">
                      Hitung Modal Bahan
                    </Text>
                  </TouchableOpacity>
                </XStack>
                <Input
                  backgroundColor="#FAFAFA"
                  borderWidth={1.5}
                  borderColor="#E4E4E7"
                  br={10}
                  placeholder="Contoh: 8500"
                  keyboardType="number-pad"
                  value={costPrice}
                  onChangeText={setCostPrice}
                  fontFamily="Geist_700Bold"
                  fontSize={16}
                  height={46}
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
            <YStack backgroundColor="#FAFAFA" p={14} br={14} borderWidth={1} borderColor="#E4E4E7" gap={12}>
              <XStack jc="space-between" ai="center">
                <YStack f={1} pr={10}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#18181B">
                    Lacak Stok Fisik (Opsional)
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                    Aktifkan jika produk memiliki stok fisik pasti di etalase (misal: Minuman Botol/Snack).
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
                <XStack backgroundColor="#FFF3E0" p={10} br={10} ai="center" gap={8} borderWidth={1} borderColor="#FFCC80">
                  <Ionicons name="infinite" size={20} color="#FF5722" />
                  <YStack f={1}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={12} color="#FF5722">
                      ∞ Tanpa Batas Stok (Fleksibel F&B)
                    </Text>
                    <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                      Menu siap dibuat kapan saja dari bahan baku. Kasir tidak akan dibatasi oleh stok habis.
                    </Text>
                  </YStack>
                </XStack>
              ) : (
                /* MODUS LACAK STOK FISIK (CUSTOM STOK INITIAL VALUE) */
                <YStack gap={6} pt={4}>
                  <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                    Input Stok Awal Fisik *
                  </Text>
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

            {/* Deskripsi Menu (Opsional) */}
            <YStack gap={6}>
              <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                Deskripsi / Catatan Menu (Publik / Struk)
              </Text>
              <TextArea
                backgroundColor="#FAFAFA"
                borderWidth={1}
                borderColor="#E4E4E7"
                br={10}
                placeholder="Contoh: Kopi susu khas Soodap dengan perpaduan espresso 100% Arabika & gula aren murni."
                value={description}
                onChangeText={setDescription}
                fontFamily="Geist_400Regular"
                fontSize={13}
                minHeight={70}
                maxHeight={160}
                p={10}
              />
            </YStack>

            {/* Catatan Resep & SOP Dapur (Internal Opsional - Collapsible) */}
            {!showRecipeInput && !recipeNote ? (
              <TouchableOpacity
                onPress={() => setShowRecipeInput(true)}
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
                  placeholder="Contoh: 30ml Espresso, 120ml Susu UHT, 20ml Gula Aren, 150g Es Batu"
                  value={recipeNote}
                  onChangeText={setRecipeNote}
                  fontFamily="Geist_400Regular"
                  fontSize={13}
                  minHeight={70}
                  maxHeight={160}
                  p={10}
                />
              </YStack>
            )}

            {/* Action Buttons */}
            <XStack gap={10} mt={8}>
              <Button
                f={1}
                size="$5"
                br={14}
                backgroundColor="#F4F4F5"
                onPress={() => router.back()}
              >
                <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={15}>
                  Batal
                </Text>
              </Button>

              <Button
                f={2}
                size="$5"
                br={14}
                backgroundColor="#FF5722"
                onPress={handleSaveProduct}
              >
                <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={15}>
                  Simpan & Publikasikan Menu
                </Text>
              </Button>
            </XStack>

          </YStack>
        </YStack>
      </ScrollView>

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
                    placeholder="Contoh: 4500"
                    keyboardType="number-pad"
                    value={ingCost}
                    onChangeText={setIngCost}
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
  );
}
