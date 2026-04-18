import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';

import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ModeSelectScreen from './src/screens/ModeSelectScreen';
import CustomTabBar from './src/components/CustomTabBar';
import { initDB } from './src/db/database';

const Tab = createBottomTabNavigator();

export default function App() {
  const [selectedMode, setSelectedMode] = useState(null);
  const [modeChosen, setModeChosen] = useState(false);

  useEffect(() => {
    initDB();
  }, []);

  function handleModeSelect(mode) {
    setSelectedMode(mode);
    setModeChosen(true);
  }

  if (!modeChosen) {
    return <ModeSelectScreen onSelect={handleModeSelect} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home">
          {() => <HomeScreen selectedMode={selectedMode} />}
        </Tab.Screen>
        <Tab.Screen name="Explore" component={ExploreScreen} />
        <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
