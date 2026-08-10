import { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Switch,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { paymentStore, PaymentMethodItem } from '../lib/paymentStore';
import { showAlert } from '../lib/alertStore';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [methods, setMethods] = useState(paymentStore.get());

  useEffect(() => {
    const unsubscribe = paymentStore.subscribe(() => {
      setMethods(paymentStore.get());
    });
    return unsubscribe;
  }, []);

  // Add Method Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'Tunai' | 'QRIS' | 'EDC' | 'Transfer' | 'E-Wallet'>('QRIS');
  const [description, setDescription] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  function handleAddMethod() {
    if (!name.trim()) {
      showAlert('Perhatian', 'Nama Metode Pembayaran tidak boleh kosong.');
      return;
    }

    let iconName = 'card-outline';
    let iconColor = '#3B82F6';
    if (type === 'Tunai') {
      iconName = 'cash-outline';
      iconColor = '#10B981';
    } else if (type === 'QRIS') {
      iconName = 'qr-code-outline';
      iconColor = '#FF5722';
    } else if (type === 'Transfer') {
      iconName = 'swap-horizontal-outline';
      iconColor = '#8B5CF6';
    } else if (type === 'E-Wallet') {
      iconName = 'wallet-outline';
      iconColor = '#EC4899';
    }

    paymentStore.addMethod({
      name: name.trim(),
      type,
      description: description.trim() || `Metode pembayaran ${type}`,
      iconName,
      iconColor,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
    });

    setName('');
    setDescription('');
    setAccountNumber('');
    setAccountName('');
    setAddModalVisible(false);
    showAlert('Sukses! 🎉', `Metode pembayaran "${name.trim()}" berhasil ditambahkan.`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7FB' }}>
      <XStack
        backgroundColor="white"
        px={14}
        pt={insets.top + 6}
        pb={10}
        ai="center"
        gap={10}
        borderBottomWidth={1}
        borderColor="#E4E4E7"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color="#18181B" />
        </TouchableOpacity>
        <YStack f={1}>
          <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#18181B" numberOfLines={1}>
            Metode Pembayaran ({methods.length})
          </Text>
          <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A" numberOfLines={1}>
            {methods.filter(m => m.isActive).length} Metode Aktif
          </Text>
        </YStack>
        <Button
          size="$2.5"
          br={8}
          px={10}
          backgroundColor="#FF5722"
          onPress={() => setAddModalVisible(true)}
        >
          <XStack ai="center" gap={3}>
            <Ionicons name="add" size={14} color="white" />
            <Text fontFamily="Geist_700Bold" color="white" fontSize={12}>
              Tambah
            </Text>
          </XStack>
        </Button>
      </XStack>

      <ScrollView f={1} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        <YStack gap={16} maxWidth={750} alignSelf="center" w="100%">

          {/* Cards List */}
          <YStack gap={12}>
            {methods.map(method => (
              <XStack
                key={method.id}
                backgroundColor="white"
                p={16}
                br={16}
                borderWidth={1.5}
                borderColor={method.isActive ? '#FF5722' : '#E4E4E7'}
                jc="space-between"
                ai="center"
              >
                <XStack ai="center" gap={12} f={1}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: method.isActive ? '#FFF3E0' : '#F4F4F5',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name={method.iconName as any}
                      size={22}
                      color={method.isActive ? '#FF5722' : '#71717A'}
                    />
                  </View>

                  <YStack f={1} jc="center" gap={2}>
                    <XStack ai="center" gap={6} flexWrap="wrap">
                      <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#18181B">
                        {method.name}
                      </Text>
                      <View style={{ backgroundColor: '#F4F4F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text fontFamily="Geist_700Bold" fontSize={10} color="#52525B">
                          {method.type}
                        </Text>
                      </View>
                    </XStack>

                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A" lh={17}>
                      {method.description}
                    </Text>

                    {method.accountNumber && (
                      <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#FF5722" mt={2}>
                        No. Rek/Akun: {method.accountNumber} {method.accountName ? `a.n ${method.accountName}` : ''}
                      </Text>
                    )}
                  </YStack>
                </XStack>

                <XStack ai="center" gap={10} ml={8}>
                  <XStack ai="center" gap={6}>
                    <Text fontFamily="Geist_700Bold" fontSize={12} color={method.isActive ? '#FF5722' : '#71717A'}>
                      {method.isActive ? 'Aktif' : 'Non-aktif'}
                    </Text>
                    <Switch
                      value={method.isActive}
                      onValueChange={() => paymentStore.toggleMethod(method.id)}
                      trackColor={{ false: '#E4E4E7', true: '#FFCC80' }}
                      thumbColor={method.isActive ? '#FF5722' : '#FAFAFA'}
                    />
                  </XStack>

                  {method.id !== '1' && method.id !== '2' && (
                    <TouchableOpacity onPress={() => paymentStore.deleteMethod(method.id)} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </XStack>
              </XStack>
            ))}
          </YStack>
        </YStack>
      </ScrollView>

      {/* ── MODAL TAMBAH METODE PEMBAYARAN ── */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddModalVisible(false)} />
          <View style={[styles.modalSheetPanel, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.sheetHandle} />
            <YStack gap={14} mt={4}>
              <XStack jc="space-between" ai="center">
                <Text fontFamily="Geist_800ExtraBold" fontSize={17} color="#18181B">
                  Tambah Metode Pembayaran
                </Text>
                <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#71717A" />
                </TouchableOpacity>
              </XStack>

              <YStack gap={12}>
                {/* 1. Payment Type Selector (First Choice) */}
                <YStack gap={4}>
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="#18181B">
                    Pilih Kategori Tipe Pembayaran *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <XStack gap={6}>
                      {(['QRIS', 'EDC', 'Transfer', 'E-Wallet'] as const).map(t => (
                        <TouchableOpacity
                          key={t}
                          onPress={() => {
                            setType(t);
                            if (t === 'QRIS') {
                              setName('QRIS Statis / Dinamis');
                              setDescription('GoPay, OVO, Dana, ShopeePay & All M-Banking');
                            } else if (t === 'EDC') {
                              setName('Mesin EDC Bank');
                              setDescription('Kartu Debit & Kredit All Bank');
                            } else if (t === 'Transfer') {
                              setName('Transfer Bank BCA');
                              setDescription('Transfer langsung ke rekening resto');
                            } else if (t === 'E-Wallet') {
                              setName('GoPay / OVO Transfer');
                              setDescription('Transfer e-wallet kasir');
                            }
                          }}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: type === t ? '#FF5722' : '#F4F4F5',
                            borderWidth: 1,
                            borderColor: type === t ? '#FF5722' : '#E4E4E7',
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={12} color={type === t ? 'white' : '#52525B'}>
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </XStack>
                  </ScrollView>
                </YStack>

                {/* 2. Dynamic Form Fields based on Type */}
                <YStack gap={10} backgroundColor="#FAFAFA" p={12} br={14} borderWidth={1} borderColor="#E4E4E7">
                  
                  {/* Nama Metode Input */}
                  <YStack gap={4}>
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#3F3F46">
                      {type === 'EDC'
                        ? 'Nama Mesin / Bank EDC *'
                        : type === 'Transfer'
                        ? 'Nama Bank Transfer *'
                        : type === 'E-Wallet'
                        ? 'Nama E-Wallet *'
                        : 'Nama Metode Pembayaran *'}
                    </Text>
                    <Input
                      backgroundColor="white"
                      borderColor="#E4E4E7"
                      br={10}
                      placeholder={
                        type === 'QRIS'
                          ? 'Contoh: QRIS Statis Cafe'
                          : type === 'EDC'
                          ? 'Contoh: EDC Bank Mandiri'
                          : type === 'Transfer'
                          ? 'Contoh: Transfer Bank BCA'
                          : 'Contoh: Tunai'
                      }
                      value={name}
                      onChangeText={setName}
                      fontFamily="Geist_700Bold"
                      fontSize={13}
                      height={42}
                    />
                  </YStack>

                  {/* Field Khusus QRIS: Upload Gambar QRIS */}
                  {type === 'QRIS' && (
                    <YStack gap={4}>
                      <Text fontFamily="Geist_700Bold" fontSize={12} color="#3F3F46">
                        Gambar / Stiker Kode QRIS *
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => showAlert('Pilih Gambar QRIS 📷', 'Mengunggah gambar stiker QRIS dari galeri perangkat.')}
                        style={{
                          backgroundColor: '#FFF3E0',
                          borderRadius: 12,
                          borderWidth: 1.5,
                          borderStyle: 'dashed',
                          borderColor: '#FF5722',
                          padding: 14,
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Ionicons name="cloud-upload-outline" size={26} color="#FF5722" />
                        <Text fontFamily="Geist_700Bold" fontSize={12} color="#FF5722">
                          + Upload Foto / Stiker QRIS Resto
                        </Text>
                        <Text fontFamily="Geist_400Regular" fontSize={10} color="#71717A">
                          Format JPG / PNG (Stiker QRIS yang akan dipindai pembeli)
                        </Text>
                      </TouchableOpacity>
                    </YStack>
                  )}

                  {/* Field Khusus Transfer & E-Wallet: No. Rekening & Nama Pemilik */}
                  {(type === 'Transfer' || type === 'E-Wallet' || type === 'EDC') && (
                    <XStack gap={10}>
                      <YStack f={1} gap={4}>
                        <Text fontFamily="Geist_700Bold" fontSize={12} color="#3F3F46">
                          {type === 'EDC'
                            ? 'No. Terminal / TID EDC (Opsional)'
                            : type === 'Transfer'
                            ? 'Nomor Rekening Bank *'
                            : 'Nomor HP / Akun E-Wallet *'}
                        </Text>
                        <Input
                          backgroundColor="white"
                          borderColor="#E4E4E7"
                          br={10}
                          placeholder={type === 'EDC' ? 'TID-89201' : '892-019-2341'}
                          keyboardType="number-pad"
                          value={accountNumber}
                          onChangeText={setAccountNumber}
                          fontFamily="Geist_700Bold"
                          fontSize={13}
                          height={42}
                        />
                      </YStack>

                      {type !== 'EDC' && (
                        <YStack f={1} gap={4}>
                          <Text fontFamily="Geist_700Bold" fontSize={12} color="#3F3F46">
                            Nama Pemilik Rek/Akun *
                          </Text>
                          <Input
                            backgroundColor="white"
                            borderColor="#E4E4E7"
                            br={10}
                            placeholder="Soodap Resto"
                            value={accountName}
                            onChangeText={setAccountName}
                            fontFamily="Geist_600SemiBold"
                            fontSize={13}
                            height={42}
                          />
                        </YStack>
                      )}
                    </XStack>
                  )}

                  {/* Deskripsi Keterangan */}
                  <YStack gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">
                      Deskripsi Keterangan Kasir
                    </Text>
                    <Input
                      backgroundColor="white"
                      borderColor="#E4E4E7"
                      br={10}
                      placeholder="Contoh: GoPay, OVO, Dana, ShopeePay & All M-Banking"
                      value={description}
                      onChangeText={setDescription}
                      fontFamily="Geist_400Regular"
                      fontSize={12}
                      height={40}
                    />
                  </YStack>
                </YStack>

                {/* Submit Action */}
                <Button size="$4" br={12} backgroundColor="#FF5722" onPress={handleAddMethod} mt={2}>
                  <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={14}>
                    Simpan Metode Pembayaran
                  </Text>
                </Button>
              </YStack>
            </YStack>
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
    marginBottom: 10,
  },
});
