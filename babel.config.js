module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Transform dynamic import() to require() — Hermes doesn't support import()
      "@babel/plugin-transform-dynamic-import",
    ],
  };
};
