# Inferno

Inferno 是一个快速，类似于 React 的库，用于在客户端和服务器上构建高性能的用户界面。Inferno 故意在组件方面保留与 React 相同的设计思想：单向数据流和关注点分离。在这些示例中，通过 Inferno JSX Babel 插件使用 JSX，以提供表达 Inferno 虚拟 DOM 的简单方法。您不需要使用 JSX，它是完全可选的，您可以使用 hyperscript 或 createElement（就像 React 一样）。请记住，编译时间优化仅适用于 JSX。

```js
import { render } from "inferno";

const message = "Hello world";

render(<MyComponent message={message} />, document.getElementById("app"));
```

Inferno 也支持类似 React 的类组件：

```js
import { render, Component } from "inferno";

class MyComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      counter: 0,
    };
  }
  render() {
    return (
      <div>
        <h1>Header!</h1>
        <span>Counter is at: {this.state.counter}</span>
      </div>
    );
  }
}

render(<MyComponent />, document.getElementById("app"));
```

由于性能是该库的重要方面，因此我们想向您展示如何进一步优化应用程序。在下面的示例中，我们通过使用 `JSX$HasVNodeChildren` 预定义子形状的编译时间来优化差异过程。然后，我们使用 Inferno.createTextVNode 创建文本 vNode。

```js
import { createTextVNode, render, Component } from "inferno";

class MyComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      counter: 0,
    };
  }
  render() {
    return (
      <div>
        <h1>Header!</h1>
        <span $HasVNodeChildren>
          {createTextVNode("Counter is at: " + this.state.counter)}
        </span>
      </div>
    );
  }
}

render(<MyComponent />, document.getElementById("app"));
```
