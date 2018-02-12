/**
 * Production Webpack Configuration
 */

const Dotenv = require('dotenv-webpack');
const { resolve } = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const WebpackBundleSizeAnalyzerPlugin = require('webpack-bundle-size-analyzer').WebpackBundleSizeAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {

  devtool: false,

  context: resolve(__dirname, 'src'),

  entry: [
    './',
    './scss/app'
  ],

  output: {
    filename: 'app-[hash].js.gz',
    path: resolve(__dirname, 'build'),
    publicPath: '/',
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loaders: ['babel-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'] },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: false,
                importLoaders: 1,
                modules: true,
                localIdentName: '[hash:base64:4]',
                minimize: true,
              },
            },
            {
              loader: 'postcss-loader',
            },
            {
              loader: 'sass-loader',
            }
          ],
        }),
      },
      { test: /\.(png|jpg|gif)$/, use: 'url-loader?limit=15000&name=[hash:base64:5].[ext]' },
      { test: /\.eot(\?v=\d+.\d+.\d+)?$/, use: 'file-loader' },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, use: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.[ot]tf(\?v=\d+.\d+.\d+)?$/, use: 'url-loader?limit=10000&mimetype=application/octet-stream' },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, use: 'url-loader?limit=10000&mimetype=image/svg+xml' }
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx', '.scss'],
    alias: {
      variables: resolve(__dirname, 'src/scss/utils/variables'),
      mixins: resolve(__dirname, 'src/scss/utils/mixins'),
      respond: resolve(__dirname, 'src/scss/utils/respond')
    }
  },

  plugins: [
    new Dotenv({
      path: './.env.production',
      safe: true
    }),
    new webpack.DefinePlugin({ // <-- key to reducing React's size
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new HtmlWebpackPlugin({
      template: `${__dirname}/src/index.ejs`,
      filename: 'index.html',
      inject: 'body',
      favicon: '',
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),

    // uglify / minify
    new webpack.optimize.UglifyJsPlugin({
      beautify: false,
      mangle: {
        screw_ie8: true,
        keep_fnames: true,
      },
      compress: {
        screw_ie8: true,
      },
      comments: false,
    }),
    new ExtractTextPlugin({ filename: 'app-[hash].css', disable: false, allChunks: true }),

    // GZIP compression
    new CompressionPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: /\.js$|\.css$|\.html$/,
      threshold: 10240,
      minRatio: 0.8
    }),

    // reporting
    new WebpackBundleSizeAnalyzerPlugin('./plain-report.txt')
  ]

};
