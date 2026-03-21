import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable, useColorScheme, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Colors from '@/constants/colors';
import AuctionCard from '@/components/AuctionCard';
import { listAuctions } from '@workspace/api-client-react';

const CATEGORIES = ['Electronics', 'Fashion', 'Art', 'Collectibles', 'Vehicles', 'Real Estate', 'Other'];

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['search', search, selectedCategory, minPrice, maxPrice],
    queryFn: () => listAuctions({
      search: search || undefined,
      category: selectedCategory || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      limit: 40,
    }),
    enabled: search.length > 0 || !!selectedCategory || !!minPrice || !!maxPrice,
  });

  const auctions = data?.auctions ?? [];
  const headerPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: headerPad + 12 }]}>
        <Text style={[styles.title, { color: C.text, fontFamily: 'Inter_700Bold' }]}>Search</Text>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: C.inputBg, borderColor: C.border }]}>
          <Feather name="search" size={18} color={C.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: C.text, fontFamily: 'Inter_400Regular' }]}
            placeholder="Search auctions..."
            placeholderTextColor={C.textTertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={C.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Filter toggle */}
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterToggle, { backgroundColor: showFilters ? C.accentSoft : C.surfaceSecondary }]}
        >
          <Ionicons name="options-outline" size={16} color={showFilters ? C.accent : C.textSecondary} />
          <Text style={[styles.filterToggleText, { color: showFilters ? C.accent : C.textSecondary }]}>
            Filters
          </Text>
        </Pressable>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filters}>
            <Text style={[styles.filterLabel, { color: C.textSecondary }]}>Category</Text>
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedCategory(selectedCategory === item ? '' : item)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedCategory === item ? C.accent : C.surfaceSecondary,
                      borderColor: selectedCategory === item ? C.accent : C.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: selectedCategory === item ? '#fff' : C.textSecondary }]}>
                    {item}
                  </Text>
                </Pressable>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            />
            <Text style={[styles.filterLabel, { color: C.textSecondary }]}>Price Range</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={[styles.priceInput, { backgroundColor: C.inputBg, color: C.text, borderColor: C.border }]}
                placeholder="Min $"
                placeholderTextColor={C.textTertiary}
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="decimal-pad"
              />
              <Text style={[{ color: C.textTertiary }]}>–</Text>
              <TextInput
                style={[styles.priceInput, { backgroundColor: C.inputBg, color: C.text, borderColor: C.border }]}
                placeholder="Max $"
                placeholderTextColor={C.textTertiary}
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={auctions}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).springify()} style={{ flex: 1 }}>
            <AuctionCard
              auction={item}
              onPress={() => router.push({ pathname: '/auction/[id]', params: { id: item.id } })}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={44} color={C.textTertiary} />
            <Text style={[styles.emptyTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>
              {search || selectedCategory ? 'No results found' : 'Start searching'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: C.textTertiary }]}>
              {search || selectedCategory ? 'Try different keywords or filters' : 'Enter a keyword to find auctions'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  title: { fontSize: 26 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  filterToggleText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  filters: { gap: 10 },
  filterLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  priceRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  priceInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
