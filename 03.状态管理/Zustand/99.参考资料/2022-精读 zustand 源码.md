> [原文地址](https://zhuanlan.zhihu.com/p/461152248)

# 精读 zustand 源码

# 手写一个 toy 级别的 zustand

上面我们分析了 zustand 执行的过程及状态管理的流程，下面我们就尝试着手写 toyzustand，这块我们分成两块，一个是创建 store 部分，一个是创建 useStore hooks 的部分，具体如下：

```js
function createStore(createState) {
  let state;
  let listeners = new Set();
  // 获取store内容
  const getState = () => state;
  // 更新store内容
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;

    if (nextState !== state) {
      const prevState = state;
      state = replace ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, prevState));
    }
  };
  // 添加订阅信息
  const subscribe = (listener) => {
    listeners.add(listener);
    // 清除订阅信息
    return () => {
      listeners.delete(listener);
    };
  };
  // 清除所有的listener
  const destroy = () => listeners.clear();

  const api = { getState, setState, destroy, subscribe };
  // 创建初始的state
  state = createState(setState, getState, api);

  return api;
}

export default createStore;
```

生成 hooks 方法：

```js
import { useLayoutEffect } from "react";
import { useReducer, useRef } from "react";
import createStore from "./createStore";

function create(createState) {
  // 根据createStore 结合createState 创建一个store
  const api = createStore(createState);

  /**
   * @description 创建 hooks
   * @param {Function} selector  可选的，返回store的内容，默认api.getState
   * @param {Function} enqulityFn  可选，默认用Object.is 判断
   * @returns
   */
  const useStore = (selector = api.getState, enqulityFn = Object.is) => {
    // 生辰一个forceUpdate函数
    const [, forceUpdate] = useReducer((c) => c + 1, 0);

    const state = api.getState();
    const stateRef = useRef(state);
    // 存储方法
    const selectorRef = useRef(selector);
    const enqulityFnRef = useRef(enqulityFn);

    // 当前current状态存储
    let currentStateRef = useRef();
    if (currentStateRef.current === undefined) {
      currentStateRef.current = selector(state);
    }

    /**
     * 当前用户所需要的状态切片（这块需要注意，zustand用户可以根据selector获取部分store内容值）
     * 所以我们判断是否需要更新，对比的是切片内容，而非整个store
     */
    let newStateSlice;
    // 更新标志
    let hasNewStateSlice = false;

    if (
      stateRef.current !== state ||
      selector !== selectorRef.current ||
      enqulityFn !== enqulityFnRef.current
    ) {
      newStateSlice = selector(state);
      hasNewStateSlice = !enqulityFn(newStateSlice, currentStateRef.current);
    }

    // 初始化数据
    useLayoutEffect(() => {
      if (hasNewStateSlice) {
        currentStateRef.current = newStateSlice;
      }
      stateRef.current = state;
      selectorRef.current = selector;
      enqulityFnRef.current = enqulityFn;
    });

    // 添加state变化订阅事件
    useLayoutEffect(() => {
      const listener = () => {
        // 获取当前最新的state状态值
        const nextState = api.getState();
        // 拿到当前用户所需的store切片
        const nextStateSlice = selectorRef.current(nextState);
        // 比较当前用户current切片 与 最新store切片是否是一样的，如果不一样，就更新到最新的切片
        if (!enqulityFnRef.current(nextStateSlice, currentStateRef.current)) {
          stateRef.current = nextState;
          currentStateRef.current = nextStateSlice;
          forceUpdate();
        }
      };
      const unSubscribe = api.subscribe(listener);
      // 当组件销毁，我们需要取消订阅
      return unSubscribe;
    }, []);

    // 返回用户所需切片
    const sliceToReturn = hasNewStateSlice
      ? newStateSlice
      : currentStateRef.current;

    return sliceToReturn;
  };
  // 将修改store的方法{getState, setState, destroy, subscribe}暴露出去，这样用户可以脱离react组件去使用状态管理
  // example: useStore.getState() ....
  Object.assign(useStore, api);

  return useStore;
}

export default create;
```

项目中使用方法：

```js
// 创建store
import create from "../create";

export const useCounterStore = create((set) => ({
  count: 0,
  increament: () => set((state) => ({ count: state.count + 1 })),
}));

// 项目中使用方式
import React from "react";
import { useCounterStore } from "./store";

const Other = () => {
  const counter = useCounterStore();
  return (
    <div>
      <h1>Other</h1>
      <div>
        <div>{counter.count}</div>
      </div>
    </div>
  );
};

export default Other;
```
