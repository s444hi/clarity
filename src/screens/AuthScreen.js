javascriptimport React, { useState, useRef, useEffect } from 'react';
import {
  Alert, StyleSheet, View, Text, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../api/supabase';
import { Theme } from '../constants/Theme';

export default function AuthScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);

  // slides up
  const entranceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(entranceAnim, { toValue: 1, tension: 60, friction: 11, useNativeDriver: true }).start();
  }, []);

  async function handleSignUp() {
    // make sure it's validated before the api
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
        // store name and number in supabase
        data: { full_name: name.trim(), phone: phone.trim() },
      },
    });

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else if (data.session) {
    } else {
      Alert.alert('Check your inbox', 'A confirmation link has been sent to ' + email.trim());
    }
    setLoading(false);
  }

  //placeholder for now
  function handleGoogleSignUp() {
    Alert.alert('Coming Soon', 'Google sign up is not configured yet.');
  }

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
          {/* page heading */}
          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.subheading}>Get started with Clarity today</Text>

          {/* google sign up */}
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignUp} activeOpacity={0.8}>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* divider */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          {/* sign up */}
          <View style={styles.card}>
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
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            <View style={styles.divider} />

            {/* phone num but it's not verified */}
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              ref={phoneRef}
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={Theme.colors.textSecondary}
              keyboardType="phone-pad"
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
              onSubmitEditing={handleSignUp}
            />
          </View>

          {/* submit */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Please wait…' : 'Create Account'}
            </Text>
          </TouchableOpacity>

        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  container: {
    flexGrow: 1, paddingHorizontal: 24,
    paddingTop: 48, paddingBottom: 40, alignItems: 'center',
  },

  heading: { fontSize: 28, fontWeight: '700', color: Theme.colors.text, marginBottom: 6, alignSelf: 'flex-start' },
  subheading: { fontSize: 15, color: Theme.colors.textSecondary, marginBottom: 32, alignSelf: 'flex-start' },

  // google oauth
  googleButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    marginBottom: 24,
    ...Theme.shadow.card,
  },
  googleButtonText: { fontSize: 16, fontWeight: '600', color: Theme.colors.text },

  orRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24 },
  orLine: { flex: 1, height: 1, backgroundColor: Theme.colors.border },
  orText: { marginHorizontal: 12, fontSize: 13, color: Theme.colors.textSecondary },

  // form
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
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

  // main submit
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
});