import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, AppState } from 'react-native';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { useAppTheme } from './src/contexts/ThemeContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { DateProvider } from './src/contexts/DateContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { cleanupRateLimiter } from './src/utils/rateLimiter';

// Import screens
import { HomeScreen } from './src/screens/HomeScreen';
import { AddExpenseScreen } from './src/screens/AddExpenseScreen';
import { AddIncomeScreen } from './src/screens/AddIncomeScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main tab navigator
const TabNavigator = () => {
  const { theme } = useAppTheme();
  const { user } = useAuth();

  // Safety check - if user is null, don't render
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Add Expense') {
            iconName = focused ? 'remove-circle' : 'remove-circle-outline';
          } else if (route.name === 'Add Income') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
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

// Main app component
const AppContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main">
            {() => <TabNavigator />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Auth">
            {() => <AuthScreen />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  // Cleanup resources on app state change to background/inactive
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Clean up rate limiter when app goes to background
        cleanupRateLimiter();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on app unmount
    return () => {
      subscription?.remove();
      cleanupRateLimiter();
    };
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to crash reporting service in production
        console.error('App crashed:', error, errorInfo);
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <DateProvider>
            <AppContent />
            <StatusBar style="auto" />
          </DateProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
