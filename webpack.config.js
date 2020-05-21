const path = require('path')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: [
    'regenerator-runtime/runtime',
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
    new CopyPlugin([
      { from: './public', to: 'public' },
      { from: './uploads', to: 'uploads' }
    ])
  ]
}
