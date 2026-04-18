import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useEffect, useState } from 'react';

import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ModeSelectScreen from './src/screens/ModeSelectScreen';
import { initDB } from './src/db/database';

const Tab = createBottomTabNavigator();

const icons = {
  Home: '🏠',
  Explore: '🔍',
  Leaderboard: '🏆',
  Profile: '👤',
};

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
        screenOptions={({ route }) => ({
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>{icons[route.name]}</Text>,
          tabBarActiveTintColor: '#6200ee',
          tabBarInactiveTintColor: '#999',
          headerStyle: { backgroundColor: '#6200ee' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        })}
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
