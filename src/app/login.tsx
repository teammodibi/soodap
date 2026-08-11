import { useState } from 'react';
import { router } from 'expo-router';
import { YStack, XStack, Button, Input, Text, Spinner } from 'tamagui';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { setActiveSession } from '../lib/session';
import { showAlert } from '../lib/alertStore';
import {
  signInWithGoogleBackend,
  sendWhatsAppOtpBackend,
  verifyWhatsAppOtpBackend,
} from '../lib/authHelpers';

type LoginScreenMode = 'email' | 'phone' | 'register' | 'forgot_password';

export default function LoginScreen() {
  // Default screen mode is EMAIL so user can start logging in with email right away
  const [screenMode, setScreenMode] = useState<LoginScreenMode>('email');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Email & Password Login Handler
  async function handleEmailLogin() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      showAlert('Perhatian', 'Harap isi Email dan Password Anda.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('email not confirmed')) {
        showAlert(
          'Email Belum Dikonfirmasi 📩',
          `Akun ${cleanEmail} sudah terdaftar tetapi link verifikasi di email belum diklik.\n\nSilakan periksa kotak masuk/spam Gmail Anda dan klik 'Konfirmasi Akun Resto', atau matikan 'Confirm email' di Supabase Dashboard.`
        );
      } else if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
        showAlert(
          'Password atau Email Belum Cocok 🔒',
          `Login untuk "${cleanEmail}" ditolak oleh Supabase.\n\nPenyebab utama:\n1. Email pendaftaran belum di-klik verifikasinya di Gmail.\n2. Password yang diketik ada salah huruf/kapital.\n\n💡 Tip: Cek link di Gmail Anda atau gunakan tombol Lupa Password.`
        );
      } else {
        showAlert('Gagal Masuk', error.message);
      }
    } else {
      (globalThis as any).isBypassed = true;
      setActiveSession({
        userId: data.user.id,
        name: data.user.user_metadata?.full_name || 'Pemilik Resto',
        role: 'Owner / Admin',
        storeName: data.user.user_metadata?.store_name || 'Soodap Resto',
        loginMethod: 'supabase_owner',
        loginTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      });
      router.replace('/setup-store');
    }
  }

  // 2. Google OAuth Login Handler
  async function handleGoogleLogin() {
    setLoading(true);
    const result = await signInWithGoogleBackend();
    setLoading(false);
    if (!result.success) {
      if (result.error && !result.error.includes('dibatalkan')) {
        showAlert('Informasi Login Google 🌐', result.error);
      }
    } else {
      router.replace('/setup-store');
    }
  }

  // 3. Phone / WhatsApp OTP Handler
  async function handlePhoneLogin() {
    if (!phone.trim()) {
      showAlert('Perhatian', 'Harap masukkan Nomor WhatsApp / HP Anda.');
      return;
    }
    setLoading(true);
    const res = await sendWhatsAppOtpBackend(phone);
    setLoading(false);

    if (res.success) {
      setOtpSent(true);
      if (res.isMock) {
        showAlert(
          'Kode OTP WhatsApp Terkirim 📩',
          `Kode verifikasi OTP telah dikirimkan ke nomor ${res.formattedPhone}.\n\n💡 (Gunakan kode OTP testing: 123456)`
        );
      } else {
        showAlert('Kode OTP Terkirim 📩', `Kode verifikasi telah dikirimkan ke nomor ${res.formattedPhone}.`);
      }
    } else {
      showAlert('Gagal Kirim OTP', res.error || 'Terjadi kesalahan saat mengirim OTP.');
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) {
      showAlert('Perhatian', 'Harap masukkan kode OTP 6-digit.');
      return;
    }
    setLoading(true);
    const res = await verifyWhatsAppOtpBackend(phone, otp);
    setLoading(false);

    if (res.success) {
      showAlert('Login Berhasil! 🎉', 'Selamat datang kembali di Soodap POS.');
      router.replace('/setup-store');
    } else {
      showAlert('Kode OTP Salah 🔴', res.error || 'Kode verifikasi OTP tidak cocok.');
    }
  }

  // 4. Register Store Handler
  async function handleRegisterStore() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || !storeName) {
      showAlert('Perhatian', 'Harap lengkapi semua data pendaftaran resto.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: Linking.createURL('/login'),
        data: {
          full_name: fullName,
          store_name: storeName,
          role: 'owner',
        },
      },
    });
    setLoading(false);
    if (error) {
      showAlert('Gagal Mendaftar', error.message);
    } else {
      showAlert(
        'Pendaftaran Berhasil! 📩',
        `Link verifikasi telah dikirimkan ke email ${cleanEmail}.\n\nSilakan cek kotak masuk email Anda dan klik link konfirmasi untuk mengaktifkan akun resto Anda.`
      );
      setScreenMode('email');
    }
  }

  // 5. Forgot Password Handler
  async function handleForgotPassword() {
    if (!email.trim()) {
      showAlert('Perhatian', 'Harap masukkan alamat email resto Anda.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL('/reset-password'),
    });
    setLoading(false);
    if (error) {
      showAlert('Gagal Kirim Reset', error.message);
    } else {
      showAlert(
        'Email Reset Terkirim! 📩',
        `Link untuk me-reset password baru telah dikirimkan ke email:\n${email.trim()}\n\nSilakan buka email Anda dan klik link reset password.`
      );
      setScreenMode('email');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#FAFAFA' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <YStack w="100%" maxWidth={380} ai="center" gap={24}>
          
          {/* Brand Header */}
          <YStack ai="center" gap={6}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={{ width: 220, height: 68, resizeMode: 'contain' }}
            />
            <Text fontFamily="Geist_500Medium" fontSize={13} color="#71717A" ta="center">
              Bisnis Resto Lancar, Senyum Lebar
            </Text>
          </YStack>

          {/* ── MODE 1: EMAIL & PASSWORD LOGIN (DEFAULT FIRST VIEW) ── */}
          {screenMode === 'email' && (
            <YStack w="100%" gap={14}>
              <YStack gap={5}>
                <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Alamat Email:</Text>
                <Input
                  size="$4"
                  br={12}
                  placeholder="nama@resto.com"
                  placeholderTextColor="$gray9"
                  color="#18181B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  backgroundColor="white"
                  borderColor="#E4E4E7"
                  fontFamily="Geist_500Medium"
                />
              </YStack>

              <YStack gap={5}>
                <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Password:</Text>
                <XStack ai="center" style={{ position: 'relative' }}>
                  <Input
                    size="$4"
                    br={12}
                    placeholder="••••••••"
                    placeholderTextColor="$gray9"
                    color="#18181B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    backgroundColor="white"
                    borderColor="#E4E4E7"
                    fontFamily="Geist_500Medium"
                    w="100%"
                    pr={44}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, padding: 6, zIndex: 10 }}
                  >
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#71717A" />
                  </TouchableOpacity>
                </XStack>
                <XStack jc="flex-end" mt={2}>
                  <TouchableOpacity onPress={() => setScreenMode('forgot_password')}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#FF5722">
                      Lupa Password?
                    </Text>
                  </TouchableOpacity>
                </XStack>
              </YStack>

              <Button
                mt={4}
                h={50}
                br={14}
                backgroundColor="#FF5722"
                pressStyle={{ opacity: 0.88 }}
                onPress={handleEmailLogin}
                disabled={loading}
              >
                {loading ? (
                  <Spinner color="white" />
                ) : (
                  <Text fontFamily="Geist_700Bold" color="white" fontSize={14}>
                    Masuk Aplikasi
                  </Text>
                )}
              </Button>

              {/* DIVIDER */}
              <XStack ai="center" gap={10} my={4}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E4E4E7' }} />
                <Text fontFamily="Geist_500Medium" fontSize={11} color="#A1A1AA">atau masuk dengan</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E4E4E7' }} />
              </XStack>

              {/* GOOGLE BUTTON */}
              <Button
                h={48}
                br={14}
                backgroundColor="white"
                borderWidth={1}
                borderColor="#E4E4E7"
                pressStyle={{ backgroundColor: '#F4F4F5' }}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                <XStack ai="center" w="100%" px={16}>
                  <View style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}>
                    {loading ? (
                      <Spinner size="small" color="#18181B" />
                    ) : (
                      <FontAwesome5 name="google" size={17} color="#EA4335" />
                    )}
                  </View>
                  <Text fontFamily="Geist_700Bold" color="#18181B" fontSize={13.5}>
                    Lanjutkan dengan Google
                  </Text>
                </XStack>
              </Button>

              {/* WHATSAPP BUTTON */}
              <Button
                h={48}
                br={14}
                backgroundColor="white"
                borderWidth={1}
                borderColor="#E4E4E7"
                pressStyle={{ backgroundColor: '#F4F4F5' }}
                onPress={() => { setScreenMode('phone'); setOtpSent(false); }}
              >
                <XStack ai="center" w="100%" px={16}>
                  <View style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome5 name="whatsapp" size={19} color="#25D366" />
                  </View>
                  <Text fontFamily="Geist_700Bold" color="#18181B" fontSize={13.5}>
                    Masuk dengan No. WhatsApp
                  </Text>
                </XStack>
              </Button>

              {/* REGISTRATION LINK */}
              <XStack jc="center" pt={8}>
                <TouchableOpacity onPress={() => setScreenMode('register')}>
                  <Text fontFamily="Geist_700Bold" fontSize={13} color="#FF5722">
                    Belum punya akun? Daftar Resto Baru
                  </Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          )}

          {/* ── MODE 2: WHATSAPP / PHONE OTP LOGIN ── */}
          {screenMode === 'phone' && (
            <YStack w="100%" gap={14}>
              <XStack jc="space-between" ai="center">
                <Text fontFamily="Geist_800ExtraBold" fontSize={16} color="#18181B">
                  Masuk dengan No. WhatsApp
                </Text>
                <TouchableOpacity onPress={() => setScreenMode('email')}>
                  <XStack ai="center" gap={4}>
                    <Ionicons name="arrow-back" size={14} color="#71717A" />
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#71717A">Kembali ke Email</Text>
                  </XStack>
                </TouchableOpacity>
              </XStack>

              {!otpSent ? (
                <YStack gap={12}>
                  <YStack gap={5}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Nomor WhatsApp / HP:</Text>
                    <Input
                      size="$4"
                      br={12}
                      placeholder="0812-3456-7890"
                      placeholderTextColor="$gray9"
                      color="#18181B"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      backgroundColor="white"
                      borderColor="#E4E4E7"
                      fontFamily="Geist_500Medium"
                    />
                  </YStack>

                  <Button
                    mt={4}
                    h={48}
                    br={12}
                    backgroundColor="#25D366"
                    pressStyle={{ opacity: 0.88 }}
                    onPress={handlePhoneLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner color="white" />
                    ) : (
                      <XStack ai="center" gap={8}>
                        <FontAwesome5 name="whatsapp" size={18} color="white" />
                        <Text fontFamily="Geist_700Bold" color="white" fontSize={14}>
                          Kirim Kode OTP WhatsApp
                        </Text>
                      </XStack>
                    )}
                  </Button>
                </YStack>
              ) : (
                <YStack gap={12}>
                  <YStack gap={5}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Masukkan 6-Digit Kode OTP:</Text>
                    <Input
                      size="$4"
                      br={12}
                      placeholder="123456"
                      placeholderTextColor="$gray9"
                      color="#18181B"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      backgroundColor="white"
                      borderColor="#E4E4E7"
                      fontFamily="Geist_700Bold"
                      fontSize={18}
                      letterSpacing={4}
                      textAlign="center"
                    />
                  </YStack>

                  <Button
                    h={48}
                    br={12}
                    backgroundColor="#FF5722"
                    pressStyle={{ opacity: 0.88 }}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner color="white" />
                    ) : (
                      <Text fontFamily="Geist_700Bold" color="white" fontSize={14}>
                        Verifikasi & Masuk
                      </Text>
                    )}
                  </Button>

                  <TouchableOpacity onPress={() => setOtpSent(false)} style={{ alignItems: 'center' }}>
                    <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#71717A">
                      Ganti Nomor HP
                    </Text>
                  </TouchableOpacity>
                </YStack>
              )}
            </YStack>
          )}

          {/* ── MODE 3: REGISTRATION ── */}
          {screenMode === 'register' && (
            <YStack w="100%" gap={12}>
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B" mb={4} ta="center">
                Daftar Outlet Resto Baru
              </Text>

              <YStack gap={4}>
                <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">Nama Resto / Outlet:</Text>
                <Input
                  placeholder="misal: Kedai Kopi Soodap"
                  placeholderTextColor="$gray9"
                  color="#18181B"
                  value={storeName}
                  onChangeText={setStoreName}
                  backgroundColor="white"
                  borderColor="#E4E4E7"
                  fontFamily="Geist_500Medium"
                  fontSize={13}
                  h={46}
                  br={12}
                />
              </YStack>

              <YStack gap={4}>
                <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">Nama Pemilik / Pengelola:</Text>
                <Input
                  placeholder="misal: Budi Santoso"
                  placeholderTextColor="$gray9"
                  color="#18181B"
                  value={fullName}
                  onChangeText={setFullName}
                  backgroundColor="white"
                  borderColor="#E4E4E7"
                  fontFamily="Geist_500Medium"
                  fontSize={13}
                  h={46}
                  br={12}
                />
              </YStack>

              <YStack gap={4}>
                <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">Email:</Text>
                <Input
                  placeholder="misal: pemilikresto@gmail.com"
                  placeholderTextColor="$gray9"
                  color="#18181B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  backgroundColor="white"
                  borderColor="#E4E4E7"
                  fontFamily="Geist_500Medium"
                  fontSize={13}
                  h={46}
                  br={12}
                />
              </YStack>

              <YStack gap={4}>
                <Text fontFamily="Geist_600SemiBold" fontSize={11} color="#3F3F46">Password:</Text>
                <XStack ai="center" style={{ position: 'relative' }}>
                  <Input
                    placeholder="••••••••"
                    placeholderTextColor="$gray9"
                    color="#18181B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showRegPassword}
                    backgroundColor="white"
                    borderColor="#E4E4E7"
                    fontFamily="Geist_500Medium"
                    fontSize={13}
                    h={46}
                    br={12}
                    w="100%"
                    pr={44}
                  />
                  <TouchableOpacity
                    onPress={() => setShowRegPassword(!showRegPassword)}
                    style={{ position: 'absolute', right: 12, padding: 6, zIndex: 10 }}
                  >
                    <Ionicons name={showRegPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#71717A" />
                  </TouchableOpacity>
                </XStack>
              </YStack>

              <Button
                mt={6}
                h={50}
                backgroundColor="#FF5722"
                onPress={handleRegisterStore}
                disabled={loading}
                br={14}
                pressStyle={{ opacity: 0.88 }}
              >
                {loading ? (
                  <Spinner color="white" />
                ) : (
                  <Text fontFamily="Geist_700Bold" color="white" fontSize={14}>
                    Daftar Sekarang
                  </Text>
                )}
              </Button>

              {/* LINK KEMBALI / LOGIN */}
              <XStack jc="center" pt={6}>
                <TouchableOpacity onPress={() => setScreenMode('email')}>
                  <Text fontFamily="Geist_600SemiBold" fontSize={13} color="#71717A">
                    Sudah punya akun resto? <Text color="#FF5722" fontFamily="Geist_700Bold">Masuk di sini</Text>
                  </Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          )}

          {/* ── MODE 4: FORGOT PASSWORD ── */}
          {screenMode === 'forgot_password' && (
            <YStack w="100%" gap={16} ai="center">
              {/* Lock Badge Icon */}
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="key-outline" size={28} color="#FF5722" />
              </View>

              {/* Title & Subtitle */}
              <YStack gap={6} ai="center">
                <Text fontFamily="Geist_800ExtraBold" fontSize={20} color="#18181B" ta="center">
                  Lupa Password Resto
                </Text>
                <Text fontFamily="Geist_500Medium" fontSize={13} color="#71717A" ta="center" style={{ lineHeight: 20, maxWidth: 320 }}>
                  Masukkan alamat email yang terdaftar pada akun resto Anda. Kami akan mengirimkan instruksi & link resmi reset password.
                </Text>
              </YStack>

              {/* Input Email */}
              <YStack w="100%" gap={6} mt={4}>
                <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Email Terdaftar:</Text>
                <Input
                  size="$4"
                  br={12}
                  placeholder="misal: pemilikresto@gmail.com"
                  placeholderTextColor="$gray9"
                  color="#18181B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  backgroundColor="white"
                  borderColor="#E4E4E7"
                  fontFamily="Geist_500Medium"
                  fontSize={14}
                  h={48}
                  px={14}
                />
              </YStack>

              {/* Action Button */}
              <Button
                w="100%"
                mt={4}
                h={50}
                br={14}
                backgroundColor="#FF5722"
                pressStyle={{ opacity: 0.88 }}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                {loading ? (
                  <Spinner color="white" />
                ) : (
                  <XStack ai="center" gap={8}>
                    <Ionicons name="mail-unread-outline" size={18} color="white" />
                    <Text fontFamily="Geist_700Bold" color="white" fontSize={14}>
                      Kirim Link Reset Password
                    </Text>
                  </XStack>
                )}
              </Button>

              {/* Clean Back Link */}
              <XStack jc="center" pt={10}>
                <TouchableOpacity onPress={() => setScreenMode('email')}>
                  <Text fontFamily="Geist_500Medium" fontSize={13} color="#71717A">
                    Sudah ingat password? <Text color="#FF5722" fontFamily="Geist_700Bold">Kembali ke Login</Text>
                  </Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          )}

        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
