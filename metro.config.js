const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);
const supabasePackages = [
  '@supabase/auth-js',
  '@supabase/functions-js',
  '@supabase/phoenix',
  '@supabase/postgrest-js',
  '@supabase/realtime-js',
  '@supabase/storage-js',
  '@supabase/supabase-js',
];

const config = {
  resolver: {
    sourceExts: [
      ...new Set([
        ...defaultConfig.resolver.sourceExts,
        'cjs',
        'mjs',
      ]),
    ],
    extraNodeModules: Object.fromEntries(
      supabasePackages.map((packageName) => ([
        packageName,
        path.resolve(__dirname, 'node_modules', ...packageName.split('/')),
      ]))
    ),
  },
};

module.exports = mergeConfig(defaultConfig, config);
