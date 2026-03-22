import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, useColorScheme,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { register, login } from '@workspace/api-client-react';

export default function AuthScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { login: authLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (mode === 'register' && !name) { setError('Please enter your name'); return; }
    setIsLoading(true);
    try {
      let result;
      if (mode === 'login') {
        result = await login({ email, password });
      } else {
        result = await register({ name, email, password });
      }
      await authLogin(result.token, result.user as any);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      const msg = err?.message || (mode === 'login' ? 'Invalid credentials' : 'Registration failed');
      setError(msg);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Close */}
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={C.text} />
          </Pressable>

          {/* Logo / Brand */}
          <Animated.View entering={FadeInDown.springify()} style={styles.brand}>
            <View style={[styles.brandIcon, { backgroundColor: C.accent }]}>
              <Ionicons name="flame" size={28} color="#fff" />
            </View>
            <Text style={[styles.brandName, { color: C.text, fontFamily: 'Inter_700Bold' }]}>BidRush</Text>
            <Text style={[styles.brandTagline, { color: C.textSecondary }]}>
              {mode === 'login' ? 'Welcome back! Sign in to continue' : 'Create your account and start bidding'}
            </Text>
          </Animated.View>

          {/* Tab Toggle */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={[styles.toggle, { backgroundColor: C.surfaceSecondary }]}
          >
            {(['login', 'register'] as const).map(m => (
              <Pressable
                key={m}
                onPress={() => { setMode(m); setError(''); }}
                style={[styles.toggleBtn, mode === m && { backgroundColor: C.cardBg }]}
              >
                <Text style={[
                  styles.toggleBtnText,
                  { color: mode === m ? C.text : C.textTertiary },
                  mode === m && { fontFamily: 'Inter_600SemiBold' },
                ]}>
                  {m === 'login' ? 'Sign In' : 'Register'}
                </Text>
              </Pressable>
            ))}
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.form}>
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: C.textSecondary }]}>Full Name</Text>
                <View style={[styles.inputContainer, { backgroundColor: C.inputBg, borderColor: C.border }]}>
                  <Ionicons name="person-outline" size={18} color={C.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: C.text, fontFamily: 'Inter_400Regular' }]}
                    placeholder="John Doe"
                    placeholderTextColor={C.textTertiary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.textSecondary }]}>Email</Text>
              <View style={[styles.inputContainer, { backgroundColor: C.inputBg, borderColor: C.border }]}>
                <Ionicons name="mail-outline" size={18} color={C.textTertiary} />
                <TextInput
                  style={[styles.input, { color: C.text, fontFamily: 'Inter_400Regular' }]}
                  placeholder="you@example.com"
                  placeholderTextColor={C.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.textSecondary }]}>Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: C.inputBg, borderColor: C.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={C.textTertiary} />
                <TextInput
                  style={[styles.input, { color: C.text, fontFamily: 'Inter_400Regular' }]}
                  placeholder={mode === 'login' ? '••••••••' : 'At least 6 characters'}
                  placeholderTextColor={C.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textTertiary} />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: C.dangerSoft }]}>
                <Ionicons name="alert-circle-outline" size={16} color={C.danger} />
                <Text style={[styles.errorText, { color: C.danger }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.submitBtn, { backgroundColor: C.accent, opacity: isLoading ? 0.8 : 1 }]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.submitBtnText, { fontFamily: 'Inter_700Bold' }]}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Demo note */}
          <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.demoNote}>
            <Ionicons name="information-circle-outline" size={14} color={C.textTertiary} />
            <Text style={[styles.demoText, { color: C.textTertiary }]}>
              Try demo: demo@bidrush.com / password123
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, gap: 20 },
  closeBtn: { alignSelf: 'flex-end', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  brand: { alignItems: 'center', gap: 10, paddingVertical: 10 },
  brandIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 28 },
  brandTagline: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  toggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
  },
  input: { flex: 1, fontSize: 15, height: '100%' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12 },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  submitBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitBtnText: { fontSize: 16, color: '#fff' },
  demoNote: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  demoText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
