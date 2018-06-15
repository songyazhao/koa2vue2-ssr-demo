import { app, router, store } from './app'

export default context => {
  // 设置路由地址
  router.push(context.url)
  // 调用匹配到路由组件的钩子函数
  const s = Date.now()
  return Promise.all(router.getMatchedComponents().map(component => {
    if (component.prefetch) {
      return component.prefetch(store)
    }
  })).then(() => {
    console.log(`数据预获取耗时: ${Date.now() - s}ms`)
    // 在 context 上存储 store，请求处理器将在HTML响应中内联状态
    context.initialState = store.state
    return app
  })
}
