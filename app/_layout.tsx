import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/OTPAuthContext';
import CustomSplashScreen from '@/components/CustomSplashScreen';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'auth/login',
};

// Navigation guard component
function NavigationGuard({ children, isBooting }: { children: React.ReactNode, isBooting: boolean }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const isLocationScreen = segments[1] === 'location-permission';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and not on auth screen - redirect to onboarding for first-time use
      // OR direct to login if they've already started the onboarding flow
      console.log('[NavigationGuard] 🔒 Not authenticated, redirecting to onboarding');
      router.replace('/auth/onboarding');
    } else if (isAuthenticated && inAuthGroup && isBooting && !isLocationScreen) {
      // If we are booting (splash screen still active) and authenticated,
      // perform a silent background redirect to the home screen.
      // EXCEPTION: If the user is specifically on the location-permission screen, stay there.
      console.log('[NavigationGuard] 🚀 Boot redirect: Authenticated, moving to home underneath splash');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, isBooting]);

  // Show loading spinner while checking auth state (hidden under splash)
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4D00" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = React.useState(true);

  useEffect(() => {
    // Hide the native splash screen as soon as we can
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {/* Main App Stack - runs in background during splash */}
          <NavigationGuard isBooting={showSplash}>
            <Stack>
              <Stack.Screen name="auth/onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ headerShown: false }} />
              <Stack.Screen name="auth/location-permission" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
          </NavigationGuard>

          {/* Custom Splash Screen Overlay */}
          {showSplash && (
            <CustomSplashScreen onAnimationComplete={() => setShowSplash(false)} />
          )}

          <StatusBar style="auto" />

          {/* reCAPTCHA container for Firebase Phone Auth on web */}
          {Platform.OS === 'web' && (
            <View nativeID="recaptcha-container" style={styles.recaptchaContainer} />
          )}
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  recaptchaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    opacity: 0,
  },
});
