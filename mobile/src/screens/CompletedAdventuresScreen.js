import { useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Platform, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCompletedAdventures } from '../db/database';
import { ADVENTURE_POINTS } from '../data/adventures';

const MINI_ADVENTURE_ASSETS = {
  'penny-hike':       { img: require('../../assets/scene-campfire.jpg'), emoji: '🪙' },
  'find-the-nature':  { img: require('../../assets/scene-forest.jpg'),   emoji: '🌿' },
};

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CompletedAdventuresScreen() {
  const [adventures, setAdventures] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (Platform.OS === 'web') {
      setAdventures([]);
      return;
    }
    setAdventures(getCompletedAdventures());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Completed</Text>
        <Text style={styles.headerSub}>Your finished adventures</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4A96A" />}
      >
        {adventures.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏕</Text>
            <Text style={styles.emptyTitle}>No adventures yet</Text>
            <Text style={styles.emptyDesc}>Complete a micro-adventure and it will appear here.</Text>
          </View>
        ) : (
          adventures.map((a) => {
            const assets = MINI_ADVENTURE_ASSETS[a.id] ?? { img: require('../../assets/scene-campfire.jpg'), emoji: '🏕' };
            const pts = ADVENTURE_POINTS[a.id] ?? 0;
            return (
              <View key={a.id + a.started_at} style={styles.card}>
                <Image source={assets.img} style={styles.cardImg} resizeMode="cover" />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardEmoji}>{assets.emoji}</Text>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsText}>+{pts} pts</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <Text style={styles.cardTag}>{a.tag}</Text>
                  <Text style={styles.cardDate}>Completed {formatDate(a.started_at)}</Text>
                </View>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedIcon}>✓</Text>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#F5EBD7',
  },
  headerTitle: { fontSize: 30, fontWeight: '800', color: '#2C1F14' },
  headerSub: { fontSize: 13, color: '#7A6651', marginTop: 2 },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#2C1F14', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#7A6651', textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(61,97,66,0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImg: { width: '100%', height: 130 },
  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardEmoji: { fontSize: 22 },
  pointsBadge: {
    backgroundColor: '#D4A96A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pointsText: { fontSize: 11, fontWeight: '700', color: '#2C1F14' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#2C1F14' },
  cardTag: {
    fontSize: 10, fontWeight: '700', color: '#3D6142',
    letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4,
  },
  cardDate: { fontSize: 11, color: '#7A6651', marginTop: 6 },

  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3D6142',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIcon: { fontSize: 16, color: '#fff', fontWeight: '700' },
});
