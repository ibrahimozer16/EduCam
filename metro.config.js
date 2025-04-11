const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.assetExts.push('bin');
defaultConfig.resolver.sourceExts.push('cjs');

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  },
});
