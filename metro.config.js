const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const emptyModule = path.resolve(__dirname, "_empty-module.js");

// Use resolveRequest (not extraNodeModules) to properly override @opentelemetry/* modules.
// extraNodeModules only adds lookup paths; resolveRequest intercepts every resolution.
// @opentelemetry/api uses dynamic import() which Hermes cannot compile — stub it out.
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
