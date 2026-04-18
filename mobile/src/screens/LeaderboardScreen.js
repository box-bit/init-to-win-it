import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserScore } from '../score';

// ─── Mock API ─────────────────────────────────────────────────────────────────
// Replace this function body with a real fetch() call when the backend is ready.
// Expected response shape: Array<{ id, name, avatar, score }>
async function fetchLeaderboard() {
  await new Promise(r => setTimeout(r, 900)); // simulate network
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

const RANK_COLORS   = ['#D4A96A', '#A8A8A8', '#C87941'];
const RANK_LABELS   = ['🥇', '🥈', '🥉'];
const ADVENTURE_PTS = { 'penny-hike': 5, 'find-the-nature': 8 };

// ─── Components ───────────────────────────────────────────────────────────────
function PlayerRow({ rank, name, avatar, score, isYou }) {
  const bg = isYou ? 'rgba(200,121,65,0.12)' : '#fff';
  const border = isYou ? 'rgba(200,121,65,0.4)' : 'rgba(44,31,20,0.07)';
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

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const [players, setPlayers]         = useState([]);
  const [userScore, setUserScore]     = useState(0);
  const [userRank, setUserRank]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [remote, local] = await Promise.all([fetchLeaderboard(), getUserScore()]);
      setUserScore(local);

      // Insert the user into the sorted list
      const withUser = [...remote, { id: 'me', name: 'You', avatar: 'fox', score: local, isYou: true }]
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({ ...p, rank: i + 1 }));

      setPlayers(withUser);
      const me = withUser.find(p => p.id === 'me');
      setUserRank(me?.rank ?? null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const topThree = players.slice(0, 3);
  const rest     = players.slice(3);

  if (loading) {
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#C87941" />}
      >
        {/* Header */}
        <LinearGradient colors={['#2C1F14', '#3B2A1A']} style={styles.header}>
          <Text style={styles.headerEyebrow}>🏆  Rankings</Text>
          <Text style={styles.headerTitle}>Leaderboard</Text>

          {/* User's own card */}
          <View style={styles.myCard}>
            <View>
              <Text style={styles.myCardLabel}>Your score</Text>
              <Text style={styles.myCardScore}>{userScore} pts</Text>
            </View>
            <View style={styles.myCardDivider} />
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.myCardLabel}>Your rank</Text>
              <Text style={styles.myCardScore}>
                {userRank != null ? `#${userRank}` : '—'}
              </Text>
            </View>
            <View style={styles.myCardDivider} />
            <View>
              <Text style={styles.myCardLabel}>Next reward</Text>
              <Text style={styles.myCardScore}>🎖</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Points guide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points per adventure</Text>
          <View style={styles.pointsGuide}>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsAdv}>🪙  The Penny Hike</Text>
              <View style={styles.pointsBadge}><Text style={styles.pointsBadgeText}>+{ADVENTURE_PTS['penny-hike']} pts</Text></View>
            </View>
            <View style={[styles.pointsRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.pointsAdv}>🌿  Find the Nature</Text>
              <View style={[styles.pointsBadge, { backgroundColor: 'rgba(61,97,66,0.12)' }]}>
                <Text style={[styles.pointsBadgeText, { color: '#3D6142' }]}>+{ADVENTURE_PTS['find-the-nature']} pts</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top 3 podium */}
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

        {/* Full list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All players</Text>
          {players.map(p => (
            <PlayerRow
              key={p.id}
              rank={p.rank}
              name={p.name}
              avatar={p.avatar}
              score={p.score}
              isYou={!!p.isYou}
            />
          ))}
        </View>

        <Text style={styles.apiNote}>Pull down to refresh · Data from 5to9 API</Text>
        <View style={{ height: 24 }} />
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
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24 },
  headerEyebrow: { fontSize: 11, letterSpacing: 3, color: 'rgba(245,235,215,0.6)', fontWeight: '700', textTransform: 'uppercase' },
  headerTitle: { fontSize: 34, fontWeight: '800', color: '#F5EBD7', marginTop: 4, marginBottom: 20 },

  myCard: { backgroundColor: 'rgba(245,235,215,0.1)', borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  myCardLabel: { fontSize: 10, letterSpacing: 1.5, color: 'rgba(245,235,215,0.6)', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  myCardScore: { fontSize: 24, fontWeight: '800', color: '#F5EBD7' },
  myCardDivider: { width: 1, height: 36, backgroundColor: 'rgba(245,235,215,0.15)' },

  // ── Sections ────────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#7A6651', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },

  // ── Points guide ────────────────────────────────────────────────────────────
  pointsGuide: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(44,31,20,0.08)', overflow: 'hidden' },
  pointsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(44,31,20,0.06)' },
  pointsAdv: { fontSize: 13.5, fontWeight: '600', color: '#2C1F14' },
  pointsBadge: { backgroundColor: 'rgba(200,121,65,0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pointsBadgeText: { fontSize: 12, fontWeight: '800', color: '#C87941' },

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

  apiNote: { textAlign: 'center', fontSize: 11, color: 'rgba(44,31,20,0.35)', marginTop: 16, fontStyle: 'italic' },
});
