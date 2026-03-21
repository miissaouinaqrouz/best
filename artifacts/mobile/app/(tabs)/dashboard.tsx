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
import AuctionCard from '@/components/AuctionCard';
import { useAuth } from '@/contexts/AuthContext';
import { getMyAuctions, getMyBids, getMyWonAuctions } from '@workspace/api-client-react';

type Tab = 'auctions' | 'bids' | 'won';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'auctions', label: 'My Auctions', icon: 'megaphone-outline' },
  { key: 'bids', label: 'My Bids', icon: 'arrow-up-circle-outline' },
  { key: 'won', label: 'Won', icon: 'trophy-outline' },
];

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('auctions');
  const headerPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  const { data: myAuctions, isLoading: loadingAuctions } = useQuery({
    queryKey: ['my-auctions'],
    queryFn: getMyAuctions,
    enabled: !!user,
  });

  const { data: myBids, isLoading: loadingBids } = useQuery({
    queryKey: ['my-bids'],
    queryFn: getMyBids,
    enabled: !!user,
  });

  const { data: wonAuctions, isLoading: loadingWon } = useQuery({
    queryKey: ['won-auctions'],
    queryFn: getMyWonAuctions,
    enabled: !!user,
  });

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: C.background, paddingTop: headerPad + 20 }]}>
        <View style={styles.authPrompt}>
          <Ionicons name="bar-chart-outline" size={48} color={C.accent} />
          <Text style={[styles.authTitle, { color: C.text, fontFamily: 'Inter_700Bold' }]}>Your Dashboard</Text>
          <Text style={[styles.authSubtitle, { color: C.textSecondary }]}>
            Sign in to track your bids, auctions, and wins
          </Text>
          <Pressable
            style={[styles.authBtn, { backgroundColor: C.accent }]}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.authBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const auctionData = myAuctions?.auctions ?? [];
  const bidData = myBids?.bids ?? [];
  const wonData = wonAuctions?.auctions ?? [];

  const stats = [
    { label: 'Active', value: auctionData.filter(a => a.status === 'live').length, icon: 'flame-outline' as const, color: C.success },
    { label: 'Bids Made', value: bidData.length, icon: 'arrow-up-outline' as const, color: C.accent },
    { label: 'Won', value: wonData.length, icon: 'trophy-outline' as const, color: C.warning },
  ];

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerPad + 16 }]}
      >
        <Text style={[styles.title, { color: C.text, fontFamily: 'Inter_700Bold' }]}>Dashboard</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: C.surface }]}>
              <View style={[styles.statIcon, { backgroundColor: `${s.color}22` }]}>
                <Ionicons name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: C.text, fontFamily: 'Inter_700Bold' }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: C.textTertiary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: C.surfaceSecondary }]}>
          {TABS.map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabBtn,
                activeTab === tab.key && { backgroundColor: C.cardBg },
              ]}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={activeTab === tab.key ? C.accent : C.textTertiary}
              />
              <Text style={[
                styles.tabBtnText,
                { color: activeTab === tab.key ? C.accent : C.textTertiary },
                activeTab === tab.key && { fontFamily: 'Inter_600SemiBold' },
              ]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        {activeTab === 'auctions' && (
          auctionData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={40} color={C.textTertiary} />
              <Text style={[styles.emptyTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>No auctions yet</Text>
              <Pressable
                style={[styles.createBtn, { backgroundColor: C.accent }]}
                onPress={() => router.push('/create-auction')}
              >
                <Text style={styles.createBtnText}>Create Your First Auction</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.grid}>
              {auctionData.map((auction, index) => (
                <Animated.View key={auction.id} entering={FadeInDown.delay(index * 50)} style={styles.gridItem}>
                  <AuctionCard
                    auction={auction as any}
                    onPress={() => router.push({ pathname: '/auction/[id]', params: { id: auction.id } })}
                  />
                </Animated.View>
              ))}
            </View>
          )
        )}

        {activeTab === 'bids' && (
          bidData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="arrow-up-circle-outline" size={40} color={C.textTertiary} />
              <Text style={[styles.emptyTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>No bids placed yet</Text>
              <Pressable
                style={[styles.createBtn, { backgroundColor: C.accent }]}
                onPress={() => router.push('/(tabs)/index')}
              >
                <Text style={styles.createBtnText}>Browse Auctions</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.bidList}>
              {bidData.map((bid: any, index: number) => (
                <Animated.View key={bid.id} entering={FadeInDown.delay(index * 50)}>
                  <Pressable
                    style={[styles.bidItem, { backgroundColor: C.surface, borderColor: C.border }]}
                    onPress={() => router.push({ pathname: '/auction/[id]', params: { id: bid.auctionId } })}
                  >
                    <View style={styles.bidLeft}>
                      <Text style={[styles.bidAuctionTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
                        {bid.auction?.title ?? 'Auction'}
                      </Text>
                      <Text style={[styles.bidDate, { color: C.textTertiary }]}>
                        {new Date(bid.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.bidRight}>
                      <Text style={[styles.bidAmount, { color: C.accent, fontFamily: 'Inter_700Bold' }]}>
                        ${bid.amount.toFixed(0)}
                      </Text>
                      <View style={[
                        styles.bidStatusBadge,
                        { backgroundColor: bid.auction?.status === 'live' ? C.successSoft : C.surfaceSecondary },
                      ]}>
                        <Text style={[styles.bidStatusText, {
                          color: bid.auction?.status === 'live' ? C.success : C.textTertiary,
                        }]}>
                          {bid.auction?.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )
        )}

        {activeTab === 'won' && (
          wonData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={40} color={C.textTertiary} />
              <Text style={[styles.emptyTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>No wins yet</Text>
              <Text style={[styles.emptySubtitle, { color: C.textTertiary }]}>Keep bidding to win your first auction!</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {wonData.map((auction, index) => (
                <Animated.View key={auction.id} entering={FadeInDown.delay(index * 50)} style={styles.gridItem}>
                  <AuctionCard
                    auction={auction as any}
                    onPress={() => router.push({ pathname: '/auction/[id]', params: { id: auction.id } })}
                    isWinner
                  />
                </Animated.View>
              ))}
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },
  title: { fontSize: 26 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabBtnText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%' },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyTitle: { fontSize: 17 },
  emptySubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  createBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  createBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  bidList: { gap: 10 },
  bidItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  bidLeft: { flex: 1, gap: 4 },
  bidAuctionTitle: { fontSize: 14 },
  bidDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  bidRight: { alignItems: 'flex-end', gap: 4 },
  bidAmount: { fontSize: 18 },
  bidStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  bidStatusText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  authTitle: { fontSize: 24 },
  authSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 260 },
  authBtn: { paddingHorizontal: 36, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  authBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
});
