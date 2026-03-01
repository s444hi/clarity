import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { supabase } from './src/api/supabase';
import AuthScreen from './src/screens/AuthScreen';
import ScanToSpeechScreen from './src/screens/ScanToSpeechScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Load OpenDyslexic from jsDelivr CDN — OTF, works in Expo Go
  const [fontsLoaded, fontError] = useFonts({
    OpenDyslexic: 'https://cdn.jsdelivr.net/gh/antijingoist/opendyslexic@master/compiled/OpenDyslexic-Regular.otf',
    'OpenDyslexic-Bold': 'https://cdn.jsdelivr.net/gh/antijingoist/opendyslexic@master/compiled/OpenDyslexic-Bold.otf',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );
    return () => subscription.unsubscribe();
  }, []);

  // Wait for both font load and auth check
  // fontError means CDN was unreachable — still render with fallback fonts
  const ready = (fontsLoaded || fontError) && !authLoading;

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF8F3', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#4A5568" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="transparent" translucent={false} />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#FAF8F3' },
          }}
        >
          {session ? (
            <Stack.Screen name="ScanToSpeech" component={ScanToSpeechScreen} />
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
