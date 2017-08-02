# 流

## 响应式编程

响应式是 Cycle.js 的一个重要方面，也是催生此框架诞生的核心原则之一。因为响应式这个词有太多不同的定义，所以在讨论之前，我们先来定义一下我们所讲的响应式。

比如现在有一个模块 Foo 和模块 Bar。一个模块可以被认为是一个 [OOP](https://en.wikipedia.org/wiki/Object-oriented_programming) 类的对象，或其他封装状态的机制。我们假设所有代码都被包装成一些模块。这里我们用一个从 Foo 到 Bar 的箭头，表示 Foo 会因某种原因影响 Bar 的状态。

![modules foo bar](img/modules-foo-bar.svg)

关于图中的箭头，举一个实际应用的例子：*每当 Foo 执行一次网络请求，Bar 中计数器自增*。如果所有的代码都被包装在一些模块里，**那这个箭头被放置在哪里？** 它是在哪里定义的呢？很典型的做法是在 Foo 中编写代码，来调用 Bar 中的方法使得计数器自增。

> 模块 Foo 内部

```javascript
function onNetworkRequest() {
  // ...
  Bar.incrementCounter();
  // ...
}
```

因为 Foo 拥有“*当网络请求发生时，在 Bar 中的计数器自增*”的能力，所以我们说箭头在箭尾那里，也就是在 Foo 那里。

![passive foo bar](img/passive-foo-bar.svg)

Bar 本身是 **被动的**，它允许其他模块改变其状态。而 Foo 是主动的，它负责使 Bar 的状态正常工作。被动的模块是不知道影响它的箭头的存在的。

替代方法是逆置箭头的所有权，而不是简单反转其方向。

![passive foo bar](img/reactive-foo-bar.svg)

在这种方法中，Bar 会监听 Foo 中发生的事件，并在该事件发生时管理自己的状态。Bar 是响应式的：它通过对外部事件作出反应来管理自己的状态。另一方面，Foo 感知不到那些源自其网络请求事件的箭头的存在。

> 模块 Bar 内部

```javascript
Foo.addOnNetworkRequestListener(() => {
  self.incrementCounter(); // self is Bar
});
```

这种做法有什么优势呢？因为逆置了箭头控制权，使得 Bar 自己负责自己。另外，我们还可以将 Bar 的 `incrementCounter()` 作为私有方法隐藏。在被动模式下，Bar 被要求将 `incrementCounter()` 公开，这就意味着我们向外暴露了 Bar 内部的状态管理。也就是说，如果我们想要知道 Bar 的计数器如何工作，我们需要找到代码库中关于 `incrementCounter()` 的所有的用法。在这方面，响应式和被动似乎是相互的。

|                       | Passive                 | Reactive      |
|-----------------------|-------------------------|---------------|
| How does Bar work?    | *Find usages*           | Look inside   |

另一方面，在响应模式下，如果想查找哪些模块会被一个可监听模块中事件影响的话，你必须找到这个事件的所有用途。

|                             | Proactive               | Listenable    |
|-----------------------------|-------------------------|---------------|
| Which modules are affected? | Look inside             | *Find Usages* |

被动／主动编程一直是大多数程序员在命令式语言中工作的默认方式。有时使用响应式模式，但也只是偶尔。响应式编程最大的卖点就是可以建立自主模块，自主模块能专注于自己的功能，而不是改变外部状态。这导致了关注点分离。

在考虑被动／主动模式之前，我们都试图将响应／监听模式作为默认选择。而响应式编程的挑战就是这种编程思想的转变。转变你的思想为“响应式优先”，这会使你学习曲线变得平坦，大部分任务也变得简单明了，尤其是当我们使用诸如 RxJS 或者 *xstream* 这样的响应式库。

## 什么是流？

可以通过以下方式实现响应式编程：事件监听器、[RxJS](http://reactivex.io/rxjs)、[Bacon.js](http://baconjs.github.io/)、[Kefir](https://rpominov.github.io/kefir/)、[most.js](https://github.com/cujojs/most)、[EventEmitter](https://nodejs.org/api/events.html)、[Actors](https://en.wikipedia.org/wiki/Actor_model) 等等。甚至 [spreadsheets](https://en.wikipedia.org/wiki/Reactive_programming) 也利用了箭头所定义的单元格公式实现了相同的想法。上述对响应式编程的定义不仅仅局限于流，并且与以前的响应式编程定义不冲突。Cycle.js 支持多个流库，如 [RxJS](http://reactivex.io/rxjs)、[xstream](http://staltz.com/xstream) 以及 [most.js](https://github.com/cujojs/most)。但默认情况下我们选择 *xstream*，因为它是为 Cycle.js 定制的。

简而言之，*xstream* 中的 *Stream* 是可以触发零个或多个事件的事件流，这个事件流可能完成也可能不完成。如果完成，那么它会触发错误或特殊的 "complete" 事件。

> Stream contract

```
(next)* (complete|error){0,1}
```

举个例子，这里是一个典型的Stream：触发一些事件，然后最终完成。

![completed stream](img/completed-stream.svg)

Streams 可以被监听，就像 EventEmitters 和 DOM 事件一样。注意到有 3 个处理程序：一个用于事件处理，一个用于错误处理，一个用于 "complete"。

```javascript
myStream.addListener({
  next: function handleNextEvent(event) {
    // do something with `event`
  },
  error: function handleError(error) {
    // do something with `error`
  },
  complete: function handleCompleted() {
    // do something when it completes
  },
});
```

当你使用所谓的 *operators* 转换它们时，*xstream* Streams 会变得非常有用，纯函数可以在现有的 Stream 之上创建新的 Streams。给定一个点击事件流，你可以轻松地创建用户点击次数的流。

> Operators

```javascript
const clickCountStream = clickStream
  // each click represents "1 amount"
  .mapTo(1)
  // sum all events `1` over time, starting from 0
  .fold((count, x) => count + x, 0);
```

[简洁才是王道](http://www.paulgraham.com/power.html)，*xstream* 运算符表明，你可以通过一些适当的运算符完成很多事。只需要约 [26 个运算符](https://github.com/staltz/xstream#methods-and-operators)，就可以构建 Cycle.js 应用程序中几乎所有的编程模式。

了解响应式编程的基础知识是使用 Cycle.js 完成工作的先决条件。我们不会在本网站提供 RxJS 或者 *xstream* 相关的教学，如果你需要学习更多，我们会推荐一些很棒的学习资源。*xstream* 和 *RxJS* 很类似，所以下列资源都很适用：

- [The introduction to Reactive Programming you've been missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754)：Cycle.js 作者 Andre Staltz 对 RxJS 的全面介绍
- [Introduction to Rx](http://introtorx.com/)：一本专注 Rx.NET 的在线图书，但大多数概念直接映射到RxJS
- [ReactiveX.io](http://reactivex.io/)：ReactiveX 的官方跨语言文档站点
- [Learn Rx](http://reactivex.io/learnrx/)：由 Jafar Husain 提供的数组和 Observables 的互动教程
- [RxJS lessons at Egghead.io](https://egghead.io/technologies/rx)
- [RxJS GitBook](http://xgrommx.github.io/rx-book/)
- [RxMarbles](http://rxmarbles.com/)：RxJS 运算符的交互图，由 Cycle.js 创建
- [Async JavaScript at Netflix](https://www.youtube.com/watch?v=XRYN2xt11Ek)：Jafar Husain 介绍 RxJS 的视频

## Cycle.js 中的 Streams

现在我们能够解释 `senses` 和 `actuators` 的类型，这意味着计算机和人类“相关观察”。

在最简单的情况下，计算机会在屏幕上生成像素，人类会触发鼠标和键盘事件。计算机观察这些用户输入，人们观察计算机生成的屏幕状态。我们可以将其建模为 *Streams*:

- 电脑输出：屏幕图像流。
- 人的输出：鼠标／键盘时间流。

`computer()` 函数将人的输出作为输入，反之亦然。它们相互观察对象的输出。在 JavaScript 中，我们可以将计算机功能写成输入流中的简单的 *xstream* 转换链。

```javascript
function computer(userEventsStream) {
  return userEventsStream
    .map(event => /* ... */)
    .filter(someCondition)
    .map(transformItToScreenPixels)
    .flatten();
}
```

如果我们能在 `human()` 函数中在做同样的事，这会很优雅。但实际上，我们不能简单地通过串联一些运算符来实现，因为我们需要离开 JavaScript 的环境，去影响外部世界。从概念上来讲，实际上 `human()` 函数是可以存在的，我们会使用 *driver* 去影响外部世界。

[Drivers](drivers.html) 是外部世界的适配器，每个 driver 都代表外部效果的一个方面。例如，DOM Driver 接受计算机生成的“屏幕”流，并返回鼠标和键盘事件的流。在这两者之间，DOM Driver 函数会产生 “*写*” 副作用去渲染 DOM 中的元素，并捕捉 “*读*” 的副作用去监测用户交互。这样，DOM Driver 函数就可以代表用户行为了。"driver" 这个名字基于操作系统驱动程序，并且跟它具有类似的作用：在设备和软件之间架设桥梁。

连接了这两个部分，我们会获得一个叫 `main()` 的运算函数，另外还有一个 driver 函数，其中一个输出是另一个的输入。

```
y = domDriver(x)
x = main(y)
```

如果 `=` 表示赋值的话，上述循环依赖性则无法被求解。因为这将等价于命令 `x = g(f(x))`，并且 `x` 在右侧表达式中未定义。

你只需要指定 `main()` 和 `domDriver()` 来定义 Cycle.js 的入口，并将它们赋给循环连接它们的 Cycle.js `run()` 方法。

```javascript
function main(sources) {
  const sinks = {
    DOM: // transform sources.DOM through
         // a series of xstream operators
  };
  return sinks;
}

const drivers = {
  DOM: makeDOMDriver('#app') // a Cycle.js helper factory
};

run(main, drivers); // solve the circular dependency
```

这就是 "*Cycle.js*" 的由来。它是一个解决人与计算机之间的对话（相互观察）期间出现的流的循环依赖的框架。

接下来，请阅读[基本示例](basic-examples.html)，它将我们迄今为止所学习的关于 Cycle.js 的知识付诸实践。