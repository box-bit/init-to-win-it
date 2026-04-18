import { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const MOODS = [
  { id: 'calm',       label: 'Calm'       },
  { id: 'lighter',    label: 'Lighter'    },
  { id: 'alive',      label: 'Alive'      },
  { id: 'thoughtful', label: 'Thoughtful' },
  { id: 'grateful',   label: 'Grateful'   },
];

const STATS = [
  { label: 'Walked',  value: '1.4', unit: 'km'   },
  { label: 'Outside', value: '32',  unit: 'min'  },
  { label: 'Streak',  value: '5',   unit: 'days' },
];

export default function LeaderboardScreen() {
  const [mood, setMood] = useState('alive');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero image */}
        <View style={styles.hero}>
          <Image source={require('../../assets/scene-campfire.jpg')} style={styles.heroImg} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'transparent', '#F5EBD7']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🏆  Adventure complete</Text>
          </View>
        </View>

        {/* Headline */}
        <View style={styles.headline}>
          <Text style={styles.title}>How do you feel{'\n'}now?</Text>
          <Text style={styles.subtitle}>One word is enough. Your guide is listening.</Text>
        </View>

        {/* Mood pills */}
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
                <Text style={[styles.moodText, active && styles.moodTextActive]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            {STATS.map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>
                  {s.value}<Text style={styles.statUnit}> {s.unit}</Text>
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsUnlock}>
            <Text style={styles.statsUnlockText}>⭐  +1 Wisłok bench unlocked  ⭐</Text>
          </View>
        </View>

        {/* Save options */}
        <View style={styles.saveRow}>
          <TouchableOpacity style={styles.saveCard} activeOpacity={0.8}>
            <View style={styles.saveIcon}><Text style={{ fontSize: 20 }}>📷</Text></View>
            <Text style={styles.saveCardTitle}>Save a photo</Text>
            <Text style={styles.saveCardSub}>A single frame from tonight.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveCard} activeOpacity={0.8}>
            <View style={[styles.saveIcon, { backgroundColor: 'rgba(61,97,66,0.1)' }]}><Text style={{ fontSize: 20 }}>📊</Text></View>
            <Text style={styles.saveCardTitle}>My ranking</Text>
            <Text style={styles.saveCardSub}>One line for the board.</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.cta}>
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85}>
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

  hero: { height: 240, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  badge: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  badgeInner: { backgroundColor: '#D4A96A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#2C1F14', letterSpacing: 1.8, textTransform: 'uppercase', backgroundColor: '#D4A96A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' },

  headline: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 4, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#2C1F14', textAlign: 'center', lineHeight: 33 },
  subtitle: { fontSize: 13, color: '#7A6651', textAlign: 'center', marginTop: 6, lineHeight: 19 },

  moodRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingHorizontal: 20, marginTop: 16 },
  moodPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(44,31,20,0.12)' },
  moodPillActive: { backgroundColor: '#2C1F14', borderColor: '#2C1F14' },
  moodText: { fontSize: 13, fontWeight: '600', color: '#2C1F14' },
  moodTextActive: { color: '#F5EBD7' },

  statsCard: { marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.08)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7A6651', fontWeight: '600' },
  statValue: { fontSize: 26, fontWeight: '700', color: '#2C1F14', marginTop: 4 },
  statUnit: { fontSize: 12, fontWeight: '500', color: '#7A6651' },
  statsDivider: { height: 1, backgroundColor: 'rgba(44,31,20,0.08)', marginVertical: 12 },
  statsUnlock: { alignItems: 'center' },
  statsUnlockText: { fontSize: 12, fontWeight: '700', color: '#C87941', letterSpacing: 1.5, textTransform: 'uppercase' },

  saveRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 12 },
  saveCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(44,31,20,0.08)', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  saveIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0E6D3', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  saveCardTitle: { fontSize: 13, fontWeight: '700', color: '#2C1F14' },
  saveCardSub: { fontSize: 11, color: '#7A6651', lineHeight: 15, marginTop: 3 },

  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 12 },
  ctaBtn: { backgroundColor: '#C87941', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  ctaBtnText: { fontSize: 17, fontWeight: '700', color: '#F5EBD7' },
  ctaArrow: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#D4A96A', alignItems: 'center', justifyContent: 'center' },
  ctaArrowText: { fontSize: 22, color: '#2C1F14', lineHeight: 26 },
});
