import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, useColorScheme, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { customFetch } from '@workspace/api-client-react';

export default function PaymentScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { auctionId } = useLocalSearchParams<{ auctionId: string }>();
  const { token } = useAuth();
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['payment-status', auctionId],
    queryFn: async () => {
      const res = await customFetch(`/api/payments/status/${auctionId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load payment info');
      return res.json();
    },
    enabled: !!auctionId && !!token,
  });

  async function handlePay() {
    setPaying(true);
    try {
      const res = await customFetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ auctionId }),
      });
      const result = await res.json();
      if (!res.ok) {
        Alert.alert('Payment Error', result.error || 'Something went wrong');
        return;
      }
      setPaid(true);
      Alert.alert('Payment Initiated', `Payment of $${data?.finalPrice?.toFixed(2)} is being processed. You will receive a confirmation shortly.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setPaying(false);
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text }]}>Complete Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {paid ? (
          <View style={[styles.successCard, { backgroundColor: C.surface }]}>
            <Ionicons name="checkmark-circle" size={72} color="#22c55e" />
            <Text style={[styles.successTitle, { color: C.text }]}>Payment Initiated!</Text>
            <Text style={[styles.successSub, { color: C.textSecondary }]}>
              Your payment is being processed. You'll receive a confirmation soon.
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: C.surface }]}>
              <Ionicons name="trophy" size={48} color="#f59e0b" style={styles.winIcon} />
              <Text style={[styles.winTitle, { color: C.text }]}>Congratulations! You won!</Text>
              <Text style={[styles.auctionTitle, { color: C.textSecondary }]}>{data?.title}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: C.surface }]}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Final Price</Text>
              <Text style={[styles.price, { color: C.primary }]}>${data?.finalPrice?.toFixed(2)}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: C.surface }]}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Payment Method</Text>
              <View style={[styles.payOption, { borderColor: C.primary, borderWidth: 2 }]}>
                <Ionicons name="card" size={24} color={C.primary} />
                <Text style={[styles.payOptionText, { color: C.text }]}>Credit / Debit Card (Stripe)</Text>
                <Ionicons name="checkmark-circle" size={20} color={C.primary} />
              </View>
            </View>

            <Pressable
              style={[styles.payBtn, { backgroundColor: C.primary }, paying && styles.payBtnDisabled]}
              onPress={handlePay}
              disabled={paying}
            >
              {paying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={20} color="#fff" />
                  <Text style={styles.payBtnText}>Pay ${data?.finalPrice?.toFixed(2)} Securely</Text>
                </>
              )}
            </Pressable>

            <Text style={[styles.secureNote, { color: C.textTertiary }]}>
              🔒 Secured by Stripe. Your payment information is encrypted.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  content: { padding: 16, gap: 16 },
  card: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 8 },
  winIcon: { marginBottom: 8 },
  winTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  auctionTitle: { fontSize: 15, textAlign: 'center' },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  price: { fontSize: 36, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', alignSelf: 'flex-start', marginBottom: 8 },
  payOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, alignSelf: 'stretch' },
  payOptionText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  payBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
  secureNote: { textAlign: 'center', fontSize: 12 },
  successCard: { borderRadius: 16, padding: 32, alignItems: 'center', gap: 12 },
  successTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  successSub: { fontSize: 15, textAlign: 'center' },
});
