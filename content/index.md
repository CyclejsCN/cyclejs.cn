## 数据流

> **你的应用程序和外部世界会构成回路**

<p>
  <img src="img/cycle-nested-frontpage.svg">
</p>


Cycle 的核心抽象就是把应用程序用作为一个纯函数 `main()`，其中输入（*sources*）是来自外部的读副作用，输出（*sinks*）是对外部的写副作用，在程序外部的所有 I/O 副作用都是由 *drivers* 管理，比如处理 DOM 副作用和 HTTP 副作用。

内部的 `main()` 遵循响应式编程的原则，这最大限度地对程序进行关注点分离，同时也提供一种纯声明式的方法去组织代码。从代码可以很容易看清 **数据流** 的流向，使其容易阅读和跟踪。  

## 例子

```
npm install xstream @cycle/run @cycle/dom
```

```js
import {run} from '@cycle/run'
import {div, label, input, hr, h1, makeDOMDriver} from '@cycle/dom'

function main(sources) {
  const input$ = sources.DOM.select('.field').events('input')

  const name$ = input$.map(ev => ev.target.value).startWith('')

  const vdom$ = name$.map(name =>
    div([
      label('Name:'),
      input('.field', {attrs: {type: 'text'}}),
      hr(),
      h1('Hello ' + name),
    ])
  )

  return { DOM: vdom$ }
}

run(main, { DOM: makeDOMDriver('#app-container') })
```

> Output:

<div class="example-hello-world-container"></div>

## 函数式和响应式

函数式容易编写「可预测」的代码，响应式容易编写「可分离」的代码。Cycle.js 程序是由纯函数构建，这意味着它们只接受输入并生成可预测的输出，而不会造成任何 I/O 副作用。
作为组成部分的响应式流来自像 [xstream](http://staltz.com/xstream)、[RxJS](http://reactivex.io/rxjs) 或者 [Most.js](https://github.com/cujojs/most/) 这样的库，这些库极大地简化了事件处理、异步调用、错误处理的相关代码。
用流构建的程序同时也分离了关注点，因为所有对一块数据的动态更新总是在同一处，并且不能从外部改变。 
结果是，Cycle 应用更少使用 `this`，并且没有像 `setState()` 或者 `update()` 这样的命令式调用。

## 简单和简洁


Cycle.js 是一个不需要学习很多概念的框架，核心 API 只有一个 `run(app, drivers)`。此外，还有 **stream**、**functions**、**drivers**（用于不同类型 I/O 副作用的插件），用于隔离组件的辅助函数。这个框架没有很多「魔法」，大多数组成部分只是 JavaScript 函数而已。虽然更少的「魔法」会导致更多的代码，但是使用函数式响应式流可以使用较少的操作去处理复杂的数据流，你将会看到 Cycle.js 构建的程序是小巧并且易读的。

## 可扩展和可测试

drivers 是类似插件的简单函数，可以从 sink 接收消息并且调用命令式函数。
所有的 I/O 副作用都属于 drivers，这意味着你的应用程序只是一个纯函数，很容易和 driver 互换。
社区已经为[React Native](https://github.com/cyclejs/cycle-react-native)、[HTML5 Notification](https://github.com/cyclejs/cycle-notification-driver)、[Socket.io](https://github.com/cgeorg/cycle-socket.io) 等构建了 drivers。
sources 和 sinks 可以很容易作为 [adapters 和 ports](https://iancooper.github.io/Paramore/ControlBus.html) 使用。 
这就意味着进行测试不再需要使用 Mock，只需要提供输入和检查输出就可以完成。你的应用程序就是纯粹的数据转换而已。

## 清晰的数据流


在每个 Cycle.js 应用中，每一个被声明过的流都是在数据流图中的一个节点，节点与节点用箭头表示依赖关系。这意味着，你的代码和外部输入输出的数据流图存在着一一对应的关系。


<p class="dataflow-minimap">
  <img src="img/dataflow-minimap.svg">
</p>

```js
function main(sources) {
  const decrement$ = sources.DOM
    .select('.decrement').events('click').mapTo(-1);

  const increment$ = sources.DOM
    .select('.increment').events('click').mapTo(+1);

  const action$ = xs.merge(decrement$, increment$);
  const count$ = action$.fold((x, y) => x + y, 0);

  const vdom$ = count$.map(count =>
    div([
      button('.decrement', 'Decrement'),
      button('.increment', 'Increment'),
      p('Counter: ' + count)
    ])
  );
  return { DOM: vdom$ };
}
```


在大多数框架中，数据流都是 **隐式** 的：你需要在心中构建一个数据在你的应用中如何流动的模型。 在 Cycle.js 中，通过阅读代码可以很清楚得知数据流，也可以在 [Cycle.js DevTool for Chrome](https://github.com/cyclejs/cyclejs/tree/master/devtool) 中通过图形方式实时查看数据流：

<p>
  <img src="img/devtool.png" style="max-height:inherit">
</p>

## 组件化

Cycle.js 是组件化的，但是和其他框架不太一样，无论多么复杂，每个单独的 Cycle.js 应用，都是一个函数，并可以被一个更大的 Cycle.js 应用复用。

<p>
  <img src="img/nested-components.svg">
</p>

sources 和 sinks 是存在于应用程序和 drivers 之间的接口，但是他们也有与子组件及其父组件之间的接口。Cycle.js 的组件可以是类似其他框架中的 GUI 部件，但是他们不仅限于 GUI。由于 sources 和 sinks 的接口不仅限于 DOM ，你也可以制作成 Web 音频组件，网络请求组件等， 

## 用 1 小时 37 分钟学习

<p>
  <img src="img/egghead.svg">
</p>

只用 1 小时 37 分钟？这些内容就是学习 Cycle.js 的基本要素。可以观看由 Cycle.js 作者制作[**免费 Egghead.io 的视频教程**](https://egghead.io/series/cycle-js-fundamentals) 。通过跟着从头开始构建理解 Cycle.js，然后学习如何把你的想法转化成应用程序。

## Supports...

- [**虚拟 DOM 渲染**](https://github.com/cyclejs/cyclejs/tree/master/dom)
- [**服务端渲染**](https://github.com/cyclejs/cyclejs/tree/master/examples/isomorphic)
- [**JSX**](http://cycle.js.org/getting-started.html)
- [**TypeScript**](https://github.com/cyclejs/cyclejs/tree/master/examples/bmi-typescript)
- [**React Native**](https://github.com/cyclejs/cycle-react-native)
- [**时间旅行**](https://github.com/cyclejs/cycle-time-travel)
- [**使用 history API 的路由**](https://github.com/cyclejs/history)
- [**更多……**](https://github.com/cyclejs-community/awesome-cyclejs)


[查看文档 >](getting-started.html)