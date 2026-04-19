import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { name: 'Home',        emoji: '🏠', label: 'Home'  },
  { name: 'Explore',     emoji: '🔍', label: 'Explore' },
  { name: 'Leaderboard', emoji: '🏆', label: 'Board' },
  { name: 'Profile',     emoji: '👤', label: 'You'   },
];

export default function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.pill}>
        {TABS.map((tab, index) => {
          const active = state.index === index;
          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.8}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#2C1F14',
    borderRadius: 18,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 2,
  },
  tabActive: {
    backgroundColor: '#D4A96A',
  },
  tabEmoji: { fontSize: 18 },
  tabLabel: { fontSize: 10, color: 'rgba(245,235,215,0.65)', letterSpacing: 0.5, fontWeight: '600' },
  tabLabelActive: { color: '#2C1F14' },
});
