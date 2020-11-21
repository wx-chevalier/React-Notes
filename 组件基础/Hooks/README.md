> 本文节选自 []()

# React Hooks

React Hooks 是 React 16.8 引入的新特性，允许我们在不使用 Class 的前提下使用 state 和其他特性。React Hooks 要解决的问题是状态共享，是继 render-props 和 higher-order components 之后的第三种状态逻辑复用方案，不会产生 JSX 嵌套地狱问题。

[![image.png](https://i.postimg.cc/G2cQwFB2/image.png)](https://postimg.cc/zLcWTRFZ)

Hooks 的优势在于：

- 多个状态不会产生嵌套，写法还是平铺的
- 允许函数组件使用 state 和部分生命周期
- 更容易将组件的 UI 与状态分离

```ts
function useWindowWidth() {
  const [width, setWidth] = React.useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [width]);

  return width;
}
```

不过 Hooks 也并非全无代价，函数式组件本身会导致大量的临时函数被创建。

# TBD

- https://reactjs.org/docs/hooks-faq.html
- https://reactjs.org/blog/2019/02/06/react-v16.8.0.html
- https://fettblog.eu/typescript-react/hooks/
- https://mp.weixin.qq.com/s/P5XZO5j494rGczXqKIza5w
- https://mp.weixin.qq.com/s/LrwPFDK2YCjcxAfw79N9Tg
- https://mp.weixin.qq.com/s/968ukIjEhhEOeLD5SQoKaw
- https://www.zhihu.com/question/338443007/answer/773530095
- https://blog.csdn.net/qq_41384351/article/details/90048454
- https://mp.weixin.qq.com/s/YEs5nH4aOAxOPYuW8oVlBA
- https://segmentfault.com/a/1190000020120456
- https://itnext.io/optimizing-react-code-with-hooks-3eaaf5978351
