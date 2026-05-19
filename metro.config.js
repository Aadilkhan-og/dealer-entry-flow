const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const emptyModule = path.resolve(__dirname, "_empty-module.js");

// Force @supabase/* through Babel so dynamic import() calls inside its pre-compiled
// dist files are transformed to require() before hermesc compiles the bundle.
// Without this, hermesc rejects `import(/* webpackIgnore: true */ ...)` at release time.
config.transformer = {
  ...(config.transformer || {}),
  transformIgnorePatterns: [
    "node_modules/(?!(" +
      "@supabase/|" +
      "react-native/|" +
      "@react-native/|" +
      "@react-native-community/|" +
      "expo/|" +
      "expo-|" +
      "@expo/|" +
      "@unimodules/|" +
      "react-navigation/|" +
      "@react-navigation/" +
    "))",
  ],
};

// Stub @opentelemetry/* entirely so the resolved module is empty even after
// @supabase's dynamic import() is converted to require() by the transform above.
config.resolver = {
  ...(config.resolver || {}),
  resolveRequest: (context, moduleName, platform) => {
    if (
      moduleName === "@opentelemetry/api" ||
      moduleName.startsWith("@opentelemetry/")
    ) {
      return { type: "sourceFile", filePath: emptyModule };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
