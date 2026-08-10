import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, Input } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { transactionStore, TransactionItem } from '../lib/transactionStore';

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [transactions, setTransactions] = useState<TransactionItem[]>(transactionStore.get());
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all'>('today');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-09');
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('2026-08-01');
  const [tempEndDate, setTempEndDate] = useState('2026-08-09');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrx, setSelectedTrx] = useState<TransactionItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = transactionStore.subscribe(() => {
      setTransactions(transactionStore.get());
    });
    return () => unsubscribe();
  }, []);

  function parseTrxDate(timestampStr: string): Date | null {
    try {
      const parts = timestampStr.split(',');
      const datePart = parts[0].trim();
      return new Date(datePart);
    } catch {
      return null;
    }
  }

  // Filter Logic
  const filteredTransactions = transactions.filter(trx => {
    const matchesSearch =
      trx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trx.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterPeriod === 'today') {
      return trx.timestamp.includes('09 Aug 2026');
    } else if (filterPeriod === 'yesterday') {
      return trx.timestamp.includes('08 Aug 2026');
    } else if (filterPeriod === 'week') {
      return trx.timestamp.includes('09 Aug') || trx.timestamp.includes('08 Aug') || trx.timestamp.includes('07 Aug') || trx.timestamp.includes('06 Aug');
    } else if (filterPeriod === 'month') {
      return trx.timestamp.includes('Aug 2026');
    } else if (filterPeriod === 'custom') {
      const trxDate = parseTrxDate(trx.timestamp);
      if (!trxDate) return true;
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      return trxDate >= start && trxDate <= end;
    }
    return true;
  });

  function openDateRangeModal() {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setDateModalVisible(true);
  }

  function handleApplyDateRange() {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setFilterPeriod('custom');
    setDateModalVisible(false);
  }

  // Financial Stats Summary
  const completedTrxs = filteredTransactions.filter(t => t.status === 'Completed');
  const openBillTrxs = filteredTransactions.filter(t => t.status === 'Open Bill');

  const totalRevenue = completedTrxs.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalOpenBill = openBillTrxs.reduce((sum, t) => sum + t.totalAmount, 0);

  // Custom Tamagui Alert Modals State
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [targetPrintTrx, setTargetPrintTrx] = useState<TransactionItem | null>(null);

  const [waModalVisible, setWaModalVisible] = useState(false);
  const [targetWaTrx, setTargetWaTrx] = useState<TransactionItem | null>(null);
  const [waPhoneInput, setWaPhoneInput] = useState('');

  const [voidModalVisible, setVoidModalVisible] = useState(false);
  const [targetVoidTrx, setTargetVoidTrx] = useState<TransactionItem | null>(null);

  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [targetSettleTrx, setTargetSettleTrx] = useState<TransactionItem | null>(null);
  const [settleMethod, setSettleMethod] = useState('Tunai');
  const [settlePaidInput, setSettlePaidInput] = useState('');

  function handleOpenDetail(trx: TransactionItem) {
    setSelectedTrx(trx);
    setDetailModalVisible(true);
  }

  function openPrintModal(trx: TransactionItem) {
    setTargetPrintTrx(trx);
    setPrintModalVisible(true);
  }

  function openWaModal(trx: TransactionItem) {
    setTargetWaTrx(trx);
    setWaPhoneInput(trx.customerPhone || '');
    setWaModalVisible(true);
  }

  function openVoidModal(trx: TransactionItem) {
    setTargetVoidTrx(trx);
    setVoidModalVisible(true);
  }

  function openSettleModal(trx: TransactionItem) {
    setTargetSettleTrx(trx);
    setSettleMethod('Tunai');
    setSettlePaidInput(trx.totalAmount.toString());
    setSettleModalVisible(true);
  }

  function handleConfirmSettle() {
    if (!targetSettleTrx) return;
    const paidNum = parseInt(settlePaidInput) || 0;
    transactionStore.settleOpenBill(targetSettleTrx.id, settleMethod, paidNum);
    setSettleModalVisible(false);
    setTargetSettleTrx(null);
  }

  function handleConfirmVoid() {
    if (!targetVoidTrx) return;
    transactionStore.voidTransaction(targetVoidTrx.id);
    setVoidModalVisible(false);
    setDetailModalVisible(false);
    setTargetVoidTrx(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7FB' }}>
      {/* ── HEADER ── */}
      <YStack
        pt={insets.top + 10}
        pb={14}
        px={16}
        backgroundColor="white"
        borderBottomWidth={1}
        borderColor="#E4E4E7"
        gap={12}
      >
        <XStack jc="space-between" ai="center">
          <XStack ai="center" gap={12}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#F4F4F5',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#18181B" />
            </TouchableOpacity>

            <YStack>
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B">
                Riwayat Pesanan
              </Text>
              <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                Daftar transaksi lunas & riwayat cetak nota
              </Text>
            </YStack>
          </XStack>

          <TouchableOpacity
            onPress={() => setExportModalVisible(true)}
            style={{
              backgroundColor: '#F4F4F5',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="document-text-outline" size={16} color="#52525B" />
            <Text fontFamily="Geist_700Bold" fontSize={12} color="#3F3F46">
              Export
            </Text>
          </TouchableOpacity>
        </XStack>

        {/* Search Bar */}
        <XStack
          backgroundColor="#F4F4F5"
          px={12}
          height={40}
          br={10}
          ai="center"
          gap={8}
        >
          <Ionicons name="search" size={16} color="#71717A" />
          <TextInput
            placeholder="Cari No. Struk, nama pelanggan, atau metode..."
            placeholderTextColor="#A1A1AA"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, fontFamily: 'Geist_400Regular', fontSize: 13, color: '#18181B' }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#A1A1AA" />
            </TouchableOpacity>
          ) : null}
        </XStack>

        {/* Filter Period Chips & Advanced Calendar Icon Button */}
        <XStack ai="center" gap={8}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
            <XStack gap={6} ai="center">
              {[
                { id: 'today', label: 'Hari Ini' },
                { id: 'yesterday', label: 'Kemarin' },
                { id: 'week', label: '7 Hari' },
                { id: 'month', label: '30 Hari' },
                { id: 'all', label: 'Semua' },
              ].map(item => {
                const isActive = filterPeriod === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setFilterPeriod(item.id as any)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: isActive ? '#FF5722' : '#F4F4F5',
                    }}
                  >
                    <Text
                      fontFamily={isActive ? 'Geist_700Bold' : 'Geist_500Medium'}
                      fontSize={12}
                      color={isActive ? 'white' : '#52525B'}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </XStack>
          </ScrollView>

          {/* Calendar Icon Button for Advanced Date Filter */}
          <TouchableOpacity
            onPress={openDateRangeModal}
            activeOpacity={0.75}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: filterPeriod === 'custom' ? '#FF5722' : '#FFF3E0',
              borderWidth: 1,
              borderColor: '#FF5722',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="calendar-outline" size={16} color={filterPeriod === 'custom' ? 'white' : '#FF5722'} />
            {filterPeriod === 'custom' ? (
              <Text fontFamily="Geist_700Bold" fontSize={11} color="white">
                {startDate} - {endDate}
              </Text>
            ) : null}
          </TouchableOpacity>
        </XStack>
      </YStack>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        {/* ── FINANCIAL SUMMARY STATS CARD ── */}
        <XStack gap={10}>
          <YStack f={1} backgroundColor="white" p={12} br={14} borderWidth={1} borderColor="#E4E4E7" gap={2}>
            <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">
              Total Penjualan
            </Text>
            <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </Text>
            <Text fontFamily="Geist_400Regular" fontSize={10} color="#A1A1AA">
              {completedTrxs.length} Pesanan Lunas
            </Text>
          </YStack>

          <YStack f={1} backgroundColor="white" p={12} br={14} borderWidth={1} borderColor="#E4E4E7" gap={2}>
            <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">
              Belum Bayar (Open Bill)
            </Text>
            <Text fontFamily="Geist_800ExtraBold" fontSize={16} color={totalOpenBill > 0 ? '#D97706' : '#18181B'}>
              Rp {totalOpenBill.toLocaleString('id-ID')}
            </Text>
            <Text fontFamily="Geist_400Regular" fontSize={10} color="#A1A1AA">
              {openBillTrxs.length} Pesanan Belum Bayar
            </Text>
          </YStack>
        </XStack>

        {/* ── TRANSACTIONS LIST ── */}
        {filteredTransactions.length === 0 ? (
          <YStack ai="center" jc="center" py={40} gap={8}>
            <Ionicons name="receipt-outline" size={48} color="#D4D4D8" />
            <Text fontFamily="Geist_600SemiBold" fontSize={14} color="#71717A">
              Belum ada riwayat transaksi terbayar.
            </Text>
          </YStack>
        ) : (
          filteredTransactions.map(trx => {
            return (
              <TouchableOpacity
                key={trx.id}
                onPress={() => handleOpenDetail(trx)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#E4E4E7',
                  gap: 10,
                }}
              >
                {/* Header Row */}
                <XStack jc="space-between" ai="center" pb={8} borderBottomWidth={1} borderColor="#F4F4F5">
                  <XStack ai="center" gap={8}>
                    <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                      #{trx.id.replace(/^(NOTA|TRX)-/, '')}
                    </Text>
                    <View
                      style={{
                        backgroundColor:
                          trx.status === 'Completed'
                            ? '#F4F4F5'
                            : trx.status === 'Open Bill'
                            ? '#FEF3C7'
                            : '#FEE2E2',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        fontFamily="Geist_700Bold"
                        fontSize={10}
                        color={
                          trx.status === 'Completed'
                            ? '#3F3F46'
                            : trx.status === 'Open Bill'
                            ? '#D97706'
                            : '#DC2626'
                        }
                      >
                        {trx.status === 'Completed'
                          ? '✓ LUNAS'
                          : trx.status === 'Open Bill'
                          ? '⏳ BELUM BAYAR'
                          : '✕ VOID'}
                      </Text>
                    </View>
                  </XStack>

                  <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                    {trx.timestamp}
                  </Text>
                </XStack>

                {/* Info Row */}
                <XStack jc="space-between" ai="center">
                  <YStack gap={2} f={1} pr={8}>
                    <XStack ai="center" gap={6}>
                      <Ionicons name="person-outline" size={13} color="#71717A" />
                      <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                        {trx.customerName}
                      </Text>
                      <View style={{ backgroundColor: '#F4F4F5', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                        <Text fontFamily="Geist_600SemiBold" fontSize={10} color="#71717A">
                          {trx.orderType}
                        </Text>
                      </View>
                    </XStack>

                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A" numberOfLines={1}>
                      {trx.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </Text>
                  </YStack>

                  <YStack ai="flex-end">
                    <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                      Rp {trx.totalAmount.toLocaleString('id-ID')}
                    </Text>
                    <Text fontFamily="Geist_600SemiBold" fontSize={10} color={trx.status === 'Open Bill' ? '#D97706' : '#71717A'}>
                      {trx.paymentMethod}
                    </Text>
                  </YStack>
                </XStack>

                {/* Quick Action Buttons */}
                <XStack gap={8} pt={6} borderTopWidth={1} borderColor="#F4F4F5">
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      openPrintModal(trx);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#F4F4F5',
                      borderWidth: 1,
                      borderColor: '#E4E4E7',
                      paddingVertical: 6,
                      borderRadius: 8,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Ionicons name="print-outline" size={14} color="#52525B" />
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">
                      Cetak Struk
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      openWaModal(trx);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#F4F4F5',
                      borderWidth: 1,
                      borderColor: '#E4E4E7',
                      paddingVertical: 6,
                      borderRadius: 8,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#52525B" />
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">
                      Kirim WA
                    </Text>
                  </TouchableOpacity>

                  {trx.status === 'Open Bill' ? (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        openSettleModal(trx);
                      }}
                      style={{
                        paddingHorizontal: 12,
                        backgroundColor: '#FF5722',
                        paddingVertical: 6,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={11} color="white">
                        Bayar Sekarang
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleOpenDetail(trx)}
                      style={{
                        paddingHorizontal: 12,
                        backgroundColor: '#F4F4F5',
                        borderWidth: 1,
                        borderColor: '#E4E4E7',
                        paddingVertical: 6,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={11} color="#3F3F46">
                        Detail
                      </Text>
                    </TouchableOpacity>
                  )}
                </XStack>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ── MODAL DETAIL TRANSAKSI & STRUK LENGKAP ── */}
      <Modal visible={detailModalVisible} transparent animationType="slide" onRequestClose={() => setDetailModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDetailModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%', gap: 14 }}>
            {/* Header Modal */}
            <XStack jc="space-between" ai="center" pb={10} borderBottomWidth={1} borderColor="#F4F4F5">
              <YStack>
                <XStack ai="center" gap={6}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B">
                    Rincian Transaksi
                  </Text>
                  <Text fontFamily="Geist_700Bold" fontSize={14} color="#FF5722">
                    #{selectedTrx?.id.replace(/^(NOTA|TRX)-/, '')}
                  </Text>
                </XStack>
                <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                  Status: {selectedTrx?.status} • {selectedTrx?.timestamp}
                </Text>
              </YStack>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F4F5', justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <YStack gap={14} pb={20}>
                {/* Meta Customer & Cashier Card */}
                <YStack backgroundColor="#FAFAFA" p={12} br={12} borderWidth={1} borderColor="#E4E4E7" gap={6}>
                  <XStack jc="space-between">
                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">Pelanggan:</Text>
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#18181B">{selectedTrx?.customerName} ({selectedTrx?.orderType})</Text>
                  </XStack>
                  <XStack jc="space-between">
                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">Kasir Melayani:</Text>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#18181B">{selectedTrx?.cashierName}</Text>
                  </XStack>
                  <XStack jc="space-between">
                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">Metode Pembayaran:</Text>
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#10B981">{selectedTrx?.paymentMethod}</Text>
                  </XStack>
                </YStack>

                {/* Items List */}
                <YStack gap={8}>
                  <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                    Daftar Item Rincian:
                  </Text>
                  {selectedTrx?.items.map((item, idx) => (
                    <YStack key={idx} backgroundColor="white" p={10} br={10} borderWidth={1} borderColor="#F4F4F5" gap={2}>
                      <XStack jc="space-between" ai="center">
                        <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                          {item.quantity}x {item.name}
                        </Text>
                        <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </Text>
                      </XStack>
                      {item.note ? (
                        <Text fontFamily="Geist_400Regular" fontSize={11} color="#FF5722">
                          Catatan: {item.note}
                        </Text>
                      ) : null}
                    </YStack>
                  ))}
                </YStack>

                {/* Calculation Breakdown */}
                <YStack backgroundColor="#F9FAFB" p={12} br={12} borderWidth={1} borderColor="#E5E7EB" gap={6}>
                  <XStack jc="space-between">
                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#6B7280">Subtotal Item:</Text>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#111827">Rp {selectedTrx?.subtotal.toLocaleString('id-ID')}</Text>
                  </XStack>

                  {selectedTrx?.discountAmount ? (
                    <XStack jc="space-between">
                      <Text fontFamily="Geist_400Regular" fontSize={12} color="#DC2626">Diskon ({selectedTrx?.discountName || 'Promo'}):</Text>
                      <Text fontFamily="Geist_700Bold" fontSize={12} color="#DC2626">- Rp {selectedTrx.discountAmount.toLocaleString('id-ID')}</Text>
                    </XStack>
                  ) : null}

                  <XStack jc="space-between">
                    <Text fontFamily="Geist_400Regular" fontSize={12} color="#6B7280">Pajak (PB1 10%):</Text>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#111827">Rp {selectedTrx?.taxAmount.toLocaleString('id-ID')}</Text>
                  </XStack>

                  <View style={{ height: 1, backgroundColor: '#D1D5DB', marginVertical: 4 }} />

                  <XStack jc="space-between" ai="center">
                    <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#111827">TOTAL TERBAYAR:</Text>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#FF5722">Rp {selectedTrx?.totalAmount.toLocaleString('id-ID')}</Text>
                  </XStack>

                  {selectedTrx?.paymentMethod === 'Tunai' && (
                    <XStack jc="space-between" mt={4}>
                      <Text fontFamily="Geist_400Regular" fontSize={12} color="#6B7280">Bayar (Cash): Rp {selectedTrx?.paidAmount.toLocaleString('id-ID')}</Text>
                      <Text fontFamily="Geist_700Bold" fontSize={12} color="#10B981">Kembalian: Rp {selectedTrx?.changeAmount.toLocaleString('id-ID')}</Text>
                    </XStack>
                  )}
                </YStack>

                {/* Modal Action Buttons */}
                <XStack gap={10} mt={6}>
                  <Button
                    flex={1}
                    size="$4"
                    br={12}
                    backgroundColor="#FAFAFA"
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    onPress={() => selectedTrx && openPrintModal(selectedTrx)}
                  >
                    <Ionicons name="print-outline" size={16} color="#3F3F46" />
                    <Text fontFamily="Geist_700Bold" color="#3F3F46" fontSize={13}>
                      Cetak Struk
                    </Text>
                  </Button>

                  {selectedTrx?.status === 'Completed' && (
                    <Button
                      size="$4"
                      br={12}
                      backgroundColor="#FEE2E2"
                      onPress={() => selectedTrx && openVoidModal(selectedTrx)}
                    >
                      <Text fontFamily="Geist_700Bold" color="#EF4444" fontSize={13}>
                        Void / Batal
                      </Text>
                    </Button>
                  )}
                </XStack>
              </YStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL RANGE TANGGAL ── */}
      <Modal visible={dateModalVisible} transparent animationType="slide" onRequestClose={() => setDateModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDateModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%', gap: 14 }}>
            <XStack jc="space-between" ai="center" pb={10} borderBottomWidth={1} borderColor="#F4F4F5">
              <YStack f={1}>
                <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B">
                  Pilih Range Tanggal Transaksi
                </Text>
                <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                  Tampilkan laporan & riwayat pesanan dalam periode tertentu
                </Text>
              </YStack>
              <TouchableOpacity
                onPress={() => setDateModalVisible(false)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F4F5', justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <YStack gap={14}>
              {/* Preset Quick Range Buttons */}
              <Text fontFamily="Geist_700Bold" fontSize={13} color="#27272A">
                Preset Pilihan Cepat
              </Text>
              <XStack flexWrap="wrap" gap={8}>
                {[
                  { label: 'Agustus 2026', start: '2026-08-01', end: '2026-08-31' },
                  { label: 'Juli 2026', start: '2026-07-01', end: '2026-07-31' },
                  { label: '7 Hari Terakhir', start: '2026-08-03', end: '2026-08-09' },
                  { label: '30 Hari Terakhir', start: '2026-07-10', end: '2026-08-09' },
                ].map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setTempStartDate(preset.start);
                      setTempEndDate(preset.end);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: tempStartDate === preset.start && tempEndDate === preset.end ? '#FFF3E0' : '#F4F4F5',
                      borderWidth: 1,
                      borderColor: tempStartDate === preset.start && tempEndDate === preset.end ? '#FF5722' : '#E4E4E7',
                    }}
                  >
                    <Text
                      fontFamily="Geist_700Bold"
                      fontSize={12}
                      color={tempStartDate === preset.start && tempEndDate === preset.end ? '#FF5722' : '#52525B'}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </XStack>

              {/* Custom Date Input Fields */}
              <YStack gap={10} mt={6}>
                <YStack gap={4}>
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">
                    Tanggal Mulai (Dari)
                  </Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderWidth={1.5}
                    borderColor="#E4E4E7"
                    br={10}
                    placeholder="YYYY-MM-DD"
                    value={tempStartDate}
                    onChangeText={setTempStartDate}
                    fontFamily="Geist_700Bold"
                    fontSize={14}
                    height={44}
                  />
                </YStack>

                <YStack gap={4}>
                  <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">
                    Tanggal Selesai (Sampai)
                  </Text>
                  <Input
                    backgroundColor="#FAFAFA"
                    borderWidth={1.5}
                    borderColor="#E4E4E7"
                    br={10}
                    placeholder="YYYY-MM-DD"
                    value={tempEndDate}
                    onChangeText={setTempEndDate}
                    fontFamily="Geist_700Bold"
                    fontSize={14}
                    height={44}
                  />
                </YStack>
              </YStack>

              {/* Apply Button */}
              <Button
                size="$4"
                br={12}
                backgroundColor="#FF5722"
                onPress={handleApplyDateRange}
                mt={8}
                height={46}
              >
                <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={14}>
                  Terapkan Range Tanggal
                </Text>
              </Button>
            </YStack>
          </View>
        </View>
      </Modal>

      {/* ── MODAL EXPORT EXCEL ── */}
      <Modal visible={exportModalVisible} transparent animationType="fade" onRequestClose={() => setExportModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setExportModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380, alignItems: 'center', gap: 14 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E8FFF1', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={30} color="#10B981" />
            </View>
            <YStack ai="center" gap={6}>
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B" ta="center">
                Export Laporan Penjualan
              </Text>
              <Text fontFamily="Geist_400Regular" fontSize={13} color="#52525B" ta="center" lh={20}>
                Unduh seluruh data transaksi, rincian pesanan lunas, dan open bill ke dalam file spreadsheet Excel (.xlsx).
              </Text>
            </YStack>
            <XStack gap={10} w="100%" mt={6}>
              <Button f={1} size="$4" br={12} backgroundColor="#F4F4F5" onPress={() => setExportModalVisible(false)}>
                <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>Tutup</Text>
              </Button>
              <Button f={1.4} size="$4" br={12} backgroundColor="#10B981" onPress={() => setExportModalVisible(false)}>
                <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>📥 Download Excel</Text>
              </Button>
            </XStack>
          </View>
        </View>
      </Modal>

      {/* ── MODAL CETAK STRUK THERMAL ── */}
      <Modal visible={printModalVisible} transparent animationType="fade" onRequestClose={() => setPrintModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPrintModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380, alignItems: 'center', gap: 14 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="print-outline" size={30} color="#FF5722" />
            </View>
            <YStack ai="center" gap={6}>
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B" ta="center">
                Cetak Struk Thermal
              </Text>
              <Text fontFamily="Geist_400Regular" fontSize={13} color="#52525B" ta="center" lh={20}>
                Menghubungkan ke Bluetooth Thermal Printer (58mm/80mm)... Struk <Text fontFamily="Geist_700Bold" color="#18181B">#{targetPrintTrx?.id.replace(/^(NOTA|TRX)-/, '')}</Text> ({targetPrintTrx?.customerName}) sebesar Rp {targetPrintTrx?.totalAmount.toLocaleString('id-ID')} siap dicetak.
              </Text>
            </YStack>
            <XStack gap={10} w="100%" mt={6}>
              <Button f={1} size="$4" br={12} backgroundColor="#F4F4F5" onPress={() => setPrintModalVisible(false)}>
                <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>Batal</Text>
              </Button>
              <Button f={1.4} size="$4" br={12} backgroundColor="#FF5722" onPress={() => setPrintModalVisible(false)}>
                <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>🖨️ Cetak Sekarang</Text>
              </Button>
            </XStack>
          </View>
        </View>
      </Modal>

      {/* ── MODAL KIRIM WHATSAPP ── */}
      <Modal visible={waModalVisible} transparent animationType="fade" onRequestClose={() => setWaModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setWaModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380, alignItems: 'center', gap: 14 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E8FFF1', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="logo-whatsapp" size={32} color="#10B981" />
            </View>
            <YStack ai="center" gap={4} w="100%">
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B" ta="center">
                Kirim Struk WhatsApp
              </Text>
              <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A" ta="center">
                Kirim nota digital langsung ke WhatsApp {targetWaTrx?.customerName}
              </Text>
            </YStack>
            <YStack gap={4} w="100%" mt={4}>
              <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">Nomor WA Pelanggan</Text>
              <Input
                backgroundColor="#FAFAFA"
                borderWidth={1.5}
                borderColor="#10B981"
                br={10}
                placeholder="Contoh: 0812-3456-7890"
                keyboardType="phone-pad"
                value={waPhoneInput}
                onChangeText={setWaPhoneInput}
                fontFamily="Geist_700Bold"
                fontSize={14}
                height={44}
              />
            </YStack>
            <XStack gap={10} w="100%" mt={6}>
              <Button f={1} size="$4" br={12} backgroundColor="#F4F4F5" onPress={() => setWaModalVisible(false)}>
                <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>Batal</Text>
              </Button>
              <Button f={1.4} size="$4" br={12} backgroundColor="#10B981" onPress={() => setWaModalVisible(false)}>
                <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>📱 Kirim WA</Text>
              </Button>
            </XStack>
          </View>
        </View>
      </Modal>

      {/* ── MODAL VOID TRANSAKSI ── */}
      <Modal visible={voidModalVisible} transparent animationType="fade" onRequestClose={() => setVoidModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVoidModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380, alignItems: 'center', gap: 14 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
            </View>
            <YStack ai="center" gap={6}>
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B" ta="center">
                Batalkan (Void) Transaksi?
              </Text>
              <Text fontFamily="Geist_400Regular" fontSize={13} color="#52525B" ta="center" lh={20}>
                Apakah Anda yakin ingin membatalkan transaksi <Text fontFamily="Geist_700Bold" color="#18181B">#{targetVoidTrx?.id.replace(/^(NOTA|TRX)-/, '')}</Text> ({targetVoidTrx?.customerName}) sebesar Rp {targetVoidTrx?.totalAmount.toLocaleString('id-ID')}? Stok produk akan dikembalikan otomatis.
              </Text>
            </YStack>
            <XStack gap={10} w="100%" mt={6}>
              <Button f={1} size="$4" br={12} backgroundColor="#F4F4F5" onPress={() => setVoidModalVisible(false)}>
                <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>Batal</Text>
              </Button>
              <Button f={1.4} size="$4" br={12} backgroundColor="#EF4444" onPress={handleConfirmVoid}>
                <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>Ya, Void Transaksi</Text>
              </Button>
            </XStack>
          </View>
        </View>
      </Modal>

      {/* ── MODAL PELUNASAN OPEN BILL ── */}
      <Modal visible={settleModalVisible} transparent animationType="slide" onRequestClose={() => setSettleModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSettleModalVisible(false)} />
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%', gap: 14 }}>
            <XStack jc="space-between" ai="center" pb={10} borderBottomWidth={1} borderColor="#F4F4F5">
              <YStack f={1}>
                <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B">
                  Bayar Pesanan (Open Bill)
                </Text>
                <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                  Proses pembayaran pesanan {targetSettleTrx?.customerName} (#{targetSettleTrx?.id.replace(/^(NOTA|TRX)-/, '')})
                </Text>
              </YStack>
              <TouchableOpacity
                onPress={() => setSettleModalVisible(false)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F4F5', justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </XStack>

            <YStack gap={14}>
              <YStack backgroundColor="#FFF3E0" p={14} br={14} borderWidth={1} borderColor="#FFCC80" gap={4}>
                <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#C2410C">Total Yang Harus Dibayar:</Text>
                <Text fontFamily="Geist_800ExtraBold" fontSize={22} color="#FF5722">
                  Rp {targetSettleTrx?.totalAmount.toLocaleString('id-ID')}
                </Text>
                <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                  Menu: {targetSettleTrx?.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </Text>
              </YStack>

              <YStack gap={6}>
                <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">Metode Pembayaran *</Text>
                <XStack gap={8}>
                  {['Tunai', 'QRIS', 'Debit/Credit EDC'].map(m => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setSettleMethod(m)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: settleMethod === m ? '#FFF3E0' : '#F4F4F5',
                        borderWidth: 1.5,
                        borderColor: settleMethod === m ? '#FF5722' : '#E4E4E7',
                        alignItems: 'center',
                      }}
                    >
                      <Text fontFamily="Geist_700Bold" fontSize={12} color={settleMethod === m ? '#FF5722' : '#52525B'}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </XStack>
              </YStack>

              <YStack gap={4}>
                <Text fontFamily="Geist_700Bold" fontSize={12} color="#27272A">Jumlah Pembayaran (Rp) *</Text>
                <Input
                  backgroundColor="#FAFAFA"
                  borderWidth={1.5}
                  borderColor="#FF5722"
                  br={10}
                  keyboardType="number-pad"
                  value={settlePaidInput}
                  onChangeText={setSettlePaidInput}
                  fontFamily="Geist_800ExtraBold"
                  fontSize={16}
                  height={46}
                />
              </YStack>

              <Button size="$4" br={12} backgroundColor="#10B981" onPress={handleConfirmSettle} mt={6} height={46}>
                <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={14}>
                  ✓ Selesaikan Pembayaran
                </Text>
              </Button>
            </YStack>
          </View>
        </View>
      </Modal>
    </View>
  );
}
