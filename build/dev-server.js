const path = require('path')
const webpack = require('webpack')
const MFS = require('memory-fs')
const clientConfig = require('./webpack.client.config')
const serverConfig = require('./webpack.server.config')

module.exports = function setupDevServer(app, onUpdate) {
  // 注册编译和热重载
  clientConfig.entry.app = ['webpack-hot-middleware/client', clientConfig.entry.app]
  clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
  // 在编译产生错误时，来跳过输出阶段
  clientConfig.optimization.noEmitOnErrors = true

  const clientCompiler = webpack(clientConfig)
  app.use(require('./koa2/dev')(clientCompiler, {
    publicPath: clientConfig.output.publicPath,
    stats: {
      colors: true,
      chunks: false
    }
  }))
  app.use(require('./koa2/hot')(clientCompiler))

  // 监听并更新服务端渲染
  const serverCompiler = webpack(serverConfig)
  const mfs = new MFS()
  const outputPath = path.join(serverConfig.output.path, serverConfig.output.filename)
  serverCompiler.outputFileSystem = mfs
  serverCompiler.watch({}, (err, stats) => {
    if (err) throw err
    stats = stats.toJson()
    stats.errors.forEach(err => console.error(err))
    stats.warnings.forEach(err => console.warn(err))
    onUpdate(mfs.readFileSync(outputPath, 'utf-8'))
  })
}
