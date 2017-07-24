# Cycle HTML

Cycle.js driver 用于将虚拟 DOM 流渲染为 HTML 。它基于 DOM driver 和 [snabbdom](https://github.com/paldepind/snabbdom/)，并将意图用于服务端渲染，其与客户端渲染等效。

```
npm install @cycle/html
```

# API

> makeHTMLDriver(effect, options)

HTML driver 函数的工厂(factory)。

参数为回调函数 `effect` 和 `options` 对象，driver 的输入可以是一个虚拟 DOM 对象，也就是 `Snabbdom VNode` 对象，输出为一个 `DOMSource`：方法 select() 和 events() 查询到的 Observables 集合。

HTML Driver 是对 DOM Driver 的完善。不同于在 DOM 上直接生成 elements，它会生成 HTML 字符串，并对这些字符串产生副作用，回调函数 `effect` 则是用于描述或自定义这些副作用。所以说，如果你希望将 HTML Driver 用于服务端渲染后发送到客户端（这是 HTML Driver 的典型用法），你需要在参数 `effect` 函数中写一些类似 `html => response.send(html)` 的部分。这么做，HTML Driver 就会知道渲染的 HTML 字符串会产生什么副作用。

HTML Driver 仅对回调函数 `effect` 中的副作用有效，它可以被认为是一个 `sink-only driver` 。但是，为了在服务端渲染时能完美代替 DOM Driver HTML Driver 返回一个类似 `DOMSource` 的源对象。这将有助于我们把已有的用 DOM Driver 的应用程序迁移到 HTML Driver。由于在服务端没有用户事件，所以在你查询时虚拟的 `DOMSource` 返回空数据流。

`DOMSource.select(selector)` 返回一个新的 `DOMSource` ，其范围受限于与给定的 CSS 选择器匹配的元素。

`DOMSource.events(eventType, options)` 返回空数据流。如果你使用 `@cycle/xstream-run` 搭配 HTML Driver 来启动你的应用，它返回的是一个 *xstream* 数据流；或者使用 `@cycle/rxjs-run` 启动应用，那你将得到一个 `RxJS Observable`。

`DOMSource.elements()` 返回根据你虚拟 DOM 渲染出的 HTML 字符串。

#### 参数:

- `effect: Function` 回调函数，它将一段渲染为 HTML 后的字符串作为输入，起到一些副作用，不返回任何值。
- `options: HTMLDriverOptions` 对象，含有一个可选属性：`transposition: boolean` ，启用/禁用虚拟 DOM 树中内部的转换。

#### 返回值:

*(Function)* HTML driver 函数。该函数期望将 VNode 流作为输入，并输出 DOMSource 对象。