const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin'); 

module.exports = {
  mode: 'production',
  entry: './src/main.js',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Catapult',
      template: './index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {from: 'static'}
      ]
    }),
  ],
  output: {
    filename: 'bundle.[hash].js',
    path: path.resolve(__dirname, 'public'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: "/node_modules/",
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: true,
            },
          },
        ],
      },
    ],
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