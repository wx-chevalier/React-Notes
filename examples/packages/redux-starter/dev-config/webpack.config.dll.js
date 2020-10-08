const path = require('path');
const pkg = require('../package.json');
const webpack = require('webpack');

const dllConfig = {
  name: 'vendor',
  entry: Object.keys(pkg.dependencies),
  output: {
    path: path.resolve(__dirname, '../build/dll'),
    filename: 'vendor.bundle.js',
    library: 'vendor_[hash]'
  },
  plugins: [
    new webpack.DllPlugin({
      name: 'vendor_[hash]',
      path: path.resolve(__dirname, '../build/dll/manifest.json')
    })
  ]
};

module.exports = dllConfig;
