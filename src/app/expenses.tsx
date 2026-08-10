import { useState } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView, Spinner } from 'tamagui';
import { useRouter } from 'expo-router';
import {
  Alert,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../lib/alertStore';

import { loadFromLocal, saveToLocal, KEYS } from '../lib/offlineDb';

type ExpenseCategory = 'Bahan Baku' | 'Operasional' | 'Utilitas (Air/Listrik)' | 'Gaji / Bonus' | 'Lainnya';
type InputSource = 'manual' | 'ocr' | 'voice';
type ViewMode = 'calendar' | 'monthly' | 'yearly';

interface ExpenseItem {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  dayNumber: number;
  month: string;
  year: number;
  source: InputSource;
  note?: string;
}

interface MonthlyCategoryBreakdown {
  category: ExpenseCategory;
  total: number;
  percent: number;
  iconName: string;
  color: string;
}

export default function ExpensesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Mode View: Calendar (Daily) vs Monthly vs Yearly
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const now = new Date();
  const [selectedDay, setSelectedDay] = useState<number>(now.getDate());
  const [selectedMonth, setSelectedMonth] = useState<string>(
    now.toLocaleDateString('id-ID', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Quick Date Search Modal State
  const [searchDateModalVisible, setSearchDateModalVisible] = useState(false);
  const [searchDayInput, setSearchDayInput] = useState('');

  // Full Month Calendar & Year Picker Dropdown Modal State
  const [fullCalendarModalVisible, setFullCalendarModalVisible] = useState(false);

  // Bottom Sheet Form State
  const [addSheetVisible, setAddSheetVisible] = useState(false);

  // Dynamic Categories State
  const [categoriesList, setCategoriesList] = useState<string[]>([
    'Bahan Baku',
    'Operasional',
    'Utilitas (Air/Listrik)',
    'Gaji / Bonus',
    'Sewa Tempat',
    'Pemasaran / Ads',
    'Lainnya',
  ]);
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Expense Database State loaded from persistent storage
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() =>
    loadFromLocal<ExpenseItem[]>(KEYS.EXPENSES, [])
  );

  // Form States for Adding New Expense
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeInputMethod, setActiveInputMethod] = useState<InputSource>('manual');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Bahan Baku');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // Voice & Scan States
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Add Manual Expense
  function handleAddExpense(src: InputSource = 'manual', customTitle?: string, customAmount?: number, customCat?: ExpenseCategory) {
    const finalTitle = customTitle || title;
    const finalAmount = customAmount || (parseInt(amount) || 0);
    const finalCat = customCat || category;

    if (!finalTitle || !finalAmount) {
      showAlert('Perhatian', 'Harap isi Nama Pengeluaran dan Nominal Rp.');
      return;
    }
    const newExpense: ExpenseItem = {
      id: Date.now().toString(),
      title: finalTitle,
      category: finalCat,
      amount: finalAmount,
      date: `${selectedDay} ${selectedMonth} ${selectedYear}, Baru saja`,
      dayNumber: selectedDay,
      month: selectedMonth,
      year: selectedYear,
      source: src,
      note,
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    saveToLocal(KEYS.EXPENSES, updated);
    setTitle('');
    setAmount('');
    setNote('');
    setShowAddForm(false);
    setAddSheetVisible(false);
    showAlert('Sukses! ✅', `Pengeluaran Rp ${finalAmount.toLocaleString('id-ID')} berhasil dicatat.`);
  }

  // Voice Expense Handler (Simulation)
  function handleToggleVoice() {
    setIsListening(true);
    setVoiceText('Mendengarkan ucapan Anda...');
    setTimeout(() => {
      setIsListening(false);
      const recognizedText = 'Beli Cup Plastik 16oz 200pcs Rp 75.000';
      setVoiceText(recognizedText);
      handleAddExpense('voice', 'Beli Cup Plastik 16oz 200pcs', 75000, 'Bahan Baku');
    }, 2500);
  }

  // Receipt OCR Handler (Simulation)
  function handleScanReceipt() {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      handleAddExpense('ocr', 'Nota Supermarket: Biji Kopi Arabika 1kg', 285000, 'Bahan Baku');
    }, 2000);
  }

  // Add Custom Category Handler
  function handleAddNewCategory() {
    if (!newCategoryInput.trim()) {
      showAlert('Perhatian', 'Harap masukkan nama kategori baru');
      return;
    }
    const trimmed = newCategoryInput.trim();
    if (!categoriesList.includes(trimmed)) {
      setCategoriesList([...categoriesList, trimmed]);
      setCategory(trimmed as any);
    }
    setNewCategoryInput('');
    setAddCategoryModalVisible(false);
    showAlert('Sukses! ✅', `Kategori "${trimmed}" berhasil ditambahkan.`);
  }

  // Filtered Expenses
  const filteredDailyExpenses = expenses.filter(
    e => e.dayNumber === selectedDay && e.month === selectedMonth && e.year === selectedYear
  );

  const monthlyExpenses = expenses.filter(
    e => e.month === selectedMonth && e.year === selectedYear
  );

  // Calculations
  const dailyTotalExpense = filteredDailyExpenses.reduce((sum, item) => sum + item.amount, 0);
  const dailyEstimatedOmset = selectedDay === 5 ? 2450000 : 2100000;
  const dailyNetProfit = dailyEstimatedOmset - dailyTotalExpense;

  const monthlyTotalExpense = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);
  const monthlyTotalOmset = 38500000;
  const monthlyNetProfit = monthlyTotalOmset - monthlyTotalExpense;

  // Monthly Breakdown per Category
  const categoryBreakdown: MonthlyCategoryBreakdown[] = [
    { category: 'Bahan Baku', total: 8450000, percent: 62, iconName: 'restaurant', color: '#FF5722' },
    { category: 'Utilitas (Air/Listrik)', total: 2800000, percent: 21, iconName: 'flash', color: '#0D6EFD' },
    { category: 'Gaji / Bonus', total: 2000000, percent: 15, iconName: 'people', color: '#10B981' },
    { category: 'Operasional', total: 350000, percent: 2, iconName: 'construct', color: '#F59E0B' },
  ];

  const CATEGORIES_LIST: ExpenseCategory[] = ['Bahan Baku', 'Operasional', 'Utilitas (Air/Listrik)', 'Gaji / Bonus', 'Lainnya'];
  const DAYS_IN_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);
  const MONTHS_LIST = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const YEARS_LIST = [2024, 2025, 2026, 2027];

  function handlePrevMonth() {
    const currentIdx = MONTHS_LIST.indexOf(selectedMonth);
    if (currentIdx > 0) {
      setSelectedMonth(MONTHS_LIST[currentIdx - 1]);
    } else {
      setSelectedMonth(MONTHS_LIST[11]);
      setSelectedYear(prev => prev - 1);
    }
  }

  function handleNextMonth() {
    const currentIdx = MONTHS_LIST.indexOf(selectedMonth);
    if (currentIdx < 11) {
      setSelectedMonth(MONTHS_LIST[currentIdx + 1]);
    } else {
      setSelectedMonth(MONTHS_LIST[0]);
      setSelectedYear(prev => prev + 1);
    }
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
              Pengeluaran & Belanja Resto
            </Text>
            <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
              Kalender Harian, Rekap Bulanan ({selectedMonth} {selectedYear}) & Tahunan
            </Text>
          </YStack>
        </XStack>

        {/* ── MODE VIEW SWITCHER (KALENDER / BULANAN / TAHUNAN) ── */}
        <XStack backgroundColor="white" px={16} py={8} gap={6} borderBottomWidth={1} borderColor="#E4E4E7">
          <TouchableOpacity
            onPress={() => setViewMode('calendar')}
            style={[styles.viewTab, viewMode === 'calendar' && styles.viewTabActive]}
          >
            <Ionicons name="calendar-outline" size={15} color={viewMode === 'calendar' ? 'white' : '#52525B'} />
            <Text fontFamily="Geist_700Bold" fontSize={12} color={viewMode === 'calendar' ? 'white' : '#52525B'}>
              Kalender Harian
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('monthly')}
            style={[styles.viewTab, viewMode === 'monthly' && styles.viewTabActive]}
          >
            <Ionicons name="pie-chart-outline" size={15} color={viewMode === 'monthly' ? 'white' : '#52525B'} />
            <Text fontFamily="Geist_700Bold" fontSize={12} color={viewMode === 'monthly' ? 'white' : '#52525B'}>
              Rekap Bulanan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('yearly')}
            style={[styles.viewTab, viewMode === 'yearly' && styles.viewTabActive]}
          >
            <Ionicons name="stats-chart-outline" size={15} color={viewMode === 'yearly' ? 'white' : '#52525B'} />
            <Text fontFamily="Geist_700Bold" fontSize={12} color={viewMode === 'yearly' ? 'white' : '#52525B'}>
              Tahunan 2026
            </Text>
          </TouchableOpacity>
        </XStack>

        <ScrollView f={1} contentContainerStyle={{ padding: 16 }}>
          <YStack gap={16} maxWidth={700} alignSelf="center" w="100%">

            {/* ── 1. CALENDAR VIEW (REKAP HARIAN PER TANGGAL) ── */}
            {viewMode === 'calendar' && (
              <YStack gap={10} pb={60}>
                {/* Visual Calendar Selector (Compact Strip) */}
                <YStack backgroundColor="white" p={10} br={14} borderWidth={1} borderColor="#E4E4E7" gap={6}>
                  <XStack jc="space-between" ai="center">
                    <XStack ai="center" gap={6}>
                      <Ionicons name="calendar-outline" size={14} color="#18181B" />
                      <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#18181B">
                        Pilih Tanggal
                      </Text>
                    </XStack>

                    <XStack ai="center" gap={6}>
                      <TouchableOpacity
                        onPress={() => setSearchDateModalVisible(true)}
                        style={{
                          backgroundColor: '#F4F4F5',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Ionicons name="search-outline" size={13} color="#3F3F46" />
                        <Text fontFamily="Geist_700Bold" fontSize={11} color="#3F3F46">
                          Cari Tgl
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setFullCalendarModalVisible(true)}
                        style={{
                          backgroundColor: '#F4F4F5',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          borderWidth: 1,
                          borderColor: '#E4E4E7',
                        }}
                      >
                        <Text fontFamily="Geist_700Bold" fontSize={11} color="#18181B">
                          {selectedDay} {selectedMonth} {selectedYear}
                        </Text>
                        <Ionicons name="chevron-down" size={13} color="#71717A" />
                      </TouchableOpacity>
                    </XStack>
                  </XStack>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                    {DAYS_IN_MONTH.map(day => {
                      const isSelected = selectedDay === day;
                      const hasExpense = expenses.some(e => e.dayNumber === day && e.month === selectedMonth);
                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => setSelectedDay(day)}
                          style={[
                            styles.calendarDayChip,
                            isSelected && styles.calendarDayChipActive
                          ]}
                        >
                          <Text fontFamily="Geist_400Regular" fontSize={9} color={isSelected ? 'white' : '#71717A'}>
                            Tgl
                          </Text>
                          <Text fontFamily="Geist_800ExtraBold" fontSize={13} color={isSelected ? 'white' : '#18181B'}>
                            {day}
                          </Text>
                          {hasExpense && (
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isSelected ? 'white' : '#EF4444', marginTop: 1 }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </YStack>

                {/* Single Compact Summary Bar (3 Metrics in 1 Row) */}
                <XStack backgroundColor="white" p={10} br={14} borderWidth={1} borderColor="#E4E4E7" gap={8} ai="center">
                  <YStack f={1} ai="center">
                    <Text fontFamily="Geist_500Medium" fontSize={10} color="#71717A">Penjualan ({selectedDay} Aug)</Text>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#18181B">
                      Rp {dailyEstimatedOmset.toLocaleString('id-ID')}
                    </Text>
                  </YStack>

                  <View style={{ width: 1, height: 26, backgroundColor: '#E4E4E7' }} />

                  <YStack f={1} ai="center">
                    <Text fontFamily="Geist_500Medium" fontSize={10} color="#71717A">Pengeluaran ({selectedDay} Aug)</Text>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#EF4444">
                      - Rp {dailyTotalExpense.toLocaleString('id-ID')}
                    </Text>
                  </YStack>

                  <View style={{ width: 1, height: 26, backgroundColor: '#E4E4E7' }} />

                  <YStack f={1} ai="center">
                    <Text fontFamily="Geist_500Medium" fontSize={10} color="#71717A">Kas Netto ({selectedDay} Aug)</Text>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#18181B">
                      Rp {dailyNetProfit.toLocaleString('id-ID')}
                    </Text>
                  </YStack>
                </XStack>

                {/* Form Input Pengeluaran (Collapsible Card Form - No Modal) */}
                {showAddForm && (
                  <YStack backgroundColor="white" p={16} br={16} borderWidth={1} borderColor="#EF4444" gap={12}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#EF4444">
                      Catat Pengeluaran Tanggal {selectedDay} {selectedMonth}
                    </Text>

                    {/* Method Selector */}
                    <XStack gap={6}>
                      <TouchableOpacity
                        onPress={() => setActiveInputMethod('manual')}
                        style={[styles.methodTab, activeInputMethod === 'manual' && styles.methodTabActive]}
                      >
                        <Ionicons name="create-outline" size={16} color={activeInputMethod === 'manual' ? 'white' : '#52525B'} />
                        <Text fontFamily="Geist_700Bold" fontSize={12} color={activeInputMethod === 'manual' ? 'white' : '#52525B'}>
                          Manual
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setActiveInputMethod('ocr')}
                        style={[styles.methodTab, activeInputMethod === 'ocr' && styles.methodTabActive]}
                      >
                        <Ionicons name="camera-outline" size={16} color={activeInputMethod === 'ocr' ? 'white' : '#52525B'} />
                        <Text fontFamily="Geist_700Bold" fontSize={12} color={activeInputMethod === 'ocr' ? 'white' : '#52525B'}>
                          Scan Struk 📸
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setActiveInputMethod('voice')}
                        style={[styles.methodTab, activeInputMethod === 'voice' && styles.methodTabActive]}
                      >
                        <Ionicons name="mic-outline" size={16} color={activeInputMethod === 'voice' ? 'white' : '#52525B'} />
                        <Text fontFamily="Geist_700Bold" fontSize={12} color={activeInputMethod === 'voice' ? 'white' : '#52525B'}>
                          Suara 🎙️
                        </Text>
                      </TouchableOpacity>
                    </XStack>

                    {activeInputMethod === 'manual' && (
                      <YStack gap={10}>
                        <Input
                          backgroundColor="#FAFAFA"
                          borderColor="#E4E4E7"
                          br={10}
                          placeholder="Nama Pengeluaran (misal: Beli Galon Air)"
                          fontSize={13}
                          value={title}
                          onChangeText={setTitle}
                        />

                        <XStack gap={8}>
                          <Input
                            f={1}
                            backgroundColor="#FAFAFA"
                            borderColor="#E4E4E7"
                            br={10}
                            placeholder="Nominal Rp"
                            fontSize={13}
                            keyboardType="number-pad"
                            value={amount}
                            onChangeText={setAmount}
                          />

                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <XStack gap={4}>
                              {CATEGORIES_LIST.map(c => (
                                <TouchableOpacity
                                  key={c}
                                  onPress={() => setCategory(c)}
                                  style={[styles.catChip, category === c && styles.catChipActive]}
                                >
                                  <Text fontFamily="Geist_700Bold" fontSize={11} color={category === c ? 'white' : '#52525B'}>
                                    {c}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </XStack>
                          </ScrollView>
                        </XStack>

                        <Button size="$4" br={12} backgroundColor="#EF4444" onPress={() => handleAddExpense('manual')}>
                          <Text fontFamily="Geist_700Bold" color="white" fontSize={14}>
                            Simpan Pengeluaran
                          </Text>
                        </Button>
                      </YStack>
                    )}

                    {activeInputMethod === 'ocr' && (
                      <YStack ai="center" gap={10} p={12} backgroundColor="#FAFAFA" br={12}>
                        <Ionicons name="camera" size={32} color="#0D6EFD" />
                        <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#52525B" ta="center">
                          Ambil/Unggah Foto Nota Struk
                        </Text>
                        <Button size="$3" br={10} backgroundColor="#0D6EFD" onPress={handleScanReceipt} disabled={isScanning}>
                          <Text fontFamily="Geist_700Bold" color="white" fontSize={12}>
                            {isScanning ? 'Mengekstrak Struk...' : 'Ambil Foto Struk Nota'}
                          </Text>
                        </Button>
                      </YStack>
                    )}

                    {activeInputMethod === 'voice' && (
                      <YStack ai="center" gap={10} p={12} backgroundColor="#FFF5F2" br={12}>
                        <TouchableOpacity onPress={handleToggleVoice} style={[styles.micBtn, isListening && styles.micBtnActive]}>
                          <Ionicons name="mic" size={24} color="white" />
                        </TouchableOpacity>
                        <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#FF5722" ta="center">
                          {isListening ? 'Mendengarkan ucapan...' : 'Tekan & Ucapkan Pengeluaran'}
                        </Text>
                      </YStack>
                    )}
                  </YStack>
                )}

                {/* List Detail Pengeluaran Tanggal Terpilih */}
                <YStack backgroundColor="white" p={14} br={16} borderWidth={1} borderColor="#E4E4E7" gap={10}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#18181B">
                    Rincian Transaksi Tanggal {selectedDay} {selectedMonth}
                  </Text>

                  {filteredDailyExpenses.length === 0 ? (
                    <YStack ai="center" py={20} gap={6}>
                      <Ionicons name="file-tray-outline" size={36} color="#D4D4D8" />
                      <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#A1A1AA">
                        Belum ada pengeluaran dicatat pada tanggal ini.
                      </Text>
                    </YStack>
                  ) : (
                    <YStack gap={8}>
                      {filteredDailyExpenses.map(item => (
                        <XStack
                          key={item.id}
                          backgroundColor="#FAFAFA"
                          p={12}
                          br={12}
                          borderWidth={1}
                          borderColor="#F4F4F5"
                          jc="space-between"
                          ai="center"
                        >
                          <XStack ai="center" gap={10} f={1} mr={8}>
                            <View style={[
                              styles.sourceBadge,
                              { backgroundColor: item.source === 'ocr' ? '#EEF4FF' : item.source === 'voice' ? '#FFF3E0' : '#F4F4F5' }
                            ]}>
                              <Ionicons
                                name={item.source === 'ocr' ? 'camera' : item.source === 'voice' ? 'mic' : 'create'}
                                size={16}
                                color={item.source === 'ocr' ? '#0D6EFD' : item.source === 'voice' ? '#FF5722' : '#52525B'}
                              />
                            </View>
                            <YStack f={1}>
                              <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">{item.title}</Text>
                              <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">{item.category} • {item.date}</Text>
                            </YStack>
                          </XStack>
                          <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#EF4444">
                            - Rp {item.amount.toLocaleString('id-ID')}
                          </Text>
                        </XStack>
                      ))}
                    </YStack>
                  )}
                </YStack>

              </YStack>
            )}

            {/* ── 2. MONTHLY REKAP (REKAP BULANAN & BREAKDOWN KATEGORI) ── */}
            {viewMode === 'monthly' && (
              <YStack gap={16}>
                
                {/* Laporan Arus Kas Bulanan */}
                <YStack backgroundColor="white" p={16} br={16} borderWidth={1} borderColor="#E4E4E7" gap={12}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                    📊 Laporan Keuangan Bulanan ({selectedMonth} {selectedYear})
                  </Text>

                  <YStack gap={8}>
                    <XStack jc="space-between" p={12} backgroundColor="#E8FFF1" br={12}>
                      <YStack>
                        <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#10B981">Total Omset Kotor</Text>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={20} color="#10B981">
                          Rp {monthlyTotalOmset.toLocaleString('id-ID')}
                        </Text>
                      </YStack>
                      <Ionicons name="trending-up" size={28} color="#10B981" />
                    </XStack>

                    <XStack jc="space-between" p={12} backgroundColor="#FEF2F2" br={12}>
                      <YStack>
                        <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#EF4444">Total Pengeluaran Resto</Text>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={20} color="#EF4444">
                          - Rp {monthlyTotalExpense.toLocaleString('id-ID')}
                        </Text>
                      </YStack>
                      <Ionicons name="trending-down" size={28} color="#EF4444" />
                    </XStack>

                    <XStack jc="space-between" p={14} backgroundColor="#EEF4FF" br={14} borderWidth={1} borderColor="#C7D9FF">
                      <YStack>
                        <Text fontFamily="Geist_700Bold" fontSize={13} color="#0D6EFD">Laba Bersih Resto (Net Profit)</Text>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={24} color="#0D6EFD">
                          Rp {monthlyNetProfit.toLocaleString('id-ID')}
                        </Text>
                      </YStack>
                      <Ionicons name="wallet" size={32} color="#0D6EFD" />
                    </XStack>
                  </YStack>
                </YStack>

                {/* Breakdown Kategori Pengeluaran Bulanan */}
                <YStack backgroundColor="white" p={16} br={16} borderWidth={1} borderColor="#E4E4E7" gap={12}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#18181B">
                    🍰 Rincian Pengeluaran per Kategori ({selectedMonth})
                  </Text>

                  <YStack gap={10}>
                    {categoryBreakdown.map((item, idx) => (
                      <YStack key={idx} gap={4}>
                        <XStack jc="space-between" ai="center">
                          <XStack ai="center" gap={6}>
                            <Ionicons name={item.iconName as any} size={15} color={item.color} />
                            <Text fontFamily="Geist_700Bold" fontSize={13} color="#18181B">
                              {item.category}
                            </Text>
                          </XStack>
                          <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#18181B">
                            Rp {item.total.toLocaleString('id-ID')} ({item.percent}%)
                          </Text>
                        </XStack>

                        {/* Progress Bar */}
                        <View style={{ height: 8, backgroundColor: '#F4F4F5', borderRadius: 4, overflow: 'hidden' }}>
                          <View style={{ height: 8, width: `${item.percent}%`, backgroundColor: item.color, borderRadius: 4 }} />
                        </View>
                      </YStack>
                    ))}
                  </YStack>
                </YStack>

              </YStack>
            )}

            {/* ── 3. YEARLY REKAP (REKAP TAHUNAN 2026) ── */}
            {viewMode === 'yearly' && (
              <YStack backgroundColor="white" p={16} br={16} borderWidth={1} borderColor="#E4E4E7" gap={14}>
                <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                  📈 Laporan Keuangan Tahunan (Tahun 2026)
                </Text>

                <YStack gap={8}>
                  {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus'].map((m, idx) => {
                    const omset = 35000000 + (idx * 800000);
                    const exp = 12000000 + (idx * 300000);
                    const profit = omset - exp;
                    return (
                      <XStack key={m} backgroundColor="#FAFAFA" p={12} br={12} jc="space-between" ai="center">
                        <YStack>
                          <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">{m} 2026</Text>
                          <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">Omset: Rp {omset.toLocaleString('id-ID')}</Text>
                        </YStack>
                        <YStack ai="flex-end">
                          <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#10B981">
                            + Rp {profit.toLocaleString('id-ID')}
                          </Text>
                          <Text fontFamily="Geist_400Regular" fontSize={11} color="#EF4444">
                            Pengeluaran: Rp {exp.toLocaleString('id-ID')}
                          </Text>
                        </YStack>
                      </XStack>
                    );
                  })}
                </YStack>
              </YStack>
            )}

          </YStack>
        </ScrollView>

        {/* ── FLOATING SEGMENTED ACTION DOCK ── */}
        <YStack
          position="absolute"
          bottom={Math.max(insets.bottom + 8, 16)}
          left={16}
          right={16}
          backgroundColor="white"
          p={10}
          br={20}
          borderWidth={1}
          borderColor="#E4E4E7"
          gap={8}
          elevation={12}
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.12}
          shadowRadius={10}
        >
          {/* Header Row with Icon */}
          <XStack jc="space-between" ai="center" px={4} pt={2}>
            <XStack ai="center" gap={6}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF5722' }} />
              <Text fontFamily="Geist_700Bold" fontSize={11} color="#52525B">
                CATAT PENGELUARAN RESTO ({selectedDay} {selectedMonth})
              </Text>
            </XStack>
            <Text fontFamily="Geist_500Medium" fontSize={10} color="#A1A1AA">
              Pilih Opsi Input:
            </Text>
          </XStack>

          {/* 3 Unified Action Segment Buttons */}
          <XStack backgroundColor="#F4F4F5" p={4} br={14} gap={6}>
            {/* Option 1: Scan Struk */}
            <TouchableOpacity
              onPress={() => {
                setActiveInputMethod('ocr');
                setAddSheetVisible(true);
              }}
              style={{
                flex: 1,
                backgroundColor: '#FF5722',
                paddingVertical: 10,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                shadowColor: '#FF5722',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={16} color="white" />
              <Text fontFamily="Geist_700Bold" fontSize={12} color="white">
                Scan Struk
              </Text>
            </TouchableOpacity>

            {/* Option 2: Input Manual */}
            <TouchableOpacity
              onPress={() => {
                setActiveInputMethod('manual');
                setAddSheetVisible(true);
              }}
              style={{
                flex: 1,
                backgroundColor: 'white',
                paddingVertical: 10,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: '#E4E4E7',
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={16} color="#18181B" />
              <Text fontFamily="Geist_700Bold" fontSize={12} color="#18181B">
                Manual
              </Text>
            </TouchableOpacity>

            {/* Option 3: Voice Note */}
            <TouchableOpacity
              onPress={() => {
                setActiveInputMethod('voice');
                setAddSheetVisible(true);
              }}
              style={{
                flex: 1,
                backgroundColor: 'white',
                paddingVertical: 10,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: '#E4E4E7',
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="mic-outline" size={16} color="#18181B" />
              <Text fontFamily="Geist_700Bold" fontSize={12} color="#18181B">
                Suara
              </Text>
            </TouchableOpacity>
          </XStack>
        </YStack>

        {/* ── MODAL 1: CARI TANGGAL DENGAN MUDAH ── */}
        <Modal
          visible={searchDateModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSearchDateModalVisible(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
            onPress={() => setSearchDateModalVisible(false)}
          >
            <Pressable
              style={{ width: '100%', maxWidth: 360, backgroundColor: 'white', borderRadius: 20, padding: 20, gap: 16 }}
              onPress={e => e.stopPropagation()}
            >
              <XStack jc="space-between" ai="center">
                <XStack ai="center" gap={8}>
                  <Ionicons name="calendar" size={20} color="#18181B" />
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                    Cari & Pilih Tanggal
                  </Text>
                </XStack>
                <TouchableOpacity onPress={() => setSearchDateModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#71717A" />
                </TouchableOpacity>
              </XStack>

              {/* Input Ketik Tanggal Direct Jumper */}
              <YStack gap={6}>
                <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#71717A">
                  Ketik Angka Tanggal (1 - 31):
                </Text>
                <XStack gap={8}>
                  <Input
                    f={1}
                    value={searchDayInput}
                    onChangeText={setSearchDayInput}
                    placeholder="Contoh: 15"
                    keyboardType="number-pad"
                    maxLength={2}
                    backgroundColor="#F4F4F5"
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    fontFamily="Geist_600SemiBold"
                    fontSize={14}
                  />
                  <Button
                    backgroundColor="#FF5722"
                    onPress={() => {
                      const dayNum = parseInt(searchDayInput);
                      if (dayNum >= 1 && dayNum <= 31) {
                        setSelectedDay(dayNum);
                        setSearchDateModalVisible(false);
                        setSearchDayInput('');
                      } else {
                        showAlert('Perhatian', 'Masukkan tanggal antara 1 dan 31');
                      }
                    }}
                  >
                    <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                      Lompat
                    </Text>
                  </Button>
                </XStack>
              </YStack>

              {/* Preset Chips */}
              <YStack gap={8}>
                <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#71717A">
                  Pintasan Tanggal Cepat:
                </Text>
                <XStack flexWrap="wrap" gap={8}>
                  {[
                    { label: 'Hari Ini (5)', day: 5 },
                    { label: 'Kemarin (4)', day: 4 },
                    { label: 'Tgl 1', day: 1 },
                    { label: 'Tgl 10', day: 10 },
                    { label: 'Tgl 15', day: 15 },
                    { label: 'Tgl 20', day: 20 },
                    { label: 'Tgl 25', day: 25 },
                    { label: 'Tgl 30', day: 30 },
                  ].map(p => (
                    <TouchableOpacity
                      key={p.label}
                      onPress={() => {
                        setSelectedDay(p.day);
                        setSearchDateModalVisible(false);
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: selectedDay === p.day ? '#FF5722' : '#F4F4F5',
                      }}
                    >
                      <Text
                        fontFamily="Geist_700Bold"
                        fontSize={12}
                        color={selectedDay === p.day ? 'white' : '#3F3F46'}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </XStack>
              </YStack>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── MODAL 2: BOTTOM SHEET INPUT PENGELUARAN ── */}
        <Modal
          visible={addSheetVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAddSheetVisible(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            onPress={() => setAddSheetVisible(false)}
          >
            <Pressable
              style={{
                backgroundColor: 'white',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 20,
                gap: 16,
                maxHeight: '90%',
              }}
              onPress={e => e.stopPropagation()}
            >
              {/* Top Drag Indicator */}
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E4E4E7', alignSelf: 'center' }} />

              <XStack jc="space-between" ai="center">
                <YStack gap={2}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={17} color="#18181B">
                    Catat Pengeluaran Resto
                  </Text>
                  <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
                    Tanggal {selectedDay} {selectedMonth} {selectedYear}
                  </Text>
                </YStack>
                <TouchableOpacity onPress={() => setAddSheetVisible(false)}>
                  <Ionicons name="close" size={22} color="#71717A" />
                </TouchableOpacity>
              </XStack>

              {/* 3 Instant Input Methods Switcher (No Double Icon!) */}
              <XStack backgroundColor="#F4F4F5" p={3} br={10} gap={4}>
                <TouchableOpacity
                  onPress={() => setActiveInputMethod('ocr')}
                  style={[styles.methodTab, activeInputMethod === 'ocr' && styles.methodTabActive]}
                >
                  <Ionicons name="camera-outline" size={15} color={activeInputMethod === 'ocr' ? 'white' : '#52525B'} />
                  <Text fontFamily="Geist_700Bold" fontSize={11} color={activeInputMethod === 'ocr' ? 'white' : '#52525B'}>
                    Scan Struk
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveInputMethod('manual')}
                  style={[styles.methodTab, activeInputMethod === 'manual' && styles.methodTabActive]}
                >
                  <Ionicons name="create-outline" size={15} color={activeInputMethod === 'manual' ? 'white' : '#52525B'} />
                  <Text fontFamily="Geist_700Bold" fontSize={11} color={activeInputMethod === 'manual' ? 'white' : '#52525B'}>
                    Manual
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveInputMethod('voice')}
                  style={[styles.methodTab, activeInputMethod === 'voice' && styles.methodTabActive]}
                >
                  <Ionicons name="mic-outline" size={15} color={activeInputMethod === 'voice' ? 'white' : '#52525B'} />
                  <Text fontFamily="Geist_700Bold" fontSize={11} color={activeInputMethod === 'voice' ? 'white' : '#52525B'}>
                    Suara
                  </Text>
                </TouchableOpacity>
              </XStack>

              {/* METHOD 1: OCR SCAN STRUK */}
              {activeInputMethod === 'ocr' && (
                <YStack gap={12} p={16} backgroundColor="#FAFAFA" br={14} borderWidth={1} borderColor="#E4E4E7" ai="center">
                  <Ionicons name="camera-outline" size={40} color="#71717A" />
                  <YStack ai="center" gap={2}>
                    <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                      Upload Struk & Ekstraksi AI
                    </Text>
                    <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A" textAlign="center">
                      Foto struk belanja, AI akan otomatis membaca nominal & item belanja.
                    </Text>
                  </YStack>
                  <Button
                    backgroundColor="#FF5722"
                    onPress={handleScanReceipt}
                    disabled={isScanning}
                    w="100%"
                    br={10}
                  >
                    {isScanning ? (
                      <XStack ai="center" gap={8}>
                        <Spinner color="white" size="small" />
                        <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                          Membaca Struk...
                        </Text>
                      </XStack>
                    ) : (
                      <XStack ai="center" gap={8}>
                        <Ionicons name="camera" size={16} color="white" />
                        <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                          Ambil Foto Struk Sekarang
                        </Text>
                      </XStack>
                    )}
                  </Button>
                </YStack>
              )}

              {/* METHOD 2: MANUAL INPUT FORM */}
              {activeInputMethod === 'manual' && (
                <YStack gap={10}>
                  <YStack gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                      Nama Pengeluaran / Belanja:
                    </Text>
                    <Input
                      value={title}
                      onChangeText={setTitle}
                      placeholder="misal: Beli Galon Air & Es Batu"
                      backgroundColor="#F4F4F5"
                      borderWidth={1}
                      borderColor="#E4E4E7"
                      fontFamily="Geist_500Medium"
                      fontSize={13}
                    />
                  </YStack>

                  <YStack gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                      Nominal Rp:
                    </Text>
                    <Input
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="misal: 85000"
                      keyboardType="number-pad"
                      backgroundColor="#F4F4F5"
                      borderWidth={1}
                      borderColor="#E4E4E7"
                      fontFamily="Geist_700Bold"
                      fontSize={14}
                    />
                  </YStack>

                  <YStack gap={4}>
                    <XStack jc="space-between" ai="center">
                      <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                        Kategori Belanja:
                      </Text>
                      <TouchableOpacity onPress={() => setAddCategoryModalVisible(true)}>
                        <Text fontFamily="Geist_700Bold" fontSize={11} color="#FF5722">
                          + Tambah Kategori
                        </Text>
                      </TouchableOpacity>
                    </XStack>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                      {categoriesList.map(cat => (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setCategory(cat as ExpenseCategory)}
                          style={[styles.catChip, category === cat && styles.catChipActive]}
                        >
                          <Text
                            fontFamily={category === cat ? 'Geist_700Bold' : 'Geist_500Medium'}
                            fontSize={11}
                            color={category === cat ? 'white' : '#52525B'}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}

                      <TouchableOpacity
                        onPress={() => setAddCategoryModalVisible(true)}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 8,
                          backgroundColor: '#FEF2F2',
                          borderWidth: 1,
                          borderColor: '#FEE2E2',
                        }}
                      >
                        <Text fontFamily="Geist_700Bold" fontSize={11} color="#EF4444">
                          + Kategori Baru
                        </Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </YStack>

                  <Button
                    backgroundColor="#FF5722"
                    onPress={() => handleAddExpense('manual')}
                    br={10}
                    mt={4}
                  >
                    <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                      Simpan Pengeluaran Resto
                    </Text>
                  </Button>
                </YStack>
              )}

              {/* METHOD 3: VOICE NOTE INPUT */}
              {activeInputMethod === 'voice' && (
                <YStack gap={12} p={16} backgroundColor="#FAFAFA" br={14} borderWidth={1} borderColor="#E4E4E7" ai="center">
                  <TouchableOpacity
                    onPress={handleToggleVoice}
                    style={[styles.micBtn, isListening && styles.micBtnActive]}
                  >
                    <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={24} color="white" />
                  </TouchableOpacity>
                  <YStack ai="center" gap={2}>
                    <Text fontFamily="Geist_700Bold" fontSize={14} color="#18181B">
                      {isListening ? 'Mendengarkan Ucapan...' : 'Tekan & Ucapkan Pengeluaran'}
                    </Text>
                    <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A" textAlign="center">
                      Contoh: "Beli Cup Plastik 16oz Rp 75.000"
                    </Text>
                  </YStack>
                  {voiceText !== '' && (
                    <View style={{ backgroundColor: '#E4E4E7', padding: 8, borderRadius: 8, width: '100%' }}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#18181B" textAlign="center">
                        🎙️ "{voiceText}"
                      </Text>
                    </View>
                  )}
                </YStack>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── MODAL 3: TAMBAH KATEGORI PENGELUARAN BARU ── */}
        <Modal
          visible={addCategoryModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAddCategoryModalVisible(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
            onPress={() => setAddCategoryModalVisible(false)}
          >
            <Pressable
              style={{ width: '100%', maxWidth: 360, backgroundColor: 'white', borderRadius: 20, padding: 20, gap: 16 }}
              onPress={e => e.stopPropagation()}
            >
              <XStack jc="space-between" ai="center">
                <XStack ai="center" gap={8}>
                  <Ionicons name="pricetag" size={20} color="#FF5722" />
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                    Tambah Kategori Pengeluaran
                  </Text>
                </XStack>
                <TouchableOpacity onPress={() => setAddCategoryModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#71717A" />
                </TouchableOpacity>
              </XStack>

              <YStack gap={6}>
                <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#71717A">
                  Nama Kategori Baru:
                </Text>
                <Input
                  value={newCategoryInput}
                  onChangeText={setNewCategoryInput}
                  placeholder="misal: Pemasaran & Ads, Maintenance"
                  backgroundColor="#F4F4F5"
                  borderWidth={1}
                  borderColor="#E4E4E7"
                  fontFamily="Geist_600SemiBold"
                  fontSize={13}
                />
              </YStack>

              <XStack gap={8} jc="flex-end">
                <Button
                  backgroundColor="#F4F4F5"
                  onPress={() => setAddCategoryModalVisible(false)}
                >
                  <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>
                    Batal
                  </Text>
                </Button>
                <Button
                  backgroundColor="#FF5722"
                  onPress={handleAddNewCategory}
                >
                  <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                    Simpan Kategori
                  </Text>
                </Button>
              </XStack>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── MODAL 4: FULL MONTH CALENDAR GRID & MONTH/YEAR SWITCHER ── */}
        <Modal
          visible={fullCalendarModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFullCalendarModalVisible(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
            onPress={() => setFullCalendarModalVisible(false)}
          >
            <Pressable
              style={{ width: '100%', maxWidth: 380, backgroundColor: 'white', borderRadius: 24, padding: 20, gap: 16 }}
              onPress={e => e.stopPropagation()}
            >
              {/* Header Title & Close */}
              <XStack jc="space-between" ai="center">
                <XStack ai="center" gap={8}>
                  <Ionicons name="calendar" size={20} color="#FF5722" />
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                    Pilih Tanggal & Bulan
                  </Text>
                </XStack>
                <TouchableOpacity onPress={() => setFullCalendarModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#71717A" />
                </TouchableOpacity>
              </XStack>

              {/* Month Navigation Control Row (< Agustus 2026 >) */}
              <XStack jc="space-between" ai="center" backgroundColor="#F4F4F5" p={8} br={12}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Ionicons name="chevron-back" size={18} color="#18181B" />
                </TouchableOpacity>

                <XStack ai="center" gap={6}>
                  <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#18181B">
                    {selectedMonth} {selectedYear}
                  </Text>
                </XStack>

                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Ionicons name="chevron-forward" size={18} color="#18181B" />
                </TouchableOpacity>
              </XStack>

              {/* Quick Year Selector Chips */}
              <YStack gap={4}>
                <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                  Pilih Tahun:
                </Text>
                <XStack gap={6}>
                  {YEARS_LIST.map(yr => (
                    <TouchableOpacity
                      key={yr}
                      onPress={() => setSelectedYear(yr)}
                      style={{
                        flex: 1,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: selectedYear === yr ? '#FF5722' : '#F4F4F5',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        fontFamily="Geist_700Bold"
                        fontSize={11}
                        color={selectedYear === yr ? 'white' : '#52525B'}
                      >
                        {yr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </XStack>
              </YStack>

              {/* Quick Month Selector Chips */}
              <YStack gap={4}>
                <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                  Pilih Bulan:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                  {MONTHS_LIST.map(m => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setSelectedMonth(m)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: selectedMonth === m ? '#FF5722' : '#F4F4F5',
                      }}
                    >
                      <Text
                        fontFamily="Geist_700Bold"
                        fontSize={11}
                        color={selectedMonth === m ? 'white' : '#52525B'}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </YStack>

              {/* 7-Column Day of Week Header */}
              <YStack gap={8}>
                <XStack jc="space-around" pt={4} borderBottomWidth={1} borderColor="#E4E4E7" pb={6}>
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
                    <Text key={i} fontFamily="Geist_700Bold" fontSize={11} color={i === 0 ? '#EF4444' : '#71717A'} style={{ width: 36, textAlign: 'center' }}>
                      {d}
                    </Text>
                  ))}
                </XStack>

                {/* 31 Days Grid */}
                <XStack flexWrap="wrap" gap={6} jc="flex-start">
                  {DAYS_IN_MONTH.map(day => {
                    const isSelected = selectedDay === day;
                    const hasExpense = expenses.some(e => e.dayNumber === day && e.month === selectedMonth && e.year === selectedYear);
                    return (
                      <TouchableOpacity
                        key={day}
                        onPress={() => {
                          setSelectedDay(day);
                          setFullCalendarModalVisible(false);
                        }}
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 10,
                          backgroundColor: isSelected ? '#FF5722' : '#F4F4F5',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: isSelected ? 0 : 1,
                          borderColor: '#E4E4E7',
                        }}
                      >
                        <Text
                          fontFamily="Geist_800ExtraBold"
                          fontSize={13}
                          color={isSelected ? 'white' : '#18181B'}
                        >
                          {day}
                        </Text>
                        {hasExpense && (
                          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isSelected ? 'white' : '#EF4444', marginTop: 1 }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </XStack>
              </YStack>
            </Pressable>
          </Pressable>
        </Modal>

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
  viewTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewTabActive: {
    backgroundColor: '#FF5722',
  },
  calendarDayChip: {
    width: 38,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  calendarDayChipActive: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  methodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  methodTabActive: {
    backgroundColor: '#FF5722',
  },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  catChipActive: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  micBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnActive: {
    backgroundColor: '#EF4444',
  },
  sourceBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
