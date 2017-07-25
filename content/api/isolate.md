# Isolate

在 Cycle.js 中,创建一个效用函数可以限制数据流组件的作用域。

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
