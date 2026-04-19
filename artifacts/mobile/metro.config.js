const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
config.resolver.blockList = [
  /node_modules\/.pnpm\/stripe.*/,
  /node_modules\/stripe.*/,
  /_tmp_\d+/,
];

module.exports = config;
