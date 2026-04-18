import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Easing, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PENNY_HIKE } from '../data/adventures';
import {
  getAdventureProgress, startAdventure, incrementSpins,
  completeAdventure, expireAdventure, resetAdventure,
} from '../db/database';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const REQUIRED_SPINS = 5;
const REQUIRED_DISTANCE_M = 2000;
const STORAGE_KEY = 'penny_hike_progress';

// ─── GPS helpers ─────────────────────────────────────────────────────────────
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
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

// ─── Coin Flipper ─────────────────────────────────────────────────────────────
const SHAFT_W = 90, SHAFT_H = 10, HEAD_W = 20, HEAD_H = 28, TAIL_W = 10, TAIL_H = 16;

function CoinFlipper({ onSpin }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const rotationValue = useRef(new Animated.Value(0)).current;
  const currentDeg = useRef(0);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(null);
    const outcome = Math.random() < 0.5 ? 'RIGHT' : 'LEFT';
    const landingOffset = outcome === 'RIGHT' ? 0 : 180;
    const target = currentDeg.current + (4 + Math.floor(Math.random() * 4)) * 360 + landingOffset;
    Animated.timing(rotationValue, {
      toValue: target,
      duration: 2800 + Math.random() * 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      currentDeg.current = target;
      setIsSpinning(false);
      setResult(outcome);
      onSpin();
    });
  };

  const rotateDeg = rotationValue.interpolate({ inputRange: [-36000, 36000], outputRange: ['-36000deg', '36000deg'] });
  const resultColor = result === 'LEFT' ? '#C0392B' : result === 'RIGHT' ? '#3D6142' : '#7A6651';

  return (
    <View style={coin.wrapper}>
      <Text style={[coin.result, { color: resultColor }]}>
        {result ? `GO ${result}` : isSpinning ? '…' : 'TAP TO FLIP'}
      </Text>
      <TouchableOpacity onPress={spin} activeOpacity={0.85} disabled={isSpinning}>
        <View style={coin.outerRing}>
          <View style={coin.innerCircle}>
            <Animated.View style={[coin.arrowContainer, { transform: [{ rotate: rotateDeg }] }]}>
              <View style={coin.tail} />
              <View style={coin.shaft} />
              <View style={coin.arrowHead} />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>
      {result && (
        <Text style={coin.hint}>
          {result === 'RIGHT' ? '→ Turn right at this crossroad' : '← Turn left at this crossroad'}
        </Text>
      )}
    </View>
  );
}

