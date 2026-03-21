import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView, useColorScheme,
  Platform, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { createAuction } from '@workspace/api-client-react';

const CATEGORIES = ['Electronics', 'Fashion', 'Art', 'Collectibles', 'Vehicles', 'Real Estate', 'Other'];

const DURATIONS = [
  { label: '1 Hour', hours: 1 },
  { label: '6 Hours', hours: 6 },
  { label: '24 Hours', hours: 24 },
  { label: '3 Days', hours: 72 },
  { label: '7 Days', hours: 168 },
];

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
  'https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=400',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

export default function CreateAuctionScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [minIncrement, setMinIncrement] = useState('5');
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [startNow, setStartNow] = useState(true);
  const [error, setError] = useState('');

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createAuction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['my-auctions'] });
    },
  });

  const addImage = () => {
    const url = imageUrl.trim();
    if (url && !imageUrls.includes(url)) {
      setImageUrls(prev => [...prev, url]);
      setImageUrl('');
    }
  };

  const handleCreate = async () => {
    setError('');
    if (!title.trim()) { setError('Please enter a title'); return; }
    if (!description.trim()) { setError('Please enter a description'); return; }
    if (!category) { setError('Please select a category'); return; }
    const price = parseFloat(startingPrice);
    if (isNaN(price) || price <= 0) { setError('Please enter a valid starting price'); return; }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + DURATIONS[selectedDuration].hours * 3600 * 1000);

    try {
      await mutateAsync({
        createAuctionRequest: {
          title: title.trim(),
          description: description.trim(),
          images: imageUrls.length > 0 ? imageUrls : [],
          category,
          startingPrice: price,
          minimumIncrement: parseFloat(minIncrement) || 1,
          startTime: startNow ? startTime.toISOString() : new Date(Date.now() + 86400000).toISOString(),
          endTime: endTime.toISOString(),
        },
      });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err?.message || 'Failed to create auction');
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top + 20 }]}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={44} color={C.textTertiary} />
          <Text style={[styles.authText, { color: C.textSecondary }]}>Sign in to create auctions</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={C.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: C.text, fontFamily: 'Inter_700Bold' }]}>Create Auction</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Basic Info */}
          <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.section}>
            <Field label="Title *">
              <TextInput
                style={[styles.input, { backgroundColor: C.inputBg, color: C.text, borderColor: C.border }]}
                placeholder="What are you selling?"
                placeholderTextColor={C.textTertiary}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </Field>

            <Field label="Description *">
              <TextInput
                style={[styles.textarea, { backgroundColor: C.inputBg, color: C.text, borderColor: C.border }]}
                placeholder="Describe your item in detail..."
                placeholderTextColor={C.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Field>
          </Animated.View>

          {/* Category */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>Category *</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: category === cat ? C.accent : C.surfaceSecondary,
                      borderColor: category === cat ? C.accent : C.border,
                    },
                  ]}
                >
                  <Text style={[styles.categoryChipText, { color: category === cat ? '#fff' : C.textSecondary }]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Pricing */}
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>Pricing</Text>
            <View style={styles.priceRow}>
              <View style={{ flex: 1 }}>
                <Field label="Starting Price *">
                  <View style={[styles.priceInput, { backgroundColor: C.inputBg, borderColor: C.border }]}>
                    <Text style={[styles.dollarSign, { color: C.textSecondary }]}>$</Text>
                    <TextInput
                      style={[styles.priceInputField, { color: C.text }]}
                      placeholder="0.00"
                      placeholderTextColor={C.textTertiary}
                      value={startingPrice}
                      onChangeText={setStartingPrice}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Min. Increment">
                  <View style={[styles.priceInput, { backgroundColor: C.inputBg, borderColor: C.border }]}>
                    <Text style={[styles.dollarSign, { color: C.textSecondary }]}>$</Text>
                    <TextInput
                      style={[styles.priceInputField, { color: C.text }]}
                      placeholder="1.00"
                      placeholderTextColor={C.textTertiary}
                      value={minIncrement}
                      onChangeText={setMinIncrement}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </Field>
              </View>
            </View>
          </Animated.View>

          {/* Duration */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>Duration</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {DURATIONS.map((d, i) => (
                <Pressable
                  key={d.label}
                  onPress={() => setSelectedDuration(i)}
                  style={[
                    styles.durationChip,
                    {
                      backgroundColor: selectedDuration === i ? C.accent : C.surfaceSecondary,
                      borderColor: selectedDuration === i ? C.accent : C.border,
                    },
                  ]}
                >
                  <Text style={[styles.durationChipText, { color: selectedDuration === i ? '#fff' : C.textSecondary }]}>
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Start now toggle */}
            <Pressable
              onPress={() => setStartNow(!startNow)}
              style={[styles.startToggle, { backgroundColor: C.surfaceSecondary, borderColor: C.border }]}
            >
              <View>
                <Text style={[styles.startToggleTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>Start immediately</Text>
                <Text style={[styles.startToggleSubtitle, { color: C.textTertiary }]}>
                  {startNow ? 'Auction goes live now' : 'Starts in 24 hours'}
                </Text>
              </View>
              <View style={[
                styles.toggleSwitch,
                { backgroundColor: startNow ? C.accent : C.border },
              ]}>
                <View style={[styles.toggleThumb, { marginLeft: startNow ? 22 : 2 }]} />
              </View>
            </Pressable>
          </Animated.View>

          {/* Images */}
          <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text, fontFamily: 'Inter_600SemiBold' }]}>
              Images (optional)
            </Text>
            <View style={styles.imageInputRow}>
              <TextInput
                style={[styles.imageInput, { backgroundColor: C.inputBg, color: C.text, borderColor: C.border }]}
                placeholder="Paste image URL..."
                placeholderTextColor={C.textTertiary}
                value={imageUrl}
                onChangeText={setImageUrl}
                autoCapitalize="none"
              />
              <Pressable
                onPress={addImage}
                style={[styles.addImageBtn, { backgroundColor: C.accentSoft }]}
              >
                <Ionicons name="add" size={22} color={C.accent} />
              </Pressable>
            </View>

            {/* Sample images */}
            <Text style={[styles.orText, { color: C.textTertiary }]}>Or use a sample:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {SAMPLE_IMAGES.map((url, i) => (
                <Pressable
                  key={i}
                  onPress={() => { if (!imageUrls.includes(url)) setImageUrls(prev => [...prev, url]); }}
                  style={[
                    styles.sampleChip,
                    { backgroundColor: imageUrls.includes(url) ? C.accentSoft : C.surfaceSecondary, borderColor: imageUrls.includes(url) ? C.accent : C.border },
                  ]}
                >
                  <Ionicons name="image-outline" size={14} color={imageUrls.includes(url) ? C.accent : C.textTertiary} />
                  <Text style={[styles.sampleChipText, { color: imageUrls.includes(url) ? C.accent : C.textTertiary }]}>
                    Sample {i + 1}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {imageUrls.length > 0 && (
              <View style={styles.imageList}>
                {imageUrls.map((url, i) => (
                  <View key={i} style={[styles.imageItem, { backgroundColor: C.surfaceSecondary, borderColor: C.border }]}>
                    <Ionicons name="image-outline" size={14} color={C.textTertiary} />
                    <Text style={[styles.imageUrl, { color: C.textSecondary }]} numberOfLines={1}>{url}</Text>
                    <Pressable onPress={() => setImageUrls(prev => prev.filter((_, j) => j !== i))}>
                      <Ionicons name="close-circle" size={16} color={C.textTertiary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Error */}
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: C.dangerSoft }]}>
              <Ionicons name="alert-circle-outline" size={16} color={C.danger} />
              <Text style={[styles.errorText, { color: C.danger }]}>{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, { backgroundColor: C.accent, opacity: isPending ? 0.8 : 1 }]}
            onPress={handleCreate}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="rocket-outline" size={20} color="#fff" />
                <Text style={[styles.submitBtnText, { fontFamily: 'Inter_700Bold' }]}>
                  Launch Auction
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 15 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  input: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  textarea: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    height: 100,
  },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  categoryChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  priceRow: { flexDirection: 'row', gap: 12 },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 48,
  },
  dollarSign: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginRight: 2 },
  priceInputField: { flex: 1, fontSize: 16, height: '100%' },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  durationChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  startToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  startToggleTitle: { fontSize: 14 },
  startToggleSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  toggleSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  imageInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  imageInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  addImageBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  sampleChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  imageList: { gap: 8 },
  imageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  imageUrl: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12 },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
  },
  submitBtnText: { fontSize: 17, color: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  authText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
