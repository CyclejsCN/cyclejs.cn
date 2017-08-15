# Model-View-Intent

## 主函数的拆分

我们可以将整个 Cycle.js 程序写在 `main()` 函数中，就像我们在[前一章](basic-examples.html#basic-examples-body-mass-index-calculator)中所做的那样。然而，任何程序员都知道这并不是一个好主意。一旦 `main()` 函数变得冗长，它将难以维护。

**MVI 是一种简单的模式来将 main() 函数重构为三个部分：Intent（监听用户）、Model（处理信息）、和 View（返回输出）**

![main equal MVI](img/main-eq-mvi.svg)

让我们看看如何重构一个计算 BMI 的 `main()` 函数：

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

我们可以从 `main` 函数中重构出许多匿名函数，诸如 BMI 的计算、VNode 的渲染等等。

```diff
 import xs from 'xstream';
 import {run} from '@cycle/run';
 import {div, input, h2, makeDOMDriver} from '@cycle/dom';

+function renderWeightSlider(weight) {
+  return div([
+    'Weight ' + weight + 'kg',
+    input('.weight', {type: 'range', min: 40, max: 140, value: weight})
+  ]);
+}

+function renderHeightSlider(height) {
+  return div([
+    'Height ' + height + 'cm',
+    input('.height', {type: 'range', min: 140, max: 210, value: height})
+  ]);
+}

+function bmi(weight, height) {
+  const heightMeters = height * 0.01;
+  return Math.round(weight / (heightMeters * heightMeters));
+}

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
-      const heightMeters = height * 0.01;
-      const bmi = Math.round(weight / (heightMeters * heightMeters));
-      return {weight, height, bmi};
+      return {weight, height, bmi: bmi(weight, height)};
     });

   const vdom$ = state$.map(({weight, height, bmi}) =>
     div([
-      div([
-        'Weight ' + weight + 'kg',
-        input('.weight', {type: 'range', min: 40, max: 140, value: weight})
-      ]),
-      div([
-        'Height ' + height + 'cm',
-        input('.height', {type: 'range', min: 140, max: 210, value: height})
-      ]),
+      renderWeightSlider(weight),
+      renderHeightSlider(height),
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

此时 `main` 函数仍然承担了太多的工作。这里我们可以进一步对它进行优化。我们可以将 `state$.map(state => someVNode)` 看作是一个 *View* 函数，它会根据状态的变化来渲染视觉元素，现在让我们来了解 `function view(state$)`。

```diff
 import xs from 'xstream';
 import {run} from '@cycle/run';
 import {div, input, h2, makeDOMDriver} from '@cycle/dom';

 function renderWeightSlider(weight) {
   return div([
     'Weight ' + weight + 'kg',
     input('.weight', {type: 'range', min: 40, max: 140, value: weight})
   ]);
 }

 function renderHeightSlider(height) {
   return div([
     'Height ' + height + 'cm',
     input('.height', {type: 'range', min: 140, max: 210, value: height})
   ]);
 }

 function bmi(weight, height) {
   const heightMeters = height * 0.01;
   return Math.round(weight / (heightMeters * heightMeters));
 }

+function view(state$) {
+  return state$.map(({weight, height, bmi}) =>
+    div([
+      renderWeightSlider(weight),
+      renderHeightSlider(height),
+      h2('BMI is ' + bmi)
+    ])
+  );
+}

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
       return {weight, height, bmi: bmi(weight, height)};
     });

-  const vdom$ = state$.map(({weight, height, bmi}) =>
-    div([
-      renderWeightSlider(weight),
-      renderHeightSlider(height),
-      h2('BMI is ' + bmi)
-    ])
-  );
+  const vdom$ = view(state$);

   return {
     DOM: vdom$
   };
 }

 run(main, {
   DOM: makeDOMDriver('#app')
 });
