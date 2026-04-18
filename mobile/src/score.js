import AsyncStorage from '@react-native-async-storage/async-storage';

const SCORE_KEY = 'user_total_score';

export async function getUserScore() {
  const raw = await AsyncStorage.getItem(SCORE_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export async function addScore(points) {
  const current = await getUserScore();
  const next = current + points;
  await AsyncStorage.setItem(SCORE_KEY, String(next));
  return next;
}
