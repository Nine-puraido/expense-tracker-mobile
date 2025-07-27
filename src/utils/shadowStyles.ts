import { Platform } from 'react-native';

interface ShadowStyleParams {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

export const createShadowStyle = ({
  shadowColor = '#000',
  shadowOffset = { width: 0, height: 2 },
  shadowOpacity = 0.1,
  shadowRadius = 4,
  elevation = 3,
}: ShadowStyleParams) => {
  if (Platform.OS === 'web') {
    // Convert React Native shadow to CSS box-shadow
    const offsetX = shadowOffset.width;
    const offsetY = shadowOffset.height;
    const blur = shadowRadius * 2;
    const opacity = shadowOpacity;
    
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${blur}px rgba(0, 0, 0, ${opacity})`,
    };
  }
  
  // Return React Native shadow props for iOS/Android
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    ...(Platform.OS === 'android' && { elevation }),
  };
};