import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PENNY_HIKE, FIND_NATURE, ADVENTURE_POINTS } from '../data/adventures';
import { getAvailableAdventuresByMode } from '../db/database';

const MINI_ADVENTURE_ASSETS = {
  'penny-hike':          { img: require('../../assets/scene-campfire.jpg') },
  'find-the-nature':     { img: require('../../assets/scene-forest.jpg') },
  'social-flash-mob':    { img: require('../../assets/scene-hills.jpg') },
  'stranger-compliment': { img: require('../../assets/scene-river.jpg') },
  'sunrise-patrol':      { img: require('../../assets/scene-river.jpg') },
  'wild-sit-spot':       { img: require('../../assets/scene-hills.jpg') },
  'urban-safari':        { img: require('../../assets/scene-campfire.jpg') },
  'coffee-roulette':     { img: require('../../assets/scene-forest.jpg') },
};

const AVATAR_IMGS = {
  urban_explore: require('../../assets/avatar-fox.png'),
  survivalist:   require('../../assets/avatar-bear.png'),
  social_chaos:  require('../../assets/avatar-raccoon.png'),
};

const FILTERS = ['All', 'Chaos', 'Nature', 'Social', 'Urban'];

const TAG_FILTER_MAP = { Chaos: 'Chaos', Nature: 'Nature', Social: 'Social', Urban: 'Urban' };

function getScreenForAdventure(adventureId) {
  if (adventureId === 'penny-hike') return 'PennyHike';
  if (adventureId === 'find-the-nature') return 'FindNature';
  return 'SimpleAdventure';
}

export default function HomeScreen({ selectedMode, navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [allAdventures, setAllAdventures] = useState([]);

  useFocusEffect(useCallback(() => {
    if (!selectedMode) return;
    if (Platform.OS === 'web') {
      const WEB_ALL = [
        { id: 'penny-hike',          title: PENNY_HIKE.title,    description: PENNY_HIKE.desc,    duration: PENNY_HIKE.duration,    tag: PENNY_HIKE.tag,    mode_type: 'social_chaos'  },
        { id: 'find-the-nature',     title: FIND_NATURE.title,   description: FIND_NATURE.desc,   duration: FIND_NATURE.duration,   tag: FIND_NATURE.tag,   mode_type: 'survivalist'   },
        { id: 'social-flash-mob',    title: 'Invisible Orchestra', description: 'Conduct an invisible orchestra in a public space.', duration: '20 min', tag: 'Social', mode_type: 'social_chaos'  },
        { id: 'stranger-compliment', title: 'Compliment Run',    description: 'Give 5 genuine compliments to 5 strangers.', duration: '30 min', tag: 'Chaos',  mode_type: 'social_chaos'  },
        { id: 'sunrise-patrol',      title: 'Sunrise Patrol',    description: 'Watch the city wake up from the highest point near you.', duration: '60 min', tag: 'Nature', mode_type: 'survivalist'   },
        { id: 'wild-sit-spot',       title: 'The Sit Spot',      description: 'Sit perfectly still in nature for 20 minutes.', duration: '25 min', tag: 'Nature', mode_type: 'survivalist'   },
        { id: 'urban-safari',        title: 'Urban Safari',      description: 'Photograph 8 signs of human creativity in plain sight.', duration: '45 min', tag: 'Urban', mode_type: 'urban_explore' },
        { id: 'coffee-roulette',     title: 'Coffee Roulette',   description: "Walk 10 min, enter the first café. Order something new.", duration: '35 min', tag: 'Urban', mode_type: 'urban_explore' },
      ];
      const modeAdventures = WEB_ALL.filter(a => a.mode_type === selectedMode.id);
      setAllAdventures(modeAdventures);
    } else {
      setAllAdventures(getAvailableAdventuresByMode(selectedMode.id));
    }
  }, [selectedMode]));

  const displayedAdventures = activeFilter === 'All'
    ? allAdventures
    : allAdventures.filter((a) => a.tag === TAG_FILTER_MAP[activeFilter]);

  const avatarImg = selectedMode ? AVATAR_IMGS[selectedMode.id] : AVATAR_IMGS.urban_explore;
  const guideName = selectedMode?.title ?? 'Explorer';
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
          onPress={() => {
            const first = displayedAdventures[0] ?? allAdventures[0];
            if (first) navigation.navigate(getScreenForAdventure(first.id), { selectedMode, adventureId: first.id });
          }}
        >
          <Image source={require('../../assets/scene-hills.jpg')} style={styles.heroImg} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(44,31,20,0.7)']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>🔥  Today's spark</Text>
            </View>
            <Text style={styles.heroTitle}>Your micro-adventure awaits</Text>
            <Text style={styles.heroMeta}>Step outside · discover something new</Text>
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
        {displayedAdventures.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No adventures match this filter.</Text>
          </View>
        )}

        {displayedAdventures.map((a) => {
          const assets = MINI_ADVENTURE_ASSETS[a.id] ?? MINI_ADVENTURE_ASSETS['penny-hike'];
          const screenName = getScreenForAdventure(a.id);
          return (
            <TouchableOpacity
              key={a.id}
              style={[styles.card, styles.miniCard]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(screenName, { selectedMode, adventureId: a.id })}
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
