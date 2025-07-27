const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize for web
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// Enable minification for web
if (process.env.EXPO_PUBLIC_PLATFORM === 'web') {
  config.transformer.minifierConfig = {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  };
}

module.exports = config;