import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, useColorScheme, Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface Auction {
  id: string;
  title: string;
  images: string[];
  category: string;
  currentPrice: number;
  startingPrice: number;
  status: 'live' | 'scheduled' | 'ended';
  endTime: string;
  startTime: string;
  bidCount: number;
  sellerName: string;
  winnerId?: string | null;
  winnerName?: string | null;
}

interface AuctionCardProps {
  auction: Auction;
  onPress: () => void;
  isWinner?: boolean;
}

function useCountdown(endTime: string, status: string) {
  const [timeLeft, setTimeLeft] = useState('');

  const calc = useCallback(() => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0 || status === 'ended') return 'Ended';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }, [endTime, status]);

  useEffect(() => {
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [calc]);

  return timeLeft;
}

export default function AuctionCard({ auction, onPress, isWinner }: AuctionCardProps) {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const timeLeft = useCountdown(auction.endTime, auction.status);
  const scale = useSharedValue(1);
  const isUrgent = auction.status === 'live' &&
    (new Date(auction.endTime).getTime() - Date.now()) < 5 * 60 * 1000;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.97, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const statusColor = auction.status === 'live' ? C.success
    : auction.status === 'scheduled' ? C.warning
    : C.textTertiary;

  const statusBg = auction.status === 'live' ? C.successSoft
    : auction.status === 'scheduled' ? C.warningSoft
    : C.surfaceSecondary;

  const statusLabel = auction.status === 'live' ? 'LIVE'
    : auction.status === 'scheduled' ? 'SOON'
    : 'ENDED';

  const hasImage = auction.images && auction.images.length > 0;

  return (
    <Pressable onPress={handlePress} style={{ flex: 1 }}>
      <Animated.View style={[styles.card, { backgroundColor: C.cardBg, shadowColor: C.shadow }, animStyle]}>
        {/* Image */}
        <View style={[styles.imageContainer, { backgroundColor: C.surfaceSecondary }]}>
          {hasImage ? (
            <Image source={{ uri: auction.images[0] }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: C.surfaceSecondary }]}>
              <Ionicons name="image-outline" size={32} color={C.textTertiary} />
            </View>
          )}
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            {auction.status === 'live' && (
              <View style={[styles.liveDot, { backgroundColor: statusColor }]} />
            )}
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          {/* Winner Badge */}
          {isWinner && (
            <View style={[styles.winnerBadge, { backgroundColor: C.warning }]}>
              <Ionicons name="trophy" size={10} color="#000" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.category, { color: C.accent }]} numberOfLines={1}>
            {auction.category}
          </Text>
          <Text style={[styles.title, { color: C.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={2}>
            {auction.title}
          </Text>

          <View style={styles.priceRow}>
            <View>
              <Text style={[styles.priceLabel, { color: C.textTertiary }]}>Current bid</Text>
              <Text style={[styles.price, { color: C.accent, fontFamily: 'Inter_700Bold' }]}>
                ${auction.currentPrice.toFixed(0)}
              </Text>
            </View>
            <View style={styles.timerContainer}>
              <Ionicons
                name="time-outline"
                size={11}
                color={isUrgent ? C.danger : C.textTertiary}
              />
              <Text style={[
                styles.timer,
                { color: isUrgent ? C.danger : C.textSecondary },
                isUrgent && { fontFamily: 'Inter_700Bold' },
              ]}>
                {timeLeft}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.bidsRow}>
              <Ionicons name="people-outline" size={11} color={C.textTertiary} />
              <Text style={[styles.bidsText, { color: C.textTertiary }]}>
                {auction.bidCount} {auction.bidCount === 1 ? 'bid' : 'bids'}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 2,
  },
  imageContainer: {
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  winnerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
    gap: 6,
  },
  category: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  priceLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginBottom: 1,
  },
  price: {
    fontSize: 18,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timer: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bidsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bidsText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
