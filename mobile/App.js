import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import AdventureDetailScreen from './src/screens/AdventureDetailScreen';
import PennyHikeDetailScreen from './src/screens/PennyHikeDetailScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ModeSelectScreen from './src/screens/ModeSelectScreen';
import CustomTabBar from './src/components/CustomTabBar';
import { initDB } from './src/db/database';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeNavigator({ selectedMode }) {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain">
        {(props) => <HomeScreen {...props} selectedMode={selectedMode} />}
      </HomeStack.Screen>
      <HomeStack.Screen name="AdventureDetail" component={AdventureDetailScreen} />
      <HomeStack.Screen name="PennyHike" component={PennyHikeDetailScreen} />
    </HomeStack.Navigator>
  );
}

export default function App() {
  const [selectedMode, setSelectedMode] = useState(null);
  const [modeChosen, setModeChosen] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDB();
    setDbReady(true);
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
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