```

现在，`main` 函数变得小多了。但它现在是只做*一件事*了吗？它仍然包含了 `changeWeight$`， `changeHeight$`， `weight$`， `height$`， `state$` 和 `view(state$)` 的返回。通常我们处理 *View* 时会使用到 *Model*，而 *Model* 一般用于**状态管理**。但是在我们的例子中，因为 `state$` 是[响应式的](streams.html#streams-reactive-programming)，所以可以自行进行状态的管理。由于在代码中定义了 `state$` 受到 `changeWeight$` 和 `changeHeight$` 的影响。因此我们可以将其放到 `model()` 函数中。

```diff
 import xs from 'xstream';
 import {run} from '@cycle/run';
 import {div, input, h2, makeDOMDriver} from '@cycle/dom';

 // ...

+function model(changeWeight$, changeHeight$) {
+  const weight$ = changeWeight$.startWith(70);
+  const height$ = changeHeight$.startWith(170);
+
+  return xs.combine(weight$, height$)
+    .map(([weight, height]) => {
+      return {weight, height, bmi: bmi(weight, height)};
+    });
+}

 function view(state$) {
   return state$.map(({weight, height, bmi}) =>
     div([
       renderWeightSlider(weight),
       renderHeightSlider(height),
       h2('BMI is ' + bmi)
     ])
   );
 }

 function main(sources) {
   const changeWeight$ = sources.DOM.select('.weight')
     .events('input')
     .map(ev => ev.target.value);

   const changeHeight$ = sources.DOM.select('.height')
     .events('input')
     .map(ev => ev.target.value);

-  const weight$ = changeWeight$.startWith(70);
-  const height$ = changeHeight$.startWith(170);
-
-  const state$ = xs.combine(weight$, height$)
-    .map(([weight, height]) => {
-      return {weight, height, bmi: bmi(weight, height)};
-    });
+  const state$ = model(changeWeight$, changeHeight$);

   const vdom$ = view(state$);

   return {
     DOM: vdom$
   };
 }

 run(main, {
   DOM: makeDOMDriver('#app')
 });
```

`main` 仍然定义了 `changeWeight$` 和 `changeHeight$`。它们是 *Actions* 的事件流。在[之前的基本示例章节中](basic-examples.html#basic-examples-increment-a-counter) 我们有一个 `action$` 流来对计数器进行增减操作。这些 Actions 是由 DOM 事件来进行解释推理的。它们的名字表明了用户的 *intentions*。我们可以组合这些流定义在一个 `intent()` 函数中：

```diff
 import xs from 'xstream';
 import {run} from '@cycle/run';
 import {div, input, h2, makeDOMDriver} from '@cycle/dom';

 // ...

+function intent(domSource) {
+  return {
+    changeWeight$: domSource.select('.weight').events('input')
+      .map(ev => ev.target.value),
+    changeHeight$: domSource.select('.height').events('input')
+      .map(ev => ev.target.value)
+  };
+}

