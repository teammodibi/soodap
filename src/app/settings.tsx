import { useState } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import {
  Alert,
  TouchableOpacity,
  View,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../lib/alertStore';
import { getActiveSession, setActiveSession } from '../lib/session';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = getActiveSession();

  // Resto Info States
  const [storeName, setStoreName] = useState(session?.storeName || 'Kopi Soodap Senopati');
  const [address, setAddress] = useState(session?.address || 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan');
  const [phone, setPhone] = useState(session?.phone || '0812-9988-7766');
  const [email, setEmail] = useState(session?.email || 'senopati@soodap.id');

  // Receipt Settings States
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>(session?.paperSize || '58mm');
  const [headerNote, setHeaderNote] = useState(session?.headerNote || 'Selamat Datang di Soodap!');
  const [footerNote, setFooterNote] = useState(session?.footerNote || 'Terima kasih atas kunjungan Anda. IG: @soodap.pos');
  const [autoPrint, setAutoPrint] = useState(true);

  // Tax & Service States
  const [taxPercent, setTaxPercent] = useState(session?.taxPercent || '10');
  const [serviceFeePercent, setServiceFeePercent] = useState('0');

  // Save Handler
  function handleSaveSettings() {
    if (session) {
      setActiveSession({
        ...session,
        storeName: storeName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        paperSize,
        headerNote: headerNote.trim(),
        footerNote: footerNote.trim(),
        taxPercent,
      });
    }
    showAlert('Pengaturan Disimpan! ✅', 'Data restoran dan konfigurasi struk berhasil diperbarui.');
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7FB' }}>
      <YStack f={1} backgroundColor="#F6F7FB">
        
        {/* ── HEADER BAR ── */}
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
            <Text fontFamily="Geist_800ExtraBold" fontSize={17} color="#18181B">
              Pengaturan Resto & POS
            </Text>
            <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
              Informasi detail outlet & konfigurasi struk
            </Text>
          </YStack>
        </XStack>

        <ScrollView f={1} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <YStack gap={20} maxWidth={600} alignSelf="center" w="100%">

            {/* 1. INFORMASI DETAIL RESTORAN / OUTLET */}
            <YStack style={styles.cardGroup}>
              <XStack ai="center" gap={8} mb={4}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="storefront-outline" size={18} color="#FF5722" />
                </View>
                <Text fontFamily="Geist_700Bold" fontSize={15} color="#18181B">
                  Informasi Restoran / Outlet
                </Text>
              </XStack>

              <YStack gap={12}>
                <YStack gap={4}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Nama Resto / Outlet</Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderColor="#E4E4E7"
                    br={10}
                    fontSize={14}
                    fontFamily="Geist_400Regular"
                    value={storeName}
                    onChangeText={setStoreName}
                  />
                </YStack>

                <YStack gap={4}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Alamat Lengkap</Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderColor="#E4E4E7"
                    br={10}
                    fontSize={14}
                    fontFamily="Geist_400Regular"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                  />
                </YStack>

                <XStack gap={10}>
                  <YStack f={1} gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Nomor Telepon / WA</Text>
                    <Input
                      backgroundColor="#FAFAFA"
                      borderColor="#E4E4E7"
                      br={10}
                      fontSize={14}
                      fontFamily="Geist_400Regular"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </YStack>

                  <YStack f={1} gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Email Resto</Text>
                    <Input
                      backgroundColor="#FAFAFA"
                      borderColor="#E4E4E7"
                      br={10}
                      fontSize={14}
                      fontFamily="Geist_400Regular"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </YStack>
                </XStack>
              </YStack>
            </YStack>

            {/* SHORTCUT KE KELOLA PRODUK & COSTING HPP */}
            <TouchableOpacity
              onPress={() => router.push('/products')}
              style={[styles.cardGroup, { backgroundColor: '#EEF4FF', borderColor: '#C7D9FF' }]}
              activeOpacity={0.8}
            >
              <XStack ai="center" jc="space-between">
                <XStack ai="center" gap={12}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#0D6EFD' }]}>
                    <Ionicons name="fast-food" size={18} color="white" />
                  </View>
                  <YStack f={1}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#0D6EFD">
                      Kelola Produk, Kategori & Costing HPP
                    </Text>
                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#52525B">
                      Tambah menu, buat kategori & hitung modal bahan resto
                    </Text>
                  </YStack>
                </XStack>
                <Ionicons name="chevron-forward" size={18} color="#0D6EFD" />
              </XStack>
            </TouchableOpacity>

            {/* 2. PENGATURAN STRUK & PRINTER */}
            <YStack style={styles.cardGroup}>
              <XStack ai="center" gap={8} mb={4}>
                <View style={[styles.sectionIcon, { backgroundColor: '#EEF4FF' }]}>
                  <Ionicons name="print-outline" size={18} color="#0D6EFD" />
                </View>
                <Text fontFamily="Geist_700Bold" fontSize={15} color="#18181B">
                  Pengaturan Struk & Printer
                </Text>
              </XStack>

              <YStack gap={12}>
                <YStack gap={6}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Ukuran Kertas Struk</Text>
                  <XStack gap={8}>
                    <TouchableOpacity
                      onPress={() => setPaperSize('58mm')}
                      style={[
                        styles.chipOption,
                        paperSize === '58mm' && styles.chipOptionActive
                      ]}
                    >
                      <Text
                        fontFamily="Geist_700Bold"
                        fontSize={13}
                        color={paperSize === '58mm' ? 'white' : '#52525B'}
                      >
                        58 mm (Kecil / Mobile Printer)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setPaperSize('80mm')}
                      style={[
                        styles.chipOption,
                        paperSize === '80mm' && styles.chipOptionActive
                      ]}
                    >
                      <Text
                        fontFamily="Geist_700Bold"
                        fontSize={13}
                        color={paperSize === '80mm' ? 'white' : '#52525B'}
                      >
                        80 mm (Standar Kasir)
                      </Text>
                    </TouchableOpacity>
                  </XStack>
                </YStack>

                <YStack gap={4}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Pesan Header Struk (Atas)</Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderColor="#E4E4E7"
                    br={10}
                    fontSize={13}
                    fontFamily="Geist_400Regular"
                    value={headerNote}
                    onChangeText={setHeaderNote}
                  />
                </YStack>

                <YStack gap={4}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Pesan Footer Struk (Bawah)</Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderColor="#E4E4E7"
                    br={10}
                    fontSize={13}
                    fontFamily="Geist_400Regular"
                    value={footerNote}
                    onChangeText={setFooterNote}
                  />
                </YStack>

                <XStack jc="space-between" ai="center" p={12} backgroundColor="#FAFAFA" br={12} borderWidth={1} borderColor="#E4E4E7">
                  <YStack f={1} mr={10}>
                    <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                      Cetak Struk Otomatis
                    </Text>
                    <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                      Cetak struk secara otomatis setelah pembayaran sukses
                    </Text>
                  </YStack>
                  <Switch
                    value={autoPrint}
                    onValueChange={setAutoPrint}
                    trackColor={{ false: '#E4E4E7', true: '#FF5722' }}
                    thumbColor="white"
                  />
                </XStack>
              </YStack>
            </YStack>

            {/* 3. PENGATURAN PAJAK & SERVICE FEE */}
            <YStack style={styles.cardGroup}>
              <XStack ai="center" gap={8} mb={4}>
                <View style={[styles.sectionIcon, { backgroundColor: '#E8FFF1' }]}>
                  <Ionicons name="receipt-outline" size={18} color="#10B981" />
                </View>
                <Text fontFamily="Geist_700Bold" fontSize={15} color="#18181B">
                  Pajak & Biaya Layanan
                </Text>
              </XStack>

              <XStack gap={10}>
                <YStack f={1} gap={4}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Pajak Restoran / PB1 (%)</Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderColor="#E4E4E7"
                    br={10}
                    fontSize={14}
                    fontFamily="Geist_400Regular"
                    value={taxPercent}
                    onChangeText={setTaxPercent}
                    keyboardType="number-pad"
                  />
                </YStack>

                <YStack f={1} gap={4}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Biaya Layanan / Service (%)</Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderColor="#E4E4E7"
                    br={10}
                    fontSize={14}
                    fontFamily="Geist_400Regular"
                    value={serviceFeePercent}
                    onChangeText={setServiceFeePercent}
                    keyboardType="number-pad"
                  />
                </YStack>
              </XStack>
            </YStack>

            {/* SAVE BUTTON */}
            <Button
              size="$5"
              br={14}
              backgroundColor="#FF5722"
              onPress={handleSaveSettings}
              pressStyle={{ opacity: 0.9 }}
              mt={4}
              mb={24}
            >
              <Text fontFamily="Geist_700Bold" color="white" fontSize={16}>
                Simpan Perubahan Pengaturan
              </Text>
            </Button>

          </YStack>
        </ScrollView>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  cardGroup: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOptionActive: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
});
