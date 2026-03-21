import React from 'react';
import {
  View, Text, StyleSheet, Pressable, useColorScheme, ScrollView, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

function Avatar({ name, avatar, size = 72, C }: any) {
  const initial = name?.[0]?.toUpperCase() ?? '?';
  if (avatar) {
    return (
      <Image
        source={{ uri: avatar }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2, backgroundColor: C.accent }]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.38, color: '#fff', fontFamily: 'Inter_700Bold' }]}>{initial}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const headerPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: C.background, paddingTop: headerPad + 20 }]}>
        <View style={styles.authPrompt}>
          <Ionicons name="person-circle-outline" size={64} color={C.accent} />
          <Text style={[styles.authTitle, { color: C.text, fontFamily: 'Inter_700Bold' }]}>Your Profile</Text>
          <Text style={[styles.authSubtitle, { color: C.textSecondary }]}>
            Sign in to manage your account and activity
          </Text>
          <Pressable
            style={[styles.authBtn, { backgroundColor: C.accent }]}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.authBtnText}>Sign In / Register</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const menuItems = [
    { icon: 'megaphone-outline' as const, label: 'My Auctions', onPress: () => router.push('/(tabs)/dashboard') },
    { icon: 'arrow-up-circle-outline' as const, label: 'My Bids', onPress: () => router.push('/(tabs)/dashboard') },
    { icon: 'trophy-outline' as const, label: 'Won Items', onPress: () => router.push('/(tabs)/dashboard') },
    { icon: 'notifications-outline' as const, label: 'Notifications', onPress: () => router.push('/notifications') },
    ...(user.isAdmin ? [{ icon: 'shield-checkmark-outline' as const, label: 'Admin Panel', onPress: () => router.push('/admin') }] : []),
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.background }]}
      contentContainerStyle={[styles.scrollContent, { paddingTop: headerPad + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: C.surface }]}>
        <Avatar name={user.name} avatar={user.avatar} size={72} C={C} />
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: C.text, fontFamily: 'Inter_700Bold' }]}>{user.name}</Text>
          <Text style={[styles.profileEmail, { color: C.textSecondary }]}>{user.email}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={C.warning} />
            <Text style={[styles.ratingText, { color: C.warning, fontFamily: 'Inter_600SemiBold' }]}>
              {user.rating.toFixed(1)}
            </Text>
            <Text style={[styles.memberSince, { color: C.textTertiary }]}>
              · Member since {new Date(user.createdAt).getFullYear()}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Auctions Created', value: user.totalSales, icon: 'megaphone-outline' as const, color: C.accent },
          { label: 'Items Won', value: user.totalPurchases, icon: 'trophy-outline' as const, color: C.warning },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: C.surface }]}>
            <Ionicons name={s.icon} size={20} color={s.color} />
            <Text style={[styles.statValue, { color: C.text, fontFamily: 'Inter_700Bold' }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: C.textTertiary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={[styles.menuCard, { backgroundColor: C.surface }]}>
        {menuItems.map((item, i) => (
          <Pressable
            key={item.label}
            style={[
              styles.menuItem,
              i < menuItems.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: C.border },
            ]}
            onPress={item.onPress}
          >
            <View style={[styles.menuIconBg, { backgroundColor: C.accentSoft }]}>
              <Ionicons name={item.icon} size={18} color={C.accent} />
            </View>
            <Text style={[styles.menuLabel, { color: C.text, fontFamily: 'Inter_500Medium' }]}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
          </Pressable>
        ))}
      </View>

      {/* Logout */}
      <Pressable
        style={[styles.logoutBtn, { backgroundColor: C.dangerSoft, borderColor: C.danger }]}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={18} color={C.danger} />
        <Text style={[styles.logoutText, { color: C.danger, fontFamily: 'Inter_600SemiBold' }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 14 },
  profileCard: {
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: {},
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 20 },
  profileEmail: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 13 },
  memberSince: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconBg: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  logoutText: { fontSize: 15 },
  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  authTitle: { fontSize: 24 },
  authSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 260 },
  authBtn: { paddingHorizontal: 36, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  authBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
});
