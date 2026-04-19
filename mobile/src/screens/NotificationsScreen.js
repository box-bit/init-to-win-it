import { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS = [
  { key: 'notif_new_adventures', label: 'New adventures available', desc: 'Get notified when new micro-adventures are added for your mode.' },
  { key: 'notif_reminders',      label: 'Daily challenge reminder',  desc: 'A gentle nudge each morning to step outside.' },
  { key: 'notif_completions',    label: 'Adventure completed',       desc: 'Confirmation when your adventure is marked complete.' },
  { key: 'notif_leaderboard',    label: 'Leaderboard updates',       desc: 'Notify when your rank changes.' },
];

export default function NotificationsScreen({ navigation }) {
  const [prefs, setPrefs] = useState({});

  useEffect(() => {
    async function load() {
      const loaded = {};
      for (const p of PREFS) {
        const val = await AsyncStorage.getItem(p.key);
        loaded[p.key] = val === null ? true : val === 'true';
      }
      setPrefs(loaded);
    }
    load();
  }, []);

  async function toggle(key) {
    const next = !prefs[key];
    setPrefs((prev) => ({ ...prev, [key]: next }));
    await AsyncStorage.setItem(key, String(next));
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 44 }} />
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>

        {PREFS.map((p) => (
          <View key={p.key} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{p.label}</Text>
              <Text style={styles.rowDesc}>{p.desc}</Text>
            </View>
            <Switch
              value={!!prefs[p.key]}
              onValueChange={() => toggle(p.key)}
              trackColor={{ false: 'rgba(44,31,20,0.15)', true: '#C87941' }}
              thumbColor="#fff"
            />
          </View>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EBD7' },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(44,31,20,0.1)' },
  backIcon: { fontSize: 26, color: '#2C1F14', lineHeight: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2C1F14' },

  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#7A6651', marginBottom: 12 },

  row: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#2C1F14', marginBottom: 3 },
  rowDesc: { fontSize: 12, color: '#7A6651', lineHeight: 17 },
});
