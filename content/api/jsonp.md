# Cycle JSONP

Cycle JSONP 是一个通过 JSONP 的 hack 技巧创建 HTTP 请求的 Cycle Driver，它基于 [jsonp](https://github.com/webmodules/jsonp) 包。该包小而取巧（类似于 JSONP）且未经测试。只要可能，使用基于 HTTP Driver 的合适的服务器和客户端 CORS 解决方案。

```
npm install @cycle/jsonp
```

## 用法

```js
function main(responses) {
  // This API endpoint returns a JSON response
  const HELLO_URL = 'http://localhost:8080/hello';
  let request$ = Rx.Observable.just(HELLO_URL);
  let vtree$ = responses.JSONP
    .filter(res$ => res$.request === HELLO_URL)
    .mergeAll()
    .startWith({text: 'Loading...'})
    .map(json =>
      h('div.container', [
        h('h1', json.text)
      ])
    );

  return {
    DOM: vtree$,
    JSONP: request$
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('.js-container'),
  JSONP: makeJSONPDriver()
})
```

## API


### `makeJSONPDriver()`

JSONP Driver 工厂方法。

该函数无论调用几次，何时调用，都为 Cycle.js 应用返回一个 JSONP 的 Driver。该 driver也是一个函数，其将请求流（URL 字符串）作为输入，同时生成一个元响应流。

**请求。** 请求流应通过 HTTP 发送字符串作为远程资源的 URL。

**响应。** 元流即为流的流。元响应流会发送响应流。这些响应流会有附上一个 `request` 字段（在流对象上）用以表明该响应流由哪一请求（从 driver 来的输入）生成。通过 npm 的 `jsonp` 包，响应流自身会发送接收到的响应对象。

返回值：

-------------------

(Function) JSONP Driver 函数