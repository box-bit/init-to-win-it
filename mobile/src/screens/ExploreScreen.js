import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { ADVENTURE_POINTS, ADVENTURE_MAP } from '../data/adventures';
import { getAllMiniAdventures } from '../db/database';

const MINI_ADVENTURE_ASSETS = {
  'penny-hike':          { img: require('../../assets/scene-campfire.jpg') },
  'find-the-nature':     { img: require('../../assets/scene-forest.jpg') },
  'social-flash-mob':    { img: require('../../assets/scene-hills.jpg') },
  'stranger-compliment': { img: require('../../assets/scene-river.jpg') },
  'sunrise-patrol':      { img: require('../../assets/scene-river.jpg') },
  'wild-sit-spot':       { img: require('../../assets/scene-hills.jpg') },
  'urban-safari':        { img: require('../../assets/scene-campfire.jpg') },
  'coffee-roulette':     { img: require('../../assets/scene-forest.jpg') },
  'mini-adventure':      { img: require('../../assets/scene-hills.jpg') },
};

const FILTERS = ['All', 'Chaos', 'Nature', 'Social', 'Urban'];

const TAG_FILTER_MAP = { Chaos: 'Chaos', Nature: 'Nature', Social: 'Social', Urban: 'Urban' };

function getScreenForAdventure(adventureId) {
  if (adventureId === 'penny-hike') return 'PennyHike';
  if (adventureId === 'find-the-nature') return 'FindNature';
  if (adventureId === 'mini-adventure') return 'MiniAdventure';
  return 'SimpleAdventure';
}

const WEB_ALL_ADVENTURES = [
  { id: 'penny-hike',      title: ADVENTURE_MAP['penny-hike'].title,      description: ADVENTURE_MAP['penny-hike'].desc,      duration: ADVENTURE_MAP['penny-hike'].duration,      tag: ADVENTURE_MAP['penny-hike'].tag,      distance: ADVENTURE_MAP['penny-hike'].distance },
  { id: 'find-the-nature', title: ADVENTURE_MAP['find-the-nature'].title,  description: ADVENTURE_MAP['find-the-nature'].desc,  duration: ADVENTURE_MAP['find-the-nature'].duration,  tag: ADVENTURE_MAP['find-the-nature'].tag,  distance: ADVENTURE_MAP['find-the-nature'].distance },
  { id: 'mini-adventure',  title: 'Leave a Message', description: 'Walk to a nearby random location and leave a handwritten message on paper.', duration: '2 hours', tag: 'Urban', distance: 'Up to 2 km' },
];

export default function ExploreScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [adventures, setAdventures] = useState([]);

  useFocusEffect(useCallback(() => {
    if (Platform.OS === 'web') {
      setAdventures(WEB_ALL_ADVENTURES);
    } else {
      setAdventures(getAllMiniAdventures());
    }
  }, []));

  const filtered = activeFilter === 'All'
    ? adventures
    : adventures.filter((a) => a.tag === TAG_FILTER_MAP[activeFilter]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔍  Explore</Text>
          <Text style={styles.headerSub}>All mini-adventures</Text>
        </View>

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

        {/* Adventures list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{filtered.length} adventure{filtered.length !== 1 ? 's' : ''}</Text>
        </View>

        {filtered.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No adventures match this filter.</Text>
          </View>
        )}

        {filtered.map((a) => {
          const assets = MINI_ADVENTURE_ASSETS[a.id] ?? MINI_ADVENTURE_ASSETS['penny-hike'];
          const screenName = getScreenForAdventure(a.id);
          return (
            <TouchableOpacity
              key={a.id}
              style={[styles.card, styles.miniCard]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Home', { screen: screenName, params: { adventureId: a.id } })}
            >
              <Image source={assets.img} style={styles.cardImg} resizeMode="cover" />
              <View style={styles.cardBody}>
                <View style={styles.cardTagRow}>
                  <Text style={[styles.cardTag, { color: '#3D6142' }]}>{a.tag}</Text>
                  {ADVENTURE_POINTS[a.id] && (
                    <View style={styles.ptsBadge}>
                      <Text style={styles.ptsBadgeText}>+{ADVENTURE_POINTS[a.id]} pts</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>{a.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{a.description}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardMetaText}>⏱ {a.duration}</Text>
                  <Text style={styles.cardMetaText}>📍 {a.distance ?? '???'}</Text>
                </View>
              </View>
              <View style={[styles.cardArrow, { backgroundColor: '#3D6142' }]}>
                <Text style={styles.cardArrowText}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },
  scroll: { paddingBottom: 16 },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#2C1F14' },
  headerSub: { fontSize: 13, color: '#7A6651', marginTop: 2 },

  filtersRow: { paddingHorizontal: 20, gap: 8, marginTop: 12, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(44,31,20,0.12)' },
  filterChipActive: { backgroundColor: '#2C1F14', borderColor: '#2C1F14' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#2C1F14' },
  filterTextActive: { color: '#F5EBD7' },

  sectionHeader: { paddingHorizontal: 20, marginTop: 18, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#7A6651', textTransform: 'uppercase', letterSpacing: 1 },

  emptyCard: { marginHorizontal: 20, padding: 24, backgroundColor: '#fff', borderRadius: 22, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  emptyText: { fontSize: 13, color: '#7A6651', textAlign: 'center' },

  card: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 22, flexDirection: 'row', alignItems: 'center', padding: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  miniCard: { borderColor: 'rgba(61,97,66,0.2)', borderWidth: 1.5 },
  cardImg: { width: 76, height: 76, borderRadius: 16 },
  cardBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 2 },
  cardTagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  cardTag: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C87941', fontWeight: '700' },
  ptsBadge: { backgroundColor: '#D4A96A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  ptsBadgeText: { fontSize: 10, fontWeight: '800', color: '#2C1F14' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2C1F14', marginTop: 2 },
  cardDesc: { fontSize: 11.5, color: '#7A6651', lineHeight: 16, marginTop: 3 },
  cardMeta: { flexDirection: 'row', gap: 12, marginTop: 6 },
  cardMetaText: { fontSize: 11, color: 'rgba(44,31,20,0.6)' },
  cardArrow: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#2C1F14', alignItems: 'center', justifyContent: 'center' },
  cardArrowText: { fontSize: 20, color: '#F5EBD7', lineHeight: 24 },
});
