import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { LIGHT_THEME, DARK_THEME } from '../constants';
import { AppTheme } from '../types';

export const useTheme = () => {
  const [theme, setTheme] = useState<AppTheme>(() => {
    const colorScheme = Appearance.getColorScheme();
    return {
      dark: colorScheme === 'dark',
      colors: colorScheme === 'dark' ? DARK_THEME : LIGHT_THEME,
    };
  });

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme({
        dark: colorScheme === 'dark',
        colors: colorScheme === 'dark' ? DARK_THEME : LIGHT_THEME,
      });
    });

    return () => subscription?.remove();
  }, []);

  return theme;
}; 