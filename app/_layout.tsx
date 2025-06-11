import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-get-random-values';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../src/hooks/useTheme';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { palette } = useTheme();
  const paperTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: palette.primary,
    },
  };
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <PaperProvider theme={paperTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="home" options={{ title: '食物地圖' }} />
            <Stack.Screen 
              name="share-extension" 
              options={{ 
                title: '新增 Pin',
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }} 
            />
          </Stack>
          <StatusBar style="auto" />
        </PaperProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
