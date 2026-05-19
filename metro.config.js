const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Stub out @opentelemetry/api — it uses dynamic import() which Hermes can't compile.
// Supabase pulls this in transitively; we don't use it at runtime.
config.resolver = {
  ...(config.resolver || {}),
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules || {}),
    "@opentelemetry/api": path.resolve(__dirname, "_empty-module.js"),
  },
};

module.exports = config;
