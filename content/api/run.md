# 使用 xstream 时的 Run() 

使用 xstream 开发 Cycle.js 应用时调用的 `run(main, drivers)` 函数。

```
npm install @cycle/run xstream
```

**注意：`xstream` 包是必需的。**

---
## 基础用法
```
import {run} from '@cycle/run'

run(main, drivers)
```

---
# API

## `setup(main, drivers)`
一个可以使 Cycle 应用进入准备运行状态的函数。接收一个 `main` 函数和一个 driver 函数集合，并准备将两者循环连接。`setup()` 返回一个对象作为输出，该对象有三个属性：`sources`、`sinks` 和 `run`。只有在 `run()` 被调用之后应用才会实际运行起来。想要了解更多细节的话可以查阅 `run()` 文档。

**示例：**
```
import {setup} from '@cycle/run';
const {sources, sinks, run} = setup(main, drivers);
// ...
const dispose = run(); // 运行应用
// ...
dispose();
```

**参数：**

---
- `main: Function` 输入是 `sources`，输出是 `sinks` 的函数。
- `drivers: Object` 使用 driver 名称作为键，使用 driver 函数作为值的对象。


**返回值：**

---
（Object）拥有 `sources`、`sinks`、`run` 三个属性的对象。`sources` 是 driver sources 的集合， `sinks` 是 driver sinks 的集合，它们一般被用来调试或者测试应用。`run` 是一个一旦被调用就开始运行应用的函数。

---
## `run(main, drivers)`

接受 `main` 函数并将它和传入的 driver 函数集合循环连接。

**示例：**
```
import run from '@cycle/run';
const dispose = run(main, drivers);
// ...
dispose();
```
`main` 函数接收一个 source 流的集合（由 drivers 返回）作为输入，返回一个 sink 流的集合（传给 drivers）。一个“流的集合”是一个 JavaScript 对象，键名与 `drivers` 对象中注册的 driver 名称一一对应，值是流。想要了解每个 driver 接收何种类型的 sinks 和输出何种类型的 sources 以及更多细节，请查询相关文档。

**参数：**

---
- `main: Function` 输入是 `sources`，输出是 `sinks` 的函数。
- `drivers: Object` 使用 driver 名称作为键，使用 driver 函数作为值的对象。

**返回值：**

---
（Function）一个销毁函数，用来终止 Cycle.js 程序的运行，并且清除资源占用。