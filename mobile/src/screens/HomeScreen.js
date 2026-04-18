import { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ADVENTURES, PENNY_HIKE } from '../data/adventures';
import { getMiniAdventuresByMode } from '../db/database';

const MINI_ADVENTURE_ASSETS = {
  'penny-hike': { img: require('../../assets/scene-campfire.jpg') },
};

const AVATAR_IMGS = {
  urban_explore: require('../../assets/avatar-fox.png'),
  survivalist:   require('../../assets/avatar-bear.png'),
  social_chaos:  require('../../assets/avatar-raccoon.png'),
};

const FILTERS = ['All', 'Forest', 'Riverside', 'Viewpoint', 'Sunset'];

export default function HomeScreen({ selectedMode, navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [dbMiniAdventures, setDbMiniAdventures] = useState([]);

  useEffect(() => {
    if (!selectedMode) return;
    if (Platform.OS === 'web') {
      // SQLite unavailable on web — use in-memory seed
      const WEB_MINI_ADVENTURES = [
        { id: 'penny-hike', title: PENNY_HIKE.title, description: PENNY_HIKE.desc,
          duration: PENNY_HIKE.duration, tag: PENNY_HIKE.tag, mode_type: 'social_chaos' },
      ];
      setDbMiniAdventures(WEB_MINI_ADVENTURES.filter(a => a.mode_type === selectedMode.id));
    } else {
      setDbMiniAdventures(getMiniAdventuresByMode(selectedMode.id));
    }
  }, [selectedMode]);

  const avatarImg = selectedMode ? AVATAR_IMGS[selectedMode.id] : AVATAR_IMGS.urban_explore;
  const guideName = selectedMode?.name ?? 'Fox';
  const dayLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long' }) + ' · Rzeszów';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Image source={avatarImg} style={styles.avatarImg} resizeMode="cover" />
            <View style={styles.avatarDot} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerSub}>{dayLabel}</Text>
            <Text style={styles.headerTitle}>Ready, {guideName}?</Text>
          </View>
          <TouchableOpacity style={styles.mapBtn}>
            <Text style={styles.mapBtnIcon}>🗺</Text>
          </TouchableOpacity>
        </View>

        {/* Hero card */}
        <TouchableOpacity
          style={styles.heroCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AdventureDetail', { adventure: ADVENTURES[1] })}
        >
          <Image source={require('../../assets/scene-hills.jpg')} style={styles.heroImg} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(44,31,20,0.7)']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>🔥  Today's spark</Text>
            </View>
            <Text style={styles.heroTitle}>Catch sunrise at Patria viewpoint</Text>
            <Text style={styles.heroMeta}>25 min · easy ride · bring a friend</Text>
          </View>
        </TouchableOpacity>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Micro-adventures</Text>
            <Text style={styles.sectionSub}>close to you</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Mini adventures from DB */}
        {dbMiniAdventures.map((a) => {
          const assets = MINI_ADVENTURE_ASSETS[a.id] ?? MINI_ADVENTURE_ASSETS['penny-hike'];
          return (
            <TouchableOpacity
              key={a.id}
              style={[styles.card, styles.chaosCard]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('PennyHike', { selectedMode })}
            >
              <Image source={assets.img} style={styles.cardImg} resizeMode="cover" />
              <View style={styles.cardBody}>
                <Text style={[styles.cardTag, { color: '#C0392B' }]}>{a.tag}</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>{a.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{a.description}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardMetaText}>⏱ {a.duration}</Text>
                  <Text style={styles.cardMetaText}>🪙 Coin decides</Text>
                </View>
              </View>
              <View style={[styles.cardArrow, { backgroundColor: '#C0392B' }]}>
                <Text style={styles.cardArrowText}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Adventure cards */}
        {ADVENTURES.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdventureDetail', { adventure: a })}
          >
            <Image source={a.img} style={styles.cardImg} resizeMode="cover" />
            <View style={styles.cardBody}>
              <Text style={styles.cardTag}>{a.tag}</Text>
              <Text style={styles.cardTitle} numberOfLines={1}>{a.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{a.desc}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardMetaText}>⏱ {a.duration}</Text>
                <Text style={styles.cardMetaText}>📍 {a.distance}</Text>
              </View>
            </View>
            <View style={styles.cardArrow}>
              <Text style={styles.cardArrowText}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },
  scroll: { paddingBottom: 16 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 },
  avatarWrapper: { position: 'relative' },
  avatarImg: { width: 48, height: 48, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(212,169,106,0.6)' },
  avatarDot: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#D4A96A', borderWidth: 2, borderColor: '#F5EBD7' },
  headerText: { flex: 1 },
  headerSub: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#7A6651' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2C1F14', marginTop: 1 },
  mapBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  mapBtnIcon: { fontSize: 20 },

  heroCard: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', height: 180 },
  heroImg: { width: '100%', height: '100%' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  heroBadge: { backgroundColor: 'rgba(212,169,106,0.95)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 6 },
  heroBadgeText: { fontSize: 10, fontWeight: '700', color: '#2C1F14', letterSpacing: 1.5, textTransform: 'uppercase' },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#F5EBD7', lineHeight: 24 },
  heroMeta: { fontSize: 12, color: 'rgba(245,235,215,0.85)', marginTop: 3 },

  filtersRow: { paddingHorizontal: 20, gap: 8, marginTop: 18, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(44,31,20,0.12)' },
  filterChipActive: { backgroundColor: '#2C1F14', borderColor: '#2C1F14' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#2C1F14' },
  filterTextActive: { color: '#F5EBD7' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#2C1F14', lineHeight: 26 },
  sectionSub: { fontSize: 13, color: '#7A6651', marginTop: 1 },
  seeAll: { fontSize: 13, fontWeight: '600', color: '#C87941' },

  card: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 22, flexDirection: 'row', alignItems: 'center', padding: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  cardImg: { width: 76, height: 76, borderRadius: 16 },
  cardBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 2 },
  cardTag: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C87941', fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2C1F14', marginTop: 2 },
  cardDesc: { fontSize: 11.5, color: '#7A6651', lineHeight: 16, marginTop: 3 },
  cardMeta: { flexDirection: 'row', gap: 12, marginTop: 6 },
  cardMetaText: { fontSize: 11, color: 'rgba(44,31,20,0.6)' },
  cardArrow: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#2C1F14', alignItems: 'center', justifyContent: 'center' },
  cardArrowText: { fontSize: 20, color: '#F5EBD7', lineHeight: 24 },
  chaosCard: { borderColor: 'rgba(192,57,43,0.2)', borderWidth: 1.5 },
});
