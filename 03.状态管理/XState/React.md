# 在 React 中使用

## Hooks

这裡我们使用 React 当作 UI Library 来实作，需求是画面上会有一个 Button 以及一个圆点，点击 Button 以后圆点的颜色会改变，颜色改变顺序为 红 → 绿 → 黄 → 红... 不断接续。

```js
const LIGHT_STATES = {
  RED: "RED",
  GREEN: "green",
  YELLOW: "yellow",
};

const LIGHT_EVENTS = {
  CLICK: "CLICK",
};

export const lightMachine = Machine({
  initial: LIGHT_STATES.RED,
  states: {
    [LIGHT_STATES.RED]: {
      on: {
        [LIGHT_EVENTS.CLICK]: LIGHT_STATES.GREEN,
      },
    },
    [LIGHT_STATES.GREEN]: {
      on: {
        [LIGHT_EVENTS.CLICK]: LIGHT_STATES.YELLOW,
      },
    },
    [LIGHT_STATES.YELLOW]: {
      on: {
        [LIGHT_EVENTS.CLICK]: LIGHT_STATES.RED,
      },
    },
  },
});
```

然后在组件中定义状态：

```js
import React from 'react';
import { useMachine } from '@xstate/react';
import { lightMachine } from './lightMachine';

function App() {
  const [state, send] = useMachine(lightMachine);
  return (
    //...
  );
}
```

React 的部分我们使用了 XState 官方提供的 @xstate/react Library，这裡用到的 useMachine 其实就是用了前面提到的 interpret 它已经帮我们产生好 service 并会回传 [state, send, service] 。

```js
import React from "react";
import { useMachine } from "@xstate/react";
import { lightMachine } from "./lightMachine";

function App() {
  const [state, send] = useMachine(lightMachine);
  return (
    <div className="App">
      {state.matches(LIGHT_STATES.RED) && <RedLight />}
      {state.matches(LIGHT_STATES.GREEN) && <GreenLight />}
      {state.matches(LIGHT_STATES.YELLOW) && <YellowLight />}
      <button
        onClick={() => {
          send(LIGHT_EVENTS.CLICK);
        }}
      >
        click me
      </button>
    </div>
  );
}
```

最后 return 时只要透过 state.matches 决定要显示哪个状态的画面，并且在 button onClick 时传送 LIGHT_EVENTS.CLICK 事件就可以啦。

## 在类组件中使用

当然，我们也可以在类组件中使用，定义如下的状态机：

```js
import { Machine } from "xstate";

// This machine is completely decoupled from React
export const toggleMachine = Machine({
  id: "toggle",
  initial: "inactive",
  states: {
    inactive: {
      on: { TOGGLE: "active" },
    },
    active: {
      on: { TOGGLE: "inactive" },
    },
  },
});
```

对状态机进行解释，并将其服务实例放在组件实例上。对于本地状态，this.state.current 将持有当前的状态机状态。你可以使用除.current 以外的属性名。当组件被挂载时，服务将通过 this.service.start() 启动。当组件将卸载时，服务通过 this.service.stop() 停止。事件通过 this.service.send(event) 发送给服务。

```js
import React from "react";
import { Machine, interpret } from "xstate";
import { toggleMachine } from "../path/to/toggleMachine";

class Toggle extends React.Component {
  state = {
    current: toggleMachine.initialState,
  };

  service = interpret(toggleMachine).onTransition((current) =>
    this.setState({ current })
  );

  componentDidMount() {
    this.service.start();
  }

  componentWillUnmount() {
    this.service.stop();
  }

  render() {
    const { current } = this.state;
    const { send } = this.service;

    return (
      <button onClick={() => send("TOGGLE")}>
        {current.matches("inactive") ? "Off" : "On"}
      </button>
    );
  }
}
```

# 更复杂的搜索的例子

> https://medium.com/weekly-webtips/intro-to-xstate-a-true-state-management-system-library-for-react-d8c0051c71e4

```js
import { Machine, assign } from "xstate";
import { search } from "../../services/github";

const statechart = {
  id: "search",
  context: {
    result: [],
  },
  initial: "idle",
  on: {
    SEARCH: [
      {
        target: "searching",
        cond: {
          type: "search query has more than one character",
        },
      },
      {
        target: "idle",
        actions: ["resetSearchResults"],
      },
    ],
  },
  states: {
    idle: {},
    searching: {
      invoke: {
        src: "searchService",
        onDone: {
          target: "loaded",
          actions: ["storeResult"],
        },
        onError: {
          target: "failure",
        },
      },
    },
    loaded: {},
    failure: {},
  },
};

const machineConfig = {
  services: {
    searchService: (_, event) => {
      return search(event.entity, {
        q: event.q,
      });
    },
  },
  actions: {
    storeResult: assign({
      result: (_, event) => {
        return event.data.items;
      },
    }),
    resetSearchResults: assign({
      result: () => {
        return [];
      },
    }),
  },
  guards: {
    "search query has more than one character": (_, event) => {
      return event.q.length >= 2;
    },
  },
};

export const searchMachine = Machine(statechart, machineConfig);
```
