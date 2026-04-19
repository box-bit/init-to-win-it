import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS = [
  { label: 'Adventures', value: '12' },
  { label: 'km walked',  value: '18.4' },
];

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState({ name: '', surname: '', picture: null });

  useFocusEffect(useCallback(() => {
    async function load() {
      const name    = await AsyncStorage.getItem('profile_name')    ?? '';
      const surname = await AsyncStorage.getItem('profile_surname') ?? '';
      const picture = await AsyncStorage.getItem('profile_picture') ?? null;
      setProfile({ name, surname, picture });
    }
    load();
  }, []));

  const displayName = [profile.name, profile.surname].filter(Boolean).join(' ') || 'Explorer';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarBlock}>
          {profile.picture
            ? <Image source={{ uri: profile.picture }} style={styles.avatarImg} />
            : <View style={styles.avatar}><Text style={styles.avatarEmoji}>👤</Text></View>
          }
          <Text style={styles.name}>{displayName}</Text>
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

        {/* Settings rows */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.rowText}>Edit profile</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
        {['Notifications', 'Privacy', 'About'].map((item) => (
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
  avatarImg: { width: 80, height: 80, borderRadius: 24, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '700', color: '#2C1F14' },
  location: { fontSize: 13, color: '#7A6651', marginTop: 4 },

  statsCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(44,31,20,0.08)', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { borderRightWidth: 1, borderRightColor: 'rgba(44,31,20,0.08)' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#2C1F14' },
  statLabel: { fontSize: 11, color: '#7A6651', marginTop: 3, letterSpacing: 0.5 },

  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#7A6651', marginBottom: 10, marginTop: 4 },

  row: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  rowText: { fontSize: 15, fontWeight: '600', color: '#2C1F14' },
  rowArrow: { fontSize: 20, color: '#7A6651' },
});