// ─── DB / storage helpers ─────────────────────────────────────────────────────
async function loadProgress() {
  if (Platform.OS !== 'web') return getAdventureProgress('penny-hike');
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}
async function saveProgress(data) {
  if (Platform.OS !== 'web') return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function formatTimeLeft(startedAt) {
  const left = Math.max(0, TWO_HOURS_MS - (Date.now() - startedAt));
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PennyHikeDetailScreen({ route, navigation }) {
  const isChaos = route.params?.selectedMode?.id === 'social_chaos';

  const [status, setStatus]           = useState('idle');
  const [spins, setSpins]             = useState(0);
  const [startedAt, setStartedAt]     = useState(null);
  const [timeLeft, setTimeLeft]       = useState('');
  const [distanceWalked, setDistanceWalked] = useState(0);
  const [locationStatus, setLocationStatus] = useState('');

  const timerRef       = useRef(null);
  const gpsCleanupRef  = useRef(null);
  const lastPosRef     = useRef(null);
  const spinsRef       = useRef(0);          // mirror for GPS callback closure
  const distanceRef    = useRef(0);

  // ── auto-complete check ──────────────────────────────────────────────────
  const tryComplete = useCallback(async (currentSpins, currentDistance) => {
    if (currentSpins < REQUIRED_SPINS || currentDistance < REQUIRED_DISTANCE_M) return;
    if (Platform.OS !== 'web') completeAdventure('penny-hike');
    else {
      const row = await loadProgress();
      if (row) await saveProgress({ ...row, status: 'completed' });
    }
    setStatus('completed');
    clearInterval(timerRef.current);
    gpsCleanupRef.current?.();
  }, []);

  // ── load progress on mount ───────────────────────────────────────────────
  const refresh = useCallback(async () => {
    const row = await loadProgress();
    if (!row) { setStatus('idle'); return; }
    if (row.status === 'in_progress' && Date.now() - row.started_at > TWO_HOURS_MS) {
      if (Platform.OS !== 'web') expireAdventure('penny-hike');
      else saveProgress({ ...row, status: 'expired' });
      setStatus('expired');
      return;
    }
    setStatus(row.status);
    setSpins(row.spins_count ?? 0);
    spinsRef.current = row.spins_count ?? 0;
    setStartedAt(row.started_at);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'in_progress' || !startedAt) return;
    setTimeLeft(formatTimeLeft(startedAt));
    timerRef.current = setInterval(() => {
      if (TWO_HOURS_MS - (Date.now() - startedAt) <= 0) { clearInterval(timerRef.current); refresh(); return; }
      setTimeLeft(formatTimeLeft(startedAt));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [status, startedAt, refresh]);

  // ── GPS tracking ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'in_progress') return;
    lastPosRef.current = null;
    setDistanceWalked(0);
    distanceRef.current = 0;
    setLocationStatus('Requesting location…');

    let cancelled = false;
    watchPositionCrossPlatform(
      (lat, lon) => {
        if (cancelled) return;
        setLocationStatus('📍 Tracking');
        if (lastPosRef.current) {
          const delta = getDistance(lastPosRef.current.latitude, lastPosRef.current.longitude, lat, lon);
          distanceRef.current += delta;
          setDistanceWalked(distanceRef.current);
          tryComplete(spinsRef.current, distanceRef.current);
        }
        lastPosRef.current = { latitude: lat, longitude: lon };
      },
      (err) => { if (!cancelled) setLocationStatus('⚠️ ' + err); }
    ).then((cleanup) => { gpsCleanupRef.current = cleanup; });

    return () => { cancelled = true; gpsCleanupRef.current?.(); };
  }, [status, tryComplete]);

  // ── actions ──────────────────────────────────────────────────────────────
  async function handleStart() {
    const now = Date.now();
    if (Platform.OS !== 'web') startAdventure('penny-hike');
    else await saveProgress({ adventure_id: 'penny-hike', status: 'in_progress', started_at: now, spins_count: 0 });
    spinsRef.current = 0;
    setSpins(0);
    setStatus('in_progress');
    setStartedAt(now);
  }

  async function handleSpin() {
    if (status !== 'in_progress') return;
    const newSpins = spinsRef.current + 1;
    spinsRef.current = newSpins;
    setSpins(newSpins);
    if (Platform.OS !== 'web') incrementSpins('penny-hike');
    else { const row = await loadProgress(); if (row) await saveProgress({ ...row, spins_count: newSpins }); }
    tryComplete(newSpins, distanceRef.current);
  }

  async function handleReset() {
    if (Platform.OS !== 'web') resetAdventure('penny-hike');
    else await AsyncStorage.removeItem(STORAGE_KEY);
    gpsCleanupRef.current?.();
    clearInterval(timerRef.current);
    spinsRef.current = 0;
    distanceRef.current = 0;
    setStatus('idle'); setSpins(0); setStartedAt(null); setDistanceWalked(0); setLocationStatus('');
  }

  const a = PENNY_HIKE;
  const distancePct = Math.min(100, (distanceWalked / REQUIRED_DISTANCE_M) * 100);
  const spinsPct    = Math.min(100, (spins / REQUIRED_SPINS) * 100);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <View style={styles.hero}>
          <Image source={a.hero} style={styles.heroImg} resizeMode="cover" />
          <LinearGradient colors={['rgba(44,31,20,0.45)', 'transparent', '#F5EBD7']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroTopBar}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.heroBtnIcon}>‹</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroTag}><Text style={styles.heroTagText}>🔥  {a.tag}</Text></View>
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

        {/* ── COMPLETED ── */}
        {status === 'completed' && (
          <View style={[styles.stateCard, styles.stateCardCompleted]}>
            <Text style={styles.stateEmoji}>🏆</Text>
            <Text style={[styles.stateTitle, { color: '#3D6142' }]}>Adventure completed!</Text>
            <Text style={styles.stateDesc}>You spun {spins} times and walked {Math.round(distanceWalked)}m. Chaos well done.</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Start again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── EXPIRED ── */}
        {status === 'expired' && (
          <View style={[styles.stateCard, styles.stateCardExpired]}>
            <Text style={styles.stateEmoji}>⌛</Text>
            <Text style={[styles.stateTitle, { color: '#C0392B' }]}>Time's up</Text>
            <Text style={styles.stateDesc}>The adventure expired. It will come back for you soon.</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── COIN FLIPPER + PROGRESS (idle & in_progress, chaos only) ── */}
        {isChaos && (status === 'idle' || status === 'in_progress') && (
          <View style={styles.flipCard}>
            <Text style={styles.flipTitle}>🪙  Flip at the crossroad</Text>

            {status === 'in_progress' && (
              <View style={styles.progressBlock}>
                {/* Timer */}
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>⏳  Time left</Text>
                  <Text style={styles.progressTimer}>{timeLeft}</Text>
                </View>

                {/* Spins */}
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>🪙  Spins</Text>
                  <Text style={styles.progressValue}>{spins} / {REQUIRED_SPINS}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${spinsPct}%`, backgroundColor: '#C0392B' }]} />
                </View>

                {/* Distance */}
                <View style={[styles.progressRow, { marginTop: 10 }]}>
                  <Text style={styles.progressLabel}>🚶  Distance</Text>
                  <Text style={styles.progressValue}>{Math.round(distanceWalked)}m / 2000m</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${distancePct}%`, backgroundColor: '#3D6142' }]} />
                </View>

                {locationStatus ? <Text style={styles.locationStatus}>{locationStatus}</Text> : null}
              </View>
            )}

            <CoinFlipper onSpin={handleSpin} />

            {status === 'idle' && (
              <TouchableOpacity style={styles.ctaBtn} onPress={handleStart} activeOpacity={0.85}>
                <Text style={styles.ctaBtnText}>Start adventure</Text>
                <Text style={styles.ctaBtnMeta}>2 hours</Text>
              </TouchableOpacity>
            )}
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

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const coin = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: 16 },
  result: { fontSize: 26, fontWeight: '900', letterSpacing: 4, marginBottom: 20, minHeight: 36 },
  outerRing: { width: 180, height: 180, borderRadius: 90, borderWidth: 3, borderColor: '#D4A96A', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(212,169,106,0.08)', shadowColor: '#B8860B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  innerCircle: { width: 138, height: 138, borderRadius: 69, backgroundColor: '#FFF8ED', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E8C88A' },
  arrowContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  tail: { width: TAIL_W, height: TAIL_H, backgroundColor: '#2C1F14', borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
  shaft: { width: SHAFT_W, height: SHAFT_H, backgroundColor: '#2C1F14' },
  arrowHead: { width: 0, height: 0, borderTopWidth: HEAD_H / 2, borderBottomWidth: HEAD_H / 2, borderLeftWidth: HEAD_W, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#2C1F14' },
  hint: { marginTop: 16, fontSize: 14, fontWeight: '600', color: '#7A6651', textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },
  scroll: { paddingBottom: 16 },

  hero: { height: 240, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroTopBar: { position: 'absolute', top: 56, left: 20 },
  heroBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,235,215,0.9)', alignItems: 'center', justifyContent: 'center' },
  heroBtnIcon: { fontSize: 24, color: '#2C1F14', lineHeight: 28 },
  heroTag: { position: 'absolute', bottom: 24, left: 20, backgroundColor: '#C0392B', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  heroTagText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 1.5, textTransform: 'uppercase' },

  titleBlock: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#2C1F14', lineHeight: 32 },
  summary: { fontSize: 13.5, color: '#7A6651', lineHeight: 20, marginTop: 8 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  metaItem: { fontSize: 12, color: 'rgba(44,31,20,0.7)' },

  stateCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 22, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  stateCardCompleted: { borderColor: 'rgba(61,97,66,0.3)', backgroundColor: 'rgba(61,97,66,0.05)' },
  stateCardExpired: { borderColor: 'rgba(192,57,43,0.3)', backgroundColor: 'rgba(192,57,43,0.05)' },
  stateEmoji: { fontSize: 40, marginBottom: 10 },
  stateTitle: { fontSize: 20, fontWeight: '700', color: '#2C1F14', marginBottom: 8 },
  stateDesc: { fontSize: 13, color: '#7A6651', textAlign: 'center', lineHeight: 19 },

  flipCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  flipTitle: { fontSize: 13, fontWeight: '700', color: '#2C1F14', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },

  progressBlock: { marginBottom: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: '#7A6651', fontWeight: '600' },
  progressTimer: { fontSize: 18, fontWeight: '700', color: '#C0392B' },
  progressValue: { fontSize: 15, fontWeight: '700', color: '#2C1F14' },
  track: { height: 8, backgroundColor: 'rgba(44,31,20,0.1)', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  locationStatus: { marginTop: 8, fontSize: 11, color: '#7A6651', fontStyle: 'italic' },

  card: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0E6D3', alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#2C1F14', letterSpacing: 1, textTransform: 'uppercase' },
  cardBody: { fontSize: 13, color: 'rgba(44,31,20,0.75)', lineHeight: 20 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { backgroundColor: 'rgba(192,57,43,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  chipText: { fontSize: 11, fontWeight: '700', color: '#C0392B', letterSpacing: 1, textTransform: 'uppercase' },

  ctaBtn: { backgroundColor: '#C0392B', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  ctaBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  ctaBtnMeta: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)', letterSpacing: 1.5, textTransform: 'uppercase' },
  resetBtn: { marginTop: 14, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(44,31,20,0.25)' },
  resetBtnText: { fontSize: 13, fontWeight: '700', color: '#2C1F14' },
});