-function model(changeWeight$, changeHeight$) {
-  const weight$ = changeWeight$.startWith(70);
-  const height$ = changeHeight$.startWith(170);
+function model(actions) {
+  const weight$ = actions.changeWeight$.startWith(70);
+  const height$ = actions.changeHeight$.startWith(170);

   return xs.combine(weight$, height$)
     .map(([weight, height]) => {
       return {weight, height, bmi: bmi(weight, height)};
     });
 }

 function view(state$) {
   return state$.map(({weight, height, bmi}) =>
     div([
       renderWeightSlider(weight),
       renderHeightSlider(height),
       h2('BMI is ' + bmi)
     ])
   );
 }

 function main(sources) {
-  const changeWeight$ = sources.DOM.select('.weight')
-    .events('input')
-    .map(ev => ev.target.value);
-
-  const changeHeight$ = sources.DOM.select('.height')
-    .events('input')
-    .map(ev => ev.target.value);
+  const actions = intent(sources.DOM);

-  const state$ = model(changeWeight$, changeHeight$);
+  const state$ = model(actions);

   const vdom$ = view(state$);

   return {
     DOM: vdom$
   };
 }

 run(main, {
   DOM: makeDOMDriver('#app')
 });
```

至此 `main` 函数终于变得足够简洁，并且在一个抽象层上定义了如何从 DOM 事件中创建 actions，并流经 model 再流向 view 并最终返回到 DOM 上。通过这一步骤链，我们可以重构 `main` 函数来组合这三个函数 `intent`, `model`, 和 `view`：

```javascript
function main(sources) {
  return {DOM: view(model(intent(sources.DOM)))};
}
```

这看上去便是最简明的 `main` 函数的格式了。

## 总结

- `intent()` 函数
  - 目的: 将 DOM 事件解释为用户的意图 actions
  - 输入: DOM source
  - 输出: Action 流
- `model()` 函数
  - 目的: 管理状态
  - 输入: Action 流
  - 输出: State 流
- `view()` 函数
  - 目的: 视觉地展示 Model 中的状态
  - 输入: State 流
  - 输出: 作为 DOM Driver sink 的虚拟 DOM 节点流

那么 **Model-View-Intent 是一种架构吗？**如果是，那么它和 Model-View-Controller 的区别又是什么呢？

## MVC 是什么

自从 80 年代以来，[Model-View-Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) (MVC) 就作为构建用户界面的基础架构，它的理念启发了其他许多重要的架构，例如 [MVVM](https://en.wikipedia.org/wiki/Model_View_ViewModel) 和 [MVP](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93presenter)。

MVC 的特点是控制器：一个操作其他部分的组件，并当用户执行操作时会相应地更新它们。

![MVC](img/mvc-diagram.svg)

MVC 中的控制器与我们的响应式理念是不相容的，因为它是一个主动的组件（隐含了被动 Model 或被动 View）。然而 MVC 的最初理念是一种在计算机数字领域和用户的心理模型之间转换信息的方法。用 Trygve 的话说：

> *MVC 最初的目的是为了在计算机中搭建起用户心理模型和数字模型的桥梁。*<br />&#8211; [Trygve Reenskaug](http://heim.ifi.uio.no/~trygver/themes/mvc/mvc-index.html)，MVC 设计模式的提出者。

我们可以保留 MVC 的理念来避免一个主动的控制器。实际上，如果你观察 `view()` 函数，它除了将状态（计算机中的数字模型）转换为对用户能够理解的视图表示外什么也不做。因此 View 其实是一种语言到另一种语言的转换：从二进制数据到英语或者其他对人类友好的语言。

![view translation](img/view-translation.svg)

而相反的方向应该是直接从用户的动作转换到*新*的数字数据。这正是 `intent()` 所要做的：在数字模型的内容里解释用户意图影响的内容。

![intent translation](img/intent-translation.svg)

Model-View-Intent (MVI) 是**响应式**、**函数式**的，并遵循了 **MVC 的核心理念**。在整个流程中 Intent 监听着用户的行为，Model 监听着 Intent，View 监听着 Model，而用户也监听着 View，因此它是响应式的。而它同样也是函数式的，因为每一个组件都在流中被表示为一个[引用透明](https://en.wikipedia.org/wiki/Referential_transparency_%28computer_science%29)的函数。它遵循它遵循了 MVC 最初的目的，因为 View 和 Intent 在用户和数字模型中搭建了桥梁。

> ### 为什么是 CSS 选择器?
>
> 一些程序员关注到 `DOM.select(selector).events(eventType)` 是一种糟糕的实践方式，因为它类似于 jQuery 结构的程序一样，会将程序裹挟的如一团乱麻一样。他们更倾向于选择虚拟 DOM 元素来指定事件处理回调，例如 `onClick={this.handleClick()}`。
> 
> 而在 Cycle *DOM* 中选择基于选择的事件处理其实是一个明智而理性的决定。这个策略将使得 MVI 遵循响应式理念，它的灵感来自于[开闭原则](https://en.wikipedia.org/wiki/Open/closed_principle)。
>
> **这对 MVI 和响应式十分重要**。如果我们让 Views 支持 `onClick={this.handleClick()}`，这意味着 Views 不再是一个简单的从数字模型到用户心理模型的转换，因为我们还指定了用户操作的结果。为了保证 Cycle.js 应用中的所有部分都是响应式的，我们需要用 View 来简单地声明 Model 的视图展示。否则 View 将会变为一个主动性的组件。让 View 在这里只负责状态的视图展示职责是更有益的：这里遵循了[单一职责概念](https://en.wikipedia.org/wiki/Single_responsibility_principle)并且对 UI 设计人员是友好的。它在概念上也与 [MVC 中的原始视图](http://heim.ifi.uio.no/~trygver/1979/mvc-2/1979-12-MVC.pdf)一致："*...视图永远不应该知道用户的输入，例如鼠标、键盘的操作。*"
> 
> **添加用户的动作不应该影响到 View。** 如果你需要改变 Intent 代码来从元素中获取新类型的事件，你不需要来修改 VTree 元素中的代码。View 应当保持着不受影响的状态，因为从状态到 DOM 的转换并没有改变。
> 
> 在 Cycle DOM 中 MVI 策略是使用适当的语义类名来命名 View 中的大多数元素。如果它们都做到这样，你便不再需要担心哪些是包含了事件处理的逻辑。类名将作为通用的设计来保证 View (DOM sink) 和 Intent (DOM source) 可以被引用到相同的元素。
> 
> 正如我们在[组件](components.html)章节中看到的，因为有 `isolate()` 的帮助，全局类名的冲突在 Cycle.js 里也并不是问题。

所以 MVI 是一种架构，但在 Cycle.js 中，它只不过是对 `main()` 函数进行的简单分解。

![main equal MVI](img/main-eq-mvi.svg)

实际上，MVI 本身就是在我们对 `main()` 函数的重构中自然产生出来的。这意味着 Model、View 和 Intent 并不是严格的需要放置代码的模块。相反，它们只是一种十分简单方便的组织代码的形式，因为它们只是简单的函数。无论什么时候，只要一个函数变得足够冗余时，它就应该被拆分开。我们可以使用 MVI 作为指导来组织代码，但如果这对你的代码没有意义，那么请不要被这些规则所束缚。

这同样意味着 Cycle.js 是*可切片的*。MVI 只是分割 `main()` 函数的一种方法。

> ### 可切片的？
>
> "可切片的"，指的是可以通过提取代码片段来重构程序，而并不需要对其周边进行过大修改的能力。
可切片的特性在函数式编程语言中经常出现，尤其是基于 LISP 的语言如 [Clojure](https://en.wikipedia.org/wiki/Clojure)（使用 S 表达式来将[代码作为数据](https://en.wikipedia.org/wiki/Homoiconicity)进行处理）。

## 追求 DRY

作为优秀的程序员应当编写好的代码库，我们需要遵守[DRY:Don't Repeat Yourself（不要自我重复）](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)的理念。而我们目前写的 MVI 代码并不是完全的做到了 DRY。

例如，滑块的视图包含了相当数量的可共享代码。在 Intent 中，我们有一些重复的 `dom.select().events()` 流。

```javascript
function renderWeightSlider(weight) {
  return div([
    'Weight ' + weight + 'kg',
    input('.weight', {type: 'range', min: 40, max: 140, value: weight})
  ]);
}

function renderHeightSlider(height) {
  return div([
    'Height ' + height + 'cm',
    input('.height', {type: 'range', min: 140, max: 210, value: height})
  ]);
}

function intent(domSource) {
  return {
    changeWeight$: domSource.select('.weight')
      .events('input')
      .map(ev => ev.target.value),
    changeHeight$: domSource.select('.height')
      .events('input')
      .map(ev => ev.target.value)
  };
}
```

我们可以创建一些函数来消除这类重复，就像这样：

```javascript
function renderSlider(label, value, unit, className, min, max) {
  return div([
    '' + label + ' ' + value + unit,
    input('.' + className, {type: 'range', min, max, value})
  ]);
}

function renderWeightSlider(weight) {
  return renderSlider('Weight', weight, 'kg', 'weight', 40, 140);
}

function renderHeightSlider(height) {
  return renderSlider('Height', height, 'cm', 'height', 140, 210);
}

function getSliderEvent(domSource, className) {
  return domSource.select('.' + className)
    .events('input')
    .map(ev => ev.target.value);
}

function intent(domSource) {
  return {
    changeWeight$: getSliderEvent(domSource, 'weight'),
    changeHeight$: getSliderEvent(domSource, 'height')
  };
}
```

但这仍然不理想：似乎我们现在的代码量变得*更多*了。其实我们真正想要的只是创建*有标签的滑块*：一个设置高度，另一个设置重量。我们应该构建一个通用的、可复用的标签滑块。换句话说，我们希望标签滑块成为一个[组件](components.html)。