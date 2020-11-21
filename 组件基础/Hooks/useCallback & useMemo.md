# useCallback 与 useMemo

```js
function Button({ onClick, color, children }) {
  const textColor = slowlyCalculateTextColor(this.props.color);
  return (
    <button
      onClick={onClick}
      className={"Button-" + color + " Button-text-" + textColor}
    >
      {children}
    </button>
  );
}
export default React.memo(Button); // ✅ Uses shallow comparison
```

不过在实际场景下，很多的 Callback 还是会被重新生成，我们还是需要在子组件中进行精细地 shouldComponentUpdate 控制。

# 闭包冻结

在 useCallback 的使用中，有时候我们会碰到所谓的闭包冻结的现象，即如下所示：

```js
let Test = () => {
  /** Search base infos */
  const [searchID, setSearchID] = useState(0);

  /** Search info action */
  const onSearchInfos = useCallback(() => {
    let fetchUrl = "/api/getSearchInfos";
    let fetchParams = { searchID };
    fetch(fetchUrl, {
      method: "POST",
      body: JSON.stringify(fetchParams),
    })
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
      });
  }, []);

  return (
    <>
      <button
        onClick={() => {
          setSearchID(searchID + 1);
        }}
      >
        button1
      </button>
      <button
        onClick={() => {
          onSearchInfos();
        }}
      >
        button2
      </button>
    </>
  );
};
```

点击 button1 按钮，searchID 的值加 1，点击 button2 发送一个请求。然而问题是，当我们点击了四次 button1，把 searchID 的值更改到了 4，然后点击 button2，会发现，发送出去的请求，searhID 的值是 0。

## 原因分析

我们可以使用如下代码来理解：

```js
storage = { a: 1 };

(() => {
  let b = storage.a;

  storage.f = () => {
    console.log(b);
  };
})();

storage.a = 2;

storage.f();
```

参考 Hooks 的实现原理，我们可以模拟写出如下的代码：

```js
// React has some component-local storage that it tracks behind the scenes.
// useState and useCallback both hook into this.
//
// Imagine there's a 'storage' variable for every instance of your
// component.
const storage = {};

function useState(init) {
  if (storage.data === undefined) {
    storage.data = init;
  }

  return [storage.data, (value) => (storage.data = value)];
}

function useCallback(fn) {
  // The real version would check dependencies here, but since our callback
  // should only update on the first render, this will suffice.
  if (storage.callback === undefined) {
    storage.callback = fn;
  }

  return storage.callback;
}

function MyComponent() {
  const [data, setData] = useState(0);
  const callback = useCallback(() => data);

  // Rather than outputting DOM, we'll just log.
  console.log("data:", data);
  console.log("callback:", callback());

  return {
    increase: () => setData(data + 1),
  };
}

let instance = MyComponent(); // Let's 'render' our component...

instance.increase(); // This would trigger a re-render, so we call our component again...
instance = MyComponent();

instance.increase(); // and again...
instance = MyComponent();
```

## 解决方案

### 添加依赖

```js
const onSearchInfos = useCallback(() => {
  // ...
}, [searchID]);
```

### 使用 Ref

```js
interface IRef {
  current: any;
}

let Test = () => {
  /** Search base infos */
  const [searchID, setSearchID] = useState(0);

  /** 解决闭包问题 */
  const fetchRef: IRef = useRef(); // hooks为我们提供的一个通用容器，里面有一个current属性
  fetchRef.current = {
    //  为current这个属性添加一个searchID，每当searchID状态变更的时候，Test都会进行重新渲染，从而current能拿到最新的值
    searchID,
  };

  /** Search info action */
  const onSearchInfos = useCallback(() => {
    let fetchUrl = "/api/getSearchInfos";
    let fetchParams = { ...fetchRef.current }; // 解构参数，这里拿到的是外层fetchRef的引用
    fetch(fetchUrl, {
      method: "POST",
      body: JSON.stringify(fetchParams),
    })
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
      });
  }, []);

  return (
    <>
      <button
        onClick={() => {
          setSearchID(searchID + 1);
        }}
      >
        button1
      </button>
      <button
        onClick={() => {
          onSearchInfos();
        }}
      >
        button2
      </button>
    </>
  );
};
```

# useMemo

useMemo 的用法类似 useEffect，常常用于缓存一些复杂计算的结果。useMemo 接收一个函数和依赖数组，当数组中依赖项变化的时候，这个函数就会执行，返回新的值。

```js
const sum = useMemo(() => {
  // 一系列计算
}, [count]);
```

# TBD

- https://blog.csdn.net/sinat_17775997/article/details/94453167
- https://nikgrozev.com/2019/04/07/reacts-usecallback-and-usememo-hooks-by-example/
