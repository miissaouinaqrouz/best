import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Pressable,
  useColorScheme, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Colors from '@/constants/colors';
import AuctionCard from '@/components/AuctionCard';
import { useAuth } from '@/contexts/AuthContext';
import { listAuctions } from '@workspace/api-client-react';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Art', 'Collectibles', 'Vehicles', 'Real Estate', 'Other'];

function CategoryChip({ label, selected, onPress, C }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? C.accent : C.surfaceSecondary,
          borderColor: selected ? C.accent : C.border,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? '#fff' : C.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>('live');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['auctions', selectedCategory, selectedStatus],
    queryFn: () => listAuctions({
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      status: selectedStatus as any,
      limit: 30,
    }),
    refetchInterval: 10000,
  });

  const auctions = data?.auctions ?? [];

  const renderItem = useCallback(({ item, index }: any) => (
    <Animated.View
      entering={FadeInDown.delay(index * 40).springify()}
      style={styles.cardWrapper}
    >
      <AuctionCard
        auction={item}
        onPress={() => router.push({ pathname: '/auction/[id]', params: { id: item.id } })}
      />
    </Animated.View>
  ), []);

  const headerPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <FlatList
        data={auctions}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerPad + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={C.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Top bar */}
            <View style={styles.topBar}>
              <View>
                <Text style={[styles.greeting, { color: C.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                  {user ? `Hey, ${user.name.split(' ')[0]}` : 'Welcome back'}
                </Text>
                <Text style={[styles.headline, { color: C.text, fontFamily: 'Inter_700Bold' }]}>
                  Live Auctions
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/notifications')}
                style={[styles.notifBtn, { backgroundColor: C.surfaceSecondary }]}
              >
                <Ionicons name="notifications-outline" size={22} color={C.text} />
              </Pressable>
            </View>

            {/* Status filter */}
            <View style={styles.statusRow}>
              {[
                { label: 'Live', value: 'live', icon: 'flame' as const },
                { label: 'Upcoming', value: 'scheduled', icon: 'calendar-outline' as const },
                { label: 'Ended', value: 'ended', icon: 'checkmark-circle-outline' as const },
              ].map(s => (
                <Pressable
                  key={s.value}
                  onPress={() => setSelectedStatus(s.value)}
                  style={[
                    styles.statusBtn,
                    {
                      backgroundColor: selectedStatus === s.value ? C.accent : C.surfaceSecondary,
                      borderColor: selectedStatus === s.value ? C.accent : C.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={s.icon}
                    size={13}
                    color={selectedStatus === s.value ? '#fff' : C.textSecondary}
                  />
                  <Text style={[
                    styles.statusBtnText,
                    { color: selectedStatus === s.value ? '#fff' : C.textSecondary },
                  ]}>
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Category chips */}
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <CategoryChip
                  label={item}
                  selected={selectedCategory === item}
                  onPress={() => setSelectedCategory(item)}
                  C={C}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categories}
            />
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={44} color={C.textTertiary} />
              <Text style={[styles.emptyTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>
                No auctions found
              </Text>
              <Text style={[styles.emptySubtitle, { color: C.textTertiary }]}>
                Try a different filter or check back soon
              </Text>
            </View>
          ) : null
        }
      />

      {/* FAB - Create Auction */}
      {user && (
        <Pressable
          style={[styles.fab, { backgroundColor: C.accent, bottom: insets.bottom + (Platform.OS === 'web' ? 84 + 34 : 90) }]}
          onPress={() => router.push('/create-auction')}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  header: { marginBottom: 16, gap: 14 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13 },
  headline: { fontSize: 26 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  categories: { gap: 8, paddingBottom: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  columnWrapper: { gap: 12, marginBottom: 12 },
  cardWrapper: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
