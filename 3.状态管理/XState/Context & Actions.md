# Context & Actions

一个 Machine 的状态(state) 是有限的，例如水的状态 (固、液、气、等离子)，但我们仍然会需要储存非定性的可变资料(data)，这些资料我们会储存在 context 中，如下：

```js
const machine = Machine({
  context: {
    // 资料 (data) 存在 context 裡，key 可以自己订
    count: 0,
    user: null,
  },
  states: {
    //...
  },
});
```

我们可以透过 withContext() 动态的给定初始资料，如下：

```js
const myMachine = machine.withContext({
  count: 10,
  user: {
    name: "Jerry",
  },
});
```

在任何状态下，我们都可以拿到 context 的值：

```js
machine.initialState.context;
// { user: null, count: 0 }

const service = interpret(machine.withContext({
  count: 10,
  user: {
    name: 'Jerry'
  },
});
service.start();
service.state.context;
// { user: { name: 'Jerry' }, count: 10 }
```

至于要如何在特定的状态中改变 machine 内的 context 呢？我们会需要用到 Assign Actions。Actions 是一种 理射后不理 (Fire-and-forget)的 Effect，专门用来处理单一次的作用，另外在 XState 中还有许多不同种类的 Effects。

# Effects

在 Statecharts 的世界裡，Side Effect 可以依行为区分为两类：

- Fire-and-forget effects - 指执行 Side Effect 后不会另外送任何 event 回 statechart 的 effect。
- Invoked effects - 指除了可执行 Side Effect 之外还能发送和接收 events 的 effect。

这两类 Effect 在 XState 中依据不同的使用方式，又可以分为：

- Fire-and-forget effects
  - Actions - 用于单次、离散的 Effect
  - Activities - 用于连续的 Effect
- Invoked effects
  - Invoked Promises
  - Invoked Callbacks
  - Invoked Observables
  - invoked Machines

# Actions

Action 本身就是一个 function，接收三个参数分别是 context, event 以及 actionMeta，context 就是当前 machine 的 context，event 则是触发当前状态切换的事件，actionMeta 则会存放当前的 state 以及 action 物件。

```js
const action = (context, event, actionMeta) => {
  // do something...
};
```

我们可以把 actions 写在任何 State 的任何事件裡，如下：

```js
const lightMachine = Machine({
  initial: "red",
  states: {
    red: {
      on: {
        CLICK: {
          // 转换到 green 的状态
          target: "green",
          // transition actions
          actions: (context, event) => console.log("hello green"),
        },
      },
    },
    green: {
      on: {
        CLICK: {
          target: "red",
          // transition actions
          actions: (context, event) => console.log("hello red"),
        },
      },
    },
  },
});
```

另外还有两种 actions，分别是在进入 state 以及离开 state 时触发，如下：

```js
const lightMachine = Machine({
  initial: "red",
  states: {
    red: {
      // entry actions
      entry: (context, event) => console.log("entry red"),
      // exit actions
      exit: (context, event) => console.log("exit red"),
      on: {
        CLICK: {
          target: "green",
        },
      },
    },
    //...
  },
});
```

在进入 red 状态时会触发 red 内部的 entry，在离开 red 状态时会触发 red 内部的 exit。这两种 actions 我们称为 entry actions 以及 exit actions。另外 actions 可以定义在 machine options 内，并透过 string 来指定执行的 action，如下：

```js
const lightMachine = Machine({
  initial: 'red',
  states: {
    red: {
      // entry actions
      entry: 'entryRed'
      // exit actions
      exit: 'exitRed',
      on: {
        CLICK: {
          target: 'green',
          // transition actions
          actions: 'redClick',
        },
      }
    },
    //...
  }
}, {
  actions: {
    entryRed: (context, event) => console.log('entry red'),
    exitRed: (context, event) => console.log('exit red'),
    redClick: (context, event) => console.log('hello green'),
  },
});

```

所有设定 actions 的地方都可以是一个 array，依序执行多个 actions，如下：

