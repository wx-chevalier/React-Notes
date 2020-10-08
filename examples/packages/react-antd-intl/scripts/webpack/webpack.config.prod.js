const merge = require('webpack-merge');
const path = require('path');

const prodConfig = require('../../../../scripts/webpack/webpack.config.prod');

module.exports = merge(prodConfig, {
  entry: {
    index: path.resolve(__dirname, '../../src/index'),
    en: path.resolve(__dirname, '../../i18n/entry/en'),
    zh: path.resolve(__dirname, '../../i18n/entry/zh')
  }
});
