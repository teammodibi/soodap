import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { TamaguiProvider } from 'tamagui';
import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import tamaguiConfig from '../../tamagui.config';

import {
  useFonts,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
} from '@expo-google-fonts/geist';

SplashScreen.preventAutoHideAsync();

import { getActiveSession, initSession } from '../lib/session';
import { initOfflineDb } from '../lib/offlineDb';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initializeAuth() {
      try {
        await Promise.all([
          initSession(),
          initOfflineDb(),
        ]);
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
      } catch (e) {
        console.warn('Auth initialization error:', e);
      } finally {
        setIsReady(true);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'login';
    const isBypassed = (globalThis as any).isBypassed;
    const localSession = getActiveSession();
    const isAuthenticated = !!session || !!isBypassed || !!localSession;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [session, segments, isReady]);

  return <>{children}</>;
}

import { Slot } from 'expo-router';

import { CustomAlertModal } from '../components/CustomAlertModal';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const [loaded, error] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <ThemeProvider value={DefaultTheme}>
        <AuthGuard>
          <Slot />
          <CustomAlertModal />
        </AuthGuard>
      </ThemeProvider>
    </TamaguiProvider>
  );
}
