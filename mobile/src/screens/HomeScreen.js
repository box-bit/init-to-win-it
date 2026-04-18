import { View, Text, Image, StyleSheet } from 'react-native';

export default function HomeScreen({ selectedMode }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      {selectedMode && (
        <View style={styles.badge}>
          <Image source={selectedMode.img} style={styles.avatar} resizeMode="cover" />
          <View>
            <Text style={styles.badgeTitle}>{selectedMode.title}</Text>
            <Text style={styles.badgeName}>{selectedMode.name}</Text>
          </View>
        </View>
      )}
      <Text style={styles.subtitle}>HackCarpathia 2026</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5EBD7' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, color: '#2C1F14' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C1F14',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 24,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 12 },
  badgeTitle: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#D4A96A', fontWeight: '700' },
  badgeName: { fontSize: 18, fontWeight: '700', color: '#F5EBD7', marginTop: 2 },
  subtitle: { fontSize: 15, color: '#7A6651' },
});