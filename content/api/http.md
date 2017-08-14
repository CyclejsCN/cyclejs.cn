# Cycle HTTP

发送 HTTP 请求的 driver，底层基于 [superagent](https://github.com/visionmedia/superagent) 实现。

```
npm install @cycle/http
```

## 用法

基础：

```js
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeHTTPDriver} from '@cycle/http';

function main(sources) {
  // ...
}

const drivers = {
  HTTP: makeHTTPDriver()
}

run(main, drivers);
```

常见的用法：

```js
function main(sources) {
  let request$ = xs.of({
    url: 'http://localhost:8080/hello', // 默认使用 GET 方法
    category: 'hello',
  });

  let response$ = sources.HTTP
    .select('hello')
    .flatten();

  let vdom$ = response$
    .map(res => res.text) // 返回值应该是 "Hello World"
    .startWith('Loading...')
    .map(text =>
      div('.container', [
        h1(text)
      ])
    );

  return {
    DOM: vdom$,
    HTTP: request$
  };
}
```

一个完整的 API 示例，在 `main` 函数中：

```js
function main(source) {
  // HTTP Source 属性：
  // - select(category) or select()
  // - filter(predicate)
  // 注意 $$ 表示这是一个 metastream，即 stream 的 stream
  let httpResponse$$ = source.HTTP.select();

  httpResponse$$.addListener({
    next: httpResponse$ => {
      // 注意 httpResponse$$ 触发 httpResponse$。

      // response stream 包含一个特殊的属性：
      // `request`， 与触发 sink stream 时的 `request` 对象相同。
      // 可以用来过滤与特定 request 对应的 httpResponse$。
      console.log(httpResponse$.request);
    },
    error: () => {},
    complete: () => {},
  });

  let httpResponse$ = httpResponse$$.flatten(); // 将 metastream 压平
  // 为什么要在 API 中提供 flatten 函数？Cycle.js 要求用户必须在不同的并行策略之间做出选择。
  // xstream 常用的 `flatten()` 有并发数为 1 的限制，一旦针对同一资源的请求发生时，前面的相同的请求将会被取消。
  // 如果想全部并行处理（没有取消的情况），请使用 `flattenConcurrently()`。

  httpResponse$.addListener({
    next: httpResponse => {
      // httpResponse 即为从 superagent 获得的 response 对象，
      // 想要了解该对象的结构，可以查看 superagent 的文档。
      console.log(httpResponse.status); // 200
    },
    error: (err) => {
      // 网络错误
      console.error(err);
    },
    complete: () => {},
  });

  // 这个 request stream 周期性地产生对象，对象有一个 `url` 属性，值为 `http://localhost:8080/ping`。
  let request$ = xs.periodic(1000)
    .mapTo({ url: 'http://localhost:8080/ping', method: 'GET' });

  return {
    HTTP: request$ // HTTP driver 将 request$ 当做输入。
  };
}
```

## 出错处理

可以使用 xstream 或者 RxJS 的规范的操作来处理错误。因为 response stream 是 stream 的 stream，每一个 stream 都有自己的 response，因此你应当为这样的每一个 response stream 提供错误处理：

```js
sources.HTTP
  .select('hello')
  .map((response$) =>
    response$.replaceError(() => xs.of(errorObject))
  ).flatten()
