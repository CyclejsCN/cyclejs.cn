# 用于 RxJS 的 Run() 函数

针对选择使用 RxJS **5** 版本的 Cycle.js 应用，所提供的 `run(main, drivers)` 函数。

```
npm install @cycle/rxjs-run rxjs
```

**注意：不要忘记安装 `rxjs` 包**

## 基本用法

```js
import run from '@cycle/rxjs-run'

run(main, drivers)
```

# API

## `run(main, drivers)`

接受一个 `main` 函数，和一组 driver 函数，并将它们循环连接起来。

#### 例子：

```js
import run from '@cycle/rxjs-run';
const dispose = run(main, drivers);
// ...
dispose();
```

`main` 函数的参数是一组 source Observables 的集合（由各个 driver 提供），返回值则是一组 sink Observables 的集合（提供给需要的 driver）。所谓的“一组 Observables 的集合”("A collection of Observables")，具体的形式是一个 Javascript object，当中每个属性与一个 driver 相对应，其属性名与这个 driver 在 `drivers` 对象中的属性名相同，属性值则是这个 driver 输入或者输出的 Observables。在各个 driver 的文档中，可以查询到这个 driver 的所输出的 sources 和接收的 sinks 的具体细节。

#### 参数：

- `main: Function` 一个函数，用于接受 `sources`，并返回一组 `sinks` Observables。
- `drivers: Object` 一个对象，其属性名是这个 driver 的名字，属性值则是具体的 driver 函数。

#### 返回：

- *（Function）* 一个销毁函数，可用于结束正在运行的 Cycle.js 程序，并清理和释放资源。

## `setup(main, drivers)`

一个初始化函数，用于完成 Cycle.js 程序在执行前所需的准备工作。该函数接受一个 `main` 函数和一组 driver 函数作为参数，返回值为一个对象，包含 3 个属性：`sources`，`sinks` 和 `run`。当 `run` 属性包含的函数被调用时，会启动 Cycle.js 程序运行。可以查看 `run` 函数的文档，其中包含有更多的细节。

#### 例子：

```js
import {setup} from '@cycle/rxjs-run';
const {sources, sinks, run} = setup(main, drivers);
// ...
const dispose = run(); // Executes the application
// ...
dispose();
```

#### 参数：

- `main: Function` 一个函数，用于接受 `sources`，并返回一组 `sinks` Observables。
- `drivers: Object` 一个对象，其属性名是 driver 名，属性值是 driver 函数。

#### 返回：

- *(Object)* 一个包含 3 个属性的对象：`sources`，`sinks` 和 `run`。`sources` 是由各个 driver sources 所组成的集合，sinks 是由各个 driver sinks 所组成的集合，这两个属性可以用于调试或者测试。`run` 则是一个函数，用于启动 Cycle.js 程序的运行。
