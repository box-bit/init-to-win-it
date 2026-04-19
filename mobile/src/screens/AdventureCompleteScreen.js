import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';

const MOODS = [
  { id: 'calm',       emoji: '😌', label: 'Calm'       },
  { id: 'lighter',    emoji: '🌤', label: 'Lighter'    },
  { id: 'alive',      emoji: '⚡', label: 'Alive'      },
  { id: 'thoughtful', emoji: '🌿', label: 'Thoughtful' },
  { id: 'grateful',   emoji: '🙏', label: 'Grateful'   },
];

export default function AdventureCompleteScreen({ route, navigation }) {
  const { points = 0, stats = [] } = route.params ?? {};
  const [mood, setMood] = useState(null);

  const distance = stats.find(s => s.label?.toLowerCase().includes('distance') || s.unit === 'km');

  function handleDone() {
    navigation.navigate('Tabs', { screen: 'Home' });
  }

  function handleLeaderboard() {
    navigation.navigate('Tabs', { screen: 'Leaderboard' });
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleDone} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>

        {/* Completion + points */}
        <View style={styles.heroSection}>
          <Text style={styles.completedLabel}>Adventure Complete</Text>
          <Text style={styles.pointsValue}>+{points}</Text>
          <Text style={styles.pointsUnit}>points earned</Text>
        </View>

        {/* Distance */}
        {distance && (
          <View style={styles.distanceRow}>
            <Text style={styles.distanceEmoji}>🚶</Text>
            <Text style={styles.distanceText}>
              {distance.value}{distance.unit ? ` ${distance.unit}` : ''} walked
            </Text>
          </View>
        )}

        {/* Feelings */}
        <View style={styles.feelSection}>
          <Text style={styles.feelQuestion}>How do you feel?</Text>
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
        </View>

      </View>

      {/* Bottom actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleDone} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleLeaderboard} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>Submit &amp; View Leaderboard</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },

  topBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(44,31,20,0.08)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: '#2C1F14', fontWeight: '600' },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 28 },

  heroSection: { alignItems: 'center' },
  completedLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: '#7A6651', marginBottom: 8 },
  pointsValue: { fontSize: 80, fontWeight: '900', color: '#C87941', lineHeight: 88 },
  pointsUnit: { fontSize: 13, color: '#7A6651', fontWeight: '600', letterSpacing: 1 },

  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(44,31,20,0.08)' },
  distanceEmoji: { fontSize: 18 },
  distanceText: { fontSize: 15, fontWeight: '600', color: '#2C1F14' },

  feelSection: { alignItems: 'center', gap: 14 },
  feelQuestion: { fontSize: 20, fontWeight: '700', color: '#2C1F14' },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  moodPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(44,31,20,0.12)' },
  moodPillActive: { backgroundColor: '#2C1F14', borderColor: '#2C1F14' },
  moodEmoji: { fontSize: 14 },
  moodText: { fontSize: 13, fontWeight: '600', color: '#2C1F14' },
  moodTextActive: { color: '#F5EBD7' },

  actions: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  primaryBtn: { backgroundColor: '#C87941', borderRadius: 18, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: '#F5EBD7' },
  secondaryBtn: { backgroundColor: 'transparent', borderRadius: 18, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(44,31,20,0.2)' },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: '#2C1F14' },
});
