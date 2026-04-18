import { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const MOODS = [
  { id: 'calm',       emoji: '😌', label: 'Calm'       },
  { id: 'lighter',    emoji: '🌤', label: 'Lighter'    },
  { id: 'alive',      emoji: '⚡', label: 'Alive'      },
  { id: 'thoughtful', emoji: '🌿', label: 'Thoughtful' },
  { id: 'grateful',   emoji: '🙏', label: 'Grateful'   },
];

export default function AdventureCompleteScreen({ route, navigation }) {
  const { points = 0, hero, tag = '', stats = [], totalScore = 0 } = route.params ?? {};
  const [mood, setMood] = useState(null);

  function handleDone() {
    navigation.navigate('HomeMain');
  }

  function handleLeaderboard() {
    // Navigate to the Leaderboard tab
    navigation.getParent()?.navigate('Leaderboard');
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          {hero
            ? <Image source={hero} style={styles.heroImg} resizeMode="cover" />
            : <View style={[styles.heroImg, { backgroundColor: '#3D6142' }]} />
          }
          <LinearGradient colors={['transparent', 'transparent', '#F5EBD7']} style={StyleSheet.absoluteFill} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🏆  Adventure complete</Text>
          </View>
        </View>

        {/* Points earned */}
        <View style={styles.pointsBurst}>
          <Text style={styles.pointsLabel}>POINTS EARNED</Text>
          <Text style={styles.pointsValue}>+{points}</Text>
          <Text style={styles.pointsTotal}>Total score: {totalScore} pts</Text>
        </View>

        {/* Stats */}
        {stats.length > 0 && (
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              {stats.map((s) => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statValue}>
                    {s.value}<Text style={styles.statUnit}>{s.unit ? ` ${s.unit}` : ''}</Text>
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsUnlock}>
              <Text style={styles.statsUnlockText}>⭐  {tag} — completed  ⭐</Text>
            </View>
          </View>
        )}

        {/* Mood */}
        <View style={styles.headline}>
          <Text style={styles.title}>How do you feel{'\n'}now?</Text>
          <Text style={styles.subtitle}>One word is enough. Your guide is listening.</Text>
        </View>
        <View style={styles.moodRow}>
          {MOODS.map((m) => {
            const active = mood === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => setMood(m.id)}
                style={[styles.moodPill, active && styles.moodPillActive]}
                activeOpacity={0.8}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodText, active && styles.moodTextActive]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Leaderboard CTA */}
        <TouchableOpacity style={styles.lbCard} onPress={handleLeaderboard} activeOpacity={0.85}>
          <View style={styles.lbIcon}><Text style={{ fontSize: 22 }}>🏅</Text></View>
          <View style={styles.lbBody}>
            <Text style={styles.lbTitle}>See the leaderboard</Text>
            <Text style={styles.lbSub}>Where do you rank among other adventurers?</Text>
          </View>
          <Text style={styles.lbArrow}>›</Text>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.cta}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleDone} activeOpacity={0.85}>
          <Text style={styles.ctaBtnText}>Save & head home</Text>
          <View style={styles.ctaArrow}><Text style={styles.ctaArrowText}>›</Text></View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },
  scroll: { paddingBottom: 16 },

  hero: { height: 220, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  badge: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#2C1F14', letterSpacing: 1.8, textTransform: 'uppercase', backgroundColor: '#D4A96A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' },

  pointsBurst: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 24 },
  pointsLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2.5, color: '#7A6651', textTransform: 'uppercase' },
  pointsValue: { fontSize: 72, fontWeight: '900', color: '#C87941', lineHeight: 80, marginTop: 4 },
  pointsTotal: { fontSize: 13, color: '#7A6651', marginTop: 2 },

  statsCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.08)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7A6651', fontWeight: '600' },
  statValue: { fontSize: 26, fontWeight: '700', color: '#2C1F14', marginTop: 4 },
  statUnit: { fontSize: 12, fontWeight: '500', color: '#7A6651' },
  statsDivider: { height: 1, backgroundColor: 'rgba(44,31,20,0.08)', marginVertical: 12 },
  statsUnlock: { alignItems: 'center' },
  statsUnlockText: { fontSize: 12, fontWeight: '700', color: '#C87941', letterSpacing: 1.5, textTransform: 'uppercase' },

  headline: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#2C1F14', textAlign: 'center', lineHeight: 31 },
  subtitle: { fontSize: 13, color: '#7A6651', textAlign: 'center', marginTop: 6, lineHeight: 19 },

  moodRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingHorizontal: 20, marginTop: 14 },
  moodPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(44,31,20,0.12)' },
  moodPillActive: { backgroundColor: '#2C1F14', borderColor: '#2C1F14' },
  moodEmoji: { fontSize: 14 },
  moodText: { fontSize: 13, fontWeight: '600', color: '#2C1F14' },
  moodTextActive: { color: '#F5EBD7' },

  lbCard: { marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(44,31,20,0.08)', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  lbIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0E6D3', alignItems: 'center', justifyContent: 'center' },
  lbBody: { flex: 1 },
  lbTitle: { fontSize: 14, fontWeight: '700', color: '#2C1F14' },
  lbSub: { fontSize: 11.5, color: '#7A6651', marginTop: 2, lineHeight: 15 },
  lbArrow: { fontSize: 24, color: '#C87941', fontWeight: '700' },

  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 12, backgroundColor: 'rgba(245,235,215,0.95)' },
  ctaBtn: { backgroundColor: '#C87941', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  ctaBtnText: { fontSize: 17, fontWeight: '700', color: '#F5EBD7' },
  ctaArrow: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#D4A96A', alignItems: 'center', justifyContent: 'center' },
  ctaArrowText: { fontSize: 22, color: '#2C1F14', lineHeight: 26 },
});
