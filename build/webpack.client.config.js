const base = require('./webpack.base.config')
const webpack = require('webpack')
const vueConfig = require('./vue-loader.config')


const config = Object.assign({}, base, {
  plugins: (base.plugins || []).concat([
    // 在 Vue 代码中去掉注释
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ]),
  optimization: {
    // 提取公用的模块以获得更快的加载
    splitChunks: {
      cacheGroups: {
        commons: {
          name: 'vendor',
          chunks: 'initial',
          minChunks: 2
        }
      }
    }
  }
})

if (process.env.NODE_ENV === 'production') {
  // 抽离CSS到单个的文件中
  const ExtractTextPlugin = require('extract-text-webpack-plugin')

  vueConfig.loaders = {
    css: ExtractTextPlugin.extract({
      loader: 'css-loader',
      fallbackLoader: 'vue-style-loader'
    }),
    stylus: ExtractTextPlugin.extract({
      loader: 'css-loader!stylus-loader',
      fallbackLoader: 'vue-style-loader'
    })
  }

  config.plugins.push(
    new ExtractTextPlugin('styles.css'),
    // 这是webpack中用于缩小CSS的必要条件
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    // 最小化 JS
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  )
}

module.exports = config
