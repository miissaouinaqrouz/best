import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image, useColorScheme,
  Platform, Dimensions, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import BidButton from '@/components/BidButton';
import { useAuth } from '@/contexts/AuthContext';
import { getAuction, placeBid } from '@workspace/api-client-react';
import { useAuctionSocket } from '@/hooks/useAuctionSocket';

const { width } = Dimensions.get('window');

function useCountdown(endTime: string, status: string) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, total: 0 });

  const calc = useCallback(() => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0 || status === 'ended') return { h: 0, m: 0, s: 0, total: 0 };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s, total: diff };
  }, [endTime, status]);

  useEffect(() => {
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [calc]);

  return timeLeft;
}

function CountdownUnit({ value, label, C }: any) {
  return (
    <View style={styles.countUnit}>
      <View style={[styles.countBox, { backgroundColor: C.surfaceSecondary }]}>
        <Text style={[styles.countValue, { color: C.text, fontFamily: 'Inter_700Bold' }]}>
          {String(value).padStart(2, '0')}
        </Text>
      </View>
      <Text style={[styles.countLabel, { color: C.textTertiary }]}>{label}</Text>
    </View>
  );
}

export default function AuctionDetailScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [imageIndex, setImageIndex] = useState(0);
  const priceScale = useSharedValue(1);

  const { data: auction, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => getAuction(id!),
    refetchInterval: 15000,
    enabled: !!id,
  });

  useAuctionSocket(id ?? null, () => {
    priceScale.value = withSpring(1.15, { damping: 6 }, () => {
      priceScale.value = withSpring(1, { damping: 10 });
    });
  });

  const bidMutation = useMutation({
    mutationFn: (amount: number) => placeBid(id!, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', id] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      // Animate price
      priceScale.value = withSpring(1.15, { damping: 6 }, () => {
        priceScale.value = withSpring(1, { damping: 10 });
      });
    },
    onError: (err: any) => {
      throw new Error(err?.message || 'Failed to place bid');
    },
  });

  const timeLeft = useCountdown(auction?.endTime ?? new Date().toISOString(), auction?.status ?? 'ended');
  const isUrgent = timeLeft.total > 0 && timeLeft.total < 5 * 60 * 1000;

  const priceAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: priceScale.value }],
  }));

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  if (!auction) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: C.background }]}>
        <Ionicons name="alert-circle-outline" size={44} color={C.textTertiary} />
        <Text style={[styles.errorText, { color: C.textTertiary }]}>Auction not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtnAlt, { backgroundColor: C.accent }]}>
          <Text style={styles.backBtnAltText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isSeller = user?.id === auction.sellerId;
  const isWinner = auction.winnerId === user?.id;
  const statusColor = auction.status === 'live' ? C.success : auction.status === 'scheduled' ? C.warning : C.textTertiary;
  const images = auction.images && auction.images.length > 0 ? auction.images : [];

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Back button */}
      <Pressable
        style={[styles.backBtn, { top: insets.top + (Platform.OS === 'web' ? 67 : 8) }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color={C.text} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.accent} />}
      >
        {/* Images */}
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
              style={{ height: 300 }}
            >
              {images.map((img: string, i: number) => (
                <Image key={i} source={{ uri: img }} style={{ width, height: 300 }} resizeMode="cover" />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.imageDots}>
                {images.map((_: string, i: number) => (
                  <View
                    key={i}
                    style={[styles.dot, { backgroundColor: i === imageIndex ? '#fff' : 'rgba(255,255,255,0.5)' }]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: C.surfaceSecondary }]}>
            <Ionicons name="image-outline" size={56} color={C.textTertiary} />
          </View>
        )}

        <Animated.View entering={FadeInDown.springify()} style={styles.details}>
          {/* Header */}
          <View style={styles.detailsHeader}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
              {auction.status === 'live' && <View style={[styles.liveDot, { backgroundColor: statusColor }]} />}
              <Text style={[styles.statusText, { color: statusColor }]}>{auction.status.toUpperCase()}</Text>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: C.accentSoft }]}>
              <Text style={[styles.categoryText, { color: C.accent }]}>{auction.category}</Text>
            </View>
          </View>

          <Text style={[styles.auctionTitle, { color: C.text, fontFamily: 'Inter_700Bold' }]}>
            {auction.title}
          </Text>

          {/* Winner Banner */}
          {auction.status === 'ended' && isWinner && (
            <View style={[styles.winnerBanner, { backgroundColor: C.warningSoft, borderColor: C.warning }]}>
              <Ionicons name="trophy" size={20} color={C.warning} />
              <Text style={[styles.winnerText, { color: C.warning, fontFamily: 'Inter_700Bold' }]}>
                You won this auction!
              </Text>
            </View>
          )}

          {/* Price & Timer */}
          <View style={[styles.priceCard, { backgroundColor: C.surface }]}>
            <View style={styles.priceLeft}>
              <Text style={[styles.priceLabel, { color: C.textTertiary }]}>Current Bid</Text>
              <Animated.Text style={[styles.currentPrice, { color: C.accent, fontFamily: 'Inter_700Bold' }, priceAnimStyle]}>
                ${auction.currentPrice.toFixed(2)}
              </Animated.Text>
              <Text style={[styles.startingPrice, { color: C.textTertiary }]}>
                Started at ${auction.startingPrice.toFixed(2)}
              </Text>
            </View>

            {auction.status !== 'ended' && (
              <View style={styles.timerBlock}>
                <Text style={[styles.timerTitle, { color: isUrgent ? C.danger : C.textTertiary }]}>
                  {auction.status === 'live' ? 'Ends in' : 'Starts in'}
                </Text>
                <View style={styles.countRow}>
                  <CountdownUnit value={timeLeft.h} label="H" C={C} />
                  <Text style={[styles.colon, { color: C.textTertiary }]}>:</Text>
                  <CountdownUnit value={timeLeft.m} label="M" C={C} />
                  <Text style={[styles.colon, { color: C.textTertiary }]}>:</Text>
                  <CountdownUnit value={timeLeft.s} label="S" C={C} />
                </View>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: C.surface }]}>
              <Ionicons name="people-outline" size={16} color={C.textSecondary} />
              <Text style={[styles.statText, { color: C.text }]}>{auction.bidCount} bids</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: C.surface }]}>
              <Ionicons name="trending-up-outline" size={16} color={C.textSecondary} />
              <Text style={[styles.statText, { color: C.text }]}>+${auction.minimumIncrement} min</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: C.surface }]}>
              <Ionicons name="person-outline" size={16} color={C.textSecondary} />
              <Text style={[styles.statText, { color: C.text }]} numberOfLines={1}>{auction.sellerName}</Text>
            </View>
          </View>

          {/* Bid button */}
          {!isSeller && (
            <View style={[styles.bidSection, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.bidSectionTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>
                Place Your Bid
              </Text>
              {user ? (
                <BidButton
                  currentPrice={auction.currentPrice}
                  minimumIncrement={auction.minimumIncrement}
                  status={auction.status}
                  onBid={async (amount) => {
                    await bidMutation.mutateAsync(amount);
                  }}
                />
              ) : (
                <Pressable
                  style={[styles.signInBidBtn, { backgroundColor: C.accent }]}
                  onPress={() => router.push('/auth')}
                >
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text style={styles.signInBidText}>Sign in to bid</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Description */}
          <View style={[styles.section, { borderColor: C.border }]}>
            <Text style={[styles.sectionTitle, { color: C.text, fontFamily: 'Inter_700Bold' }]}>Description</Text>
            <Text style={[styles.description, { color: C.textSecondary }]}>{auction.description}</Text>
          </View>

          {/* Bid History */}
          {(auction as any).recentBids && (auction as any).recentBids.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.text, fontFamily: 'Inter_700Bold' }]}>
                Bid History
              </Text>
              {(auction as any).recentBids.map((bid: any, i: number) => (
                <Animated.View
                  key={bid.id}
                  entering={FadeInDown.delay(i * 50)}
                  style={[styles.bidRow, { borderBottomColor: C.border }]}
                >
                  <View style={[styles.bidAvatar, { backgroundColor: C.accentSoft }]}>
                    <Text style={[styles.bidAvatarText, { color: C.accent, fontFamily: 'Inter_700Bold' }]}>
                      {bid.bidderName?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.bidInfo}>
                    <Text style={[styles.bidderName, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>
                      {bid.bidderName}
                      {i === 0 && <Text style={[{ color: C.success }]}> · Leading</Text>}
                    </Text>
                    <Text style={[styles.bidTime, { color: C.textTertiary }]}>
                      {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={[styles.bidAmount, { color: C.accent, fontFamily: 'Inter_700Bold' }]}>
                    ${bid.amount.toFixed(2)}
                  </Text>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: { height: 300, alignItems: 'center', justifyContent: 'center' },
  imageDots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  details: { padding: 16, gap: 16 },
  detailsHeader: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  categoryText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  auctionTitle: { fontSize: 22, lineHeight: 30 },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  winnerText: { fontSize: 15 },
  priceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  priceLeft: { gap: 2 },
  priceLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  currentPrice: { fontSize: 36 },
  startingPrice: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  timerBlock: { alignItems: 'flex-end', gap: 4 },
  timerTitle: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countUnit: { alignItems: 'center', gap: 2 },
  countBox: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 36, alignItems: 'center' },
  countValue: { fontSize: 18 },
  countLabel: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  colon: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  statText: { fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  bidSection: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  bidSectionTitle: { fontSize: 16 },
  signInBidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 14,
  },
  signInBidText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  section: { gap: 12, paddingTop: 4 },
  sectionTitle: { fontSize: 17 },
  description: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  bidAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bidAvatarText: { fontSize: 15 },
  bidInfo: { flex: 1 },
  bidderName: { fontSize: 14 },
  bidTime: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  bidAmount: { fontSize: 16 },
  errorText: { fontSize: 16, marginTop: 10 },
  backBtnAlt: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnAltText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});
