import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MODES = [
  { id: 'urban_explore', label: 'Urban\nExplore', emoji: '🏙️', color: '#4A90D9' },
  { id: 'survivalist',   label: 'Survivor-\nalist',    emoji: '🌲', color: '#5C8A3C' },
  { id: 'social_chaos',  label: 'Social\nChaos',  emoji: '🔥', color: '#C0392B' },
];

export default function ModeSelectScreen({ onSelect }) {
  async function handleSelect(mode) {
    await AsyncStorage.setItem('selectedMode', JSON.stringify(mode));
    onSelect(mode);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Choose Your Mode</Text>
      <Text style={styles.subtitle}>Select how you want to play</Text>
      <View style={styles.row}>
        {MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[styles.card, { backgroundColor: mode.color }]}
            onPress={() => handleSelect(mode)}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{mode.emoji}</Text>
            <Text style={styles.cardLabel}>{mode.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#aaa',
    marginBottom: 40,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    aspectRatio: 0.75,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
