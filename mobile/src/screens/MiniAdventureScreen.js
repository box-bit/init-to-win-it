import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Alert, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADVENTURE_POINTS } from '../data/adventures';
import {
  getAdventureProgress, startAdventure,
  completeAdventure, expireAdventure, resetAdventure,
} from '../db/database';
import { addScore, addKm } from '../score';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const COMPLETION_RADIUS_M = 25;
const ADVENTURE_ID = 'mini-adventure';
const STORAGE_KEY = 'mini_adventure_progress';
const MAP_SIZE = Dimensions.get('window').width - 40;
const MAP_RADIUS = MAP_SIZE / 2 - 24;
const MAX_DIST_M = 2200;

// ─── GPS helpers ──────────────────────────────────────────────────────────────
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

const getBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const la1 = (lat1 * Math.PI) / 180;
  const la2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
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

function generateDestination(lat, lon) {
  const distM = 500 + Math.random() * 1500;
  const bearing = Math.random() * 360;
  const bearingRad = (bearing * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const destLat = lat + (distM * Math.cos(bearingRad)) / 111320;
  const destLon = lon + (distM * Math.sin(bearingRad)) / (111320 * Math.cos(latRad));
  return { latitude: destLat, longitude: destLon };
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
async function loadProgress() {
  if (Platform.OS !== 'web') return getAdventureProgress(ADVENTURE_ID);
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

// ─── Radar Map ────────────────────────────────────────────────────────────────
function RadarMap({ bearing, distToDest, arrived, hasDestination, locationStatus }) {
  const center = MAP_SIZE / 2;

  // Destination dot position (user always at center)
  let destX = null;
  let destY = null;
  if (hasDestination && distToDest !== null) {
    const scale = Math.min(distToDest / MAX_DIST_M, 1);
    const bearingRad = (bearing * Math.PI) / 180;
    const rawX = center + Math.sin(bearingRad) * scale * MAP_RADIUS;
    const rawY = center - Math.cos(bearingRad) * scale * MAP_RADIUS;
    // Clamp to map boundary
    const dx = rawX - center;
    const dy = rawY - center;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MAP_RADIUS) {
      const f = MAP_RADIUS / dist;
      destX = center + dx * f;
      destY = center + dy * f;
    } else {
      destX = rawX;
      destY = rawY;
    }
  }

  const DOT = 10;
  const PIN = 14;

  return (
    <View style={map.container}>
      {/* Grid rings */}
      {[0.33, 0.66, 1].map((r) => (
        <View
          key={r}
          style={[map.ring, {
            width: MAP_RADIUS * 2 * r,
            height: MAP_RADIUS * 2 * r,
            borderRadius: MAP_RADIUS * r,
            left: center - MAP_RADIUS * r,
            top: center - MAP_RADIUS * r,
          }]}
        />
      ))}

      {/* Cross hairs */}
      <View style={[map.crossH, { top: center - 0.5, left: 16, right: 16 }]} />
      <View style={[map.crossV, { left: center - 0.5, top: 16, bottom: 16 }]} />

      {/* Compass labels */}
      <Text style={[map.compass, { top: 4, left: center - 6 }]}>N</Text>
      <Text style={[map.compass, { bottom: 4, left: center - 5 }]}>S</Text>
      <Text style={[map.compass, { left: 4, top: center - 8 }]}>W</Text>
      <Text style={[map.compass, { right: 4, top: center - 8 }]}>E</Text>

      {/* Line from user to destination */}
      {destX !== null && (
        <View
          style={[map.line, lineStyle(center, center, destX, destY)]}
        />
      )}

      {/* Destination pin */}
      {destX !== null && (
        <View style={[map.pin, arrived && map.pinArrived, {
          left: destX - PIN / 2,
          top: destY - PIN / 2,
          width: PIN,
          height: PIN,
          borderRadius: PIN / 2,
        }]}>
          <Text style={map.pinText}>{arrived ? '✓' : '📍'}</Text>
        </View>
      )}

      {/* User dot */}
      <View style={[map.userDot, {
        left: center - DOT / 2,
        top: center - DOT / 2,
        width: DOT + 8,
        height: DOT + 8,
        borderRadius: (DOT + 8) / 2,
      }]} />
      <View style={[map.userDotInner, {
        left: center - DOT / 2 + 3,
        top: center - DOT / 2 + 3,
        width: DOT + 2,
        height: DOT + 2,
        borderRadius: (DOT + 2) / 2,
      }]} />

      {/* Status overlay */}
      {!hasDestination && (
        <View style={map.statusOverlay}>
          <Text style={map.statusText}>
            {locationStatus || 'Waiting for GPS…'}
          </Text>
        </View>
      )}
    </View>
  );
}

function lineStyle(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return {
    width: length,
    transform: [{ rotate: `${angle}deg` }],
    left: x1,
    top: y1,
  };
}

const map = StyleSheet.create({
  container: { width: MAP_SIZE, height: MAP_SIZE, backgroundColor: '#EDE3D4', borderRadius: 20, overflow: 'hidden', position: 'relative', borderWidth: 1.5, borderColor: 'rgba(44,31,20,0.1)' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(44,31,20,0.1)', backgroundColor: 'transparent' },
  crossH: { position: 'absolute', height: 1, backgroundColor: 'rgba(44,31,20,0.08)' },
  crossV: { position: 'absolute', width: 1, backgroundColor: 'rgba(44,31,20,0.08)' },
  compass: { position: 'absolute', fontSize: 9, fontWeight: '700', color: 'rgba(44,31,20,0.35)', letterSpacing: 0.5 },
  line: { position: 'absolute', height: 1.5, backgroundColor: 'rgba(192,57,43,0.4)', transformOrigin: '0 50%' },
  pin: { position: 'absolute', backgroundColor: '#C0392B', alignItems: 'center', justifyContent: 'center' },
  pinArrived: { backgroundColor: '#3D6142' },
  pinText: { fontSize: 10 },
  userDot: { position: 'absolute', backgroundColor: 'rgba(44,120,210,0.2)' },
  userDotInner: { position: 'absolute', backgroundColor: '#2878D2' },
  statusOverlay: { position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center' },
  statusText: { fontSize: 10, color: 'rgba(44,31,20,0.5)', fontStyle: 'italic' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MiniAdventureScreen({ route, navigation }) {
  const [status, setStatus]                 = useState('idle');
  const [startedAt, setStartedAt]           = useState(null);
  const [timeLeft, setTimeLeft]             = useState('');
  const [timePct, setTimePct]               = useState(0);
  const [locationStatus, setLocationStatus] = useState('');
  const [destination, setDestination]       = useState(null);
  const [distToDest, setDistToDest]         = useState(null);
  const [bearing, setBearing]               = useState(0);
  const [distanceWalked, setDistanceWalked] = useState(0);

  const timerRef       = useRef(null);
  const gpsCleanupRef  = useRef(null);
  const lastPosRef     = useRef(null);
  const distanceRef    = useRef(0);
  const destinationRef = useRef(null);

  // ── load progress ────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    const row = await loadProgress();
    if (!row) { setStatus('idle'); return; }
    if (row.status === 'in_progress' && Date.now() - row.started_at > TWO_HOURS_MS) {
      if (Platform.OS !== 'web') expireAdventure(ADVENTURE_ID);
      else saveProgress({ ...row, status: 'expired' });
      setStatus('expired');
      return;
    }
    setStatus(row.status);
    setStartedAt(row.started_at);
    if (row.destination) {
      setDestination(row.destination);
      destinationRef.current = row.destination;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'in_progress' || !startedAt) return;
    const tick = () => {
      const left = Math.max(0, TWO_HOURS_MS - (Date.now() - startedAt));
      setTimeLeft(formatTimeLeft(startedAt));
      setTimePct(1 - left / TWO_HOURS_MS);
      if (left <= 0) { clearInterval(timerRef.current); refresh(); }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [status, startedAt, refresh]);

  // ── GPS tracking (always on while screen open) ────────────────────────────
  useEffect(() => {
    lastPosRef.current = null;
    if (status === 'in_progress') {
      distanceRef.current = 0;
      setDistanceWalked(0);
    }
    setLocationStatus('Requesting location…');

    let cancelled = false;
    watchPositionCrossPlatform(
      (lat, lon) => {
        if (cancelled) return;
        setLocationStatus('');
        if (lastPosRef.current && status === 'in_progress') {
          const delta = getDistance(lastPosRef.current.latitude, lastPosRef.current.longitude, lat, lon);
          distanceRef.current += delta;
          setDistanceWalked(distanceRef.current);
        }
        lastPosRef.current = { latitude: lat, longitude: lon };
        const dest = destinationRef.current;
        if (dest) {
          setDistToDest(getDistance(lat, lon, dest.latitude, dest.longitude));
          setBearing(getBearing(lat, lon, dest.latitude, dest.longitude));
        }
      },
      (err) => { if (!cancelled) setLocationStatus('⚠️ ' + err); }
    ).then((cleanup) => { gpsCleanupRef.current = cleanup; });

    return () => { cancelled = true; gpsCleanupRef.current?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ── actions ──────────────────────────────────────────────────────────────
  async function handleStart() {
    const pos = lastPosRef.current;
    if (!pos) {
      Alert.alert('Location needed', 'Still acquiring GPS signal. Try again in a moment.');
      return;
    }
    const dest = generateDestination(pos.latitude, pos.longitude);
    destinationRef.current = dest;
    setDestination(dest);
    setDistToDest(getDistance(pos.latitude, pos.longitude, dest.latitude, dest.longitude));
    setBearing(getBearing(pos.latitude, pos.longitude, dest.latitude, dest.longitude));

    const now = Date.now();
    if (Platform.OS !== 'web') startAdventure(ADVENTURE_ID);
    else await saveProgress({ adventure_id: ADVENTURE_ID, status: 'in_progress', started_at: now, destination: dest });
    distanceRef.current = 0;
    setStatus('in_progress');
    setStartedAt(now);
  }

  async function handleFinish() {
    const arrived = distToDest !== null && distToDest <= COMPLETION_RADIUS_M;
    if (!arrived) {
      Alert.alert('Not there yet', `You need to be within ${COMPLETION_RADIUS_M}m.\n\nCurrently ${distToDest !== null ? Math.round(distToDest) : '?'}m away.`);
      return;
    }
    if (Platform.OS !== 'web') completeAdventure(ADVENTURE_ID);
    else {
      const row = await loadProgress();
      if (row) await saveProgress({ ...row, status: 'completed' });
    }
    clearInterval(timerRef.current);
    gpsCleanupRef.current?.();
    await addKm(distanceRef.current / 1000);
    const pts = ADVENTURE_POINTS[ADVENTURE_ID] ?? 6;
    const totalScore = await addScore(pts);
    navigation.navigate('AdventureComplete', {
      points: pts,
      totalScore,
      stats: [{ label: 'Walked', value: String(Math.round(distanceRef.current)), unit: 'm' }],
    });
  }

  async function handleReset() {
    if (Platform.OS !== 'web') resetAdventure(ADVENTURE_ID);
    else await AsyncStorage.removeItem(STORAGE_KEY);
    clearInterval(timerRef.current);
    distanceRef.current = 0;
    destinationRef.current = null;
    setStatus('idle');
    setStartedAt(null);
    setDistanceWalked(0);
    setDistToDest(null);
    setDestination(null);
    setTimePct(0);
    setTimeLeft('');
  }

  const arrived = distToDest !== null && distToDest <= COMPLETION_RADIUS_M;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTag}>✍️  Leave a Message</Text>
          <View style={styles.ptsBadge}>
            <Text style={styles.ptsBadgeText}>+{ADVENTURE_POINTS[ADVENTURE_ID] ?? 6} pts</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Go to the spot</Text>
          <Text style={styles.summary}>
            Walk to a random location within 2km. Leave a handwritten message on paper when you arrive.
          </Text>
        </View>

        {/* ── EXPIRED ── */}
        {status === 'expired' && (
          <View style={[styles.stateCard, styles.stateCardExpired]}>
            <Text style={styles.stateEmoji}>⌛</Text>
            <Text style={[styles.stateTitle, { color: '#C0392B' }]}>Time's up</Text>
            <Text style={styles.stateDesc}>Adventure expired. Try again whenever you're ready.</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {status !== 'expired' && (
          <View style={styles.mainCard}>

            {/* ── IDLE: start button ── */}
            {status === 'idle' && (
              <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
                <Text style={styles.startBtnText}>Start Adventure</Text>
                <Text style={styles.startBtnMeta}>2 HOURS</Text>
              </TouchableOpacity>
            )}

            {/* ── IN PROGRESS: time bar + finish ── */}
            {status === 'in_progress' && (
              <>
                {/* Time bar */}
                <View style={styles.timeBarBlock}>
                  <View style={styles.timeBarRow}>
                    <Text style={styles.timeBarLabel}>⏳  Time remaining</Text>
                    <Text style={styles.timeBarValue}>{timeLeft}</Text>
                  </View>
                  <View style={styles.timeBarTrack}>
                    <View style={[styles.timeBarFill, { width: `${timePct * 100}%` }]} />
                  </View>
                </View>

                {/* Distance info */}
                <View style={styles.distRow}>
                  <View style={styles.distItem}>
                    <Text style={styles.distLabel}>🚶 Walked</Text>
                    <Text style={styles.distValue}>{Math.round(distanceWalked)}m</Text>
                  </View>
                  <View style={styles.distDivider} />
                  <View style={styles.distItem}>
                    <Text style={styles.distLabel}>🎯 To destination</Text>
                    <Text style={[styles.distValue, arrived && { color: '#3D6142' }]}>
                      {distToDest !== null ? `${Math.round(distToDest)}m` : '…'}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Map — always shown (idle + in_progress) */}
            <View style={styles.mapWrapper}>
              <RadarMap
                bearing={bearing}
                distToDest={distToDest}
                arrived={arrived}
                hasDestination={!!destination}
                locationStatus={locationStatus}
              />
              {destination && distToDest !== null && (
                <Text style={styles.mapCaption}>
                  {arrived
                    ? '✅ You\'re at the destination!'
                    : `📍 ${Math.round(distToDest)}m to destination`}
                </Text>
              )}
              {!destination && (
                <Text style={styles.mapCaption}>Your position · destination appears after start</Text>
              )}
            </View>

            {/* Finish button */}
            {status === 'in_progress' && (
              <TouchableOpacity
                style={[styles.finishBtn, !arrived && styles.finishBtnDisabled]}
                onPress={handleFinish}
                activeOpacity={arrived ? 0.85 : 0.6}
              >
                <Text style={styles.finishBtnText}>
                  {arrived ? 'Finish Adventure ✓' : `Get within 25m to finish`}
                </Text>
              </TouchableOpacity>
            )}

          </View>
        )}

        {/* Info cards */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}><Text style={{ fontSize: 18 }}>✍️</Text></View>
            <Text style={styles.cardLabel}>The task</Text>
          </View>
          <Text style={styles.cardBody}>
            Walk to the pin on the map. Within 25 metres the finish button unlocks.
            Leave a handwritten message on paper — a word, a thought, a drawing.
          </Text>
          <View style={styles.chips}>
            <View style={styles.chip}><Text style={styles.chipText}>Urban</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>Discovery</Text></View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}><Text style={{ fontSize: 18 }}>🛡</Text></View>
            <Text style={styles.cardLabel}>Stay safe</Text>
          </View>
          <Text style={styles.cardBody}>
            Stick to public spaces. Share your location with someone before you set off.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },
  scroll: { paddingBottom: 16 },

  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, gap: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(44,31,20,0.08)', alignItems: 'center', justifyContent: 'center' },
  backBtnIcon: { fontSize: 24, color: '#2C1F14', lineHeight: 28 },
  headerTag: { flex: 1, fontSize: 13, fontWeight: '700', color: '#2C1F14', letterSpacing: 1 },
  ptsBadge: { backgroundColor: '#D4A96A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  ptsBadgeText: { fontSize: 12, fontWeight: '800', color: '#2C1F14' },

  titleBlock: { paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 26, fontWeight: '700', color: '#2C1F14', lineHeight: 30 },
  summary: { fontSize: 13, color: '#7A6651', lineHeight: 19, marginTop: 6 },

  stateCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 22, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  stateCardExpired: { borderColor: 'rgba(192,57,43,0.3)', backgroundColor: 'rgba(192,57,43,0.05)' },
  stateEmoji: { fontSize: 40, marginBottom: 10 },
  stateTitle: { fontSize: 20, fontWeight: '700', color: '#2C1F14', marginBottom: 8 },
  stateDesc: { fontSize: 13, color: '#7A6651', textAlign: 'center', lineHeight: 19 },

  mainCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)', gap: 14 },

  startBtn: { backgroundColor: '#C0392B', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  startBtnMeta: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 },

  timeBarBlock: { gap: 6 },
  timeBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeBarLabel: { fontSize: 12, fontWeight: '600', color: '#7A6651' },
  timeBarValue: { fontSize: 17, fontWeight: '700', color: '#C0392B' },
  timeBarTrack: { height: 10, backgroundColor: 'rgba(44,31,20,0.1)', borderRadius: 5, overflow: 'hidden' },
  timeBarFill: { height: '100%', backgroundColor: '#C0392B', borderRadius: 5 },

  distRow: { flexDirection: 'row', backgroundColor: 'rgba(44,31,20,0.04)', borderRadius: 14, padding: 12 },
  distItem: { flex: 1, alignItems: 'center', gap: 2 },
  distLabel: { fontSize: 11, color: '#7A6651', fontWeight: '600' },
  distValue: { fontSize: 18, fontWeight: '700', color: '#2C1F14' },
  distDivider: { width: 1, backgroundColor: 'rgba(44,31,20,0.1)', marginVertical: 2 },

  mapWrapper: { alignItems: 'center', gap: 8 },
  mapCaption: { fontSize: 12, color: '#7A6651', fontStyle: 'italic', textAlign: 'center' },

  finishBtn: { backgroundColor: '#3D6142', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  finishBtnDisabled: { backgroundColor: 'rgba(61,97,66,0.3)' },
  finishBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  card: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0E6D3', alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#2C1F14', letterSpacing: 1, textTransform: 'uppercase' },
  cardBody: { fontSize: 13, color: 'rgba(44,31,20,0.75)', lineHeight: 20 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chip: { backgroundColor: 'rgba(192,57,43,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  chipText: { fontSize: 11, fontWeight: '700', color: '#C0392B', letterSpacing: 1, textTransform: 'uppercase' },

  resetBtn: { marginTop: 14, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(44,31,20,0.25)' },
  resetBtnText: { fontSize: 13, fontWeight: '700', color: '#2C1F14' },
});