```

更多的信息可以查看 [xstream 关于 replaceError 的文档 ](https://github.com/staltz/xstream#replaceError) 或者 [RxJS catch 相关的文档](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/catch.md)

## 其他信息

更多高级的用法，可以参看[搜索示例](https://github.com/cyclejs/cyclejs/tree/master/examples/http-search-github)

## 浏览器支持

[![Sauce Test Status](https://saucelabs.com/browser-matrix/cyclejs-http.svg)](https://saucelabs.com/u/cyclejs-http)

不支持 IE8，因为依赖的 [superagent](https://github.com/visionmedia/superagent) 不支持。

# 隔离语义

Cycle HTTP 通过 `@cycle/isolate` 支持组件的隔离。下面讲一讲给 `isolate(Component, scope)` 传递不同的 `scope`，隔离上下文是如何工作的。

**scope 为 `null` 时，无隔离。**

父子组件运行在同一个上下文当中，在子组件中调用类似 `HTTPSource.select()` 方法时可以获取到与父组件相关的 response stream。这意味着，子组件可以看到非自己产生的 reponse。

**scope 为字符串：siblings isolation（兄弟组件隔离）**

在父组件中调用 `HTTPSource.select()` 可以获取到其子组件的 HTTP response。但是，使用“siblings isolation”隔离策略的子组件无法访问到其他采用同样策略“siblings isolation”子组件的 HTTP response。

# API


## `makeHTTPDriver()`

HTTP Driver 工厂函数。

函数，调用返回一个可用于 Cycle.js 应用的 HTTP Driver。这个 driver 同样是一个函数，接收 request stream 作为输入，输出 HTTP Source。HTTP Source 是一个对象，拥有若干函数用于 response stream 的查询。

**Request**。request stream 输出字符串或者对象。如果输出的是字符串，就是代表一个 URL 地址，指向一个远程可通过 HTTP 请求的资源。如果输出的对象，这个对象等价于 superagent 请求的配置对象。即对象结构与 supergent request API 的配置类似。`request` 对象的属性包括：

- `url` **（String）**：远程资源路径。**必选**；
- `method` **（String）**：request 的 HTTP 方法（GET、POST、PUT 等等）；
- `category` **（String）**：可选，自定义 key。可以用在 HTTP Source 中，比如要查询相关的 response 时：`sources.http.select(category)`；
- `query` **（Object）**：对象，发送 `GET` 或者 `POST` 时的 payload；
- `send` **（Object）**：对象，发送 `POST` 时的 payload；
- `headers` **（Object）**：对象，设定 HTTP 请求头；
- `accept` **（String）**：设置 HTTP 请求头 Accept 值；
- `type` **（String）**：设置请求头 Content-Type 值，简写；
- `user` **（String）**：用于登录验证的用户名；
- `password` **（String）**：用于登录验证的密码；
- `field` **（Object）**：对象，Form 字段对应的 key/value 值；
- `progress` **（Boolean）**：配置是否跟踪并在 response Observable 上触发 progress 事件；
- `attach` **（Array）**：对象数组，每个对象包含 `name`、`path`和`filename` 属性，代表一个上传资源；
- `withCredentials` **（Boolean）**：开启跨域请求携带目标域的 cookie 信息；
- `agent` **（Object）**：对象，指定 SSL 证书认证所需的 `cert` 和 `key`；
- `redirects` **（Number）**：允许重定向的次数；
- `lazy` **（Boolean）**：是否启用延迟请求模式；在 HTTP Source 上对应的 response stream 被订阅时才发出请求。默认值为 `false`：无论 response 是否会被应用使用，请求都会尽早发出；
- `responseType` **（String）**：设置 XHR 的 responseType。

**Responses**：metastream 就是输出 stream 的 stream。HTTP Source 管理 response 的 metastream。这些 response 的 stream 自身有一个 `request` 属性值，指明来自 driver 输入的哪个 request 产生了自己。HTTP Source 自己本身并不是 stream，但它有两个方法，`filter()` 和 `select()`，所以可以调用 `sources.HTTP.filter(request => request.url === X)`，过滤出满足条件的 response stream，获得一个新的 HTTP Source；还可以调用  `sources.HTTP.select(category)`，获取与 `category` 键值相匹配的 response 的 metastream。甚至，还可以直接不传参调用`httpSource.select()`，获得全部的 metastream。在消费 metastream 前必须将其压平（flatten），在 response stream 中将会收到来由 superagent 产生的响应对象。

#### 返回：

**（Function）** HTTP Driver 函数
