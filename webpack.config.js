const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin'); 

module.exports = {
  mode: 'production',
  entry: './src/main.js',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Catapult'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {from: 'static'}
      ]
    })
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
    clean: true
  },

  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 9000,
    hot: true
  }
};