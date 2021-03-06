'use strict'

process.env.VUE_ENV = 'server'

const isDev = process.env.NODE_ENV === 'development'

const fs = require('fs')
const path = require('path')
const resolve = file => path.resolve(__dirname, file)
const serialize = require('serialize-javascript')

const { createBundleRenderer } = require('vue-server-renderer')

const Koa = require('koa')
const app = new Koa()
const serve = require('koa-static')
const favicon = require('koa-favicon')
const router = require('koa-router')()

// 解析模板 index.html
const html = (() => {
  const template = fs.readFileSync(resolve('./index.html'), 'utf-8')
  const i = template.indexOf('{{ APP }}')
  // 在开发模式(development)下通过 vue-style-loader 动态插入 styles
  const style = isDev ? '' : '<link rel="stylesheet" href="/dist/styles.css">'
  return {
    head: template.slice(0, i).replace('{{ STYLE }}', style),
    tail: template.slice(i + '{{ APP }}'.length)
  }
})()

let renderer
if (isDev) {
  require('./build/dev-server')(app, bundle => {
    renderer = createRenderer(bundle)
  })
} else {
  // 从fs中创建服务端渲染器
  const bundlePath = resolve('./dist/server-bundle.js')
  renderer = createRenderer(fs.readFileSync(bundlePath, 'utf-8'))
}

function createRenderer(bundle) {
  return createBundleRenderer(bundle, {
    cache: require('lru-cache')({
      max: 1000,
      maxAge: 1000 * 60 * 15
    })
  })
}

app.use(require('koa-bigpipe'))
app.use(favicon(resolve('src/assets/logo.png')))

router.get('/dist', serve(resolve('./dist')))

app.use((ctx, next) => {
  const res = ctx.res
  const req = ctx.req
  if (!renderer) {
    return res.end('等待编译... 即将刷新.')
  }

  const context = { url: req.url }
  const renderStream = renderer.renderToStream(context)
  let s = Date.now()
  let firstChunk = true

  ctx.write(html.head)
  // on('data'...) 流动模式
  renderStream.on('data', chunk => {
    if (firstChunk) {
      // embed initial store state
      if (context.initialState) {
        ctx.write(
          `<script>window.__INITIAL_STATE__=${
            serialize(context.initialState, { isJSON: true })
          }</script>`
        )
      }
      firstChunk = false
    }
    ctx.write(chunk)
  })

  renderStream.on('end', () => {
    ctx.end(html.tail)
    console.log(`渲染耗时: ${Date.now() - s}ms`)
  })

  renderStream.on('error', err => {
    throw err
  })
})

app
  .use(router.routes())
  .use(router.allowedMethods())

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Live Server：http://localhost:${port}`)
})
