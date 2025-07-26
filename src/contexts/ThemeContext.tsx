import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_THEME, DARK_THEME, STORAGE_KEYS } from '../constants';
import { AppTheme } from '../types';

interface ThemeContextType {
  theme: AppTheme;
  mode: 'light' | 'dark' | 'system';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('system');
  const [theme, setTheme] = useState<AppTheme>(() => {
    const colorScheme = Appearance.getColorScheme();
    return {
      dark: colorScheme === 'dark',
      colors: colorScheme === 'dark' ? DARK_THEME : LIGHT_THEME,
    };
  });

  // Load theme mode from storage
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setMode(stored);
      }
    })();
  }, []);

  // Listen to system changes if mode is 'system'
  useEffect(() => {
    if (mode === 'system') {
      const sub = Appearance.addChangeListener(({ colorScheme }) => {
        setTheme({
          dark: colorScheme === 'dark',
          colors: colorScheme === 'dark' ? DARK_THEME : LIGHT_THEME,
        });
      });
      // Set initial
      const colorScheme = Appearance.getColorScheme();
      setTheme({
        dark: colorScheme === 'dark',
        colors: colorScheme === 'dark' ? DARK_THEME : LIGHT_THEME,
      });
      return () => sub.remove();
    } else {
      setTheme({
        dark: mode === 'dark',
        colors: mode === 'dark' ? DARK_THEME : LIGHT_THEME,
      });
      return undefined;
    }
  }, [mode]);

  // Toggle between light/dark/system
  const toggleTheme = useCallback(() => {
    setMode(prev => {
      let next: 'light' | 'dark' | 'system';
      if (prev === 'system') next = 'light';
      else if (prev === 'light') next = 'dark';
      else next = 'system';
      AsyncStorage.setItem(STORAGE_KEYS.THEME, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 