import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FIND_NATURE } from '../data/adventures';
import { saveNaturePhoto, getNaturePhotos, clearNaturePhotos } from '../db/database';
import { ANTHROPIC_API_KEY } from '../config';

const REQUIRED_PLANTS = 5;

async function pickImage() {
  const ImagePicker = await import('expo-image-picker');
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Allow photo library access to upload plant pictures.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.6,
    base64: true,
  });
  if (result.canceled) return null;
  return result.assets[0];
}

async function takePhoto() {
  const ImagePicker = await import('expo-image-picker');
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Allow camera access to take plant pictures.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.6,
    base64: true,
  });
  if (result.canceled) return null;
  return result.assets[0];
}

async function checkIsPlant(base64Data) {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'YOUR_ANTHROPIC_API_KEY_HERE') {
    // Demo mode: randomly approve for testing
    await new Promise(r => setTimeout(r, 1200));
    const plants = ['Oak tree', 'Dandelion', 'Wild rose', 'Clover', 'Nettle', 'Birch tree', 'Fern', 'Moss'];
    return { is_plant: true, name: plants[Math.floor(Math.random() * plants.length)] };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64Data },
            },
            {
              type: 'text',
              text: 'Is this a photo of a plant (flower, tree, shrub, grass, moss, fern, etc.)? Reply with JSON only: {"is_plant": true/false, "name": "common name or null"}',
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { is_plant: false, name: null };
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { is_plant: false, name: null };
  }
}

