import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, useColorScheme, Platform, ActivityIndicator,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface BidButtonProps {
  currentPrice: number;
  minimumIncrement: number;
  onBid: (amount: number) => Promise<void>;
  disabled?: boolean;
  status: string;
}

export default function BidButton({ currentPrice, minimumIncrement, onBid, disabled, status }: BidButtonProps) {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const minBid = currentPrice + minimumIncrement;
  const [amount, setAmount] = useState(minBid.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const scale = useSharedValue(1);
  const errorShake = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorShake.value }],
  }));

  const handleBid = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < minBid) {
      setError(`Min bid: $${minBid.toFixed(2)}`);
      errorShake.value = withSequence(
        withSpring(-8, { damping: 5 }),
        withSpring(8, { damping: 5 }),
        withSpring(-4, { damping: 5 }),
        withSpring(0, { damping: 10 }),
      );
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError('');
    setIsLoading(true);
    scale.value = withSpring(0.96, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    try {
      await onBid(val);
      setAmount((val + minimumIncrement).toString());
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message || 'Failed to place bid');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickBids = [minBid, minBid + minimumIncrement * 2, minBid + minimumIncrement * 5];

  if (status !== 'live') {
    return (
      <View style={[styles.endedContainer, { backgroundColor: C.surfaceSecondary, borderColor: C.border }]}>
        <Ionicons name="lock-closed-outline" size={16} color={C.textTertiary} />
        <Text style={[styles.endedText, { color: C.textTertiary }]}>
          {status === 'ended' ? 'Auction ended' : 'Auction not started yet'}
        </Text>
      </View>
    );
  }

  return (
    <Animated.View style={shakeStyle}>
      <View style={styles.container}>
        {/* Quick bid chips */}
        <View style={styles.quickBids}>
          {quickBids.map(q => (
            <Pressable
              key={q}
              onPress={() => setAmount(q.toString())}
              style={[styles.quickChip, { borderColor: C.border, backgroundColor: C.surfaceSecondary }]}
            >
              <Text style={[styles.quickChipText, { color: C.textSecondary }]}>${q.toFixed(0)}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputContainer, { backgroundColor: C.inputBg, borderColor: error ? C.danger : C.border }]}>
            <Text style={[styles.dollarSign, { color: C.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>$</Text>
            <TextInput
              style={[styles.input, { color: C.text, fontFamily: 'Inter_700Bold' }]}
              value={amount}
              onChangeText={v => {
                setAmount(v);
                setError('');
              }}
              keyboardType="decimal-pad"
              placeholderTextColor={C.textTertiary}
            />
          </View>

          <Animated.View style={[{ flex: 1 }, animStyle]}>
            <Pressable
              style={[
                styles.bidBtn,
                { backgroundColor: disabled ? C.surfaceSecondary : C.accent },
              ]}
              onPress={handleBid}
              disabled={disabled || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="arrow-up-circle" size={18} color={disabled ? C.textTertiary : '#fff'} />
                  <Text style={[styles.bidBtnText, { color: disabled ? C.textTertiary : '#fff' }]}>
                    Bid Now
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: C.danger }]}>{error}</Text>
        ) : (
          <Text style={[styles.hintText, { color: C.textTertiary }]}>
            Minimum bid: ${minBid.toFixed(2)}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  quickBids: { flexDirection: 'row', gap: 8 },
  quickChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
  },
  dollarSign: { fontSize: 18, marginRight: 2 },
  input: { flex: 1, fontSize: 22, height: '100%' },
  bidBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  bidBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  errorText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  hintText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  endedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  endedText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
