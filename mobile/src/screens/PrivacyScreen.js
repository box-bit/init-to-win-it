import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const SECTIONS = [
  {
    title: 'Data we collect',
    body: 'We collect only what is needed to run your adventures: adventure progress, photos you take during Find the Nature, and your profile name and picture. All data is stored locally on your device.',
  },
  {
    title: 'Location',
    body: 'GPS is used only while an adventure is active to track distance walked. We do not store your location history and we do not share location data with any third party.',
  },
  {
    title: 'Photos',
    body: 'Photos taken during adventures are stored locally on your device. When plant verification is enabled, images are sent to the Anthropic API for analysis only — they are not stored or used for training.',
  },
  {
    title: 'No accounts, no cloud',
    body: 'This app works fully offline. We do not create user accounts, send data to our servers, or share any personal information with third parties.',
  },
  {
    title: 'Your rights',
    body: 'You can delete all app data at any time by uninstalling the app. There is no account to close and no data stored remotely.',
  },
  {
    title: 'Contact',
    body: 'Questions about privacy? Reach us at hello@microadventure.app',
  },
];

export default function PrivacyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy</Text>
          <View style={{ width: 44 }} />
        </View>

        <Text style={styles.intro}>
          Your privacy matters. Here is exactly what this app does — and does not — do with your data.
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardBody}>{s.body}</Text>
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

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(44,31,20,0.1)' },
  backIcon: { fontSize: 26, color: '#2C1F14', lineHeight: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2C1F14' },

  intro: { fontSize: 14, color: '#7A6651', lineHeight: 21, marginBottom: 20 },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(44,31,20,0.07)' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2C1F14', marginBottom: 6 },
  cardBody: { fontSize: 13, color: '#7A6651', lineHeight: 20 },
});
