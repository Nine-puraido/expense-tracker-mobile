import { Platform, StyleSheet } from 'react-native';

export const webStyles = StyleSheet.create({
  webContainer: Platform.OS === 'web' ? {
    maxWidth: 400,
    marginHorizontal: 'auto',
    minHeight: '100vh',
  } : {},
  
  webScrollView: Platform.OS === 'web' ? {
    maxHeight: '100vh',
  } : {},
  
  webTextInput: Platform.OS === 'web' ? {
    outlineStyle: 'none',
  } : {},
  
  webButton: Platform.OS === 'web' ? {
    cursor: 'pointer',
    userSelect: 'none',
  } : {},
});

export const isWeb = Platform.OS === 'web';