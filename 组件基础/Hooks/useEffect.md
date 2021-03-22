# useEffect

useEffect 是一个 Effect Hook，常用于一些副作用的操作，在一定程度上可以充当 componentDidMount、componentDidUpdate、componentWillUnmount 这三个生命周期。

```js
useEffect(() => {
  async function fetchData() {
    // You can await here
    const response = await MyAPI.getData(someId);
    // ...
  }
  fetchData();
}, [someId]); // Or [] if effect doesn't need props or state
```

useEffect 是一个神奇的函数，通过不同的组合搭配我们能够极大地精简原本类组件中的业务逻辑代码。useEffect 接收两个参数，分别是要执行的回调函数、依赖数组。

- 如果依赖数组为空数组，那么回调函数会在第一次渲染结束后（componentDidMount）执行，返回的函数会在组件卸载时（componentWillUnmount）执行。
- 如果不传依赖数组，那么回调函数会在每一次渲染结束后（componentDidMount 和 componentDidUpdate）执行。
- 如果依赖数组不为空数组，那么回调函数会在依赖值每次更新渲染结束后（componentDidUpdate）执行，这个依赖值一般是 state 或者 props。

## 受控组件的状态变化

在编写 Input 这样的受控组件时，我们常常需要在 Props 中的 value 值变化之后，联动更新存储实际数据的内部 value 值：

```jsx
const defaultProps = {
  formData: {},
};

export function VCForm({ formData = defaultProps.formData }) {
  // ...
  const [innerFormData, setInnerFormData] = React.useState(formData);
  // ...

  // 当外部 Props 状态变化后，更新数据
  React.useEffect(() => {
    if (formData) {
      setInnerFormData(formData);
    }
  }, [formData]);
  // ...

  return (
    <Form
      value={innerFormDaat}
      onChange={(newData) => {
        setInnerFormData(newData);
      }}
    />
  );
}
```

这里需要注意的是，如果我们直接将默认值写在参数列表里，即 `formData = {}`；在外部参数未传入 formData，那么会发现每次组件更新都会触发 formData 被分配到新的默认值，也就导致了该组件的无限重复更新。因此我们需要仿造类组件中 defaultProps 的做法，将 defaultProps 以静态外部变量的方式存储并赋值。

# useLayoutEffect

useLayoutEffect 也是一个 Hook 方法，从名字上看和 useEffect 差不多，他俩用法也比较像。在 90% 的场景下我们都会用 useEffect，然而在某些场景下却不得不用 useLayoutEffect。useEffect 和 useLayoutEffect 的区别是：

- useEffect 不会 block 浏览器渲染，而 useLayoutEffect 会。
- useEffect 会在浏览器渲染结束后执行，useLayoutEffect 则是在 DOM 更新完成后，浏览器绘制之前执行。

```js
const moveTo = (dom, delay, options) => {
  dom.style.transform = `translate(${options.x}px)`;
  dom.style.transition = `left ${delay}ms`;
};

const Animate = () => {
  const ref = useRef();
  useEffect(() => {
    moveTo(ref.current, 500, { x: 600 });
  }, []);

  return <div ref={ref}>方块</div>;
};
```

在 useEffect 里面会让这个方块往后移动 600px 距离，可以看到这个方块在移动过程中会闪一下。但如果换成了 useLayoutEffect 呢？会发现方块不会再闪动，而是直接出现在了 600px 的位置。原因是 useEffect 是在浏览器绘制之后执行的，所以方块一开始就在最左边，于是我们看到了方块移动的动画。然而 useLayoutEffect 是在绘制之前执行的，会阻塞页面的绘制，所以页面会在 useLayoutEffect 里面的代码执行结束后才去继续绘制，于是方块就直接出现在了右边。那么这里的代码是怎么实现的呢？以 preact 为例，useEffect 在 options.commit 阶段执行，而 useLayoutEffect 在 options.diffed 阶段执行。然而在实现 useEffect 的时候使用了 requestAnimationFrame，requestAnimationFrame 可以控制 useEffect 里面的函数在浏览器重绘结束，下次绘制之前执行。

# useInterval

```ts
function Counter() {
  const [count, setCount] = useState(0);

  useInterval(() => {
    setCount(count + 1);
  }, 1000);

  return <h1>{count}</h1>;
}
import { useEffect, useRef } from "react";

/* istanbul ignore next */
/** keep typescript happy */
const noop = () => {};

export function useInterval(
  callback: () => void,
  delay: number | null | false,
  immediate?: boolean
) {
  // Remember the latest callback:
  //
  // Without this, if you change the callback, when setInterval ticks again, it
  // will still call your old callback.
  //
  // If you add `callback` to useEffect's deps, it will work fine but the
  // interval will be reset.
  const savedCallback = useRef(noop);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  });

  // Execute callback if immediate is set.
  useEffect(() => {
    if (!immediate) return;
    if (delay === null || delay === false) return;
    savedCallback.current();
  }, [immediate]);

  // Set up the interval.
  useEffect(() => {
    if (delay === null || delay === false) return undefined;
    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

useInterval 还能够来暂停、终止定时器。

# Links

- https://medium.com/trabe/react-useeffect-hook-44d8aa7cccd0
