import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen({ selectedMode }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      {selectedMode && (
        <View style={[styles.badge, { backgroundColor: selectedMode.color }]}>
          <Text style={styles.badgeEmoji}>{selectedMode.emoji}</Text>
          <Text style={styles.badgeLabel}>{selectedMode.label.replace('\n', ' ')}</Text>
        </View>
      )}
      <Text style={styles.subtitle}>HackCarpathia 2026</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 20,
    gap: 8,
  },
  badgeEmoji: { fontSize: 22 },
  badgeLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 16, color: '#666' },
});
