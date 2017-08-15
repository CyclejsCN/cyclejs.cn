# Isolate

在 Cycle.js 中，Isolate 是一个限制数据流组件的作用域的工具函数。

```
npm install @cycle/isolate
```

详细内容请看 Cycle.js 相关的[组件文档](http://cycle.js.org/components.html#multiple-instances-of-the-same-component)。

## 案例

```js
import isolate from '@cycle/isolate';
import LabeledSlider from './LabeledSlider';

function bmiCalculator({DOM}) {
  let weightProps$ = Rx.Observable.just({
    label: 'Weight', unit: 'kg', min: 40, initial: 70, max: 140
  });
  let heightProps$ = Rx.Observable.just({
    label: 'Height', unit: 'cm', min: 140, initial: 170, max: 210
  });

  // LabeledSlider 是一个数据流组件
  // isolate(LabeledSlider) 不是一个纯函数：在每次调用时，它都生成一个新的数据流组件。
  
  let WeightSlider = isolate(LabeledSlider);
  let HeightSlider = isolate(LabeledSlider);

  let weightSlider = WeightSlider({DOM, props$: weightProps$});
  let heightSlider = HeightSlider({DOM, props$: heightProps$});

  let bmi$ = Rx.Observable.combineLatest(
    weightSlider.value$,
    heightSlider.value$,
    (weight, height) => {
      let heightMeters = height * 0.01;
      let bmi = Math.round(weight / (heightMeters * heightMeters));
      return bmi;
    }
  );

  return {
    DOM: bmi$.combineLatest(weightSlider.DOM, heightSlider.DOM,
      (bmi, weightVTree, heightVTree) =>
        h('div', [
          weightVTree,
          heightVTree,
          h('h2', 'BMI is ' + bmi)
        ])
      )
  };
}
```

# API

## <a id="isolate"></a> `isolate(component, scope)`
以 `component` 函数和 `scope` 为输入，返回一个 `component` 函数的隔离版本。

如果可以的话，当独立的组件被调用时，`source.isolateSource(source, scope)` 方法把提供给它的每个 `source` 和其指定的 `scope` 分开。与此类似，`source.isolateSink(sink, scope)` 方法把返回于独立组件的 `sink` 和被给定的 `scope` 分割开。

`scope` 可以是一个字符串或者一个对象。如果它使除了这两种类型以外的其他东西，它都会被转化为字符串。如果 `scope` 是一个对象，它代表着“每个渠道各自的 scope”，这也就允许你去对 sources/sinks 中的每一个 key 值指定一个不同的 scope。例如：

```js
const childSinks = isolate(Child, {DOM: 'foo', HTTP: 'bar'})(sources);
```

你可以使用通配符 `'*'` 作为未收到特定 scope 的 source/sinks 的默认渠道：

```js
// 使用 'bar' 作为对于 HTTP 渠道和其他渠道的 isolation scope
const childSinks = isolate(Child, {DOM: 'foo', '*': 'bar'})(sources);
```
如果你没有使用通配符，并且渠道也不明确，那么 `isolate` 会生成一个随机的 scope。

```js
// 使用一些任意字符串作为 HTTP 和其他渠道的 isolation scope
const childSinks = isolate(Child, {DOM: 'foo'})(sources);
```
如果 `scope` 参数根本没有提供，就会自动生成一个新的 scope。这就意味着尽管 **`isolate(component, scope)` 是纯函数**（即透明的），然而  **`isolate(component)` 不是纯函数**（即不透明的）。两种对 `isolate(Foo, bar)` 调用都会生成一样的组件，但是两种方式调用 `isolate(Foo)` 会生成两个不同的组件。

注意到 `isolateSource()` 和 `isolateSink()` 两个方法都有 `source` 的静态成员。这是因为当应用程序产生 `sink` 时，driver 生成了 `source`。并且 `isolateSource()` 和 `isolateSink()` 函数都是由 driver 执行的。

#### 参数：
- `component: 函数` 一个把 `sources` 作为入参，输出一个 `sinks` 集合的函数。

- `scope: 字符串` 一个可选字符串，当返回的独立组件被调用时，隔离每个 `sources` 和`sinks`。

#### 返回：
**（函数）** 作用域分量函数作为原始的 `component` 函数，以 `sources` 为输入，返回 `sinks`。
