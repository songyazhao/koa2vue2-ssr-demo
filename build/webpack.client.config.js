const base = require('./webpack.base.config')
const webpack = require('webpack')
// 抽离CSS到单个的文件中，webpack4 中废弃了 extract-text-webpack-plugin 插件，替代的是mini-css-extract-plugin
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const config = Object.assign({}, base, {
  plugins: (base.plugins || []).concat([
    // 在 Vue 代码中去掉注释
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    })
  ]),
  optimization: {
    // 压缩丑化 JS，默认为true
    // minimize: true,
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
  const unshiftLoaders = exps => {
    for (const [index, exp] of exps.entries()) {
      config
        .module.rules
        .find(item => item.test.toString() === exp.toString())
        .use
        .unshift(MiniCssExtractPlugin.loader)
    }
  }
  unshiftLoaders([/\.styl(us)?$/, /\.css$/])

  config.plugins.push(
    new MiniCssExtractPlugin({　　
      // filename: '[name].[chunkhash:7].css',
      filename: 'styles.css'
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
}

module.exports = config
