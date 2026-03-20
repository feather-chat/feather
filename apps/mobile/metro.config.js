const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch only the shared workspace packages the mobile app consumes
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages', 'api-client'),
  path.resolve(monorepoRoot, 'packages', 'shared'),
];

// Let Metro know where to resolve packages and workspace packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
