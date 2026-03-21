import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, useColorScheme, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { adminListUsers, adminListAuctions } from '@workspace/api-client-react';

type AdminTab = 'users' | 'auctions';

export default function AdminScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const headerPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminListUsers,
    enabled: !!user?.isAdmin,
  });

  const { data: auctionsData } = useQuery({
    queryKey: ['admin-auctions'],
    queryFn: adminListAuctions,
    enabled: !!user?.isAdmin,
  });

  if (!user?.isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: C.background, paddingTop: headerPad + 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </Pressable>
        <View style={styles.centered}>
          <Ionicons name="shield-outline" size={48} color={C.textTertiary} />
          <Text style={[styles.accessTitle, { color: C.textTertiary }]}>Admin Access Only</Text>
        </View>
      </View>
    );
  }

  const users = usersData?.users ?? [];
  const auctions = auctionsData?.auctions ?? [];

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: headerPad + 12 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </Pressable>
        <Text style={[styles.title, { color: C.text, fontFamily: 'Inter_700Bold' }]}>Admin Panel</Text>
        <View style={[styles.adminBadge, { backgroundColor: C.accentSoft }]}>
          <Ionicons name="shield-checkmark" size={14} color={C.accent} />
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={[styles.statItem, { backgroundColor: C.surface }]}>
          <Text style={[styles.statNumber, { color: C.accent, fontFamily: 'Inter_700Bold' }]}>{users.length}</Text>
          <Text style={[styles.statLabel, { color: C.textTertiary }]}>Users</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: C.surface }]}>
          <Text style={[styles.statNumber, { color: C.success, fontFamily: 'Inter_700Bold' }]}>
            {auctions.filter(a => a.status === 'live').length}
          </Text>
          <Text style={[styles.statLabel, { color: C.textTertiary }]}>Live</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: C.surface }]}>
          <Text style={[styles.statNumber, { color: C.text, fontFamily: 'Inter_700Bold' }]}>{auctions.length}</Text>
          <Text style={[styles.statLabel, { color: C.textTertiary }]}>Total Auctions</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: C.surfaceSecondary, marginHorizontal: 16 }]}>
        {[{ key: 'users' as const, label: 'Users', icon: 'people-outline' as const },
          { key: 'auctions' as const, label: 'Auctions', icon: 'megaphone-outline' as const }].map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabBtn, activeTab === tab.key && { backgroundColor: C.cardBg }]}
          >
            <Ionicons name={tab.icon} size={15} color={activeTab === tab.key ? C.accent : C.textTertiary} />
            <Text style={[styles.tabBtnText, { color: activeTab === tab.key ? C.accent : C.textTertiary }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={activeTab === 'users' ? users : auctions as any[]}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 30)}>
            {activeTab === 'users' ? (
              <View style={[styles.userRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={[styles.userAvatar, { backgroundColor: C.accentSoft }]}>
                  <Text style={[styles.userAvatarText, { color: C.accent, fontFamily: 'Inter_700Bold' }]}>
                    {item.name?.[0]?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>
                    {item.name}
                    {item.isAdmin && <Text style={[{ color: C.accent }]}> · Admin</Text>}
                  </Text>
                  <Text style={[styles.userEmail, { color: C.textTertiary }]}>{item.email}</Text>
                </View>
                <View style={styles.userStats}>
                  <Text style={[styles.userRating, { color: C.warning, fontFamily: 'Inter_600SemiBold' }]}>
                    {item.rating?.toFixed(1)}
                  </Text>
                  <Ionicons name="star" size={11} color={C.warning} />
                </View>
              </View>
            ) : (
              <Pressable
                style={[styles.auctionRow, { backgroundColor: C.surface, borderColor: C.border }]}
                onPress={() => router.push({ pathname: '/auction/[id]', params: { id: item.id } })}
              >
                <View style={styles.auctionInfo}>
                  <Text style={[styles.auctionTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.auctionMeta, { color: C.textTertiary }]}>
                    {item.category} · {item.bidCount} bids
                  </Text>
                </View>
                <View style={styles.auctionRight}>
                  <Text style={[styles.auctionPrice, { color: C.accent, fontFamily: 'Inter_700Bold' }]}>
                    ${item.currentPrice?.toFixed(0)}
                  </Text>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: item.status === 'live' ? '#00C896' : item.status === 'scheduled' ? '#FFB400' : '#6B7280' },
                  ]} />
                </View>
              </Pressable>
            )}
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  accessTitle: { fontSize: 18, fontFamily: 'Inter_500Medium' },
  backBtn: { padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  title: { fontSize: 20 },
  adminBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statsBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  statItem: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 22 },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  tabBar: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4, marginBottom: 12 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 9 },
  tabBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  listContent: { paddingHorizontal: 16, paddingBottom: 60, gap: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, borderWidth: 1, gap: 12 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 16 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14 },
  userEmail: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  userStats: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  userRating: { fontSize: 13 },
  auctionRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, borderWidth: 1, gap: 12, justifyContent: 'space-between' },
  auctionInfo: { flex: 1, gap: 3 },
  auctionTitle: { fontSize: 14 },
  auctionMeta: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  auctionRight: { alignItems: 'flex-end', gap: 4 },
  auctionPrice: { fontSize: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});
