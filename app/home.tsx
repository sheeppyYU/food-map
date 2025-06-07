import HomeMapScreen from '@/src/screens/HomeMapScreen';
import { Stack } from 'expo-router';
import React from 'react';

export default function Home() {
  return <HomeMapScreen />;
}

export function Index() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
    </Stack>
  );
} 