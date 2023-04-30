# Invoking Services

在一台状态机中表达整个应用的行为会很快变得复杂而笨重。很自然地使用多台状态机相互通信来代替表达复杂的逻辑。这与 Actor 模型非常相似，其中每个状态机实例被视为一个 Actor，可以向其他 Actor（如 Promise 或其他状态机）发送和接收事件（消息），并对它们做出反应。

对于状态机之间的通信，父状态机调用子状态机，并通过 sendParent(...)监听子状态机发送的事件，或者等待子状态机达到最终状态，然后将引起 onDone 过渡。我们可以调用如下类型：

- Promises：将在 resolve 时采用 onDone 转换，或在 reject 时采用 onError 转换。
- Callbacks：可以向父机发送事件和从父机接收事件。
- Observables：可以向父机发送事件，以及完成后的信号。
- Machines：它还可以发送/接收事件，并在达到最终状态时通知父机。

## invoke 属性

在状态节点的配置中，用 invoke 属性定义了一个调用，其值是一个包含的对象。

- src：需要被调用的服务源，可以是状态机、Promise、回调函数、Observable 等
- id：被调用服务的唯一标识
- onDone：在子状态机达到终态，或者 Promise/Observable 结束时
- onError：当被调用的服务触发异常时
- autoForward：自动转发传入到该状态机的事件到其他状态机

# Invoking Promises

由于每个 Promise 都可以被建模为一个状态机，XState 可以按原样调用 Promise。Promise 可以是：

- resolve()：触发 onDone 回调
- reject()：触发 onError 回调

如果被调用的 Promise 处于活动状态，在 Promise 落定之前退出，Promise 的结果就会被丢弃。

```js
// Function that returns a promise
// This promise might resolve with, e.g.,
// { name: 'David', location: 'Florida' }
const fetchUser = (userId) =>
  fetch(`url/to/user/${userId}`).then((response) => response.json());

const userMachine = Machine({
  id: "user",
  initial: "idle",
  context: {
    userId: 42,
    user: undefined,
    error: undefined,
  },
  states: {
    idle: {
      on: {
        FETCH: "loading",
      },
    },
    loading: {
      invoke: {
        id: "getUser",
        src: (context, event) => fetchUser(context.userId),
        onDone: {
          target: "success",
          actions: assign({ user: (context, event) => event.data }),
        },
        onError: {
          target: "failure",
          actions: assign({ error: (context, event) => event.data }),
        },
      },
    },
    success: {},
    failure: {
      on: {
        RETRY: "loading",
      },
    },
  },
});
```

已解析的数据被放置到'done.invoke.<id>'事件中，在数据属性下，例如：。

```json
{
  "type": "done.invoke.getUser",
  "data": {
    "name": "David",
    "location": "Florida"
  }
}
```

## Promise Rejection

如果一个 Promise 拒绝，onError 过渡将采取 `{ type: 'error.platform' }` 事件。错误数据可以在事件的 data 属性上获得。

```js
const search = (context, event) => new Promise((resolve, reject) => {
  if (!event.query.length) {
    return reject('No query specified');
    // or:
    // throw new Error('No query specified');
  }

  return getSearchResults(event.query);
});

// ...
const searchMachine = Machine({
  id: 'search',
  initial: 'idle',
  context: {
    results: undefined,
    errorMessage: undefined,
  },
  states: {
    idle: {
      on: { SEARCH: 'searching' }
    },
    searching: {
      invoke: {
        id: 'search'
        src: search,
        onError: {
          target: 'failure',
          actions: assign({
            errorMessage: (context, event) => {
              // event is:
              // { type: 'error.platform', data: 'No query specified' }
              return event.data;
            }
          })
        },
        onDone: {
          target: 'success',
          actions: assign({ results: (_, event) => event.data })
        }
      }
    },
    success: {},
    failure: {}
  }
});
```

# Invoking Callbacks

发送到父机的事件流可以通过回调处理，这是一个接收两个参数的函数：

```js
// ...
counting: {
  invoke: {
    id: 'incInterval',
    src: (context, event) => (callback, onReceive) => {
      // This will send the 'INC' event to the parent every second
      const id = setInterval(() => callback('INC'), 1000);

      // Perform cleanup
      return () => clearInterval(id);
    }
  },
  on: {
    INC: { actions: assign({ counter: context => context.counter + 1 }) }
  }
}
// ...
```

# Invoking Machines

不同的状态机之间可以按层级调用：

- 父向子可以通过 `send(EVENT, { to: 'someChildId' })`
- 子向父可以通过 `sendParent(EVENT)`

如果退出了状态机被调用的状态，状态机就会停止。

```js
import { Machine, interpret, send, sendParent } from "xstate";

// Invoked child machine
const minuteMachine = Machine({
  id: "timer",
  initial: "active",
  states: {
    active: {
      after: {
        60000: "finished",
      },
    },
    finished: { type: "final" },
  },
});

const parentMachine = Machine({
  id: "parent",
  initial: "pending",
  states: {
    pending: {
      invoke: {
        src: minuteMachine,
        // The onDone transition will be taken when the
        // minuteMachine has reached its top-level final state.
        onDone: "timesUp",
      },
    },
    timesUp: {
      type: "final",
    },
  },
});

const service = interpret(parentMachine)
  .onTransition((state) => console.log(state.value))
  .start();
// => 'pending'
// ... after 1 minute
// => 'timesUp'
```

## Invoking with Context

子机可以使用从父机的上下文衍生出的带有数据属性的上下文被调用。例如，下面的 parentMachine 将调用一个新的 timerMachine 服务，初始上下文为 `{ duration: 3000 }`:

```js
const timerMachine = Machine({
  id: "timer",
  context: {
    duration: 1000, // default duration
  },
  /* ... */
});

const parentMachine = Machine({
  id: "parent",
  initial: "active",
  context: {
    customDuration: 3000,
  },
  states: {
    active: {
      invoke: {
        id: "timer",
        src: timerMachine,
        // Deriving child context from parent context
        data: {
          duration: (context, event) => context.customDuration,
        },
      },
    },
  },
});
```

就像 assign(...) 一样，子上下文可以被映射为一个对象（首选）或一个函数。

```js
// Object (per-property):
data: {
  duration: (context, event) => context.customDuration,
  foo: (context, event) => event.value,
  bar: 'static value'
}

// Function (aggregate), equivalent to above:
data: (context, event) => ({
  duration: context.customDuration,
  foo: event.value,
  bar: 'static value'
})
```
