const path = require('path');
const merge = require('webpack-merge');

const devConfig = require('../../../../scripts/webpack/webpack.config.dev');

module.exports = merge(devConfig, {
  entry: {
    index: path.resolve(__dirname, '../../src'),
    en: path.resolve(__dirname, '../../i18n/entry/en'),
    zh: path.resolve(__dirname, '../../i18n/entry/zh')
  },
  devServer: {
    contentBase: path.resolve(__dirname, '../../public')
  }
});
