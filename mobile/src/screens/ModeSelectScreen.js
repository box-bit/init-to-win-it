import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Image, Pressable, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const AVATARS = [
  {
    id: 'urban_explore',
    title: 'Urban Legend',
    vibe: 'Curious. Clever.\nHidden corners at golden hour.',
    img: require('../../assets/avatar-fox.png'),
    color: '#C87941',
  },
  {
    id: 'survivalist',
    title: 'Survivalist',
    vibe: 'Calm. Strong.\nPine forests and quiet fires.',
    img: require('../../assets/avatar-bear.png'),
    color: '#3D6142',
  },
  {
    id: 'social_chaos',
    title: 'Chaos',
    vibe: 'Playful. Spontaneous.\nAdventures with the crew.',
    img: require('../../assets/avatar-raccoon.png'),
    color: '#4A6B8A',
  },
];

export default function ModeSelectScreen({ onSelect }) {
  const [selected, setSelected] = useState('urban_explore');

  async function handleConfirm() {
    const mode = AVATARS.find((a) => a.id === selected);
    await AsyncStorage.setItem('selectedMode', JSON.stringify(mode));
    onSelect(mode);
  }

  return (
    <LinearGradient
      colors={['#2C1F14', '#3B2A1A', '#1E2D1F']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>🧭  5to9 · Adventure</Text>
          <Text style={styles.title}>Step outside.{'\n'}Find a small adventure.</Text>
          <Text style={styles.subtitle}>
            Pick the spirit that walks with you. Your guide shapes the trails you'll discover.
          </Text>
        </View>

        {/* Avatar cards */}
        <View style={styles.cardsRow}>
          {AVATARS.map((a) => {
            const isSel = selected === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => setSelected(a.id)}
                style={[styles.card, isSel && styles.cardSelected]}
              >
                <View style={[styles.imgWrapper, isSel && { borderColor: '#D4A96A', borderWidth: 2 }]}>
                  <Image source={a.img} style={styles.avatar} resizeMode="cover" />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, isSel && { color: '#C87941' }]}>{a.title}</Text>
                  <Text style={styles.cardVibe}>{a.vibe}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.btn} onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={styles.btnText}>Choose your vibe</Text>
            <View style={styles.btnIcon}>
              <Text style={{ fontSize: 18, color: '#2C1F14' }}>›</Text>
            </View>
          </TouchableOpacity>
          {/* Dots */}
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  eyebrow: { fontSize: 13, letterSpacing: 3, color: 'rgba(245,235,215,0.75)', fontWeight: '600', textTransform: 'uppercase' },
  title: { marginTop: 12, fontSize: 34, fontWeight: '700', color: '#F5EBD7', lineHeight: 40 },
  subtitle: { marginTop: 10, fontSize: 15, color: 'rgba(245,235,215,0.75)', lineHeight: 22, maxWidth: 320 },

  cardsRow: { flexDirection: 'column', gap: 10, paddingHorizontal: 16, marginTop: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(245,235,215,0.25)',
    padding: 12,
  },
  cardSelected: { backgroundColor: 'rgba(245,235,215,0.92)' },
  imgWrapper: { borderRadius: 16, overflow: 'hidden', width: 72, height: 72, backgroundColor: 'rgba(212,192,158,0.4)' },
  avatar: { width: '100%', height: '100%' },
  cardBody: { paddingHorizontal: 14, paddingVertical: 2, flex: 1 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#D4A96A', textTransform: 'uppercase', letterSpacing: 1 },
  cardVibe: { fontSize: 13, color: 'rgba(44,31,20,0.65)', lineHeight: 18, marginTop: 4 },

  footer: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12 },
  btn: {
    backgroundColor: '#2C1F14',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  btnText: { fontSize: 17, fontWeight: '700', color: '#F5EBD7' },
  btnIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#D4A96A',
    alignItems: 'center', justifyContent: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 18 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(245,235,215,0.35)' },
  dotActive: { width: 24, backgroundColor: '#F5EBD7' },
});