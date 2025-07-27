import React, { Suspense, lazy } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Lazy load heavy components
const MainApp = lazy(() => import('../App'));

const LoadingScreen = () => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color="#3B82F6" />
    <Text style={styles.loadingText}>Loading Expense Tracker...</Text>
  </View>
);

export default function AppLite() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <MainApp />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 20,
    color: '#fff',
    fontSize: 16,
  },
});