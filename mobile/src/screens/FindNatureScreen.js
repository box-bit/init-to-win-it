import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIND_NATURE, ADVENTURE_POINTS } from '../data/adventures';
import {
  saveNaturePhoto, getNaturePhotos, clearNaturePhotos,
  startAdventure, getAdventureProgress, completeAdventure,
  expireAdventure, resetAdventure,
} from '../db/database';
import { addScore } from '../score';
import { ANTHROPIC_API_KEY } from '../config';

const REQUIRED_PLANTS = 5;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const WEB_PHOTOS_KEY  = 'find_nature_photos';
const WEB_PROGRESS_KEY = 'find_nature_progress';

// ─── Image picking ────────────────────────────────────────────────────────────
async function pickFromLibrary() {
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

async function pickFromCamera() {
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

// ─── AI plant check ───────────────────────────────────────────────────────────
async function checkIsPlant(base64Data) {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'YOUR_ANTHROPIC_API_KEY_HERE') {
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
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Data } },
            { type: 'text', text: 'Is this a photo of a plant (flower, tree, shrub, grass, moss, fern, etc.)? Reply with JSON only: {"is_plant": true/false, "name": "common name or null"}' },
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

// ─── Timer helper ─────────────────────────────────────────────────────────────
function formatTimeLeft(startedAt) {
  const left = Math.max(0, TWO_HOURS_MS - (Date.now() - startedAt));
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Web storage helpers ──────────────────────────────────────────────────────
async function webLoadProgress() {
  const raw = await AsyncStorage.getItem(WEB_PROGRESS_KEY);
  return raw ? JSON.parse(raw) : null;
}
async function webSaveProgress(data) {
  await AsyncStorage.setItem(WEB_PROGRESS_KEY, JSON.stringify(data));
}
async function webLoadPhotos() {
  const raw = await AsyncStorage.getItem(WEB_PHOTOS_KEY);
  return raw ? JSON.parse(raw) : [];
}
async function webSavePhoto(uri, isPlant, plantName) {
  const photos = await webLoadPhotos();
  photos.push({ uri, is_plant: isPlant ? 1 : 0, plant_name: plantName ?? null, uploaded_at: Date.now() });
  await AsyncStorage.setItem(WEB_PHOTOS_KEY, JSON.stringify(photos));
}
async function webClear() {
  await AsyncStorage.removeItem(WEB_PHOTOS_KEY);
  await AsyncStorage.removeItem(WEB_PROGRESS_KEY);
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function FindNatureScreen({ route, navigation }) {
  const [status, setStatus]       = useState('idle');
  const [photos, setPhotos]       = useState([]);
  const [checking, setChecking]   = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [timeLeft, setTimeLeft]   = useState('');
  const [errorMsg, setErrorMsg]   = useState(null);

  const timerRef    = useRef(null);
  const errorTimer  = useRef(null);
  const a = FIND_NATURE;

  // ── show top error banner, auto-dismiss after 4s ────────────────────────
  function showError(msg) {
    setErrorMsg(msg);
    clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setErrorMsg(null), 4000);
  }

  // ── load state from DB / AsyncStorage ────────────────────────────────────
  const loadState = useCallback(async () => {
    if (Platform.OS === 'web') {
      const progress = await webLoadProgress();
      if (!progress || progress.status === 'completed') { await webClear(); setStatus('idle'); return; }
      const p = await webLoadPhotos();
      setPhotos(p);
      if (progress.status === 'in_progress' && Date.now() - progress.started_at > TWO_HOURS_MS) {
        await webSaveProgress({ ...progress, status: 'expired' });
        setStatus('expired');
        return;
      }
      setStatus(progress.status);
      setStartedAt(progress.started_at ?? null);
    } else {
      const progress = getAdventureProgress('find-the-nature');
      setPhotos(getNaturePhotos());
      if (!progress) { setStatus('idle'); return; }
      if (progress.status === 'in_progress' && Date.now() - progress.started_at > TWO_HOURS_MS) {
        expireAdventure('find-the-nature');
        setStatus('expired');
        return;
      }
      if (progress.status === 'completed') {
        resetAdventure('find-the-nature');
        clearNaturePhotos();
        setStatus('idle');
        return;
      }
      setStatus(progress.status);
      setStartedAt(progress.started_at ?? null);
    }
  }, []);

  useEffect(() => { loadState(); }, [loadState]);

  // ── countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'in_progress' || !startedAt) return;
    setTimeLeft(formatTimeLeft(startedAt));
    timerRef.current = setInterval(() => {
      const remaining = TWO_HOURS_MS - (Date.now() - startedAt);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        if (Platform.OS !== 'web') expireAdventure('find-the-nature');
        else webLoadProgress().then(p => p && webSaveProgress({ ...p, status: 'expired' }));
        setStatus('expired');
        return;
      }
      setTimeLeft(formatTimeLeft(startedAt));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [status, startedAt]);

  useEffect(() => () => { clearTimeout(errorTimer.current); clearInterval(timerRef.current); }, []);

  const validPhotos = photos.filter(p => p.is_plant === 1);
  const validCount  = validPhotos.length;
  const progressPct = Math.min(100, (validCount / REQUIRED_PLANTS) * 100);

  // ── Start ─────────────────────────────────────────────────────────────────
  async function handleStart() {
    const now = Date.now();
    if (Platform.OS !== 'web') startAdventure('find-the-nature');
    else await webSaveProgress({ status: 'in_progress', started_at: now });
    setStartedAt(now);
    setStatus('in_progress');
  }

  // ── Finish (validated) ────────────────────────────────────────────────────
  async function handleFinish() {
    if (status === 'expired') {
      showError("Time's up! The 2-hour window has expired.");
      return;
    }
    if (validCount < REQUIRED_PLANTS) {
      const left = REQUIRED_PLANTS - validCount;
      showError(`You still need ${left} more plant photo${left !== 1 ? 's' : ''} (${validCount}/5 done).`);
      return;
    }
    if (Platform.OS !== 'web') completeAdventure('find-the-nature');
    else webSaveProgress({ status: 'completed', started_at: startedAt });
    clearInterval(timerRef.current);

    const pts = ADVENTURE_POINTS['find-the-nature'];
    const totalScore = await addScore(pts);
    navigation.navigate('AdventureComplete', {
      points: pts,
      totalScore,
      hero: FIND_NATURE.hero,
      tag: FIND_NATURE.tag,
      stats: [
        { label: 'Plants', value: String(validCount), unit: 'found' },
      ],
    });
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  async function handleReset() {
    clearInterval(timerRef.current);
    if (Platform.OS !== 'web') { resetAdventure('find-the-nature'); clearNaturePhotos(); }
    else await webClear();
    setPhotos([]);
    setStartedAt(null);
    setStatus('idle');
  }

  // ── Add photo (called from any empty slot) ────────────────────────────────
  async function handleAddPhoto(useCamera) {
    if (validCount >= REQUIRED_PLANTS || checking) return;
    setChecking(true);
    const asset = useCamera ? await pickFromCamera() : await pickFromLibrary();
    if (!asset?.base64) { setChecking(false); return; }
    const result = await checkIsPlant(asset.base64);

    if (Platform.OS !== 'web') saveNaturePhoto(asset.uri, result.is_plant, result.name);
    else await webSavePhoto(asset.uri, result.is_plant, result.name);

    if (!result.is_plant) {
      Alert.alert('Not a plant 🍂', 'The image does not appear to show a plant. Try a clearer photo with the plant as the main subject.');
    }

    await loadState();
    setChecking(false);
  }

  function onSlotPress() {
    if (checking || validCount >= REQUIRED_PLANTS) return;
    handleAddPhoto(false);
  }

  return (
    <View style={styles.container}>

      {/* ── Top error banner (fixed, outside ScrollView) ── */}
      {errorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerIcon}>⚠️</Text>
          <Text style={styles.errorBannerText} numberOfLines={2}>{errorMsg}</Text>
          <TouchableOpacity onPress={() => setErrorMsg(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.errorBannerClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

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

        {/* ── EXPIRED ── */}
        {status === 'expired' && (
          <View style={[styles.stateCard, styles.stateCardExpired]}>
            <Text style={styles.stateEmoji}>⌛</Text>
            <Text style={[styles.stateTitle, { color: '#C0392B' }]}>Time's up</Text>
            <Text style={styles.stateDesc}>
              The 2-hour window has passed. You found {validCount} of {REQUIRED_PLANTS} plants.
            </Text>
            <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.85}>
              <Text style={styles.finishBtnText}>Finish adventure</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── IDLE — Start button ── */}
        {status === 'idle' && (
          <View style={styles.actionCard}>
            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
              <Text style={styles.startBtnText}>Start adventure</Text>
              <Text style={styles.startBtnMeta}>2 hours</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── IN PROGRESS — timer + grid + finish ── */}
        {status === 'in_progress' && (
          <View style={styles.uploadCard}>
            <Text style={styles.uploadTitle}>🌱  Plant photos</Text>
            <Text style={styles.uploadSubtitle}>
              Tap any empty slot to photograph a plant. Each photo is verified by AI.
            </Text>

            {/* Timer + progress */}
            <View style={styles.timerRow}>
              <View>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>{validCount} / {REQUIRED_PLANTS} plants</Text>
              </View>
              <View style={styles.timerBox}>
                <Text style={styles.timerLabel}>Time left</Text>
                <Text style={styles.timerText}>{timeLeft}</Text>
              </View>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progressPct}%` }]} />
            </View>

            {/* Photo grid — all empty slots tappable */}
            <View style={styles.grid}>
              {Array.from({ length: REQUIRED_PLANTS }).map((_, i) => {
                const photo = validPhotos[i];
                const isThisLoading = checking && i === validCount;
                const tappable = !photo && !isThisLoading;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.slot, photo && styles.slotFilled, isThisLoading && styles.slotLoading]}
                    onPress={tappable ? onSlotPress : undefined}
                    activeOpacity={tappable ? 0.65 : 1}
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
                    ) : isThisLoading ? (
                      <>
                        <ActivityIndicator color="#3D6142" />
                        <Text style={styles.slotCheckingText}>Checking…</Text>
                      </>
                    ) : (
                      <Text style={styles.slotPlus}>+</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Finish button */}
            <TouchableOpacity
              style={[styles.finishBtn, checking && styles.finishBtnDisabled]}
              onPress={!checking ? handleFinish : null}
              activeOpacity={0.85}
            >
              <Text style={styles.finishBtnText}>Finish adventure</Text>
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

  // ── Error banner ──────────────────────────────────────────────────────────
  errorBanner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#C0392B', paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 54 : 14,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 10,
  },
  errorBannerIcon: { fontSize: 18 },
  errorBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff', lineHeight: 18 },
  errorBannerClose: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: { height: 240, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroTopBar: { position: 'absolute', top: 56, left: 20 },
  heroBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,235,215,0.9)', alignItems: 'center', justifyContent: 'center' },
  heroBtnIcon: { fontSize: 24, color: '#2C1F14', lineHeight: 28 },
  heroTag: { position: 'absolute', bottom: 24, left: 20, backgroundColor: '#3D6142', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  heroTagText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 1.5, textTransform: 'uppercase' },

  // ── Title ─────────────────────────────────────────────────────────────────
  titleBlock: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#2C1F14', lineHeight: 32 },
  summary: { fontSize: 13.5, color: '#7A6651', lineHeight: 20, marginTop: 8 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  metaItem: { fontSize: 12, color: 'rgba(44,31,20,0.7)' },

  // ── State cards ───────────────────────────────────────────────────────────
  stateCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 22, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  stateCardCompleted: { borderColor: 'rgba(61,97,66,0.3)', backgroundColor: 'rgba(61,97,66,0.05)' },
  stateCardExpired: { borderColor: 'rgba(192,57,43,0.3)', backgroundColor: 'rgba(192,57,43,0.05)' },
  stateEmoji: { fontSize: 40, marginBottom: 10 },
  stateTitle: { fontSize: 20, fontWeight: '700', color: '#2C1F14', marginBottom: 8 },
  stateDesc: { fontSize: 13, color: '#7A6651', textAlign: 'center', lineHeight: 19, marginBottom: 4 },
  resetBtn: { marginTop: 10, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(44,31,20,0.25)' },
  resetBtnText: { fontSize: 13, fontWeight: '700', color: '#2C1F14' },

  // ── Start button ──────────────────────────────────────────────────────────
  actionCard: { marginHorizontal: 20, marginBottom: 10 },
  startBtn: { backgroundColor: '#3D6142', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  startBtnMeta: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)', letterSpacing: 1.5, textTransform: 'uppercase' },

  // ── Upload card (in_progress) ──────────────────────────────────────────────
  uploadCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1.5, borderColor: 'rgba(61,97,66,0.2)' },
  uploadTitle: { fontSize: 13, fontWeight: '700', color: '#2C1F14', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  uploadSubtitle: { fontSize: 12, color: '#7A6651', lineHeight: 17, marginBottom: 14 },

  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  progressLabel: { fontSize: 11, color: '#7A6651', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressValue: { fontSize: 15, fontWeight: '700', color: '#3D6142', marginTop: 2 },
  timerBox: { alignItems: 'flex-end' },
  timerLabel: { fontSize: 11, color: '#7A6651', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  timerText: { fontSize: 18, fontWeight: '700', color: '#C0392B', marginTop: 2 },

  track: { height: 8, backgroundColor: 'rgba(44,31,20,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  fill: { height: '100%', borderRadius: 4, backgroundColor: '#3D6142' },

  // ── Photo grid ────────────────────────────────────────────────────────────
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  slot: {
    width: '30%', aspectRatio: 1, borderRadius: 16,
    backgroundColor: 'rgba(61,97,66,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(61,97,66,0.25)', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative',
  },
  slotFilled: { borderStyle: 'solid', borderColor: '#3D6142' },
  slotLoading: { borderStyle: 'solid', borderColor: 'rgba(61,97,66,0.4)' },
  slotImg: { width: '100%', height: '100%' },
  slotBadge: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#3D6142', alignItems: 'center', justifyContent: 'center' },
  slotBadgeText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  slotName: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(44,31,20,0.65)', paddingVertical: 3, paddingHorizontal: 4, fontSize: 9, color: '#fff', textAlign: 'center', fontWeight: '600' },
  slotPlus: { fontSize: 28, color: 'rgba(61,97,66,0.4)', fontWeight: '300' },
  slotCheckingText: { fontSize: 9, color: '#7A6651', marginTop: 4 },

  // ── Finish button ─────────────────────────────────────────────────────────
  finishBtn: { backgroundColor: '#2C1F14', borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  finishBtnDisabled: { backgroundColor: 'rgba(44,31,20,0.4)' },
  finishBtnText: { fontSize: 16, fontWeight: '700', color: '#F5EBD7' },

  // ── Info sections ─────────────────────────────────────────────────────────
  card: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0E6D3', alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#2C1F14', letterSpacing: 1, textTransform: 'uppercase' },
  cardBody: { fontSize: 13, color: 'rgba(44,31,20,0.75)', lineHeight: 20 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { backgroundColor: 'rgba(61,97,66,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  chipText: { fontSize: 11, fontWeight: '700', color: '#3D6142', letterSpacing: 1, textTransform: 'uppercase' },
});
