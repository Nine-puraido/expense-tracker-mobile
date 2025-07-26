import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const ThemeToggle: React.FC = () => {
  const { theme, mode, toggleTheme } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={toggleTheme}
    >
      <Ionicons
        name={mode === 'system' ? 'contrast' : theme.dark ? 'sunny' : 'moon'}
        size={24}
        color={theme.colors.text}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
}); 