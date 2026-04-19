import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADVENTURE_MAP, ADVENTURE_POINTS } from '../data/adventures';
import {
  getAdventureProgress, startAdventure, completeAdventure,
  expireAdventure, resetAdventure,
} from '../db/database';
import { addScore, addKm } from '../score';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const MODE_COLORS = {
  social_chaos:  '#C0392B',
  survivalist:   '#3D6142',
  urban_explore: '#C87941',
};

// ─── GPS helpers ──────────────────────────────────────────────────────────────
const gpsGetDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const watchPositionCrossPlatform = async (onUpdate, onError) => {
  if (Platform.OS === 'web') {
    if (!navigator?.geolocation) { onError('Geolocation not supported.'); return () => {}; }
    const id = navigator.geolocation.watchPosition(
      (pos) => onUpdate(pos.coords.latitude, pos.coords.longitude),
      (err) => onError(err.message),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(id);
  } else {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { onError('Location permission denied.'); return () => {}; }
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (loc) => onUpdate(loc.coords.latitude, loc.coords.longitude)
    );
    return () => sub.remove();
  }
};

function formatTimeLeft(startedAt) {
  const left = Math.max(0, TWO_HOURS_MS - (Date.now() - startedAt));
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Web storage helpers ──────────────────────────────────────────────────────
function webKey(adventureId) { return `simple_adventure_progress_${adventureId}`; }
async function webLoadProgress(adventureId) {
  const raw = await AsyncStorage.getItem(webKey(adventureId));
  return raw ? JSON.parse(raw) : null;
}
async function webSaveProgress(adventureId, data) {
  await AsyncStorage.setItem(webKey(adventureId), JSON.stringify(data));
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SimpleAdventureScreen({ route, navigation }) {
  const { adventureId, selectedMode } = route.params ?? {};
  const adventure = ADVENTURE_MAP[adventureId];
  const accent = MODE_COLORS[selectedMode?.id] ?? '#C87941';

  const [status, setStatus]     = useState('idle');
  const [startedAt, setStartedAt] = useState(null);
  const [timeLeft, setTimeLeft]   = useState('');

  const timerRef      = useRef(null);
  const gpsCleanupRef = useRef(null);
  const lastPosRef    = useRef(null);
  const distanceRef   = useRef(0);

  const refresh = useCallback(async () => {
    if (Platform.OS !== 'web') {
      const row = getAdventureProgress(adventureId);
      if (!row) { setStatus('idle'); return; }
      if (Date.now() - row.started_at > TWO_HOURS_MS) {
        expireAdventure(adventureId);
        setStatus('expired');
        return;
      }
      setStatus(row.status);
      setStartedAt(row.started_at);
    } else {
      const row = await webLoadProgress(adventureId);
      if (!row) { setStatus('idle'); return; }
      if (row.status === 'in_progress' && Date.now() - row.started_at > TWO_HOURS_MS) {
        await webSaveProgress(adventureId, { ...row, status: 'expired' });
        setStatus('expired');
        return;
      }
      setStatus(row.status);
      setStartedAt(row.started_at);
    }
  }, [adventureId]);

  useEffect(() => { refresh(); }, [refresh]);

  // countdown timer
  useEffect(() => {
    if (status !== 'in_progress' || !startedAt) return;
    setTimeLeft(formatTimeLeft(startedAt));
    timerRef.current = setInterval(() => {
      if (TWO_HOURS_MS - (Date.now() - startedAt) <= 0) {
        clearInterval(timerRef.current);
        refresh();
        return;
      }
      setTimeLeft(formatTimeLeft(startedAt));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [status, startedAt, refresh]);

  // GPS tracking
  useEffect(() => {
    if (status !== 'in_progress') return;
    lastPosRef.current = null;
    distanceRef.current = 0;
    let cancelled = false;
    watchPositionCrossPlatform(
      (lat, lon) => {
        if (cancelled) return;
        if (lastPosRef.current) {
          distanceRef.current += gpsGetDistance(lastPosRef.current.latitude, lastPosRef.current.longitude, lat, lon);
        }
        lastPosRef.current = { latitude: lat, longitude: lon };
      },
      () => {}
    ).then((cleanup) => { gpsCleanupRef.current = cleanup; });
    return () => { cancelled = true; gpsCleanupRef.current?.(); };
  }, [status]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    gpsCleanupRef.current?.();
  }, []);

  async function handleStart() {
    const now = Date.now();
    if (Platform.OS !== 'web') startAdventure(adventureId);
    else await webSaveProgress(adventureId, { adventure_id: adventureId, status: 'in_progress', started_at: now });
    distanceRef.current = 0;
    setStatus('in_progress');
    setStartedAt(now);
  }

  async function handleFinish() {
    if (Platform.OS !== 'web') completeAdventure(adventureId);
    else await webSaveProgress(adventureId, { status: 'completed', started_at: startedAt });
    clearInterval(timerRef.current);
    gpsCleanupRef.current?.();
    await addKm(distanceRef.current / 1000);
    const pts = ADVENTURE_POINTS[adventureId] ?? 5;
    const totalScore = await addScore(pts);
    navigation.navigate('AdventureComplete', {
      points: pts,
      totalScore,
      hero: adventure.hero,
      tag: adventure.tag,
      stats: [
        { label: 'Walked', value: (distanceRef.current / 1000).toFixed(2), unit: 'km' },
      ],
    });
  }

  async function handleReset() {
    if (Platform.OS !== 'web') resetAdventure(adventureId);
    else await AsyncStorage.removeItem(webKey(adventureId));
    clearInterval(timerRef.current);
    gpsCleanupRef.current?.();
    distanceRef.current = 0;
    setStatus('idle');
    setStartedAt(null);
  }

  if (!adventure) {
    return (
      <View style={styles.container}>
        <Text style={{ padding: 40, color: '#7A6651' }}>Adventure not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <Image source={adventure.hero} style={styles.heroImg} resizeMode="cover" />
          <LinearGradient colors={['rgba(44,31,20,0.45)', 'transparent', '#F5EBD7']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroTopBar}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.heroBtnIcon}>‹</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.heroTag, { backgroundColor: accent }]}>
            <Text style={styles.heroTagText}>{adventure.tag}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{adventure.title}</Text>
            <View style={styles.ptsBadge}>
              <Text style={styles.ptsBadgeText}>+{ADVENTURE_POINTS[adventureId] ?? 5} pts</Text>
            </View>
          </View>
          <Text style={styles.summary}>{adventure.summary}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaItem}>⏱  {adventure.duration}</Text>
            <Text style={styles.metaItem}>📍  {adventure.distance}</Text>
            <Text style={styles.metaItem}>🗺  {adventure.location}</Text>
          </View>
        </View>

        {/* Expired */}
        {status === 'expired' && (
          <View style={[styles.stateCard, { borderColor: 'rgba(192,57,43,0.3)', backgroundColor: 'rgba(192,57,43,0.05)' }]}>
            <Text style={styles.stateEmoji}>⌛</Text>
            <Text style={[styles.stateTitle, { color: '#C0392B' }]}>Time's up</Text>
            <Text style={styles.stateDesc}>The adventure window expired. Try again whenever you're ready.</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Idle */}
        {status === 'idle' && (
          <View style={styles.actionCard}>
            <TouchableOpacity style={[styles.startBtn, { backgroundColor: accent }]} onPress={handleStart} activeOpacity={0.85}>
              <Text style={styles.startBtnText}>Start adventure</Text>
              <Text style={styles.startBtnMeta}>{adventure.duration}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* In progress */}
        {status === 'in_progress' && (
          <View style={[styles.progressCard, { borderColor: `${accent}33` }]}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>⏳  Time left</Text>
              <Text style={[styles.progressTimer, { color: accent }]}>{timeLeft}</Text>
            </View>
            <TouchableOpacity
              style={[styles.finishBtn, { backgroundColor: accent }]}
              onPress={handleFinish}
              activeOpacity={0.85}
            >
              <Text style={styles.finishBtnText}>Mark as done ✓</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info sections */}
        {adventure.sections.map((s) => (
          <View key={s.label} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}><Text style={{ fontSize: 18 }}>{s.emoji}</Text></View>
              <Text style={styles.cardLabel}>{s.label}</Text>
            </View>
            <Text style={styles.cardBody}>{s.body}</Text>
            {s.chips && (
              <View style={styles.chips}>
                {s.chips.map((c) => (
                  <View key={c} style={[styles.chip, { backgroundColor: `${accent}18` }]}>
                    <Text style={[styles.chipText, { color: accent }]}>{c}</Text>
                  </View>
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
  heroTag: { position: 'absolute', bottom: 24, left: 20, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  heroTagText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 1.5, textTransform: 'uppercase' },

  titleBlock: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#2C1F14', lineHeight: 32, flex: 1 },
  ptsBadge: { backgroundColor: '#D4A96A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  ptsBadgeText: { fontSize: 12, fontWeight: '800', color: '#2C1F14' },
  summary: { fontSize: 13.5, color: '#7A6651', lineHeight: 20, marginTop: 8 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  metaItem: { fontSize: 12, color: 'rgba(44,31,20,0.7)' },

  stateCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 22, padding: 24, alignItems: 'center', borderWidth: 1 },
  stateEmoji: { fontSize: 40, marginBottom: 10 },
  stateTitle: { fontSize: 20, fontWeight: '700', color: '#2C1F14', marginBottom: 8 },
  stateDesc: { fontSize: 13, color: '#7A6651', textAlign: 'center', lineHeight: 19 },
  resetBtn: { marginTop: 14, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(44,31,20,0.25)' },
  resetBtnText: { fontSize: 13, fontWeight: '700', color: '#2C1F14' },

  actionCard: { marginHorizontal: 20, marginBottom: 10 },
  startBtn: { borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  startBtnMeta: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)', letterSpacing: 1.5, textTransform: 'uppercase' },

  progressCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1.5 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  progressLabel: { fontSize: 13, color: '#7A6651', fontWeight: '600' },
  progressTimer: { fontSize: 20, fontWeight: '700' },
  finishBtn: { borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  finishBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  card: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0E6D3', alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#2C1F14', letterSpacing: 1, textTransform: 'uppercase' },
  cardBody: { fontSize: 13, color: 'rgba(44,31,20,0.75)', lineHeight: 20 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  chipText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});
