const webpack = require('webpack');

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "assert": require.resolve("assert"),
    "buffer": require.resolve("buffer"),
    "crypto": require.resolve("crypto-browserify"),
    "https": require.resolve("https-browserify"),
    "http": require.resolve("stream-http"),
    "os": require.resolve("os-browserify/browser"),
    "path": require.resolve("path-browserify"),
    "process": require.resolve("process/browser.js"),
    "stream": require.resolve("stream-browserify"),
    "url": require.resolve("url"),
    "vm": require.resolve("vm-browserify"),
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false,
    "readline": false,
    "zlib": false
  };

  // Настройки для ES модулей
  config.resolve.extensionAlias = {
    ...config.resolve.extensionAlias,
    ".js": [".ts", ".tsx", ".js", ".jsx"],
    ".mjs": [".mts", ".mjs"]
  };

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser.js"
    }),
    new webpack.DefinePlugin({
      global: 'globalThis',
    })
  ];

  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Critical dependency: the request of a dependency is an expression/,
  ];

  // Отключение требования полной спецификации для модулей
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });
  
  return config;
}; 