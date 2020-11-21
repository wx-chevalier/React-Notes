# 组件内状态

# useState

useState 接收一个初始值，返回一个数组，数组里面分别是当前值和修改这个值的方法（类似 state 和 setState）。useState 接收一个函数，返回一个数组。setCount 可以接收新值，也可以接收一个返回新值的函数。

```ts
const [count1, setCount1] = useState(0);
const [count2, setCount2] = useState(() => 0);
setCount1(1); // 修改 state
```

函数式状态的粒度会比类中状态更细，函数式状态保存的是快照，类状态保存的是最新值。引用类型的情况下，类状态不需要传入新的引用，而函数式状态必须保证是个新的引用。

## 快照（闭包）与最新值（引用）

在函数式组件中，我们有时候会发现所谓闭包冻结的现象，譬如在如下代码中：

```ts
function App() {
  const [count, setCount] = useState(0);
  const inc = React.useCallback(() => {
    setTimeout(() => {
      setCount(count + 1);
    });
  }, []);

  return <h1 onClick={inc}>{count}</h1>;
}
```

类组件里面可以通过 this.state 引用到 count，所以每次 setTimeout 的时候都能通过引用拿到上一次的最新 count，所以点击多少次最后就加了多少。在函数式组件里面每次更新都是重新执行当前函数，也就是说 setTimeout 里面读取到的 count 是通过闭包获取的，而这个 count 实际上只是初始值，并不是上次执行完成后的最新值，所以最后只加了 1 次。

想要解决这个问题，那就涉及到另一个新的 Hook 方法 useRef。useRef 是一个对象，它拥有一个 current 属性，并且不管函数组件执行多少次，而 useRef 返回的对象永远都是原来那一个。

```ts
export default function App() {
  const [count, setCount] = React.useState(0);
  const ref = useRef(0);

  const inc = React.useCallback(() => {
    setTimeout(() => {
      setCount((ref.current += 1));
    });
  }, []);

  return (
    <h1 onClick={inc}>
      {count},{ref.current}
    </h1>
  );
}
```

# useRef

```js
export function useRef<T>(initialValue: T): { current: T } {
  currentlyRenderingFiber = resolveCurrentlyRenderingFiber();
  workInProgressHook = createWorkInProgressHook();
  let ref;

  if (workInProgressHook.memoizedState === null) {
    ref = { current: initialValue };
    // ...
    workInProgressHook.memoizedState = ref;
  } else {
    ref = workInProgressHook.memoizedState;
  }
  return ref;
}
```

对于函数式组件，如果我们需要获取该组件子元素的 Ref，可以使用 forwardRef 来进行 Ref 转发：

```js
const FancyButton = React.forwardRef((props, ref) => (
  <button ref={ref} className="FancyButton">
    {props.children}
  </button>
));

// You can now get a ref directly to the DOM button:
const ref = React.createRef();
<FancyButton ref={ref}>Click me!</FancyButton>;
```
