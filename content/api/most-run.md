# 用于 most.js 的 Run() 函数

针对使用 most.js (单体流)实现的 Cycle.js 应用所提供的 `run(main, drivers)` 函数。

```
npm install @cycle/most-run most
```

**注意: `most` 包是必需的。**

## 基本用法

```js
import run from '@cycle/most-run'

run(main, drivers)
```

## 测试用法

```js
import {setup} from '@cycle/most-run'

const {sources, sinks, run} = setup(main, drivers)

let dispose

sources.DOM.select(':root').elements
  .observe(fn)
  .then(() => dispose())

dispose = run() // 开始循环
```

# API

## `run(main, drivers)`

接收一个 `main` 函数并将它和传入的 driver 函数集合循环连接起来。

**示例：**
```js
import run from '@cycle/most-run';
const dispose = run(main, drivers);
// ...
dispose();
```

`main` 函数期望输入一个 source 流的集合（由 drivers 返回），然后返回一个 sink 流的集合（传给 drivers）。一个“流的集合”其实是一个 JavaScript 对象，其键名与在 drivers 对象中注册的 driver 名称一一对应，并且键值是流。想要了解各个 driver 输出哪种 sources 类型和接收哪种 sinks 类型的更多细节，请查询相关文档。

#### 参数：

- `main: Function` 一个接收 `sources` 作为 输入和输出 `sinks` 的函数。
- `drivers: Object` 一个对象，其键名是 driver 的名称，键值是相对应 driver 函数。

#### 返回：

*(Function)* 一个销毁函数，用于终止正在运行的 Cycle.js 程序，并清除和释放被占用的资源。

## <a id="setup"></a> `setup(main, drivers)`

一个使 Cycle 应用进入准备状态的初始化函数。接收一个 `main` 函数并准备将其与输入的 driver 函数集合循环连接。作为输出，`setup()` 返回一个包含三个属性：`sources`，`sinks` 和 `run` 的对象。仅当 `run()` 被调用时，应用才会真正运行。想要了解更多细节请查阅 `run()` 的相关文档。

**示例：**
```js
import {setup} from '@cycle/most-run';
const {sources, sinks, run} = setup(main, drivers);
// ...
const dispose = run(); // 运行应用
// ...
dispose();
```
#### 参数：

- `main: Function` 一个接收 `sources` 作为输入并输出  `sinks` 的函数。
- `drivers: Object` 一个对象，其键名是 driver 的名称，键值是相对应 driver 函数。

#### 返回：

**(Object)** 一个包含三个属性： `sources`，`sinks` 和 `run`。`sources` 是由各个 driver sources 组成的集合，`sinks` 是由各个 driver sinks 所组成的集合，这两个属性可以用来调试或者测试。`run` 是一个一旦被调用就会开始运行应用的函数。
