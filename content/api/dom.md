# Cycle DOM

一个用来和 DOM 相互作用的 Cycle.js driver。driver 基于 [snabbdom](https://github.com/snabbdom/snabbdom) 作为虚拟 DOM 库。

```
npm install @cycle/dom
```

## 浏览器支持

这些是目前我们官方支持的浏览器。在其他浏览器中 Cycle.js 可能无法使用（或使用部分功能）。

[![Sauce Test Status](https://saucelabs.com/browser-matrix/cyclejs-dom.svg)](https://saucelabs.com/u/cyclejs-dom)

# 隔离语义

通过使用 `@cycle/isolate` 包，Cycle DOM 支持组件之间的隔离。Cycle DOM 中，隔离上下文取决于传给 `isolate(Component, scope)` 的 `scope`：

**当作用域是 `':root'` 字符串：没有隔离。**

子组件将运行在和它父组件同一个上下文中， `DOMSource.select()` 这样的方法将访问父组件的 DOM 树。也就是说子组件能够访问不属于自己的 DOM 树。

**当作用域是一个选择器字符串（例如：'.foo' 或 '#foo'）：兄弟组件隔离。**

父组件中调用 `DOMSource.select()` 能够获取被“兄弟组件隔离”隔离的子组件（这意味着没有父子隔离）的 DOM 树。然而，一个被“兄弟组件隔离”所隔离的子组件中调用 DOMSource.select() 无法获取另一个被“兄弟组件隔离”所隔离的子组件的 DOM 树。

**当作用域是任意其他字符串：完全隔离。**

父组件中调用 `DOMSource.select()` 将无法获取被完全隔离的子组件的 DOM 树。兄弟组件也将无法获取被完全隔离的兄弟组件的 DOM 树。

# API

## `makeDOMDriver(container, options)`

DOM driver 函数的工厂方法。

接受一个 `container`，用来定义 driver 将要作用的既存目标 DOM，和一个 `options` 对象作为第二个参数。driver 的输入是一个虚拟 DOM 对象的流，或者换句话说，Snabbdom VNode 对象。driver 的输出是一个 DOMSource：一个通过 `select()` 和 `events()` 方法查询的可观察对象的集合。

`DOMSource.select(selector)` 返回一个新的 DOMSource，作用域限制在匹配给定 CSS `selector` 的元素。

`DOMSource.events(eventType, options)` 返回一个发生在匹配当前 DOMSource 的元素上的 `eventType` 类型的事件流。事件对象包含 `ownerTarget` 属性，作用就像 `currentTarget`。这样做的原因是一些浏览器不允许改变 `currentTarget` 属性，因此创造了一个新的属性。如果你使用 `@cycle/xstream-run` 和 Cycle DOM driver 来运行你的应用，返回的流是一个 *xstream* 流，如果你使用 `@cycle/rxjs-run`，则返回一个 RxJS 可观察对象。`options` 参数可以带有 `useCapture` 属性，默认值为 `false`，设为 `true` ，则事件类型不会冒泡。阅读 https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener 了解更多关于 `useCapture` 和它的用途。
其他选项 `preventDefault` 默认为假。如果设置成真，driver 将自动在每个事件上调用 `preventDefault()`。

`DOMSource.elements()` 返回一个 DOMSource 中匹配选择器的 DOM 元素流。`DOMSource.select(':root').elements()`
返回一个对应于应用根元素（或容器）的 DOM 元素流。

#### 参数：

- `container: String|HTMLElement` 包含 VTree 渲染的 DOM 选择器（或元素自身）。
- `options: DOMDriverOptions` 该对象带有两个可选属性：
  - `modules: array` 覆盖 `@cycle/dom` 默认定义在 [`src/modules.ts`](./src/modules.ts) 中的 Snabbdom 模块。
  - `transposition: boolean` 用以启用/禁用虚拟 DOM 树内部流的转换。

#### 返回：

**(Function)** DOM driver 函数。函数接受一个 VNode 流作为输入，并输出 DOMSource 对象。

## `mockDOMSource(mockConfig)`

一个用来创造模拟 DOMSource 对象的工厂函数，用于测试。

接受 `mockConfig` 对象作为参数，返回一个 DOMSource，可以传递给任意在代码中接受 DOMSource 的 Cycle.js 应用，用于测试。

`mockConfig` 参数是一个指定选择器、事件类型和它们的流的对象。例如：

```js
const domSource = mockDOMSource({
  '.foo': {
    'click': xs.of({target: {}}),
    'mouseover': xs.of({target: {}}),
  },
  '.bar': {
    'scroll': xs.of({target: {}}),
    elements: xs.of({tagName: 'div'}),
  }
});
// Usage
const click$ = domSource.select('.foo').events('click');
const element$ = domSource.select('.bar').elements();
```

模拟的 DOMSource 支持隔离。附有 `isolateSink` 和 `isolateSource` 两个函数，通过 className 实施简单的隔离。带有作用域 `foo` 的 **isolateSink** 将在虚拟 DOM 节点流上添加 `___foo` class，带有作用域 `foo` 的 **isolateSource** 将
进行一次常规的 `mockedDOMSource.select('.__foo')` 调用。

#### 参数：

- `mockConfig: Object` 该对象的键是选择器字符串，值是一个嵌套对象。嵌套对象的键是 `eventType` 字符串，值是你创造的流。

#### 返回：

**(Object)** 模拟的 DOMSource 对象，包含 `select()`，`events()` 和 `elements()`，这些方法可以像 DOM driver 的 DOMSource 一样使用。

## `h()`

hyperscript 函数 `h()` 用来创造虚拟 DOM 对象，即 VNode。执行下列代码

```js
h('div.myClass', {style: {color: 'red'}}, [])
```

以创造一个 VNode，代表一个 className 为 `myClass`，样式为红色并且没有子节点的 `DIV` 元素。具体的 API 为 `h(tagOrSelector, optionalData, optionalChildrenOrText)`。

然而，通常你应该使用 hyperscript helper，这是基于 hyperscript 的快捷函数。每个 DOM 标签都有一个 hyperscript helper 函数，例如 `h1()`、`h2()`、`div()`、`span()`、`label()`、`input()`。之前的例子可以写成：

```js
div('.myClass', {style: {color: 'red'}}, [])
```

此外也有 SVG helper 函数，能够对结果元素应用合适的 SVG 命名空间。`svg()` 函数创造最顶层的 SVG 元素，`svg.g`、`svg.polygon`、`svg.circle`、`svg.path` 是 SVG 特有的子元素。例如：

```js
svg({width: 150, height: 150}, [
  svg.polygon({
    attrs: {
      class: 'triangle',
      points: '20 0 20 150 150 20'
    }
  })
])
```