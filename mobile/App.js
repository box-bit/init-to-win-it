import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './src/screens/HomeScreen';
import AdventureDetailScreen from './src/screens/AdventureDetailScreen';
import PennyHikeDetailScreen from './src/screens/PennyHikeDetailScreen';
import FindNatureScreen from './src/screens/FindNatureScreen';
import AdventureCompleteScreen from './src/screens/AdventureCompleteScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ModeSelectScreen from './src/screens/ModeSelectScreen';
import CustomTabBar from './src/components/CustomTabBar';
import { initDB } from './src/db/database';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function HomeNavigator({ selectedMode }) {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain">
        {(props) => <HomeScreen {...props} selectedMode={selectedMode} />}
      </HomeStack.Screen>
      <HomeStack.Screen name="AdventureDetail" component={AdventureDetailScreen} />
      <HomeStack.Screen name="PennyHike" component={PennyHikeDetailScreen} />
      <HomeStack.Screen name="FindNature" component={FindNatureScreen} />
      <HomeStack.Screen name="AdventureComplete" component={AdventureCompleteScreen} />
    </HomeStack.Navigator>
  );
}

export default function App() {
  const [selectedMode, setSelectedMode] = useState(null);
  const [modeChosen, setModeChosen] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function setup() {
      initDB();
      const resetDone = await AsyncStorage.getItem('score_reset_v1');
      if (!resetDone) {
        await AsyncStorage.setItem('user_total_score', '0');
        await AsyncStorage.setItem('score_reset_v1', '1');
      }
      setDbReady(true);
    }
    setup();
  }, []);

  if (!dbReady) return null;

  if (!modeChosen) {
    return (
      <SafeAreaProvider>
        <ModeSelectScreen onSelect={(mode) => { setSelectedMode(mode); setModeChosen(true); }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Home">
            {() => <HomeNavigator selectedMode={selectedMode} />}
          </Tab.Screen>
          <Tab.Screen name="Explore" component={ExploreScreen} />
          <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Tab.Screen name="Profile" component={ProfileNavigator} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
