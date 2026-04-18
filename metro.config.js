const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/private/defaults/exclusionList').default;
const path = require('path');

const config = getDefaultConfig(__dirname);

// Keep Metro away from generated Android/Gradle trees that are unstable on Windows.
config.resolver.blockList = exclusionList([
  /node_modules[\/\\]@react-native[\/\\]gradle-plugin[\/\\].*/,
  /node_modules[\/\\].*[\/\\]\.cxx[\/\\].*/,
  /node_modules[\/\\].*[\/\\]\.gradle[\/\\].*/,
  /android[\/\\]\.gradle[\/\\].*/,
  /android[\/\\]app[\/\\]\.cxx[\/\\].*/,
]);

// Ensure Metro can always find react-native-worklets (peer dep of reanimated)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-worklets': path.resolve(__dirname, 'node_modules/react-native-worklets'),
};

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return context.resolveRequest(context, 'tslib/tslib.js', platform);
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
