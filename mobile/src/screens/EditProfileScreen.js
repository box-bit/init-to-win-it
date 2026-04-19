import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Image, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen({ navigation }) {
  const [name, setName]       = useState('');
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');
  const [picture, setPicture] = useState(null);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    async function load() {
      setName(await AsyncStorage.getItem('profile_name')    ?? '');
      setSurname(await AsyncStorage.getItem('profile_surname') ?? '');
      setPicture(await AsyncStorage.getItem('profile_picture') ?? null);
    }
    load();
  }, []);

  async function pickImage() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to change your picture.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPicture(result.assets[0].uri);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await AsyncStorage.setItem('profile_name', name.trim());
      await AsyncStorage.setItem('profile_surname', surname.trim());
      if (picture) {
        await AsyncStorage.setItem('profile_picture', picture);
      } else {
        await AsyncStorage.removeItem('profile_picture');
      }
      if (password.trim()) {
        await AsyncStorage.setItem('profile_password', password.trim());
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit profile</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Picture */}
        <View style={styles.avatarBlock}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            {picture
              ? <Image source={{ uri: picture }} style={styles.avatarImg} />
              : <View style={styles.avatar}><Text style={styles.avatarEmoji}>👤</Text></View>
            }
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Fields */}
        <View style={styles.form}>
          <Text style={styles.label}>First name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your first name"
            placeholderTextColor="rgba(44,31,20,0.35)"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Surname</Text>
          <TextInput
            style={styles.input}
            value={surname}
            onChangeText={setSurname}
            placeholder="Your surname"
            placeholderTextColor="rgba(44,31,20,0.35)"
            autoCapitalize="words"
          />

          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Leave blank to keep current"
            placeholderTextColor="rgba(44,31,20,0.35)"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={save}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
        </TouchableOpacity>

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

  avatarBlock: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 100, height: 100, borderRadius: 28, backgroundColor: '#2C1F14', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 44 },
  avatarImg: { width: 100, height: 100, borderRadius: 28 },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 10, backgroundColor: '#D4A96A', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F5EBD7' },
  avatarEditIcon: { fontSize: 14 },
  avatarHint: { fontSize: 12, color: '#7A6651', marginTop: 10 },

  form: { gap: 4 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: '#7A6651', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#2C1F14', borderWidth: 1, borderColor: 'rgba(44,31,20,0.1)' },

  saveBtn: { marginTop: 28, backgroundColor: '#C87941', borderRadius: 18, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#F5EBD7' },
});
