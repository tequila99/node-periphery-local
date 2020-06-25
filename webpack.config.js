const path = require('path')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
// const TerserPlugin = require('terser-webpack-plugin')
const nodeExternals = require('webpack-node-externals')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: [
    './src/index.js'
  ],
  target: 'node',
  node: {
    __dirname: false
  },
  externals: [nodeExternals({
    modulesFromFile: true
  })],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'periphery-local.js'
  },
  module: {
    rules: [
      {
        use: 'babel-loader',
        exclude: /(node_modules)/,
        test: /\.js$/
      }
    ]
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin(),
    new webpack.IgnorePlugin(/uws/),
    new CopyWebpackPlugin([
      { from: 'node_modules/serialport/build/Release/serialport.node', to: 'dist/' }
    ])
  ]
}
