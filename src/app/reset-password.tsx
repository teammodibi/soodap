import { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Button, Input, Text, Spinner } from 'tamagui';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { showAlert } from '../lib/alertStore';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResetPassword() {
    if (!newPassword || !confirmPassword) {
      showAlert('Perhatian', 'Harap isi kedua kolom password baru Anda.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Perhatian', 'Konfirmasi password tidak cocok dengan password baru.');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Perhatian', 'Password minimal terdiri dari 6 karakter.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      showAlert('Gagal Ubah Password 🔴', error.message);
    } else {
      showAlert(
        'Password Berhasil Diperbarui! 🎉',
        'Password baru Anda telah disimpan. Silakan masuk kembali dengan password baru Anda.',
        [
          {
            text: 'Masuk Aplikasi',
            onPress: () => router.replace('/login'),
          },
        ]
      );
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
              source={{ uri: 'https://lh3.googleusercontent.com/d/1_tkN7OIkzVSikvXLu363-hklyvDIpgDF' }}
              style={{ width: 140, height: 50, resizeMode: 'contain' }}
            />
            <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#71717A">
              Bisnis Resto Lancar, Senyum Lebar
            </Text>
          </YStack>

          {/* Form Box */}
          <YStack w="100%" gap={16} backgroundColor="white" p={20} br={16} borderWidth={1} borderColor="#E4E4E7">
            <YStack ai="center" gap={4}>
              <Text fontFamily="Geist_800ExtraBold" fontSize={18} color="#18181B" ta="center">
                Atur Ulang Password Baru
              </Text>
              <Text fontFamily="Geist_500Medium" fontSize={12} color="#71717A" ta="center">
                Silakan buat kata sandi baru untuk akun resto Anda.
              </Text>
            </YStack>

            <YStack gap={4}>
              <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Password Baru:</Text>
              <XStack ai="center" style={{ position: 'relative' }}>
                <Input
                  size="$4"
                  br={12}
                  placeholder="••••••••"
                  placeholderTextColor="$gray9"
                  color="#18181B"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPass}
                  backgroundColor="white"
                  borderColor="#E4E4E7"
                  fontFamily="Geist_500Medium"
                  fontSize={13}
                  h={46}
                  w="100%"
                  pr={44}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPass(!showNewPass)}
                  style={{ position: 'absolute', right: 12, padding: 6, zIndex: 10 }}
                >
                  <Ionicons name={showNewPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#71717A" />
                </TouchableOpacity>
              </XStack>
            </YStack>

            <YStack gap={4}>
              <Text fontFamily="Geist_600SemiBold" fontSize={12} color="#3F3F46">Konfirmasi Password Baru:</Text>
              <XStack ai="center" style={{ position: 'relative' }}>
                <Input
                  size="$4"
                  br={12}
                  placeholder="••••••••"
                  placeholderTextColor="$gray9"
                  color="#18181B"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPass}
                  backgroundColor="white"
                  borderColor="#E4E4E7"
                  fontFamily="Geist_500Medium"
                  fontSize={13}
                  h={46}
                  w="100%"
                  pr={44}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPass(!showConfirmPass)}
                  style={{ position: 'absolute', right: 12, padding: 6, zIndex: 10 }}
                >
                  <Ionicons name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#71717A" />
                </TouchableOpacity>
              </XStack>
            </YStack>

            <Button
              mt={6}
              h={50}
              br={14}
              backgroundColor="#FF5722"
              pressStyle={{ opacity: 0.88 }}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <Spinner color="white" />
              ) : (
                <XStack ai="center" gap={8}>
                  <Ionicons name="key-outline" size={18} color="white" />
                  <Text fontFamily="Geist_700Bold" color="white" fontSize={14}>
                    Simpan Password Baru
                  </Text>
                </XStack>
              )}
            </Button>
          </YStack>

        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
