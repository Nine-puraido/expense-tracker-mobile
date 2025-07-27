import Constants from 'expo-constants';

interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Secure configuration management for environment variables
 */
function getConfig(): Config {
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

  if (!supabaseUrl) {
    throw new Error(
      'Missing required environment variable: EXPO_PUBLIC_SUPABASE_URL\n' +
      'Please check your .env file or app.config.js configuration'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing required environment variable: EXPO_PUBLIC_SUPABASE_ANON_KEY\n' +
      'Please check your .env file or app.config.js configuration'
    );
  }

  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(
      'Invalid EXPO_PUBLIC_SUPABASE_URL format. Must be a valid URL.'
    );
  }
  if (!supabaseAnonKey.startsWith('eyJ')) {
    throw new Error(
      'Invalid EXPO_PUBLIC_SUPABASE_ANON_KEY format. Must be a valid JWT token.'
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export const config = getConfig();

