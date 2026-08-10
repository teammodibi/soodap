import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView, Spinner } from 'tamagui';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getActiveSession, setActiveSession } from '../lib/session';
import { showAlert } from '../lib/alertStore';

const CATEGORIES = [
  { id: 'coffee', name: 'Coffee Shop / Cafe', icon: 'cafe-outline' as const },
  { id: 'resto', name: 'Resto & Rumah Makan', icon: 'restaurant-outline' as const },
  { id: 'bakery', name: 'Bakery & Pastry', icon: 'pizza-outline' as const },
  { id: 'beverage', name: 'Minuman Kekinian', icon: 'beer-outline' as const },
  { id: 'fastfood', name: 'Fast Food & Snacking', icon: 'fast-food-outline' as const },
  { id: 'retail', name: 'Retail / Stand Toko', icon: 'storefront-outline' as const },
  { id: 'other', name: 'Lainnya', icon: 'grid-outline' as const },
];

export default function SetupStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = getActiveSession();

  // Form States
  const [storeName, setStoreName] = useState(session?.storeName || 'Kopi Soodap Senopati');
  const [businessCategory, setBusinessCategory] = useState('Coffee Shop / Cafe');
  const [customCategory, setCustomCategory] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>('58mm');
  const [taxPercent, setTaxPercent] = useState('10');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.storeName) {
      setStoreName(session.storeName);
    }
  }, [session]);

  function handleSaveSetup(isSkipped = false) {
    if (!isSkipped && !storeName.trim()) {
      showAlert('Perhatian', 'Harap isi Nama Outlet / Resto Anda.');
      return;
    }

    setLoading(true);

    const finalCategory =
      businessCategory === 'Lainnya' && customCategory.trim()
        ? customCategory.trim()
        : businessCategory;

    const updatedSession = {
      ...(session || {
        userId: 'owner-1',
        name: 'Owner Resto',
        role: 'Owner / Admin',
        loginMethod: 'supabase_owner' as const,
        loginTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }),
      storeName: storeName.trim() || 'Soodap Resto',
      businessCategory: finalCategory,
      address: isSkipped ? '' : address.trim(),
      phone: isSkipped ? '' : phone.trim(),
      paperSize,
      taxPercent: isSkipped ? '0' : taxPercent,
      headerNote: isSkipped ? 'Selamat Datang!' : `Selamat Datang di ${storeName.trim() || 'Soodap'}!`,
      footerNote: 'Terima kasih atas kunjungan Anda. Powered by Soodap POS',
      isSetupCompleted: true,
    };

    setActiveSession(updatedSession);

    setTimeout(() => {
      setLoading(false);
      if (isSkipped) {
        showAlert('Setup Dilewati ⏩', 'Profil resto dapat Anda lengkapi kapan saja di menu Pengaturan.');
      } else {
        showAlert('Setup Berhasil! 🎉', `Selamat! Outlet "${storeName.trim()}" telah siap digunakan.`);
      }
      router.replace('/');
    }, 400);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#FAFAFA' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 24) }}>
        <YStack f={1} ai="center" pt={insets.top + 20} px={20} gap={20}>
          
          {/* Header & Logo */}
          <YStack ai="center" gap={6}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={{ width: 150, height: 46, resizeMode: 'contain' }}
            />
            <Text fontFamily="Geist_800ExtraBold" fontSize={20} color="#18181B" textAlign="center" mt={4}>
              Setup Profil Resto & Outlet 🏪
            </Text>
            <Text fontFamily="Geist_400Regular" fontSize={13} color="#71717A" textAlign="center" px={10}>
              Lengkapi informasi usaha Anda untuk struk pembayaran & laporan real-time.
            </Text>
          </YStack>

          {/* Main Form Container */}
          <YStack w="100%" maxWidth={480} backgroundColor="white" p={22} br={24} borderWidth={1} borderColor="#E4E4E7" gap={18}>
            
            {/* 1. Nama Resto (Mandatory) */}
            <YStack gap={6}>
              <XStack jc="space-between" ai="center">
                <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                  Nama Outlet / Resto <Text color="#EF4444">*</Text>
                </Text>
                <Text fontFamily="Geist_500Medium" fontSize={11} color="#EF4444">
                  Wajib diisi
                </Text>
              </XStack>
              <Input
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Contoh: Kopi Soodap Senopati"
                placeholderTextColor="$gray9"
                color="#18181B"
                h={44}
                br={12}
                fontSize={14}
                borderColor="#D4D4D8"
                focusStyle={{ borderColor: '#FF5722' }}
              />
            </YStack>

            {/* 2. Jenis Usaha (Quick Chips) */}
            <YStack gap={8}>
              <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                Kategori Usaha Resto <Text color="#EF4444">*</Text>
              </Text>
              <XStack fw="wrap" gap={8}>
                {CATEGORIES.map((cat) => {
                  const isSelected = businessCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setBusinessCategory(cat.name)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: isSelected ? '#FF5722' : '#F4F4F5',
                        borderWidth: 1,
                        borderColor: isSelected ? '#FF5722' : '#E4E4E7',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Ionicons name={cat.icon} size={15} color={isSelected ? 'white' : '#52525B'} />
                      <Text fontFamily="Geist_600SemiBold" fontSize={12} color={isSelected ? 'white' : '#3F3F46'}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </XStack>
              {businessCategory === 'Lainnya' && (
                <Input
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  placeholder="Tuliskan kategori usaha Anda (misal: Angkringan, Katering, Warung Makan, dll.)"
                  placeholderTextColor="$gray9"
                  color="#18181B"
                  h={42}
                  br={12}
                  fontSize={13}
                  borderColor="#D4D4D8"
                  focusStyle={{ borderColor: '#FF5722' }}
                  mt={4}
                />
              )}
            </YStack>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#E4E4E7', marginVertical: 4 }} />

            {/* Section Label: Optional Fields */}
            <XStack jc="space-between" ai="center">
              <Text fontFamily="Geist_700Bold" fontSize={12} color="#71717A" letterSpacing={0.5}>
                INFORMASI OPERASIONAL & STRUK
              </Text>
              <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                <Text fontFamily="Geist_700Bold" fontSize={10} color="#D97706">
                  OPSIONAL (BISA DISKIP)
                </Text>
              </View>
            </XStack>

            {/* 3. Alamat Outlet (Optional) */}
            <YStack gap={6}>
              <Text fontFamily="Geist_600SemiBold" fontSize={12.5} color="#3F3F46">
                Alamat Lengkap Outlet
              </Text>
              <Input
                value={address}
                onChangeText={setAddress}
                placeholder="Contoh: Jl. Senopati No. 45, Kebayoran Baru, Jakarta"
                placeholderTextColor="$gray9"
                color="#18181B"
                h={44}
                br={12}
                fontSize={13.5}
                borderColor="#D4D4D8"
                focusStyle={{ borderColor: '#FF5722' }}
              />
            </YStack>

            {/* 4. No Telepon / WA (Optional) */}
            <YStack gap={6}>
              <Text fontFamily="Geist_600SemiBold" fontSize={12.5} color="#3F3F46">
                No. Telepon / WhatsApp Resto
              </Text>
              <Input
                value={phone}
                onChangeText={setPhone}
                placeholder="Contoh: 0812-9988-7766"
                placeholderTextColor="$gray9"
                color="#18181B"
                keyboardType="phone-pad"
                h={44}
                br={12}
                fontSize={13.5}
                borderColor="#D4D4D8"
                focusStyle={{ borderColor: '#FF5722' }}
              />
            </YStack>

            {/* 5. Printer Struk & Pajak (Optional Grid) */}
            <XStack gap={12}>
              {/* Paper Size */}
              <YStack f={1} gap={6}>
                <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                  Ukuran Struk
                </Text>
                <XStack gap={6}>
                  {(['58mm', '80mm'] as const).map((size) => {
                    const isSel = paperSize === size;
                    return (
                      <TouchableOpacity
                        key={size}
                        onPress={() => setPaperSize(size)}
                        style={{
                          flex: 1,
                          paddingVertical: 9,
                          borderRadius: 10,
                          backgroundColor: isSel ? '#18181B' : '#F4F4F5',
                          alignItems: 'center',
                        }}
                      >
                        <Text fontFamily="Geist_700Bold" fontSize={12} color={isSel ? 'white' : '#52525B'}>
                          {size}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </XStack>
              </YStack>

              {/* Tax % */}
              <YStack f={1} gap={6}>
                <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                  Pajak Resto PB1 (%)
                </Text>
                <Input
                  value={taxPercent}
                  onChangeText={setTaxPercent}
                  placeholder="10"
                  placeholderTextColor="$gray9"
                  color="#18181B"
                  keyboardType="numeric"
                  h={38}
                  br={10}
                  fontSize={13}
                  borderColor="#D4D4D8"
                />
              </YStack>
            </XStack>

            {/* Actions */}
            <YStack gap={10} mt={6}>
              <Button
                h={48}
                br={14}
                backgroundColor="#FF5722"
                pressStyle={{ opacity: 0.88 }}
                onPress={() => handleSaveSetup(false)}
                disabled={loading}
              >
                {loading ? (
                  <Spinner color="white" size="small" />
                ) : (
                  <XStack ai="center" gap={8}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="white">
                      Simpan & Buka POS Kasir
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </XStack>
                )}
              </Button>

              <TouchableOpacity
                onPress={() => handleSaveSetup(true)}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XStack ai="center" gap={6}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#71717A">
                    Lewati untuk Sekarang (Skip)
                  </Text>
                  <Ionicons name="play-forward" size={14} color="#71717A" />
                </XStack>
              </TouchableOpacity>
            </YStack>

          </YStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
