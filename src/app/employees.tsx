import { useState } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView } from 'tamagui';
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

type StaffRole = 'Kasir' | 'Koki / Barista' | 'Waiters / Server' | 'Manager Resto' | 'Supervisor';
type ShiftType = 'Shift Pagi (08:00 - 16:00)' | 'Shift Sore (16:00 - 23:00)' | 'Full Time';
type BankType = 'BCA' | 'Mandiri' | 'BRI' | 'BNI' | 'GoPay' | 'DANA' | 'ShopeePay' | 'Cash / Tunai';

interface ModulePermissions {
  canManageExpenses?: boolean;
  canManageProducts?: boolean;
  canVoidTransaction?: boolean;
  canAccessKDS?: boolean;
}

interface EmployeeItem {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;
  shift: ShiftType;
  phone: string;
  salary: number;
  bankName: BankType;
  accountNumber: string;
  accountHolder: string;
  isClockedIn: boolean;
  clockInTime?: string;
  customPermissions?: ModulePermissions;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  isManualEntry?: boolean;
}

export default function EmployeesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'employees' | 'shift'>('employees');

  // Employee List State loaded from persistent storage
  const [employees, setEmployees] = useState<EmployeeItem[]>(() =>
    loadFromLocal<EmployeeItem[]>(KEYS.EMPLOYEES, [])
  );

  // Attendance Records State
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([
    { id: 'att-1', employeeId: '1', employeeName: 'Siti Rahma', role: 'Kasir', date: '5 Aug 2026', clockInTime: '08:02' },
    { id: 'att-2', employeeId: '2', employeeName: 'Budi Santoso', role: 'Manager Resto', date: '5 Aug 2026', clockInTime: '07:45' },
    { id: 'att-3', employeeId: '3', employeeName: 'Ahmad Fauzi', role: 'Koki / Barista', date: '4 Aug 2026', clockInTime: '08:10', clockOutTime: '16:05' },
    { id: 'att-4', employeeId: '4', employeeName: 'Dewi Lestari', role: 'Waiters / Server', date: '4 Aug 2026', clockInTime: '16:00', clockOutTime: '23:12' },
  ]);

  // Add/Edit Employee Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeItem | null>(null);

  // Detail Modal State
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailEmp, setSelectedDetailEmp] = useState<EmployeeItem | null>(null);

  // Manual Attendance Modal State
  const [manualAttModalVisible, setManualAttModalVisible] = useState(false);
  const [editingAttLog, setEditingAttLog] = useState<AttendanceRecord | null>(null);
  const [attSelectedEmpId, setAttSelectedEmpId] = useState('1');
  const [attClockInInput, setAttClockInInput] = useState('08:00');
  const [attClockOutInput, setAttClockOutInput] = useState('16:00');

  // Form Inputs: General Info
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<StaffRole>('Kasir');
  const [formPin, setFormPin] = useState('');
  const [formShift, setFormShift] = useState<ShiftType>('Shift Pagi (08:00 - 16:00)');
  const [formPhone, setFormPhone] = useState('');
  const [formSalary, setFormSalary] = useState('3000000');

  // Form Inputs: Payroll Account
  const [formBankName, setFormBankName] = useState<BankType>('BCA');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formAccountHolder, setFormAccountHolder] = useState('');

  // Clock In / Clock Out Quick Action
  function handleToggleClockIn(emp: EmployeeItem) {
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    setEmployees(prev =>
      prev.map(e => (e.id === emp.id ? { ...e, isClockedIn: !e.isClockedIn, clockInTime: !e.isClockedIn ? timeNow : undefined } : e))
    );

    if (!emp.isClockedIn) {
      // Add new log entry
      const newLog: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        date: '5 Aug 2026',
        clockInTime: timeNow,
      };
      setAttendanceLogs([newLog, ...attendanceLogs]);
      showAlert('Clock-In Berhasil 🟢', `${emp.name} (${emp.role}) berhasil masuk shift pukul ${timeNow}.`);
    } else {
      // Find active log and add clock out time
      setAttendanceLogs(prev =>
        prev.map(log => {
          if (log.employeeId === emp.id && !log.clockOutTime) {
            return { ...log, clockOutTime: timeNow };
          }
          return log;
        })
      );
      showAlert('Clock-Out Berhasil 🔴', `${emp.name} (${emp.role}) berhasil keluar shift pukul ${timeNow}.`);
    }
  }

  // Open Detail Modal
  function handleOpenDetail(emp: EmployeeItem) {
    setSelectedDetailEmp(emp);
    setDetailModalVisible(true);
  }

  // Open Add Employee Modal
  function handleOpenAdd() {
    setEditingEmp(null);
    setFormName('');
    setFormRole('Kasir');
    setFormPin('');
    setFormShift('Shift Pagi (08:00 - 16:00)');
    setFormPhone('');
    setFormSalary('3000000');
    setFormBankName('BCA');
    setFormAccountNumber('');
    setFormAccountHolder('');
    setFormPermissions({
      canManageExpenses: false,
      canManageProducts: false,
      canVoidTransaction: false,
      canAccessKDS: false,
    });
    setAddModalVisible(true);
  }

  // Open Edit Employee Modal
  function handleOpenEdit(emp: EmployeeItem) {
    setEditingEmp(emp);
    setFormName(emp.name);
    setFormRole(emp.role);
    setFormPin(emp.pin);
    setFormShift(emp.shift);
    setFormPhone(emp.phone);
    setFormSalary(emp.salary.toString());
    setFormBankName(emp.bankName);
    setFormAccountNumber(emp.accountNumber);
    setFormAccountHolder(emp.accountHolder);
    setFormPermissions(emp.customPermissions || {
      canManageExpenses: emp.role === 'Manager Resto' || emp.role === 'Supervisor',
      canManageProducts: emp.role === 'Manager Resto' || emp.role === 'Supervisor',
      canVoidTransaction: emp.role === 'Manager Resto' || emp.role === 'Supervisor',
      canAccessKDS: emp.role === 'Koki / Barista' || emp.role === 'Manager Resto',
    });
    setAddModalVisible(true);
  }

  // Selfie & GPS Clock In Modal State
  const [selfieModalVisible, setSelfieModalVisible] = useState(false);
  const [selfieTargetEmp, setSelfieTargetEmp] = useState<EmployeeItem | null>(null);
  const [isCapturingSelfie, setIsCapturingSelfie] = useState(false);

  function handleInitiateClockIn(emp: EmployeeItem) {
    if (!emp.isClockedIn) {
      setSelfieTargetEmp(emp);
      setSelfieModalVisible(true);
    } else {
      handleToggleClockIn(emp);
    }
  }

  function handleConfirmSelfieClockIn() {
    if (!selfieTargetEmp) return;
    setIsCapturingSelfie(true);
    setTimeout(() => {
      setIsCapturingSelfie(false);
      setSelfieModalVisible(false);
      handleToggleClockIn(selfieTargetEmp);
    }, 1200);
  }

  // Form Inputs: Custom Module Permissions
  const [formPermissions, setFormPermissions] = useState<ModulePermissions>({
    canManageExpenses: false,
    canManageProducts: false,
    canVoidTransaction: false,
    canAccessKDS: false,
  });

  // Save Employee (Create or Edit)
  function handleSaveEmployee() {
    if (!formName.trim()) {
      showAlert('Perhatian', 'Harap isi Nama Lengkap Karyawan.');
      return;
    }
    if (!formPin.trim() || formPin.length !== 4) {
      showAlert('Perhatian', 'Harap isi 4-Digit PIN Kasir.');
      return;
    }

    const numSalary = parseInt(formSalary.replace(/[^0-9]/g, '')) || 0;

    if (editingEmp) {
      // Update
      const updated = employees.map(emp =>
        emp.id === editingEmp.id
          ? {
              ...emp,
              name: formName,
              role: formRole,
              pin: formPin,
              shift: formShift,
              phone: formPhone,
              salary: numSalary,
              bankName: formBankName,
              accountNumber: formAccountNumber,
              accountHolder: formAccountHolder || formName,
              customPermissions: formPermissions,
            }
          : emp
      );
      setEmployees(updated);
      saveToLocal(KEYS.EMPLOYEES, updated);
      showAlert('Sukses! ✅', `Data staf & izin hak akses "${formName}" berhasil diperbarui.`);
    } else {
      // Create
      const newEmp: EmployeeItem = {
        id: Date.now().toString(),
        name: formName,
        role: formRole,
        pin: formPin,
        shift: formShift,
        phone: formPhone,
        salary: numSalary,
        bankName: formBankName,
        accountNumber: formAccountNumber,
        accountHolder: formAccountHolder || formName,
        isClockedIn: false,
        customPermissions: formPermissions,
      };
      const updated = [...employees, newEmp];
      setEmployees(updated);
      saveToLocal(KEYS.EMPLOYEES, updated);
      showAlert('Sukses! ✅', `Karyawan baru "${formName}" (${formRole}) berhasil ditambahkan.`);
    }
    setAddModalVisible(false);
  }

  // Delete Employee
  function handleDeleteEmployee(emp: EmployeeItem) {
    showAlert(
      'Hapus Karyawan?',
      `Apakah Anda yakin ingin menghapus "${emp.name}" dari daftar tim resto?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Staf',
          style: 'destructive',
          onPress: () => {
            const updated = employees.filter(e => e.id !== emp.id);
            setEmployees(updated);
            saveToLocal(KEYS.EMPLOYEES, updated);
            setDetailModalVisible(false);
            showAlert('Terhapus', `Karyawan "${emp.name}" telah dihapus.`);
          },
        },
      ],
      'confirm'
    );
  }

  // Save Manual Attendance (Create or Edit)
  function handleSaveManualAttendance() {
    if (editingAttLog) {
      // Edit existing log
      setAttendanceLogs(prev =>
        prev.map(log =>
          log.id === editingAttLog.id
            ? { ...log, clockInTime: attClockInInput, clockOutTime: attClockOutInput || undefined, isManualEntry: true }
            : log
        )
      );
      showAlert('Sukses! ✅', `Rekap jam masuk & pulang ${editingAttLog.employeeName} berhasil diperbarui.`);
    } else {
      // Create new manual attendance record
      const targetEmp = employees.find(e => e.id === attSelectedEmpId) || employees[0];
      const newLog: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: targetEmp.id,
        employeeName: targetEmp.name,
        role: targetEmp.role,
        date: '5 Aug 2026',
        clockInTime: attClockInInput,
        clockOutTime: attClockOutInput || undefined,
        isManualEntry: true,
      };
      setAttendanceLogs([newLog, ...attendanceLogs]);
      showAlert('Sukses! ✅', `Absensi manual "${targetEmp.name}" (${attClockInInput} - ${attClockOutInput}) berhasil dicatat.`);
    }
    setManualAttModalVisible(false);
  }

  // Open Edit Attendance Modal
  function handleOpenEditAttendance(log: AttendanceRecord) {
    setEditingAttLog(log);
    setAttSelectedEmpId(log.employeeId);
    setAttClockInInput(log.clockInTime);
    setAttClockOutInput(log.clockOutTime || '16:00 WIB');
    setManualAttModalVisible(true);
  }

  // Open Add Manual Attendance Modal
  function handleOpenAddManualAttendance() {
    setEditingAttLog(null);
    setAttSelectedEmpId(employees[0]?.id || '1');
    setAttClockInInput('08:00 WIB');
    setAttClockOutInput('16:00 WIB');
    setManualAttModalVisible(true);
  }

  // Calculated Metrics
  const totalStaff = employees.length;
  const activeClockedIn = employees.filter(e => e.isClockedIn).length;

  const ROLES_LIST: StaffRole[] = ['Kasir', 'Koki / Barista', 'Waiters / Server', 'Manager Resto', 'Supervisor'];
  const SHIFTS_LIST: ShiftType[] = ['Shift Pagi (08:00 - 16:00)', 'Shift Sore (16:00 - 23:00)', 'Full Time'];
  const BANKS_LIST: BankType[] = ['BCA', 'Mandiri', 'BRI', 'BNI', 'GoPay', 'DANA', 'ShopeePay', 'Cash / Tunai'];

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
              Kelola Tim & Karyawan Resto
            </Text>
            <Text fontFamily="Geist_400Regular" fontSize={12} color="#71717A">
              Hak Akses Peran, PIN 4-Digit, & Rekap Absensi Shift
            </Text>
          </YStack>
        </XStack>

        {/* ── METRICS SUMMARY BAR (4 CARDS) ── */}
        <XStack backgroundColor="white" p={12} gap={8} borderBottomWidth={1} borderColor="#E4E4E7">
          <YStack f={1} p={10} backgroundColor="#FAFAFA" br={12} borderWidth={1} borderColor="#F4F4F5" ai="center">
            <Text fontFamily="Geist_500Medium" fontSize={10} color="#71717A">Total Tim</Text>
            <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#18181B">{totalStaff} Orang</Text>
          </YStack>

          <YStack f={1} p={10} backgroundColor="#ECFDF5" br={12} borderWidth={1} borderColor="#A7F3D0" ai="center">
            <Text fontFamily="Geist_500Medium" fontSize={10} color="#047857">Aktif Shift</Text>
            <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#059669">{activeClockedIn} Staf</Text>
          </YStack>

          <YStack f={1} p={10} backgroundColor="#FFF7ED" br={12} borderWidth={1} borderColor="#FFEDD5" ai="center">
            <Text fontFamily="Geist_500Medium" fontSize={10} color="#C2410C">PIN Terpasang</Text>
            <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#EA580C">{totalStaff}/{totalStaff}</Text>
          </YStack>

          <YStack f={1} p={10} backgroundColor="#FEF2F2" br={12} borderWidth={1} borderColor="#FEE2E2" ai="center">
            <Text fontFamily="Geist_500Medium" fontSize={10} color="#991B1B">Rekap Absensi</Text>
            <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#EF4444">{attendanceLogs.length} Log</Text>
          </YStack>
        </XStack>

        {/* ── SUBTAB SEGMENT SWITCHER (2 CLEAN TABS) ── */}
        <XStack backgroundColor="white" px={16} py={8} gap={8} borderBottomWidth={1} borderColor="#E4E4E7">
          <TouchableOpacity
            onPress={() => setActiveTab('employees')}
            style={[styles.tabBtn, activeTab === 'employees' && styles.tabBtnActive]}
          >
            <Ionicons name="people-outline" size={16} color={activeTab === 'employees' ? 'white' : '#52525B'} />
            <Text fontFamily="Geist_700Bold" fontSize={13} color={activeTab === 'employees' ? 'white' : '#52525B'}>
              Daftar Staf ({totalStaff})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('shift')}
            style={[styles.tabBtn, activeTab === 'shift' && styles.tabBtnActive]}
          >
            <Ionicons name="time-outline" size={16} color={activeTab === 'shift' ? 'white' : '#52525B'} />
            <Text fontFamily="Geist_700Bold" fontSize={13} color={activeTab === 'shift' ? 'white' : '#52525B'}>
              Absensi & Shift ({attendanceLogs.length})
            </Text>
          </TouchableOpacity>
        </XStack>

        {/* ── CONTENT BODY ── */}
        <ScrollView f={1} contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom + 80, 100) }}>
          <YStack gap={14} maxWidth={700} alignSelf="center" w="100%">

            {/* TAB 1: DAFTAR KARYAWAN (ULTRA CLEAN CARD VIEW) */}
            {activeTab === 'employees' && (
              <YStack gap={10}>
                {employees.map(emp => (
                  <TouchableOpacity
                    key={emp.id}
                    onPress={() => handleOpenDetail(emp)}
                    activeOpacity={0.75}
                    style={{
                      backgroundColor: 'white',
                      padding: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: '#E4E4E7',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <XStack ai="center" gap={10} f={1}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' }}>
                        <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#FF5722">
                          {emp.name.charAt(0)}
                        </Text>
                      </View>

                      <YStack gap={2} f={1}>
                        <XStack ai="center" gap={6}>
                          <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#18181B">
                            {emp.name}
                          </Text>
                          {emp.isClockedIn && (
                            <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                              <Text fontFamily="Geist_700Bold" fontSize={9} color="#059669">
                                🟢 Aktif Shift
                              </Text>
                            </View>
                          )}
                        </XStack>

                        <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#71717A">
                          <Text color="#FF5722">{emp.role}</Text> • {emp.phone}
                        </Text>
                      </YStack>
                    </XStack>

                    <XStack ai="center" gap={4}>
                      <View style={{ backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Text fontFamily="Geist_700Bold" fontSize={11} color="#EA580C">
                          Detail
                        </Text>
                        <Ionicons name="chevron-forward" size={12} color="#EA580C" />
                      </View>
                    </XStack>
                  </TouchableOpacity>
                ))}
              </YStack>
            )}

            {/* TAB 2: ABSENSI & REKAP SHIFT (JAM MASUK & JAM PULANG) */}
            {activeTab === 'shift' && (
              <YStack gap={12}>
                <XStack jc="space-between" ai="center">
                  <YStack gap={2}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#18181B">
                      ⏱️ Rekap Absensi Datang & Pulang Staf
                    </Text>
                    <Text fontFamily="Geist_400Regular" fontSize={11} color="#71717A">
                      Otomatis dari PIN Kasir atau Di-input Manual oleh Admin/Manager
                    </Text>
                  </YStack>

                  <TouchableOpacity
                    onPress={handleOpenAddManualAttendance}
                    style={{
                      backgroundColor: '#FF5722',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Ionicons name="add-circle" size={14} color="white" />
                    <Text fontFamily="Geist_700Bold" fontSize={11} color="white">
                      + Input Manual
                    </Text>
                  </TouchableOpacity>
                </XStack>

                {/* GEOFENCING GPS & SELFIE SECURITY BANNER */}
                <XStack backgroundColor="#ECFDF5" p={10} br={12} borderWidth={1} borderColor="#A7F3D0" ai="center" jc="space-between">
                  <XStack ai="center" gap={8} f={1}>
                    <Ionicons name="location" size={18} color="#059669" />
                    <YStack gap={1} f={1}>
                      <Text fontFamily="Geist_700Bold" fontSize={11} color="#047857">
                        📍 Geofencing GPS & Selfie Presensi Aktif
                      </Text>
                      <Text fontFamily="Geist_500Medium" fontSize={10} color="#059669">
                        Hanya BISA Clock-In jika Berada dalam Radius 50m dari Outlet Resto
                      </Text>
                    </YStack>
                  </XStack>
                  <View style={{ backgroundColor: '#059669', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={9} color="white">
                      🔒 TERKUNCI
                    </Text>
                  </View>
                </XStack>

                {/* Absensi Logs Cards */}
                {attendanceLogs.map(log => {
                  const emp = employees.find(e => e.id === log.employeeId);
                  const isWorking = !log.clockOutTime;

                  return (
                    <YStack
                      key={log.id}
                      backgroundColor="white"
                      p={14}
                      br={16}
                      borderWidth={1}
                      borderColor="#E4E4E7"
                      gap={10}
                    >
                      <XStack jc="space-between" ai="center">
                        <XStack ai="center" gap={8}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isWorking ? '#059669' : '#71717A' }} />
                          <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#18181B">
                            {log.employeeName}
                          </Text>
                          <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                            ({log.role})
                          </Text>
                        </XStack>

                        <XStack ai="center" gap={6}>
                          {log.isManualEntry && (
                            <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                              <Text fontFamily="Geist_700Bold" fontSize={9} color="#D97706">
                                📝 Manual Admin
                              </Text>
                            </View>
                          )}
                          <Text fontFamily="Geist_500Medium" fontSize={11} color="#A1A1AA">
                            {log.date}
                          </Text>
                        </XStack>
                      </XStack>

                      {/* Datang & Pulang Time Container */}
                      <XStack backgroundColor="#FAFAFA" p={10} br={12} borderWidth={1} borderColor="#F4F4F5" jc="space-between" ai="center">
                        <YStack gap={2}>
                          <Text fontFamily="Geist_500Medium" fontSize={10} color="#047857">
                            🟢 Jam Masuk (Clock-In):
                          </Text>
                          <Text fontFamily="Geist_800ExtraBold" fontSize={14} color="#059669">
                            {log.clockInTime}
                          </Text>
                        </YStack>

                        <View style={{ width: 1, height: 24, backgroundColor: '#E4E4E7' }} />

                        <YStack gap={2} ai="flex-end">
                          <Text fontFamily="Geist_500Medium" fontSize={10} color={isWorking ? '#C2410C' : '#991B1B'}>
                            🔴 Jam Pulang (Clock-Out):
                          </Text>
                          <Text fontFamily="Geist_800ExtraBold" fontSize={14} color={isWorking ? '#EA580C' : '#EF4444'}>
                            {log.clockOutTime || 'Sedang Shift...'}
                          </Text>
                        </YStack>
                      </XStack>

                      {/* Action Bar */}
                      <XStack jc="flex-end" ai="center" gap={8} pt={2}>
                        {emp && (
                          <TouchableOpacity
                            onPress={() => handleInitiateClockIn(emp)}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: 8,
                              backgroundColor: emp.isClockedIn ? '#FEF2F2' : '#ECFDF5',
                            }}
                          >
                            <Text fontFamily="Geist_700Bold" fontSize={11} color={emp.isClockedIn ? '#EF4444' : '#059669'}>
                              {emp.isClockedIn ? '🔴 Set Clock-Out' : '📸 Selfie Clock-In'}
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          onPress={() => handleOpenEditAttendance(log)}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 8,
                            backgroundColor: '#F4F4F5',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Ionicons name="pencil" size={13} color="#18181B" />
                          <Text fontFamily="Geist_700Bold" fontSize={11} color="#18181B">
                            Edit Jam
                          </Text>
                        </TouchableOpacity>
                      </XStack>

                    </YStack>
                  );
                })}
              </YStack>
            )}

          </YStack>
        </ScrollView>

        {/* ── FLOATING ACTION BUTTON: TAMBAH KARYAWAN ── */}
        <View style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom + 8, 16),
          left: 16,
          right: 16,
        }}>
          <Button
            size="$4"
            br={14}
            backgroundColor="#FF5722"
            onPress={handleOpenAdd}
            height={46}
          >
            <XStack ai="center" gap={8}>
              <Ionicons name="person-add" size={18} color="white" />
              <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={14}>
                + TAMBAH KARYAWAN BARU
              </Text>
            </XStack>
          </Button>
        </View>

        {/* ── MODAL 1: CONFIDENTIAL DETAIL & GAJI STAF ── */}
        <Modal
          visible={detailModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
            onPress={() => setDetailModalVisible(false)}
          >
            <Pressable
              style={{ width: '100%', maxWidth: 380, backgroundColor: 'white', borderRadius: 24, padding: 20, gap: 16 }}
              onPress={e => e.stopPropagation()}
            >
              <XStack jc="space-between" ai="center">
                <XStack ai="center" gap={8}>
                  <Ionicons name="shield-checkmark" size={20} color="#FF5722" />
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                    Detail & Gaji Staf (Privat)
                  </Text>
                </XStack>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#71717A" />
                </TouchableOpacity>
              </XStack>

              {selectedDetailEmp && (
                <YStack gap={12}>
                  {/* Name & Role */}
                  <YStack backgroundColor="#FAFAFA" p={12} br={14} borderWidth={1} borderColor="#F4F4F5" gap={4}>
                    <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                      {selectedDetailEmp.name}
                    </Text>
                    <Text fontFamily="Geist_700Bold" fontSize={12} color="#FF5722">
                      {selectedDetailEmp.role} • PIN Login: {selectedDetailEmp.pin}
                    </Text>
                    <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">
                      🕒 {selectedDetailEmp.shift}
                    </Text>
                  </YStack>

                  {/* Payroll Box */}
                  <YStack backgroundColor="#ECFDF5" p={12} br={14} borderWidth={1} borderColor="#A7F3D0" gap={6}>
                    <XStack jc="space-between" ai="center">
                      <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#047857">
                        Gaji Pokok / Bulan:
                      </Text>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={15} color="#059669">
                        Rp {selectedDetailEmp.salary.toLocaleString('id-ID')}
                      </Text>
                    </XStack>
                  </YStack>

                  {/* Bank Account Box */}
                  <YStack backgroundColor="#FFF7ED" p={12} br={14} borderWidth={1} borderColor="#FFEDD5" gap={6}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#C2410C">
                      Informasi Transfer Rekening:
                    </Text>
                    <YStack gap={2}>
                      <Text fontFamily="Geist_800ExtraBold" fontSize={13} color="#EA580C">
                        {selectedDetailEmp.bankName} • {selectedDetailEmp.accountNumber || '-'}
                      </Text>
                      <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">
                        Atas Nama (A/N): {selectedDetailEmp.accountHolder || selectedDetailEmp.name}
                      </Text>
                    </YStack>
                  </YStack>

                  {/* Custom Permissions Display */}
                  <YStack gap={4} px={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                      Modul Akses Khusus:
                    </Text>
                    <XStack flexWrap="wrap" gap={4}>
                      <View style={{ backgroundColor: '#F4F4F5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text fontFamily="Geist_700Bold" fontSize={10} color="#18181B">
                          {selectedDetailEmp.role} (Standar)
                        </Text>
                      </View>
                      {selectedDetailEmp.customPermissions?.canManageExpenses && (
                        <View style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                          <Text fontFamily="Geist_700Bold" fontSize={10} color="#EF4444">
                            + Pengeluaran Resto
                          </Text>
                        </View>
                      )}
                      {selectedDetailEmp.customPermissions?.canManageProducts && (
                        <View style={{ backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                          <Text fontFamily="Geist_700Bold" fontSize={10} color="#EA580C">
                            + Stok & Menu
                          </Text>
                        </View>
                      )}
                      {selectedDetailEmp.customPermissions?.canVoidTransaction && (
                        <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                          <Text fontFamily="Geist_700Bold" fontSize={10} color="#D97706">
                            + Void & Diskon
                          </Text>
                        </View>
                      )}
                      {selectedDetailEmp.customPermissions?.canAccessKDS && (
                        <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                          <Text fontFamily="Geist_700Bold" fontSize={10} color="#059669">
                            + Layar Dapur KDS
                          </Text>
                        </View>
                      )}
                    </XStack>
                  </YStack>

                  {/* Contact */}
                  <YStack gap={2} px={4}>
                    <Text fontFamily="Geist_500Medium" fontSize={11} color="#71717A">
                      📱 WhatsApp / No HP: {selectedDetailEmp.phone}
                    </Text>
                  </YStack>

                  {/* Actions Row */}
                  <XStack gap={8} pt={4}>
                    <Button
                      f={1}
                      backgroundColor="#F4F4F5"
                      onPress={() => {
                        setDetailModalVisible(false);
                        handleOpenEdit(selectedDetailEmp);
                      }}
                      br={10}
                    >
                      <XStack ai="center" gap={4}>
                        <Ionicons name="pencil" size={14} color="#18181B" />
                        <Text fontFamily="Geist_700Bold" color="#18181B" fontSize={12}>
                          Edit Staf
                        </Text>
                      </XStack>
                    </Button>

                    <Button
                      backgroundColor="#FEF2F2"
                      onPress={() => {
                        setDetailModalVisible(false);
                        handleDeleteEmployee(selectedDetailEmp);
                      }}
                      br={10}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </Button>
                  </XStack>
                </YStack>
              )}

              <Button
                backgroundColor="#FF5722"
                onPress={() => setDetailModalVisible(false)}
                br={10}
              >
                <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                  Tutup Detail
                </Text>
              </Button>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── MODAL 2: INPUT / EDIT ABSENSI MANUAL ADMIN ── */}
        <Modal
          visible={manualAttModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setManualAttModalVisible(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
            onPress={() => setManualAttModalVisible(false)}
          >
            <Pressable
              style={{ width: '100%', maxWidth: 380, backgroundColor: 'white', borderRadius: 24, padding: 20, gap: 14 }}
              onPress={e => e.stopPropagation()}
            >
              <XStack jc="space-between" ai="center">
                <XStack ai="center" gap={8}>
                  <Ionicons name="time" size={20} color="#FF5722" />
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                    {editingAttLog ? 'Edit Absensi Shift' : 'Input Absensi Manual Admin'}
                  </Text>
                </XStack>
                <TouchableOpacity onPress={() => setManualAttModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#71717A" />
                </TouchableOpacity>
              </XStack>

              {!editingAttLog && (
                <YStack gap={4}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                    Pilih Karyawan:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {employees.map(emp => (
                      <TouchableOpacity
                        key={emp.id}
                        onPress={() => setAttSelectedEmpId(emp.id)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: attSelectedEmpId === emp.id ? '#FF5722' : '#F4F4F5',
                        }}
                      >
                        <Text fontFamily="Geist_700Bold" fontSize={11} color={attSelectedEmpId === emp.id ? 'white' : '#52525B'}>
                          {emp.name} ({emp.role})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </YStack>
              )}

              <XStack gap={10}>
                <YStack f={1} gap={4}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                    🟢 Jam Masuk (Clock-In):
                  </Text>
                  <Input
                    value={attClockInInput}
                    onChangeText={setAttClockInInput}
                    placeholder="misal: 07:45 WIB"
                    backgroundColor="#F4F4F5"
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    fontFamily="Geist_700Bold"
                    fontSize={13}
                  />
                </YStack>

                <YStack f={1} gap={4}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                    🔴 Jam Pulang (Clock-Out):
                  </Text>
                  <Input
                    value={attClockOutInput}
                    onChangeText={setAttClockOutInput}
                    placeholder="misal: 16:05 WIB"
                    backgroundColor="#F4F4F5"
                    borderWidth={1}
                    borderColor="#E4E4E7"
                    fontFamily="Geist_700Bold"
                    fontSize={13}
                  />
                </YStack>
              </XStack>

              <XStack gap={8} jc="flex-end" pt={4}>
                <Button
                  backgroundColor="#F4F4F5"
                  onPress={() => setManualAttModalVisible(false)}
                >
                  <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>
                    Batal
                  </Text>
                </Button>
                <Button
                  backgroundColor="#FF5722"
                  onPress={handleSaveManualAttendance}
                >
                  <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                    Simpan Absensi
                  </Text>
                </Button>
              </XStack>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── MODAL 3: TAMBAH / EDIT KARYAWAN ── */}
        <Modal
          visible={addModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAddModalVisible(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
            onPress={() => setAddModalVisible(false)}
          >
            <Pressable
              style={{ width: '100%', maxWidth: 420, backgroundColor: 'white', borderRadius: 24, padding: 20, gap: 14 }}
              onPress={e => e.stopPropagation()}
            >
              <XStack jc="space-between" ai="center">
                <XStack ai="center" gap={8}>
                  <Ionicons name="person" size={20} color="#FF5722" />
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                    {editingEmp ? 'Edit Data Staf & Gaji' : 'Tambah Karyawan Baru'}
                  </Text>
                </XStack>
                <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#71717A" />
                </TouchableOpacity>
              </XStack>

              <ScrollView maxHeight={420} showsVerticalScrollIndicator={false}>
                <YStack gap={12}>
                  {/* Nama Input */}
                  <YStack gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                      Nama Lengkap Staf:
                    </Text>
                    <Input
                      value={formName}
                      onChangeText={setFormName}
                      placeholder="misal: Siti Rahma"
                      backgroundColor="#F4F4F5"
                      borderWidth={1}
                      borderColor="#E4E4E7"
                      fontFamily="Geist_500Medium"
                      fontSize={13}
                    />
                  </YStack>

                  {/* Peran Hak Akses */}
                  <YStack gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                      Peran Hak Akses (Role):
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {ROLES_LIST.map(r => (
                        <TouchableOpacity
                          key={r}
                          onPress={() => setFormRole(r)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                            backgroundColor: formRole === r ? '#FF5722' : '#F4F4F5',
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={11} color={formRole === r ? 'white' : '#52525B'}>
                            {r}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </YStack>

                  {/* 4-Digit PIN Input & Gaji */}
                  <XStack gap={10}>
                    <YStack f={1} gap={4}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                        PIN Kasir (4 Angka):
                      </Text>
                      <Input
                        value={formPin}
                        onChangeText={setFormPin}
                        placeholder="misal: 1234"
                        keyboardType="number-pad"
                        maxLength={4}
                        backgroundColor="#F4F4F5"
                        borderWidth={1}
                        borderColor="#E4E4E7"
                        fontFamily="Geist_800ExtraBold"
                        fontSize={13}
                      />
                    </YStack>

                    <YStack f={1.2} gap={4}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                        Gaji Pokok / Bulan (Rp):
                      </Text>
                      <Input
                        value={formSalary}
                        onChangeText={setFormSalary}
                        placeholder="misal: 3000000"
                        keyboardType="number-pad"
                        backgroundColor="#F4F4F5"
                        borderWidth={1}
                        borderColor="#E4E4E7"
                        fontFamily="Geist_700Bold"
                        fontSize={13}
                      />
                    </YStack>
                  </XStack>

                  {/* Bank Name Selector */}
                  <YStack gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                      Bank / E-Wallet Pembayaran Gaji:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {BANKS_LIST.map(b => (
                        <TouchableOpacity
                          key={b}
                          onPress={() => setFormBankName(b)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                            backgroundColor: formBankName === b ? '#FF5722' : '#F4F4F5',
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={11} color={formBankName === b ? 'white' : '#52525B'}>
                            {b}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </YStack>

                  {/* Nomor Rekening & Atas Nama */}
                  <XStack gap={10}>
                    <YStack f={1} gap={4}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                        No. Rekening / E-Wallet:
                      </Text>
                      <Input
                        value={formAccountNumber}
                        onChangeText={setFormAccountNumber}
                        placeholder="misal: 8410928192"
                        keyboardType="number-pad"
                        backgroundColor="#F4F4F5"
                        borderWidth={1}
                        borderColor="#E4E4E7"
                        fontFamily="Geist_600SemiBold"
                        fontSize={13}
                      />
                    </YStack>

                    <YStack f={1} gap={4}>
                      <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                        Atas Nama (A/N):
                      </Text>
                      <Input
                        value={formAccountHolder}
                        onChangeText={setFormAccountHolder}
                        placeholder="misal: Siti Rahma"
                        backgroundColor="#F4F4F5"
                        borderWidth={1}
                        borderColor="#E4E4E7"
                        fontFamily="Geist_500Medium"
                        fontSize={13}
                      />
                    </YStack>
                  </XStack>

                  {/* Shift Input */}
                  <YStack gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                      Shift Tugas:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {SHIFTS_LIST.map(s => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => setFormShift(s)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                            backgroundColor: formShift === s ? '#FF5722' : '#F4F4F5',
                          }}
                        >
                          <Text fontFamily="Geist_700Bold" fontSize={11} color={formShift === s ? 'white' : '#52525B'}>
                            {s}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </YStack>

                  {/* Phone Input */}
                  <YStack gap={4}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#71717A">
                      Nomor WhatsApp / HP:
                    </Text>
                    <Input
                      value={formPhone}
                      onChangeText={setFormPhone}
                      placeholder="misal: 081234567890"
                      keyboardType="phone-pad"
                      backgroundColor="#F4F4F5"
                      borderWidth={1}
                      borderColor="#E4E4E7"
                      fontFamily="Geist_500Medium"
                      fontSize={13}
                    />
                  </YStack>

                  {/* CUSTOM MODULE PERMISSION SWITCHES */}
                  <YStack gap={6} backgroundColor="#FAFAFA" p={10} br={12} borderWidth={1} borderColor="#F4F4F5">
                    <Text fontFamily="Geist_700Bold" fontSize={11} color="#18181B">
                      ⚙️ Izin Akses Modul Tambahan (Custom Permission):
                    </Text>

                    <XStack flexWrap="wrap" gap={6}>
                      <TouchableOpacity
                        onPress={() => setFormPermissions(p => ({ ...p, canManageExpenses: !p.canManageExpenses }))}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: formPermissions.canManageExpenses ? '#FF5722' : '#F4F4F5',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Ionicons
                          name={formPermissions.canManageExpenses ? 'checkbox' : 'square-outline'}
                          size={14}
                          color={formPermissions.canManageExpenses ? 'white' : '#52525B'}
                        />
                        <Text fontFamily="Geist_700Bold" fontSize={11} color={formPermissions.canManageExpenses ? 'white' : '#52525B'}>
                          Pengeluaran Resto
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setFormPermissions(p => ({ ...p, canManageProducts: !p.canManageProducts }))}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: formPermissions.canManageProducts ? '#FF5722' : '#F4F4F5',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Ionicons
                          name={formPermissions.canManageProducts ? 'checkbox' : 'square-outline'}
                          size={14}
                          color={formPermissions.canManageProducts ? 'white' : '#52525B'}
                        />
                        <Text fontFamily="Geist_700Bold" fontSize={11} color={formPermissions.canManageProducts ? 'white' : '#52525B'}>
                          Stok & Menu
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setFormPermissions(p => ({ ...p, canVoidTransaction: !p.canVoidTransaction }))}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: formPermissions.canVoidTransaction ? '#FF5722' : '#F4F4F5',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Ionicons
                          name={formPermissions.canVoidTransaction ? 'checkbox' : 'square-outline'}
                          size={14}
                          color={formPermissions.canVoidTransaction ? 'white' : '#52525B'}
                        />
                        <Text fontFamily="Geist_700Bold" fontSize={11} color={formPermissions.canVoidTransaction ? 'white' : '#52525B'}>
                          Void & Diskon
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setFormPermissions(p => ({ ...p, canAccessKDS: !p.canAccessKDS }))}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: formPermissions.canAccessKDS ? '#FF5722' : '#F4F4F5',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Ionicons
                          name={formPermissions.canAccessKDS ? 'checkbox' : 'square-outline'}
                          size={14}
                          color={formPermissions.canAccessKDS ? 'white' : '#52525B'}
                        />
                        <Text fontFamily="Geist_700Bold" fontSize={11} color={formPermissions.canAccessKDS ? 'white' : '#52525B'}>
                          Layar Dapur (KDS)
                        </Text>
                      </TouchableOpacity>
                    </XStack>
                  </YStack>

                </YStack>
              </ScrollView>

              {/* Buttons */}
              <XStack gap={8} jc="flex-end" pt={4}>
                <Button
                  backgroundColor="#F4F4F5"
                  onPress={() => setAddModalVisible(false)}
                >
                  <Text fontFamily="Geist_700Bold" color="#52525B" fontSize={13}>
                    Batal
                  </Text>
                </Button>
                <Button
                  backgroundColor="#FF5722"
                  onPress={handleSaveEmployee}
                >
                  <Text fontFamily="Geist_700Bold" color="white" fontSize={13}>
                    Simpan Staf & Gaji
                  </Text>
                </Button>
              </XStack>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── MODAL 4: SELFIE PRESENSI & GEOFENCING GPS VERIFICATION ── */}
        <Modal
          visible={selfieModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSelfieModalVisible(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
            onPress={() => setSelfieModalVisible(false)}
          >
            <Pressable
              style={{ width: '100%', maxWidth: 380, backgroundColor: 'white', borderRadius: 24, padding: 20, gap: 14, alignItems: 'center' }}
              onPress={e => e.stopPropagation()}
            >
              <XStack jc="space-between" ai="center" w="100%">
                <XStack ai="center" gap={8}>
                  <Ionicons name="camera" size={20} color="#FF5722" />
                  <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                    Selfie Presensi & Geofencing GPS
                  </Text>
                </XStack>
                <TouchableOpacity onPress={() => setSelfieModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#71717A" />
                </TouchableOpacity>
              </XStack>

              {/* GPS Location Verification Box */}
              <XStack backgroundColor="#ECFDF5" p={10} br={12} borderWidth={1} borderColor="#A7F3D0" ai="center" gap={8} w="100%">
                <Ionicons name="location-sharp" size={20} color="#059669" />
                <YStack gap={1} f={1}>
                  <Text fontFamily="Geist_700Bold" fontSize={11} color="#047857">
                    📍 GPS Outlet Resto Terverifikasi
                  </Text>
                  <Text fontFamily="Geist_500Medium" fontSize={10} color="#059669">
                    Jarak: 14 Meter dari Resto Outlet (-6.2088, 106.8456)
                  </Text>
                </YStack>
              </XStack>

              {/* Simulated Camera Viewfinder Frame */}
              <View style={{
                width: '100%',
                height: 220,
                backgroundColor: '#18181B',
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#FF5722',
                overflow: 'hidden',
              }}>
                <View style={{
                  width: 140,
                  height: 170,
                  borderRadius: 70,
                  borderWidth: 2,
                  borderColor: '#FF5722',
                  borderStyle: 'dashed',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Ionicons name="person" size={70} color="#52525B" />
                </View>
                <Text fontFamily="Geist_600SemiBold" fontSize={11} color="white" style={{ position: 'absolute', bottom: 12 }}>
                  Posisikan wajah Anda di dalam bingkai
                </Text>
              </View>

              {/* Selfie Action Button */}
              <Button
                backgroundColor="#FF5722"
                onPress={handleConfirmSelfieClockIn}
                disabled={isCapturingSelfie}
                w="100%"
                br={12}
                height={46}
              >
                <XStack ai="center" gap={8}>
                  <Ionicons name="camera" size={18} color="white" />
                  <Text fontFamily="Geist_800ExtraBold" color="white" fontSize={14}>
                    {isCapturingSelfie ? 'Memproses Foto & GPS...' : '📸 AMBIL FOTO SELFIE & CLOCK-IN'}
                  </Text>
                </XStack>
              </Button>
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
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#FF5722',
  },
});
