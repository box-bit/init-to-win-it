import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const STATS = [
  { label: 'Adventures', value: '12' },
  { label: 'km walked',  value: '18.4' },
  { label: 'Day streak', value: '5' },
];

const BADGES = ['🌲 Forest walker', '🌅 Golden hour', '🔥 5-day streak'];

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}><Text style={styles.avatarEmoji}>👤</Text></View>
          <Text style={styles.name}>Explorer</Text>
          <Text style={styles.location}>🧭  Rzeszów, Podkarpackie</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          {STATS.map((s, i) => (
            <View key={s.label} style={[styles.statItem, i < STATS.length - 1 && styles.statDivider]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <Text style={styles.sectionTitle}>Badges</Text>
        <View style={styles.badgesRow}>
          {BADGES.map((b) => (
            <View key={b} style={styles.badge}>
              <Text style={styles.badgeText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Settings rows */}
        <Text style={styles.sectionTitle}>Settings</Text>
        {['Edit profile', 'Notifications', 'Privacy', 'About'].map((item) => (
          <TouchableOpacity key={item} style={styles.row} activeOpacity={0.7}>
            <Text style={styles.rowText}>{item}</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },
  scroll: { paddingHorizontal: 20, paddingTop: 60 },

  avatarBlock: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#2C1F14', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarEmoji: { fontSize: 36 },
  name: { fontSize: 22, fontWeight: '700', color: '#2C1F14' },
  location: { fontSize: 13, color: '#7A6651', marginTop: 4 },

  statsCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.08)', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { borderRightWidth: 1, borderRightColor: 'rgba(44,31,20,0.08)' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#2C1F14' },
  statLabel: { fontSize: 11, color: '#7A6651', marginTop: 3, letterSpacing: 0.5 },

  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#7A6651', marginBottom: 10, marginTop: 4 },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  badge: { backgroundColor: '#2C1F14', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#F5EBD7' },

  row: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  rowText: { fontSize: 15, fontWeight: '600', color: '#2C1F14' },
  rowArrow: { fontSize: 20, color: '#7A6651' },
});
