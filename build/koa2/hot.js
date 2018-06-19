'use strict'

const hotMiddleware = require('webpack-hot-middleware')
const PassThrough = require('stream').PassThrough

// webpack-hot-middleware返回的是一个express中间件，这里对他进行改造变成koa中间件
module.exports = (compiler, opts) => {
  const expressMiddleware = hotMiddleware(compiler, opts)
  return (ctx, next) => {
    let stream = new PassThrough()
    ctx.body = stream
    return expressMiddleware(ctx.req, {
      write: stream.write.bind(stream),
      writeHead: (state, headers) => {
        ctx.state = state
        ctx.set(headers)
      }
    }, next)
    // return next();
  }
}
