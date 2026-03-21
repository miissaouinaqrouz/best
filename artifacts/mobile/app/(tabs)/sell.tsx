import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function SellScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const headerPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: C.background, paddingTop: headerPad + 20 }]}>
        <View style={styles.authPrompt}>
          <Ionicons name="lock-closed-outline" size={48} color={C.accent} />
          <Text style={[styles.authTitle, { color: C.text, fontFamily: 'Inter_700Bold' }]}>Sign in to sell</Text>
          <Text style={[styles.authSubtitle, { color: C.textSecondary }]}>
            Create an account to start auctioning your items
          </Text>
          <Pressable
            style={[styles.authBtn, { backgroundColor: C.accent }]}
            onPress={() => router.push('/auth')}
          >
            <Text style={[styles.authBtnText, { fontFamily: 'Inter_700Bold' }]}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: headerPad + 20 }]}>
      <Text style={[styles.title, { color: C.text, fontFamily: 'Inter_700Bold' }]}>Sell</Text>
      <Text style={[styles.subtitle, { color: C.textSecondary }]}>
        List your items and start earning
      </Text>

      <View style={styles.content}>
        {/* Hero create card */}
        <Pressable
          style={[styles.createCard, { backgroundColor: C.accent }]}
          onPress={() => router.push('/create-auction')}
        >
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="add" size={36} color="#fff" />
          </View>
          <Text style={styles.createTitle}>Create Auction</Text>
          <Text style={styles.createSubtitle}>
            Set your price, add photos, and let bidders compete
          </Text>
        </Pressable>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: C.surface }]}>
            <Ionicons name="megaphone-outline" size={22} color={C.accent} />
            <Text style={[styles.statValue, { color: C.text, fontFamily: 'Inter_700Bold' }]}>
              {user.totalSales}
            </Text>
            <Text style={[styles.statLabel, { color: C.textTertiary }]}>Total Sales</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.surface }]}>
            <Ionicons name="star-outline" size={22} color={C.warning} />
            <Text style={[styles.statValue, { color: C.text, fontFamily: 'Inter_700Bold' }]}>
              {user.rating.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: C.textTertiary }]}>Rating</Text>
          </View>
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.tipsTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>
            Tips for a successful auction
          </Text>
          {[
            { icon: 'camera-outline' as const, text: 'Use clear, high-quality photos' },
            { icon: 'pricetag-outline' as const, text: 'Set a competitive starting price' },
            { icon: 'time-outline' as const, text: 'Choose optimal auction duration' },
            { icon: 'document-text-outline' as const, text: 'Write a detailed description' },
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name={tip.icon} size={16} color={C.accent} />
              <Text style={[styles.tipText, { color: C.textSecondary }]}>{tip.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.myAuctionsBtn, { borderColor: C.accent }]}
          onPress={() => router.push('/(tabs)/dashboard')}
        >
          <Ionicons name="list-outline" size={18} color={C.accent} />
          <Text style={[styles.myAuctionsBtnText, { color: C.accent, fontFamily: 'Inter_600SemiBold' }]}>
            View My Auctions
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 26, marginBottom: 4 },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', marginBottom: 24 },
  content: { gap: 16 },
  createCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  createSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 26 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  tipsCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  tipsTitle: { fontSize: 15, marginBottom: 4 },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  tipText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  myAuctionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
  },
  myAuctionsBtnText: { fontSize: 15 },
  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  authTitle: { fontSize: 24 },
  authSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 260 },
  authBtn: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  authBtnText: { fontSize: 16, color: '#fff' },
});
