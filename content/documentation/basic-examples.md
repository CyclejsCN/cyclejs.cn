# 基本示例

## 共同结构

基于 Cycle.js 的应用有三个重要元素：`main()`，**drivers** 和 `run()`。在 `main()` 函数里，我们接收来自 drivers（sources，`main` 函数中的入参）的信息，同时也发送信息给 drivers（sinks，`main` 函数中的出参）。

**你可以在 [cyclejs/examples](https://github.com/cyclejs/cyclejs/tree/master/examples) 章节中找到这些例子以及其他案例的源代码。**


从上一章，我们知道 `run()` 函数把 `main()` 函数和 driver 部分绑在了一起。在 DOM Driver 的例子中，我们的 `main()` 函数通过 DOM 来和用户进行交互。我们的大部分案例都会使用 DOM Driver，但是请注意 Cycle.js 是模块化并且可扩展的。因此你也可以不依赖 DOM Driver 来创建一个例如 Web Audio 或是移动端的原生应用。

```javascript
function main(driverSources) {
  const driverSinks = {
    DOM: //通过一系列的流操作变化 driverSources.DOM 
    
  };
  return driverSinks;
}

const drivers = {
  DOM: makeDOMDriver('#app'),
};

run(main, drivers);
```

## 切换复选框

让我们从 index.html 文件开始，这个文件中我们已经提前书写了包含我们应用的元素。

> 在 index.html 文件中

```html
<!-- html head goes here -->

<body>
  <div id="app"></div>
</body>
```

我们把基于 Cycle.js 的应用程序放在 `#app` 中。`checkbox-app.js` 文件应该如下（如果有必要，请在把文件从 ES6 转为 ES5 的步骤前完成）：

> checkbox-app.js

```javascript
import xs from 'xstream';
import {run} from '@cycle/run';
import {div, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  const sinks = {DOM: null};
  return sinks;
}

run(main, {
  DOM: makeDOMDriver('#app'),
});
```

Cycle *DOM* 是一个代码包，包含了两个 drivers 和一些库的使用说明。`makeDOMDriver()` 能创建一个 DOM Driver，`makeHTMLDriver()` 会创建一个 HTML Driver（为了服务器端渲染）。Cycle DOM 也包含了 `div()`，`h1()`，`h2()`，`input()`，`ul()`，`li()`，`svg()` 等方法。这些方法生成的都是虚拟元素（也就是[*虚拟节点*](https://github.com/paldepind/snabbdom/#virtual-node)）。详细的介绍请看 [`snabbdom`](https://github.com/paldepind/snabbdom) 的文档。

到现在我们的 `main()` 函数还什么都没做。它接受 driver 的 `sources`，输出 driver 的 `sinks`。为了在屏幕上能显示一些东西，我们需要在 `sinks.DOM` 中输出一个虚拟节点的流。`DOM` 在 `sinks` 中名字必须与 drivers 对象给 `run()` 函数的名字一致。这就是在 Cycle.js 中 drivers 和输出流能一一对应的原因。这对于 `sources` 也成立：我们通过使用 `sources.DOM` 来监听 DOM 的事件。

我们来添加一个映射到 VNode 的 false 流。[`xs.of(x)`](https://github.com/staltz/xstream#of) 创建一个会立即触发 x 的流。然后我们使用 [`map()`](https://github.com/staltz/xstream#map) 函数把它转化为包含一个 `<input type="checkbox">` 和一个 `<p>` 元素的虚拟节点。如果复选框是 `false`，就显示 `off`，反之显示 `ON`。

```javascript
import xs from 'xstream';
import {run} from '@cycle/run';
import {div, input, p, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  const sinks = {
    DOM: xs.of(false)
      .map(toggled =>
        div([
          input({attrs: {type: 'checkbox'}}), 'Toggle me',
          p(toggled ? 'ON' : 'off')
        ])
      )
  };
  return sinks;
}

run(main, {
  DOM: makeDOMDriver('#app'),
});
```

<a class="jsbin-embed" href="https://jsbin.com/robiyod/embed?output">JS Bin on jsbin.com</a>

我们很开心的看到创建的虚拟 DOM 元素通过使用 `div()`，`input()` 和 `p()` 等标签生成 DOM 元素。但是如果我们点击复选框的时候，它的 “off” 的标签没有变为 “ON”。这是因为我们没有监听 DOM 事件。本质上而言，我们的 `main()` 函数并不听从*使用者*。

我们通过使用 `sources.DOM` 来匹配复选框上的 `change` 事件，从而确定虚拟节点中显示的复选框的值（第一次 `map()`）。但是，我们需要 [`.startWith()`](https://github.com/staltz/xstream#startWith) 方法来给虚拟节点流一个默认值。没有默认值的话，什么都不会显示。这是因为我们的 `sinks` 实时反应了 `sources` 的情况，同时 `sources` 实时反应了 `sinks` 的改变。在第一次事件中，如果没有任何变换，什么都不会发生。就像第一次见陌生人的时候没有话可说一样，某一方需要主动开始对话。这就是 `main()` 函数做的事情：启动交互，然后让有序的动作变成 `main()` 函数和 DOM Driver 之间的复杂互动。

```diff
 import xs from 'xstream';
 import {run} from '@cycle/run';
 import {div, input, p, makeDOMDriver} from '@cycle/dom';

 function main(sources) {
   const sinks = {
-    DOM: xs.of(false)
+    DOM: sources.DOM.select('input').events('change')
+      .map(ev => ev.target.checked)
+      .startWith(false)
       .map(toggled =>
         div([
           input({attrs: {type: 'checkbox'}}), 'Toggle me',
           p(toggled ? 'ON' : 'off')
         ])
       )
   };
   return sinks;
 }

 run(main, {
   DOM: makeDOMDriver('#app')
 });
```

<a class="jsbin-embed" href="https://jsbin.com/makuye/embed?output">JS Bin on jsbin.com</a>

## HTTP 请求

Web 应用程序众多日常需求中的一个就是从服务器端获取并渲染数据。我们如何使用 Cycle.js 实现这个需求？

假设我们有一个十条用户数据的后端数据库。我们想在前端实现点击一个按钮“随机得到一个用户”，并且展示该用户的详细信息（例如名字和邮箱）。这就是我们想要获得的效果：

<a class="jsbin-embed" href="https://jsbin.com/vedote/embed?output">JS Bin on jsbin.com</a>

一旦按钮被点击，我们就需要对终端 `/user/:number` 发出一个请求。在一个基于 Cycle.js 的应用中 HTTP 请求适合放在哪里呢？

*sinks* 是从 `main()` 函数到 driver 执行作用的指令，而 *sources* 是可读的作用。在这里 HTTP 请求就是 `sinks` ，而 HTTP 响应就是 `sources`。

[HTTP Driver](https://github.com/cyclejs/cyclejs/tree/master/http) 在风格上和 DOM Driver 相似：它预计有一个 `sink` 流（作为请求），然后返回一个 `source` 流（作为响应）。我们先不研究 HTTP Driver 详细的工作原理，先来看看一个基本的HTTP示例。

当按钮被点击，HTTP 请求发送，然后 HTTP 请求流直接依赖于按钮的点击流。我们通过作为 `main()` 函数中的一个 `sink` 返回给 HTTP Driver 一个`getRandomUser$` 请求流。

```javascript
function main(sources) {
  // ...
  const click$ = sources.DOM.select('.get-random').events('click');

  const getRandomUser$ = click$.map(() => {
    const randomNum = Math.round(Math.random() * 9) + 1;
    return {
      url: 'https://jsonplaceholder.typicode.com/users/' + String(randomNum),
      category: 'users',
      method: 'GET'
    };
  });

  // ...

  return {
    // ...
    HTTP: getRandomUser$,
  };
}
```

一旦我们获得一个 HTTP 响应，我们就要给当前用户展示数据。对于这个目标，我们需要直接依赖于 HTTP 响应流的用户数据流。这个从 `main` 函数的入参 `sources.HTTP` 获得（当调用 `run()` 函数的时候，`HTTP` 的名字应该和你给 HTTP driver 的 driver 名字对应）。

```javascript
function main(sources) {
  // ...

  const user$ = sources.HTTP.select('users')
    .flatten()
    .map(res => res.body);

  // ...
}
```

`sources.HTTP` 是一个“HTTP 源”，代表这个应用程序需要的所有网络响应。`select(category)` 是一个特地给 HTTP 源的接口，它返回所有响应流中的一个和`目录`有关的流。因为该输出是众多流中的一个，所以我们可以使用 `flatten()` 函数来获得一个平坦的响应流。当我们返回一个有用户字段的目录的对象时，检查一下之前 `getRandomUser$` 的声明。现在会有一些奇妙的变化，如果你对这里的细节很感兴趣的话，请阅读 [HTTP Driver 文档](https://github.com/cyclejs/cyclejs/tree/master/http) 。为了获得来自响应的 JSON 数据，我们会匹配每个响应 `res` 和 `res.body`，忽略像 HTTP 状态这样的字段。

我们还没有指定如何渲染我们的应用程序。一旦我们在 `user$` 中获取流当前用户的数据，我们就应该显示相应的 DOM 结构。所以叫做 `vdom$` 的虚拟节点流应该直接依赖于 `user$`。

```javascript
function main(sources) {
  // ...
  const vdom$ = user$.map(user =>
    div('.users', [
      button('.get-random', 'Get random user'),
      div('.user-details', [
        h1('.user-name', user.name),
        h4('.user-email', user.email),
        a('.user-website', {href: user.website}, user.website)
      ])
    ])
  );
  // ...
}
```

但是，最初不会存在任何的 `user$` 事件，因为这只发生在用户点击的时候。这就和我们之前“复选框”示例中遇到的“对话主动性” 问题一样。所以我们需要让 `user$` 从一个 `null` 用户开始，也就是说 `vdom$` 遇到一个空的用户，它就只渲染按钮。此外，如果我们有真实的用户数据，我们仍然展示他们的名字，邮箱和网站。

```diff
 function main(sources) {
   // ...

   const user$ = sources.HTTP.select('users')
     .flatten()
     .map(res => res.body)
+    .startWith(null);

   const vdom$ = user$.map(user =>
     div('.users', [
       button('.get-random', 'Get random user'),
-      div('.user-details', [
+      user === null ? null : div('.user-details', [
         h1('.user-name', user.name),
         h4('.user-email', user.email),
         a('.user-website', {href: user.website}, user.website)
       ])
     ])
   );

   // ...
 }
```

我们把 `vdom$` 给 DOM Driver，然后就会渲染在页面上。
当这些步骤都做完，整个代码就如下所示。

```javascript
import xs from 'xstream';
import {run} from '@cycle/run';
import {div, button, h1, h4, a, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

function main(sources) {
  const getRandomUser$ = sources.DOM.select('.get-random').events('click')
    .map(() => {
      const randomNum = Math.round(Math.random() * 9) + 1;
      return {
        url: 'https://jsonplaceholder.typicode.com/users/' + String(randomNum),
        category: 'users',
        method: 'GET'
      };
    });

  const user$ = sources.HTTP.select('users')
    .flatten()
    .map(res => res.body)
    .startWith(null);

  const vdom$ = user$.map(user =>
    div('.users', [
      button('.get-random', 'Get random user'),
      user === null ? null : div('.user-details', [
        h1('.user-name', user.name),
        h4('.user-email', user.email),
        a('.user-website', {attrs: {href: user.website}}, user.website)
      ])
    ])
  );

  return {
    DOM: vdom$,
    HTTP: getRandomUser$
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
});
```

<a class="jsbin-embed" href="https://jsbin.com/vedote/embed?output">JS Bin on jsbin.com</a>

## 增加一个计数器

我们看到如何使用 *sources 和 sinks* 模式来构建用户界面，但是我们的示例中还没有状态：标签只反映了复选框的事件，并且用户详细信息的视图只展示来自 HTTP 响应的数据。正常的应用程序都会在内存中存有状态，所以让我们看看如何建立一个有状态的基于 Cycle.js 的应用程序。

如果我们有一个计数流（发出事件来改变当前计数器的值），那么展现计数就简单了。

```javascript
count$.map(count =>
  div([
    button('.increment', 'Increment'),
    button('.decrement', 'Decrement'),
    p('Counter: ' + count)
  ])
)
```

> ### 什么是 `$` 协定
>
> 注意到我们使用名字 `count$` 来表示当前计数器值流。美元符号 `$` 作为一个名字的后缀是一个宽松的协定，代表着这个变量是一个流。这是通过名字来帮助表明类型。
>
> 假设你有一个依赖于“name”字符串流的虚拟节点流
>
> `const vdom$ = name$.map(name => h1(name));`
>
> 我们注意到当流被命名为 `name$` 时，在 `map` 的方法中把入参 `name` 作为一个数组。这个命名规则预示着 `name` 是 `name$` 发出的值。通常来说，`foobar$` 决定了 `foobar`。没有这个约定的话，如果 `name$` 被简单的命名为 `name`，那么读者就会搞不懂所涉及的类型了。此外，相对于其他可选择的 `nameStream`，`nameObservable` 或者 `nameObs` 来说，`name$` 更为简洁。这个协定也可以拓展到数组上：使用复数来表示是数组类型。例如：`vdoms` 是一个关于 `vdom` 的数组，但是 `vdom$` 是 `vdom` 流。

但是我们怎么创建一个 `count$`？很明显它必须依赖于增量点击和减量点击。前者意味着“+1”操作，而后者意味着“-1”操作。

```javascript
const action$ = xs.merge(
  DOM.select('.decrement').events('click').mapTo(-1),
  DOM.select('.increment').events('click').mapTo(+1)
);
```

[`merge`](https://github.com/staltz/xstream#merge) 操作让我们得到一个关于动作的事件流（无论增量还是减量动作）。这也就是说，`merge` 是 *OR* 操作。但这还不是计数流（`count$`），只是一个动作流（`action$`）。

`count$` 应该从零开始，后来是由 `action$` 发出的所有数字的总和。把时间内的所有事件连接到一个流中，我们使用 [`fold()`](https://github.com/staltz/xstream#fold) 操作：

```js
const count$ = action$.fold((x, y) => x + y, 0);
```

`fold` 是做什么的呢？它和 [`reduce`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce) 相似，允许我们在序列中计算值的总和。同时，`fold` 也有 `startWith` 的行为，因为它需要一个`种子`参数（我们给出了数字'0'）然后在最初时发出。

![fold counter](img/fold-counter.svg)

我们把 `action$` 和 `count$` 都放在我们的 `main()` 函数中，我们可以像这样实现计数器：

<a class="jsbin-embed" href="https://jsbin.com/husiyul/embed?output">JS Bin on jsbin.com</a>

```javascript
import xs from 'xstream';
import {run} from '@cycle/run';
import {div, button, p, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  const action$ = xs.merge(
    sources.DOM.select('.dec').events('click').mapTo(-1),
    sources.DOM.select('.inc').events('click').mapTo(+1)
  );

  const count$ = action$.fold((x, y) => x + y, 0);

  const vdom$ = count$.map(count =>
    div([
      button('.dec', 'Decrement'),
      button('.inc', 'Increment'),
      p('Counter: ' + count)
    ])
  );

  return {
    DOM: vdom$
  };
}

run(main, {
  DOM: makeDOMDriver('#app')
});
```

## 体重指数计算器

现在我们有一个有状态的基于 Cycle.js 的应用程序，接下来让我们来处理更大一点的问题。想想接下来的[体重指数](https://en.wikipedia.org/wiki/Body_mass_index)计算器：它有一个滑块来选择重量，一个滑块来选择高度，最后显示出来的数字就是从重量值和高度值中计算出来的体重指数。

<a class="jsbin-embed" href="https://jsbin.com/nucepu/embed?output">JS Bin on jsbin.com</a>

在前一个例子中，我们有*减量*和*增量*的动作。在这个例子里，我们有“改变重量”和“改变高度”。这看起来很简单。

```javascript
const changeWeight$ = sources.DOM.select('.weight')
  .events('input')
  .map(ev => ev.target.value);

const changeHeight$ = sources.DOM.select('.height')
  .events('input')
  .map(ev => ev.target.value);
```

现在我们知道应用程序通常是由 `startWith` 或者 `fold` 初始化的。我们需要*高度*和*重量*作为*时间段内的值*，而不是作为 *change events*。为了表示*高度*作为状态，我们只需要把一个初始值添加到 `changeHeight$` 中。

```javascript
const weight$ = changeWeight$.startWith(70);
const height$ = changeHeight$.startWith(170);
```

为了结合两边的状态，并且使用它们的值来计算体重指数，我们使用 xstream 的 [`combine`](https://github.com/staltz/xstream#combine) 操作。我们在之前的例子中看到了 `merge` 有 *OR* 的语意。而 `combine` 有 *AND* 的语意。举个例子，为了计算体重指数，我们需要一个`重量`值*和*一个`高度`值。“combine” 将**多个**流作为入参，并生成**一个**包含**多个**值的数组流，其中的每个值和每一个输入流一一对应。

```javascript
const bmi$ = xs.combine(weight$, height$)
  .map(([weight, height]) => {
    const heightMeters = height * 0.01;
    return Math.round(weight / (heightMeters * heightMeters));
  });
  ```

现在我们只需要一个函数来可视化体重指数结果和滑块。我们通过映射 `bmi$` 给虚拟节点流，并把它给 `DOM` driver。

<a class="jsbin-embed" href="https://jsbin.com/wojokof/embed?output">JS Bin on jsbin.com</a>

```javascript
import xs from 'xstream';
import {run} from '@cycle/run';
import {div, input, h2, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  const changeWeight$ = sources.DOM.select('.weight')
    .events('input')
    .map(ev => ev.target.value);

  const changeHeight$ = sources.DOM.select('.height')
    .events('input')
    .map(ev => ev.target.value);

  const weight$ = changeWeight$.startWith(70);
  const height$ = changeHeight$.startWith(170);

  const bmi$ = xs.combine(weight$, height$)
    .map(([weight, height]) => {
      const heightMeters = height * 0.01;
      return Math.round(weight / (heightMeters * heightMeters));
    });

  const vdom$ = bmi$.map(bmi =>
    div([
      div([
        'Weight ___kg',
        input('.weight', {attrs: {type: 'range', min: 40, max: 140}})
      ]),
      div([
        'Height ___cm',
        input('.height', {attrs: {type: 'range', min: 140, max: 210}})
      ]),
      h2('BMI is ' + bmi)
    ])
  );

  return {
    DOM: vdom$
  };
}

run(main, {
  DOM: makeDOMDriver('#app')
});
```

代码运行。当我们移动滑块，我们可以得到对应的体重指数。但是，你可能也注意到，重量和高度的标签并没有实时展示出滑块的选择值。相反，它们只是显示如 `Weight ___kg` 一样。这个完全没有用，因为我们根本不知道我们选择的重量值。

这个问题发生的原因是当我们映射 `bmi$` 时，我们没有`重量`和`高度`的数值。因此，对于渲染虚拟节点的函数，我们要有一个流包含完整的数值而不是只有体重指数。我们需要一个 `state$`。

```javascript
const state$ = xs.combine(weight$, height$)
  .map(([weight, height]) => {
    const heightMeters = height * 0.01;
    const bmi = Math.round(weight / (heightMeters * heightMeters));
    return {weight, height, bmi};
  });
  ```

下面这个程序使用 `state$` 来渲染具有正确动态值的 DOM 结构。

<a class="jsbin-embed" href="https://jsbin.com/nucepu/embed?output">JS Bin on jsbin.com</a>

```javascript
import xs from 'xstream';
import {run} from '@cycle/run';
import {div, input, h2, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  const changeWeight$ = sources.DOM.select('.weight')
    .events('input')
    .map(ev => ev.target.value);

  const changeHeight$ = sources.DOM.select('.height')
    .events('input')
    .map(ev => ev.target.value);

  const weight$ = changeWeight$.startWith(70);
  const height$ = changeHeight$.startWith(170);

  const state$ = xs.combine(weight$, height$)
    .map(([weight, height]) => {
      const heightMeters = height * 0.01;
      const bmi = Math.round(weight / (heightMeters * heightMeters));
      return {weight, height, bmi};
    });

  const vdom$ = state$.map(({weight, height, bmi}) =>
    div([
      div([
        'Weight ' + weight + 'kg',
        input('.weight', {type: 'range', min: 40, max: 140, value: weight})
      ]),
      div([
        'Height ' + height + 'cm',
        input('.height', {type: 'range', min: 140, max: 210, value: height})
      ]),
      h2('BMI is ' + bmi)
    ])
  );

  return {
    DOM: vdom$
  };
}

run(main, {
  DOM: makeDOMDriver('#app')
});
```

太棒了，程序正如我们想要的一样运行了。重量和高度的标签反映着滑块上选择的值，而体重指数也被重新计算显示。

但是我们把所有的代码都写在了一个 `main()` 函数里。这种方法没有可拓展性，即使是像这样的小应用程序，它看起来也太大了，做的事情太多了。

对于用户界面来说，我们需要一个合理的架构包含响应式，函数式以及 Cycle.js 的循环原理。这就是我们[下一章](model-view-intent.html)的主题。
