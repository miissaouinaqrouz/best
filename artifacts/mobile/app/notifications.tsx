import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, useColorScheme, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, markNotificationRead } from '@workspace/api-client-react';

function notifIcon(type: string) {
  switch (type) {
    case 'outbid': return { name: 'arrow-up-circle' as const, color: '#FF3B5C' };
    case 'auction_won': return { name: 'trophy' as const, color: '#FFB400' };
    case 'auction_ending': return { name: 'time' as const, color: '#FF8C55' };
    case 'auction_lost': return { name: 'close-circle' as const, color: '#6B7280' };
    default: return { name: 'notifications' as const, color: '#FF8C55' };
  }
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const headerPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <View style={[styles.header, { paddingTop: headerPad + 12 }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </Pressable>
          <Text style={[styles.title, { color: C.text, fontFamily: 'Inter_700Bold' }]}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={44} color={C.textTertiary} />
          <Text style={[styles.emptyTitle, { color: C.textTertiary }]}>Sign in to see notifications</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: headerPad + 12 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: C.text, fontFamily: 'Inter_700Bold' }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: C.accent }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const icon = notifIcon(item.type);
          return (
            <Animated.View entering={FadeInDown.delay(index * 50)}>
              <Pressable
                style={[
                  styles.notifItem,
                  { backgroundColor: item.read ? C.surface : C.accentSoft, borderColor: C.border },
                ]}
                onPress={() => {
                  if (!item.read) markRead(item.id);
                  if (item.auctionId) router.push({ pathname: '/auction/[id]', params: { id: item.auctionId } });
                }}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${icon.color}22` }]}>
                  <Ionicons name={icon.name} size={20} color={icon.color} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, { color: C.text, fontFamily: item.read ? 'Inter_500Medium' : 'Inter_700Bold' }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.notifMessage, { color: C.textSecondary }]} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <Text style={[styles.notifTime, { color: C.textTertiary }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {!item.read && (
                  <View style={[styles.unreadDot, { backgroundColor: C.accent }]} />
                )}
              </Pressable>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={44} color={C.textTertiary} />
              <Text style={[styles.emptyTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>All caught up!</Text>
              <Text style={[styles.emptySubtitle, { color: C.textTertiary }]}>No notifications yet</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifContent: { flex: 1, gap: 3 },
  notifTitle: { fontSize: 14 },
  notifMessage: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  notifTime: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
