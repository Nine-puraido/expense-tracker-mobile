import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'expense_tracker_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUserState(userData);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (userData: User | null) => {
    try {
      if (userData) {
        // Save user to storage and state
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        setUserState(userData);
      } else {
        // Clear user from storage and state
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        setUserState(null);
      }
    } catch (error) {
      console.error('Error saving user to storage:', error);
      // Still update state even if storage fails
      setUserState(userData);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUserState(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Force logout even if storage fails
      setUserState(null);
    }
  };

  const value: AuthContextType = {
    user,
    setUser,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};