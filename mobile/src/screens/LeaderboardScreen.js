import { useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Platform, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { getUserScore } from '../score';
import { getCompletedAdventures } from '../db/database';
import { ADVENTURE_POINTS } from '../data/adventures';

// ─── Mock API ─────────────────────────────────────────────────────────────────
// Replace this function body with a real fetch() call when the backend is ready.
// Expected response shape: Array<{ id, name, avatar, score }>
async function fetchLeaderboard() {
  await new Promise(r => setTimeout(r, 900));
  return [
    { id: 'm1', name: 'WildRoamer',    avatar: 'fox',     score: 67 },
    { id: 'm2', name: 'BearKnight',    avatar: 'bear',    score: 54 },
    { id: 'm3', name: 'RaccoonKing',   avatar: 'raccoon', score: 48 },
    { id: 'm4', name: 'ForestRunner',  avatar: 'fox',     score: 41 },
    { id: 'm5', name: 'NatureHunter',  avatar: 'bear',    score: 35 },
    { id: 'm6', name: 'UrbanFox',      avatar: 'fox',     score: 28 },
    { id: 'm7', name: 'ChaosBear',     avatar: 'raccoon', score: 22 },
    { id: 'm8', name: 'Survivalist88', avatar: 'bear',    score: 18 },
    { id: 'm9', name: 'WalkingFox',    avatar: 'fox',     score: 13 },
    { id: 'm10', name: 'NewExplorer',  avatar: 'raccoon', score: 8  },
  ];
}

// ─── Assets ───────────────────────────────────────────────────────────────────
const AVATAR_IMGS = {
  fox:     require('../../assets/avatar-fox.png'),
  bear:    require('../../assets/avatar-bear.png'),
  raccoon: require('../../assets/avatar-raccoon.png'),
};

const MINI_ADVENTURE_ASSETS = {
  'penny-hike':      { img: require('../../assets/scene-campfire.jpg'), emoji: '🪙' },
  'find-the-nature': { img: require('../../assets/scene-forest.jpg'),   emoji: '🌿' },
};

const RANK_LABELS = ['🥇', '🥈', '🥉'];

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function PlayerRow({ rank, name, avatar, score, isYou }) {
  const bg     = isYou ? 'rgba(200,121,65,0.12)' : '#fff';
  const border = isYou ? 'rgba(200,121,65,0.4)'  : 'rgba(44,31,20,0.07)';
  return (
    <View style={[styles.row, { backgroundColor: bg, borderColor: border }]}>
      <View style={styles.rankBox}>
        {rank <= 3
          ? <Text style={styles.rankEmoji}>{RANK_LABELS[rank - 1]}</Text>
          : <Text style={[styles.rankNum, isYou && { color: '#C87941' }]}>#{rank}</Text>
        }
      </View>
      <View style={styles.avatarBox}>
        <Image source={AVATAR_IMGS[avatar] ?? AVATAR_IMGS.fox} style={styles.avatarImg} resizeMode="cover" />
      </View>
      <Text style={[styles.rowName, isYou && { color: '#C87941', fontWeight: '800' }]} numberOfLines={1}>
        {isYou ? 'You' : name}
      </Text>
      {isYou && <View style={styles.youBadge}><Text style={styles.youBadgeText}>YOU</Text></View>}
      <Text style={[styles.rowScore, isYou && { color: '#C87941' }]}>{score} pts</Text>
    </View>
  );
}

function CompletedCard({ adventure }) {
  const assets = MINI_ADVENTURE_ASSETS[adventure.id] ?? { img: require('../../assets/scene-campfire.jpg'), emoji: '🏕' };
  const pts = ADVENTURE_POINTS[adventure.id] ?? 0;
  return (
    <View style={styles.completedCard}>
      <Image source={assets.img} style={styles.completedImg} resizeMode="cover" />
      <View style={styles.completedBody}>
        <View style={styles.completedTop}>
          <Text style={styles.completedEmoji}>{assets.emoji}</Text>
          <View style={styles.ptsBadge}>
            <Text style={styles.ptsBadgeText}>+{pts} pts</Text>
          </View>
        </View>
        <Text style={styles.completedTitle}>{adventure.title}</Text>
        <Text style={styles.completedTag}>{adventure.tag}</Text>
        <Text style={styles.completedDate}>Completed {formatDate(adventure.completed_at ?? adventure.started_at)}</Text>
      </View>
      <View style={styles.checkBadge}>
        <Text style={styles.checkIcon}>✓</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const [tab, setTab]               = useState('rankings');
  const [players, setPlayers]       = useState([]);
  const [userScore, setUserScore]   = useState(0);
  const [userRank, setUserRank]     = useState(null);
  const [completed, setCompleted]   = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCompleted = useCallback(() => {
    if (Platform.OS !== 'web') {
      try {
        const rows = getCompletedAdventures();
        console.log('[Leaderboard] completed adventures:', rows.length, rows);
        setCompleted(rows);
      } catch (e) {
        console.error('[Leaderboard] loadCompleted failed:', e);
      }
    }
  }, []);

  const loadRankings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [remote, local] = await Promise.all([fetchLeaderboard(), getUserScore()]);
      setUserScore(local);
      const withUser = [...remote, { id: 'me', name: 'You', avatar: 'fox', score: local, isYou: true }]
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({ ...p, rank: i + 1 }));
      setPlayers(withUser);
      setUserRank(withUser.find(p => p.id === 'me')?.rank ?? null);
    } finally {
      setInitialLoad(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadCompleted();
    loadRankings();
  }, [loadCompleted, loadRankings]));

  const topThree = players.slice(0, 3);

  if (initialLoad) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#C87941" />
        <Text style={styles.loaderText}>Fetching rankings…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { loadCompleted(); loadRankings(true); }} tintColor="#C87941" />}
      >
        {/* Dark header */}
        <LinearGradient colors={['#2C1F14', '#3B2A1A']} style={styles.header}>
          <Text style={styles.headerEyebrow}>🏆  Rankings</Text>
          <Text style={styles.headerTitle}>Leaderboard</Text>

          {/* Score card */}
          <View style={styles.myCard}>
            <View>
              <Text style={styles.myCardLabel}>Your score</Text>
              <Text style={styles.myCardScore}>{userScore} pts</Text>
            </View>
            <View style={styles.myCardDivider} />
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.myCardLabel}>Your rank</Text>
              <Text style={styles.myCardScore}>{userRank != null ? `#${userRank}` : '—'}</Text>
            </View>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'rankings' && styles.tabBtnActive]}
              onPress={() => setTab('rankings')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, tab === 'rankings' && styles.tabBtnTextActive]}>🏆  Rankings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'completed' && styles.tabBtnActive]}
              onPress={() => setTab('completed')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, tab === 'completed' && styles.tabBtnTextActive]}>
                ✅  My Adventures{completed.length > 0 ? ` (${completed.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── RANKINGS TAB ── */}
        {tab === 'rankings' && (
          <>
            {topThree.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top adventurers</Text>
                <View style={styles.podium}>
                  {topThree.map(p => (
                    <View key={p.id} style={styles.podiumItem}>
                      <Text style={styles.podiumEmoji}>{RANK_LABELS[p.rank - 1]}</Text>
                      <Image source={AVATAR_IMGS[p.avatar] ?? AVATAR_IMGS.fox} style={styles.podiumAvatar} resizeMode="cover" />
                      <Text style={styles.podiumName} numberOfLines={1}>{p.isYou ? 'You' : p.name}</Text>
                      <Text style={styles.podiumScore}>{p.score} pts</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All players</Text>
              {players.map(p => (
                <PlayerRow key={p.id} rank={p.rank} name={p.name} avatar={p.avatar} score={p.score} isYou={!!p.isYou} />
              ))}
            </View>

            <Text style={styles.apiNote}>Pull down to refresh · Data from 5to9 API</Text>
          </>
        )}

        {/* ── COMPLETED TAB ── */}
        {tab === 'completed' && (
          <View style={styles.section}>
            {completed.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🏕</Text>
                <Text style={styles.emptyTitle}>No adventures yet</Text>
                <Text style={styles.emptyDesc}>Complete a micro-adventure and it will appear here.</Text>
              </View>
            ) : (
              completed.map((a) => <CompletedCard key={a.progress_id} adventure={a} />)
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },
  scroll: { paddingBottom: 16 },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5EBD7', gap: 12 },
  loaderText: { fontSize: 13, color: '#7A6651', fontWeight: '600' },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24 },
  headerEyebrow: { fontSize: 11, letterSpacing: 3, color: 'rgba(245,235,215,0.6)', fontWeight: '700', textTransform: 'uppercase' },
  headerTitle: { fontSize: 34, fontWeight: '800', color: '#F5EBD7', marginTop: 4, marginBottom: 20 },

  myCard: { backgroundColor: 'rgba(245,235,215,0.1)', borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16 },
  myCardLabel: { fontSize: 10, letterSpacing: 1.5, color: 'rgba(245,235,215,0.6)', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  myCardScore: { fontSize: 24, fontWeight: '800', color: '#F5EBD7' },
  myCardDivider: { width: 1, height: 36, backgroundColor: 'rgba(245,235,215,0.15)' },

  // ── Tab switcher ────────────────────────────────────────────────────────────
  tabSwitcher: { flexDirection: 'row', backgroundColor: 'rgba(245,235,215,0.08)', borderRadius: 14, padding: 4, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#D4A96A' },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: 'rgba(245,235,215,0.55)', letterSpacing: 0.3 },
  tabBtnTextActive: { color: '#2C1F14' },

  // ── Sections ────────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#7A6651', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },

  // ── Podium ──────────────────────────────────────────────────────────────────
  podium: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.08)' },
  podiumItem: { alignItems: 'center', gap: 6, flex: 1 },
  podiumEmoji: { fontSize: 26 },
  podiumAvatar: { width: 48, height: 48, borderRadius: 14 },
  podiumName: { fontSize: 11, fontWeight: '700', color: '#2C1F14', textAlign: 'center' },
  podiumScore: { fontSize: 13, fontWeight: '800', color: '#C87941' },

  // ── Player rows ──────────────────────────────────────────────────────────────
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, gap: 10 },
  rankBox: { width: 32, alignItems: 'center' },
  rankEmoji: { fontSize: 20 },
  rankNum: { fontSize: 14, fontWeight: '700', color: '#7A6651' },
  avatarBox: { width: 38, height: 38, borderRadius: 12, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  rowName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#2C1F14' },
  youBadge: { backgroundColor: '#C87941', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  youBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  rowScore: { fontSize: 14, fontWeight: '800', color: '#2C1F14' },

  // ── Completed cards ──────────────────────────────────────────────────────────
  completedCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(61,97,66,0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  completedImg: { width: '100%', height: 120 },
  completedBody: { padding: 14 },
  completedTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  completedEmoji: { fontSize: 22 },
  ptsBadge: { backgroundColor: '#D4A96A', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  ptsBadgeText: { fontSize: 11, fontWeight: '700', color: '#2C1F14' },
  completedTitle: { fontSize: 17, fontWeight: '700', color: '#2C1F14' },
  completedTag: { fontSize: 10, fontWeight: '700', color: '#3D6142', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 },
  completedDate: { fontSize: 11, color: '#7A6651', marginTop: 6 },
  checkBadge: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#3D6142', alignItems: 'center', justifyContent: 'center' },
  checkIcon: { fontSize: 16, color: '#fff', fontWeight: '700' },

  // ── Empty state ──────────────────────────────────────────────────────────────
  emptyState: { marginTop: 40, alignItems: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#2C1F14', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#7A6651', textAlign: 'center', lineHeight: 20 },

  apiNote: { textAlign: 'center', fontSize: 11, color: 'rgba(44,31,20,0.35)', marginTop: 16, fontStyle: 'italic' },
});
