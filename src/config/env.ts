import Constants from 'expo-constants';

interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Secure configuration management for environment variables
 * This ensures all required environment variables are available
 */
function getConfig(): Config {
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

  // Validate that required environment variables are present
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

  // Basic validation of URL format
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(
      'Invalid EXPO_PUBLIC_SUPABASE_URL format. Must be a valid URL.'
    );
  }

  // Basic validation of JWT format (should start with 'eyJ')
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

// Export the configuration
export const config = getConfig();

// For debugging purposes only (remove in production)
if (__DEV__) {
  console.log('✅ Environment configuration loaded successfully');
  console.log('Supabase URL:', config.supabaseUrl);
  console.log('Supabase Key configured:', config.supabaseAnonKey ? 'Yes' : 'No');
}