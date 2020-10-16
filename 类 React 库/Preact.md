# Preact

Preact，它是 React 的 3KB 轻量替代方案，拥有同样的 ES6 API。高性能，轻量，即时生产是 Preact 关注的核心。基于这些主题，Preact 关注于 React 的核心功能，实现了一套简单可预测的 diff 算法使它成为最快的虚拟 DOM 框架之一，同时 preact-compat 为兼容性提供了保证，使得 Preact 可以无缝对接 React 生态中的大量组件，同时也补充了很多 Preact 没有实现的功能。

![Performance Comparison](https://i.postimg.cc/4dVTRmr4/image.png)

## 工作流程

简单介绍了 Preact 的前生今世以后，接下来说下 Preact 的工作流程，主要包含五个模块：component、h 函数、render、diff 算法、回收机制。首先是我们定义好的组件，在渲染开始的时候，首先会进入 h 函数生成对应的 virtual node（如果是 JSX 编写，之前还需要一步转码）。每一个 vnode 中包含自身节点的信息，以及子节点的信息，由此而连结成为一棵 virtual dom 树。基于生成的 vnode，render 模块会结合当前 dom 树的情况进行流程控制，并为后续的 diff 操作做一些准备工作。

![Preact 工作流程](https://i.postimg.cc/fLKBdsdj/image.png)

Preact 的 diff 算法实现有别于 react 基于双 virtual dom 树的思路，Preact 只维持一棵新的 virtual dom 树，diff 过程中会基于 dom 树还原出旧的 virtual dom 树，再将两者进行比较，并在比较过程中实时对 dom 树进行 patch 操作，最终生成新的 dom 树。与此同时，diff 过程中被卸载的组件和节点不会被直接删除，而是被分别放入回收池中缓存，当再次有同类型的组件或节点被构建时，可以在回收池中找到同名元素进行改造，避免从零构建的开销。

# 快速开始

```js
import { h, render, Component } from "preact";

class Clock extends Component {
  state = { time: Date.now() };

  // Called whenever our component is created
  componentDidMount() {
    // update time every second
    this.timer = setInterval(() => {
      this.setState({ time: Date.now() });
    }, 1000);
  }

  // Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    clearInterval(this.timer);
  }

  render() {
    let time = new Date(this.state.time).toLocaleTimeString();
    return <span>{time}</span>;
  }
}

render(<Clock />, document.body);
```

# TBD

— https://www.axihe.com/react/preact/home.html#linkstate Preact 学习笔记
