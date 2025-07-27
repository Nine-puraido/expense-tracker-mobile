import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { DateProvider } from './src/contexts/DateContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddExpenseScreen } from './src/screens/AddExpenseScreen';
import { AddIncomeScreen } from './src/screens/AddIncomeScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Add Expense') iconName = focused ? 'remove-circle' : 'remove-circle-outline';
          else if (route.name === 'Add Income') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'Analytics') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home">
        {props => <HomeScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Add Expense">
        {props => <AddExpenseScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Add Income">
        {props => <AddIncomeScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Analytics">
        {props => <AnalyticsScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {props => <ProfileScreen {...props} user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default function App() {
  console.log('Web App Starting...');
  
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <DateProvider>
            <NavigationContainer>
              <View style={styles.container}>
                <TabNavigator />
              </View>
            </NavigationContainer>
          </DateProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      width: '100%',
      marginHorizontal: 'auto',
      backgroundColor: '#f5f5f5',
    }),
  },
});