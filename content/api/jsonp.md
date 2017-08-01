# Cycle JSONP

Driver通过JSONP的hack技巧来创建HTTP请求，基于 [jsonp](https://github.com/webmodules/jsonp) 包。该包小而笨拙（类似于JSONP）且未经测试。只要可能，使用基于HTTP Driver的合适的服务和客户端CORS解决方案。

```
npm install @cycle/jsonp
```

## Usage

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

# API

## `makeJSONPDriver()`

JSONP Driver 工厂方法。

该函数无论调用几次，何时调用，都为Cycle.js应用返回一个JSONP的Driver。该driver也是一个函数，其将请求流（URL字符串）作为输入，同时生成一个元响应流。

**请求。** 请求流应通过HTTP发送字符串作为远程资源的URL。

**响应。** 元流即为流的流。元响应流会发送响应流。这些响应流会有附上一个`request`字段（在流对象上）用以表明该响应流由哪一请求（从driver来的输入）生成。通过npm的`jsonp`包，响应流自身会发送接收到的响应对象。

**返回值：**

-------------------

(Function) JSONP Driver 函数