import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdventureDetailScreen({ route, navigation }) {
  const { adventure } = route.params;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <Image source={adventure.hero} style={styles.heroImg} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(44,31,20,0.45)', 'transparent', '#F5EBD7']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroTopBar}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.heroBtnIcon}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroBtn}>
              <Text style={[styles.heroBtnIcon, { color: '#C87941' }]}>♡</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroTag}>
            <Text style={styles.heroTagText}>🧭  {adventure.tag}</Text>
          </View>
        </View>

        {/* Title + meta */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{adventure.title}</Text>
          <Text style={styles.summary}>{adventure.summary}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaItem}>⏱  {adventure.duration}</Text>
            <Text style={styles.metaItem}>📍  {adventure.distance}</Text>
            <Text style={styles.metaItem}>🗺  {adventure.location}</Text>
          </View>
        </View>

        {/* Sections */}
        {adventure.sections.map((s) => (
          <View key={s.label} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}><Text style={{ fontSize: 18 }}>{s.emoji}</Text></View>
              <Text style={styles.cardLabel}>{s.label}</Text>
            </View>
            <Text style={styles.cardBody}>{s.body}</Text>
            {s.chips && (
              <View style={styles.chips}>
                {s.chips.map((c) => (
                  <View key={c} style={styles.chip}>
                    <Text style={styles.chipText}>{c}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.cta}>
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Game', { adventure })}
        >
          <Text style={styles.ctaBtnText}>Start adventure</Text>
          <Text style={styles.ctaBtnMeta}>{adventure.duration}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },
  scroll: { paddingBottom: 16 },

  hero: { height: 280, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroTopBar: { position: 'absolute', top: 56, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  heroBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,235,215,0.9)', alignItems: 'center', justifyContent: 'center' },
  heroBtnIcon: { fontSize: 24, color: '#2C1F14', lineHeight: 28 },
  heroTag: { position: 'absolute', bottom: 24, left: 20, backgroundColor: '#D4A96A', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  heroTagText: { fontSize: 11, fontWeight: '700', color: '#2C1F14', letterSpacing: 1.5, textTransform: 'uppercase' },

  titleBlock: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#2C1F14', lineHeight: 32 },
  summary: { fontSize: 13.5, color: '#7A6651', lineHeight: 20, marginTop: 8 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  metaItem: { fontSize: 12, color: 'rgba(44,31,20,0.7)' },

  card: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0E6D3', alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#2C1F14', letterSpacing: 1, textTransform: 'uppercase' },
  cardBody: { fontSize: 13, color: 'rgba(44,31,20,0.75)', lineHeight: 20 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { backgroundColor: 'rgba(61,97,66,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  chipText: { fontSize: 11, fontWeight: '700', color: '#3D6142', letterSpacing: 1, textTransform: 'uppercase' },

  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 12 },
  ctaBtn: { backgroundColor: '#C87941', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  ctaBtnText: { fontSize: 17, fontWeight: '700', color: '#F5EBD7' },
  ctaBtnMeta: { fontSize: 12, fontWeight: '600', color: 'rgba(245,235,215,0.8)', letterSpacing: 1.5, textTransform: 'uppercase' },
});