```js
const lightMachine = Machine(
  {
    initial: "red",
    states: {
      red: {
        // entry actions
        entry: ["entryRed", "temp"],
        // exit actions
        exit: ["exitRed", "temp"],
        on: {
          CLICK: {
            target: "green",
            // transition actions
            actions: ["redClick", "temp"],
          },
        },
      },
      //...
    },
  },
  {
    actions: {
      entryRed: (context, event) => console.log("entry red"),
      exitRed: (context, event) => console.log("exit red"),
      redClick: (context, event) => console.log("hello green"),
      temp: (context, event) => console.log("temp"),
    },
  }
);
```

在实务开发上，不建议直接把 action function inline 在 machine config 裡，如下，这会造成之后难以除错、测试以及图像化。

```ts
  CLICK: {
    target: 'gerrn',
    actions: (context, event) => console.log('hello green')
  }
```

建议统一把 actions 放在 machine options 内，如下：

```js
const lightMachine = Machine(
  {
    initial: "red",
    states: {
      red: {
        // entry actions
        entry: ["entryRed", "temp"],
        //...
      },
      //...
    },
  },
  {
    actions: {
      entryRed: (context, event) => console.log("entry red"),
      temp: (context, event) => console.log("temp"),
    },
  }
);
```

# Assign Action

assign 是一个 function 专门用来更新 machine context，它吃一个 assigner 参数，这个参数会表示 context 要更新成什麽值。assigner 可以是一个 object (推荐用法)，用法如下：

```js
import { Machine, assign } from "xstate";

// ...
actions: assign({
  // 透过外部传进来的 event 来改变 count
  count: (context, event) => context.count + event.value,
  message: "value 也可以直接是 static value",
});
// ...
```

assigner 也可以是一个 function，用法如下：

```js
// ...
  // 他会 partial update context
	actions: assign((context, event) => {
    return {
      count: context.count + event.value,
      message: 'value 也可以直接是 static value'
    }
  }),
// ...

```

让我们直接来看一个简单的例子吧：

```js
const counterMachine = Machine(
  {
    id: "counter",
    initial: "ENABLED",
    context: {
      count: 0,
    },
    states: {
      ENABLED: {
        on: {
          INC: {
            actions: ["increment"],
          },
          DYNAMIC_INC: {
            actions: ["dynamic_increment"],
          },
          RESET: {
            actions: ["reset"],
          },
          DISABLE: "DISABLED",
        },
      },
      DISABLED: {
        on: {
          ENABLE: "ENABLED",
        },
      },
    },
  },
  {
    actions: {
      increment: assign({
        count: (context) => context.count + 1,
      }),
      dynamic_increment: assign({
        count: (context, event) => context.count + (event.value || 0),
      }),
      reset: assign({
        count: 0,
      }),
    },
  }
);
```

从上面这个范例，可以看出使用 XState 能够很清楚的定义出什麽状态下可以接收哪些 event，例如在 DISABLED 的状态下就只会对 ENABLE 的 event 会有反应，对于 INC, RESET 等事件就不会有反应。另外从 DYNAMIC_INC 事件可以看出如何根据外部传入的参数控制增长数值，详细可以参考以下这段,程序码:

```js
//...
on: {
  [COUNTER_EVENTS.DYNAMIC_INC]: {
    actions: ['dynamic_increment'],
  },
}
//...
actions: {
  dynamic_increment: assign({
    count: (context, event) => context.count + (event.value || 0)
    // event 除了 type 这个属性之外有什麽 property 是外部决定的
  }),
},
//...
//...
<Button
  label="Increment"
  onClick={() =>
    // 这裡传入 DYNAMIC_INC event 同时要给 value
    send({ type: COUNTER_EVENTS.DYNAMIC_INC, value: Number(value) })
  }
/>
//...

```

注意事项

- 永远不要从外部修改一个 machine 内的 context，任何改变 context 的行为都应该来自 event。
- 推荐使用 `assign({ ... })` 的写法，这个写法利于未来的工具做分析。
- 跟所有 actions 相同不建议 inline 写在 machine 裡面，建议定义在 machine options 的 actions 内。
- 理想上，context 应该是一个 JS 的 plain object，并且应该可以被序列化。
- 记得 `assign` 就只是 pure function 回传一个 action 物件，并直接对 machine 造成影响。
