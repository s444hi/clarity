javascriptimport React, { useState, useRef, useEffect } from 'react';
import {
  Alert, StyleSheet, View, Text, TextInput, Image,
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../api/supabase';
import { Theme } from '../constants/Theme';

export default function AuthScreen() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // slides up on mount
  const entranceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(entranceAnim, { toValue: 1, tension: 60, friction: 11, useNativeDriver: true }).start();
  }, []);

  async function handleSignIn() {
    // validate before hitting the api
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) Alert.alert('Sign In Failed', error.message);
    setLoading(false);
  }

  async function handleSignUp() {
    // validate before hitting the api
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your name.');
      return;
    }
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // store name in supabase user metadata
        data: { full_name: name.trim() },
      },
    });
    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else if (data.session) {
      // auto-logged in (email confirmation disabled in Supabase)
    } else {
      Alert.alert('Check your inbox', 'A confirmation link has been sent to ' + email.trim());
    }
    setLoading(false);
  }

  // resets all fields when switching between sign in and sign up
  function switchMode(next) {
    setMode(next);
    setName('');
    setEmail('');
    setPassword('');
  }

  const isSignIn = mode === 'signin';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{
            opacity: entranceAnim,
            transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) }],
          }}
        >
          {/* logo */}
          <View style={styles.logoArea}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Read clearly. Think freely.</Text>
          </View>

          {/* toggle between sign in and sign up */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segment, isSignIn && styles.segmentActive]}
              onPress={() => switchMode('signin')}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentText, isSignIn && styles.segmentTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, !isSignIn && styles.segmentActive]}
              onPress={() => switchMode('signup')}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentText, !isSignIn && styles.segmentTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* form */}
          <View style={styles.card}>
            {/* name field — sign up only */}
            {!isSignIn && (
              <>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your full name"
                  placeholderTextColor={Theme.colors.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
                <View style={styles.divider} />
              </>
            )}

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Theme.colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <View style={styles.divider} />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Theme.colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={isSignIn ? handleSignIn : handleSignUp}
            />
          </View>

          {/* submit — label changes based on current mode */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={isSignIn ? handleSignIn : handleSignUp}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Please wait…' : isSignIn ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* link to switch modes */}
          <TouchableOpacity onPress={() => switchMode(isSignIn ? 'signup' : 'signin')} style={styles.toggleRow} activeOpacity={0.6}>
            <Text style={styles.toggleText}>
              {isSignIn ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.toggleLink}>{isSignIn ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1, paddingHorizontal: 24,
    paddingTop: 40, paddingBottom: 40, alignItems: 'center',
  },

  // logo
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoImage: { width: 190, height: 190, marginBottom: 8 },
  tagline: { fontSize: 15, color: Theme.colors.textSecondary, marginTop: 4 },

  // segmented control
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.secondary,
    borderRadius: Theme.radius.pill,
    padding: 4, width: '100%', marginBottom: 24,
  },
  segment: { flex: 1, paddingVertical: 10, borderRadius: Theme.radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: Theme.colors.white, ...Theme.shadow.card },
  segmentText: { fontSize: 15, fontWeight: '500', color: Theme.colors.textSecondary },
  segmentTextActive: { color: Theme.colors.primary, fontWeight: '700' },

  // form
  card: {
    width: '100%',
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.lg,
    padding: 20,
    borderWidth: 1, borderColor: Theme.colors.border,
    marginBottom: 20, ...Theme.shadow.card,
  },
  inputLabel: {
    fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8,
  },
  input: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 16, color: Theme.colors.text,
    borderWidth: 1, borderColor: Theme.colors.borderLight,
  },
  divider: { height: 16 },

  // main submit button
  primaryButton: {
    width: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.pill,
    paddingVertical: 17,
    alignItems: 'center', marginBottom: 16,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 7,
  },
  buttonDisabled: { opacity: 0.55 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },

  // toggle
  toggleRow: { paddingVertical: 8 },
  toggleText: { fontSize: 15, color: Theme.colors.textSecondary, textAlign: 'center' },
  toggleLink: { color: Theme.colors.accentText, fontWeight: '600' },
});