const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add all necessary fallbacks
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert"),
    "buffer": require.resolve("buffer"),
    "process": require.resolve("process/browser"),
    "url": require.resolve("url"),
    "path": require.resolve("path-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "vm": require.resolve("vm-browserify"),
  };

  // Add plugins
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  // Fix for process/browser resolution
  config.resolve.alias = {
    ...config.resolve.alias,
    'process': 'process/browser',
  };

  // Fix for ES modules
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });

  // Suppress warnings for node modules
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Module not found: Can't resolve/,
    /Critical dependency: the request of a dependency is an expression/,
    /Can't resolve 'process\/browser'/,
  ];

  return config;
}; 