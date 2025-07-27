import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { supabase, supabaseAuthService } from '../services/supabase';

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

  useEffect(() => {
    loadUserFromSupabase();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: userData } = await supabaseAuthService.getCurrentUser();
        if (userData) {
          setUserState({
            ...userData,
            nickname: userData.nickname || undefined,
            updated_at: new Date().toISOString()
          });
        }
        
        if (userData) {
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        }
      } else {
        setUserState(null);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserFromSupabase = async () => {
    try {
      const { data: userData } = await supabaseAuthService.getCurrentUser();
      if (userData) {
        const userWithTimestamp = {
          ...userData,
          nickname: userData.nickname || undefined,
          updated_at: new Date().toISOString()
        };
        setUserState(userWithTimestamp);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userWithTimestamp));
      } else {
        const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserState(userData);
        }
      }
    } catch (error) {
      try {
        const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserState(userData);
        }
      } catch (storageError) {
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (userData: User | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        setUserState(userData);
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        setUserState(null);
      }
    } catch (error) {
      setUserState(userData);
    }
  };

  const logout = async () => {
    try {
      await supabaseAuthService.signOut();
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUserState(null);
    } catch (error) {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
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