export default function FindNatureScreen({ route, navigation }) {
  const [photos, setPhotos] = useState([]);
  const [loadingSlot, setLoadingSlot] = useState(null);
  const [completed, setCompleted] = useState(false);

  const a = FIND_NATURE;

  const loadPhotos = useCallback(() => {
    if (Platform.OS === 'web') return;
    const rows = getNaturePhotos();
    const validPhotos = rows.filter(r => r.is_plant === 1);
    setPhotos(rows);
    if (validPhotos.length >= REQUIRED_PLANTS) setCompleted(true);
  }, []);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const validCount = photos.filter(p => p.is_plant === 1).length;

  async function handleAddPhoto(useCamera) {
    if (validCount >= REQUIRED_PLANTS) return;

    const asset = useCamera ? await takePhoto() : await pickImage();
    if (!asset?.base64) return;

    setLoadingSlot(photos.length);
    const result = await checkIsPlant(asset.base64);

    if (Platform.OS !== 'web') {
      saveNaturePhoto(asset.uri, result.is_plant, result.name);
    }

    if (!result.is_plant) {
      Alert.alert('Not a plant', 'The image does not appear to show a plant. Try a different photo.');
      setLoadingSlot(null);
      loadPhotos();
      return;
    }

    loadPhotos();
    setLoadingSlot(null);

    if (validCount + 1 >= REQUIRED_PLANTS) {
      setCompleted(true);
    }
  }

  function handleReset() {
    if (Platform.OS !== 'web') clearNaturePhotos();
    setPhotos([]);
    setCompleted(false);
  }

  function showPhotoOptions() {
    Alert.alert('Add plant photo', 'How would you like to add a photo?', [
      { text: 'Take photo', onPress: () => handleAddPhoto(true) },
      { text: 'Choose from library', onPress: () => handleAddPhoto(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const validPhotos = photos.filter(p => p.is_plant === 1);
  const progressPct = Math.min(100, (validCount / REQUIRED_PLANTS) * 100);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <Image source={a.hero} style={styles.heroImg} resizeMode="cover" />
          <LinearGradient colors={['rgba(44,31,20,0.45)', 'transparent', '#F5EBD7']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroTopBar}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.heroBtnIcon}>‹</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroTag}><Text style={styles.heroTagText}>🌿  {a.tag}</Text></View>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{a.title}</Text>
          <Text style={styles.summary}>{a.summary}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaItem}>⏱  {a.duration}</Text>
            <Text style={styles.metaItem}>📍  {a.distance}</Text>
            <Text style={styles.metaItem}>🗺  {a.location}</Text>
          </View>
        </View>

        {/* Completed state */}
        {completed && (
          <View style={[styles.stateCard, styles.stateCardCompleted]}>
            <Text style={styles.stateEmoji}>🏆</Text>
            <Text style={[styles.stateTitle, { color: '#3D6142' }]}>Nature explorer!</Text>
            <Text style={styles.stateDesc}>
              You found and photographed {validCount} different plants. Well done, survivalist.
            </Text>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Start again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upload section */}
        {!completed && (
          <View style={styles.uploadCard}>
            <Text style={styles.uploadTitle}>🌱  Plant photos</Text>
            <Text style={styles.uploadSubtitle}>
              Upload photos of 5 different plants. Each image is verified by AI.
            </Text>

            {/* Progress */}
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{validCount} / {REQUIRED_PLANTS}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progressPct}%` }]} />
            </View>

            {/* Photo grid */}
            <View style={styles.grid}>
              {Array.from({ length: REQUIRED_PLANTS }).map((_, i) => {
                const photo = validPhotos[i];
                const isLoading = loadingSlot !== null && i === validCount;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.slot, photo && styles.slotFilled]}
                    onPress={!photo && !isLoading ? showPhotoOptions : undefined}
                    activeOpacity={photo ? 1 : 0.75}
                  >
                    {photo ? (
                      <>
                        <Image source={{ uri: photo.uri }} style={styles.slotImg} resizeMode="cover" />
                        <View style={styles.slotBadge}>
                          <Text style={styles.slotBadgeText}>✓</Text>
                        </View>
                        {photo.plant_name ? (
                          <Text style={styles.slotName} numberOfLines={1}>{photo.plant_name}</Text>
                        ) : null}
                      </>
                    ) : isLoading ? (
                      <ActivityIndicator color="#3D6142" />
                    ) : (
                      <Text style={styles.slotPlus}>+</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.addBtn, validCount >= REQUIRED_PLANTS && styles.addBtnDisabled]}
              onPress={validCount < REQUIRED_PLANTS ? showPhotoOptions : null}
              activeOpacity={0.85}
            >
              <Text style={styles.addBtnText}>
                {validCount >= REQUIRED_PLANTS ? 'All plants found!' : 'Add plant photo'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info sections */}
        {a.sections.map((s) => (
          <View key={s.label} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}><Text style={{ fontSize: 18 }}>{s.emoji}</Text></View>
              <Text style={styles.cardLabel}>{s.label}</Text>
            </View>
            <Text style={styles.cardBody}>{s.body}</Text>
            {s.chips && (
              <View style={styles.chips}>
                {s.chips.map((c) => (
                  <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },
  scroll: { paddingBottom: 16 },

  hero: { height: 240, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroTopBar: { position: 'absolute', top: 56, left: 20 },
  heroBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,235,215,0.9)', alignItems: 'center', justifyContent: 'center' },
  heroBtnIcon: { fontSize: 24, color: '#2C1F14', lineHeight: 28 },
  heroTag: { position: 'absolute', bottom: 24, left: 20, backgroundColor: '#3D6142', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  heroTagText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 1.5, textTransform: 'uppercase' },

  titleBlock: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#2C1F14', lineHeight: 32 },
  summary: { fontSize: 13.5, color: '#7A6651', lineHeight: 20, marginTop: 8 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  metaItem: { fontSize: 12, color: 'rgba(44,31,20,0.7)' },

  stateCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 22, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  stateCardCompleted: { borderColor: 'rgba(61,97,66,0.3)', backgroundColor: 'rgba(61,97,66,0.05)' },
  stateEmoji: { fontSize: 40, marginBottom: 10 },
  stateTitle: { fontSize: 20, fontWeight: '700', color: '#2C1F14', marginBottom: 8 },
  stateDesc: { fontSize: 13, color: '#7A6651', textAlign: 'center', lineHeight: 19 },
  resetBtn: { marginTop: 14, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(44,31,20,0.25)' },
  resetBtnText: { fontSize: 13, fontWeight: '700', color: '#2C1F14' },

  uploadCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1.5, borderColor: 'rgba(61,97,66,0.2)' },
  uploadTitle: { fontSize: 13, fontWeight: '700', color: '#2C1F14', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  uploadSubtitle: { fontSize: 12, color: '#7A6651', lineHeight: 17, marginBottom: 14 },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#7A6651', fontWeight: '600' },
  progressValue: { fontSize: 15, fontWeight: '700', color: '#3D6142' },
  track: { height: 8, backgroundColor: 'rgba(44,31,20,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  fill: { height: '100%', borderRadius: 4, backgroundColor: '#3D6142' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  slot: { width: '30%', aspectRatio: 1, borderRadius: 16, backgroundColor: 'rgba(61,97,66,0.08)', borderWidth: 1.5, borderColor: 'rgba(61,97,66,0.2)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  slotFilled: { borderStyle: 'solid', borderColor: '#3D6142' },
  slotImg: { width: '100%', height: '100%' },
  slotBadge: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#3D6142', alignItems: 'center', justifyContent: 'center' },
  slotBadgeText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  slotName: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(44,31,20,0.6)', paddingVertical: 3, paddingHorizontal: 4, fontSize: 9, color: '#fff', textAlign: 'center', fontWeight: '600' },
  slotPlus: { fontSize: 28, color: 'rgba(61,97,66,0.4)', fontWeight: '300' },

  addBtn: { backgroundColor: '#3D6142', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: 'rgba(61,97,66,0.4)' },
  addBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  card: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0E6D3', alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#2C1F14', letterSpacing: 1, textTransform: 'uppercase' },
  cardBody: { fontSize: 13, color: 'rgba(44,31,20,0.75)', lineHeight: 20 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { backgroundColor: 'rgba(61,97,66,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  chipText: { fontSize: 11, fontWeight: '700', color: '#3D6142', letterSpacing: 1, textTransform: 'uppercase' },
});
