const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Explicitly define node modules paths to solve S: drive mapping issues
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'expo-modules-core': path.resolve(__dirname, 'node_modules/expo-modules-core'),
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
};

config.watchFolders = [
  path.resolve(__dirname),
  path.resolve(__dirname, 'node_modules'),
];

module.exports = config;
