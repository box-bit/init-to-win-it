import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const ITEMS = [
  { label: 'App name',    value: 'MicroAdventure' },
  { label: 'Version',     value: '1.0.0' },
  { label: 'Built at',    value: 'HackCarpathia 2026 · Rzeszów' },
  { label: 'Team',        value: 'init-to-win-it' },
  { label: 'Platform',    value: 'React Native / Expo' },
];

export default function AboutScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Logo block */}
        <View style={styles.logoBlock}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🌿</Text>
          </View>
          <Text style={styles.appName}>MicroAdventure</Text>
          <Text style={styles.tagline}>Step outside. Discover something new.</Text>
        </View>

        {/* Meta rows */}
        <View style={styles.metaCard}>
          {ITEMS.map((item, i) => (
            <View key={item.label} style={[styles.metaRow, i < ITEMS.length - 1 && styles.metaRowDivider]}>
              <Text style={styles.metaLabel}>{item.label}</Text>
              <Text style={styles.metaValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* About text */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What is this?</Text>
          <Text style={styles.cardBody}>
            MicroAdventure is a hackathon project built to fight screen addiction and urban boredom. It gives you small, achievable outdoor challenges — a coin-flip hike, a plant photography walk — that get you off the couch and into the world.{'\n\n'}
            Built in 24 hours at HackCarpathia 2026 in Rzeszów, Poland.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Open source</Text>
          <Text style={styles.cardBody}>
            This project is open source. You can find the code, report issues, and contribute at our GitHub repository.
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(44,31,20,0.1)' },
  backIcon: { fontSize: 26, color: '#2C1F14', lineHeight: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2C1F14' },

  logoBlock: { alignItems: 'center', marginBottom: 28 },
  logoCircle: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#3D6142', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoEmoji: { fontSize: 38 },
  appName: { fontSize: 24, fontWeight: '800', color: '#2C1F14' },
  tagline: { fontSize: 13, color: '#7A6651', marginTop: 4 },

  metaCard: { backgroundColor: '#fff', borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)', overflow: 'hidden' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  metaRowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(44,31,20,0.07)' },
  metaLabel: { fontSize: 14, color: '#7A6651', fontWeight: '500' },
  metaValue: { fontSize: 14, color: '#2C1F14', fontWeight: '600' },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2C1F14', marginBottom: 6 },
  cardBody: { fontSize: 13, color: '#7A6651', lineHeight: 20 },
});
