> [原文地址](https://zhuanlan.zhihu.com/p/424967867)、[原文地址](https://zhuanlan.zhihu.com/p/439911498) TODO!

# 「React Fiber」 详细解析

距离 React Fiber 发布已经两年多的时间了，你有没有真的了解它呢？

React Fiber 是什么？官方的解释是 “**React Fiber 是对核心算法的一次重新实现”**。

使用 React 框架的开发者都知道，React 是靠数据驱动视图改变的一种框架，它的核心驱动方法就是用其提供的 setState 方法设置 state 中的数据从而驱动存放在内存中的虚拟 DOM 树的更新。

更新方法就是通过 React 的 Diff 算法比较旧虚拟 DOM 树和新虚拟 DOM 树之间的 Change ，然后批处理这些改变。

在 Fiber 诞生之前，React 处理一次 setState()（首次渲染）时会有两个阶段：

- **调度阶段（Reconciler）**：这个阶段 React 用新数据生成新的 Virtual DOM，遍历 Virtual DOM，然后通过 Diff 算法，快速找出需要更新的元素，放到更新队列中去。
- **渲染阶段（Renderer）**：这个阶段 React 根据所在的渲染环境，遍历更新队列，将对应元素更新。在浏览器中，就是更新对应的 DOM 元素。

表面上看，这种设计也是挺合理的，因为更新过程不会有任何 I/O 操作，完全是 CPU 计算，所以无需异步操作，执行到结束即可。

这个策略像函数调用栈一样，会深度优先遍历所有的 Virtual DOM 节点，进行 Diff 。它一定要等整棵 Virtual DOM 计算完成之后，才将任务出栈释放主线程。对于复杂组件，需要大量的 diff 计算，会严重影响到页面的交互性。

举个例子：

> 假设更新一个组件需要 1ms，如果有 200 个组件要更新，那就需要 200ms，在这 200ms 的更新过程中，浏览器唯一的主线程都在专心运行更新操作，无暇去做任何其他的事情。想象一下，在这 200ms 内，用户往一个 input 元素中输入点什么，敲击键盘也不会获得响应，因为渲染输入按键结果也是浏览器主线程的工作，但是浏览器主线程被 React 占用，抽不出空，最后的结果就是用户敲了按键看不到反应，等 React 更新过程结束之后，那些按键会一下出现在 input 元素里，这就是所谓的界面卡顿。

**React Fiber，就是为了解决渲染复杂组件时严重影响用户和浏览器交互的问题。**

## Fiber 产生的原因？

为了解决这个问题，react 推出了 Fiber，它能够将渲染工作分割成块并将其分散到多个帧中。同时加入了在新更新进入时暂停，中止或重复工作的能力和为不同类型的更新分配优先级的能力。

至于上面提到的为什么会影响到用户体验，这里需要简单介绍一下浏览器的工作模式：

因为浏览器的页面是一帧一帧绘制出来的，当每秒绘制的帧数（FPS）达到 60 时，页面是流畅的，小于这个值时，用户会感觉到卡顿，转换成时间就是 16ms 内如果当前帧内执行的任务没有完成，就会造成卡顿。

一帧中执行的工作主要以下图所示的任务执行顺序单线程依次执行。

如果其中一项任务执行的过久，导致总时长超过了 16ms，用户就会感觉到卡顿了

> 上面提到的调和阶段，就属于下图的 js 的执行阶段。如果调和时间过长导致了这一阶段执行时间过长，那么就有可能在用户有交互的时候，本来应该是渲染下一帧了，但是在当前一帧里还在执行 JS，就导致用户交互不能马上得到反馈，从而产生卡顿感。

![img](https://assets.ng-tech.icu/item/v2-700f19419e81d9e9518385ccf2a634fa_1440w.webp)

## Fiber 的设计思路

React 为了解决这个问题，根据浏览器的每一帧执行的特性，构思出了 Fiber 来将一次任务拆解成单元，以划分时间片的方式，按照 Fiber 的自己的调度方法，根据任务单元优先级，分批处理或吊起任务，将一次更新分散在多次时间片中，另外, 在浏览器空闲的时候, 也可以继续去执行未完成的任务, 充分利用浏览器每一帧的工作特性。

它的实现的调用栈示意图如下所示，一次更新任务是分时间片执行的，直至完成某次更新。

这样 React 更新任务就只能在规定时间内占用浏览器线程了, 如果说在这个时候用户有和浏览器的页面交互，浏览器也是可以及时获取到交互内容。

![img](https://assets.ng-tech.icu/item/v2-398077dda18dd8a2055dc21c442e39e6_1440w.webp)

## Fiber 具体都做了什么？

React 在 render 第一次渲染时，会通过 React.createElement 创建一颗 Element 树，可以称之为 **Virtual DOM Tree.** 同时也会基于 Virtual DOM Tree 构建一个“结构相同” **Fiber Tree。**

> Virtual DOM Tree 虚拟 DOM 树
> 虚拟 DOM 树的存在就是为了解决 js 直接操作真实 DOM 而引起的计算机计算能力的浪费。
> 因为通过 js 直接修改 DOM ，会引起整颗 DOM 树计算和改变，而虚拟 DOM 树的存在可以让真实 DOM 只改变必要改变的部分。

### 1、Fiber 的调度单元： Fiber Node

Fiber Node，是 Fiber Tree 的基本构成单元，也可以类比成 **Virtual DOM Tree** 的一个节点(实际比它的节点多了很多上下文信息)，也是 Fiber 中的一个工作单元。一个 Fiber Node 包含了如下内容

```js
{
  ...
  // 跟当前Fiber相关本地状态（比如浏览器环境就是DOM节点）
  stateNode: any,

    // 单链表树结构
  return: Fiber | null,// 指向他在Fiber节点树中的`parent`，用来在处理完这个节点之后向上返回
  child: Fiber | null,// 指向自己的第一个子节点
  sibling: Fiber | null,  // 指向自己的兄弟结构，兄弟节点的return指向同一个父节点

  // 更新相关
  pendingProps: any,  // 新的变动带来的新的props
  memoizedProps: any,  // 上一次渲染完成之后的props
  updateQueue: UpdateQueue<any> | null,  // 该Fiber对应的组件产生的Update会存放在这个队列里面
  memoizedState: any, // 上一次渲染的时候的state

  // Scheduler 相关
  expirationTime: ExpirationTime,  // 代表任务在未来的哪个时间点应该被完成，不包括他的子树产生的任务
  // 快速确定子树中是否有不在等待的变化
  childExpirationTime: ExpirationTime,

 // 在Fiber树更新的过程中，每个Fiber都会有一个跟其对应的Fiber
  // 我们称他为`current <==> workInProgress`
  // 在渲染完成之后他们会交换位置
  alternate: Fiber | null,

  // Effect 相关的
  effectTag: SideEffectTag, // 用来记录Side Effect
  nextEffect: Fiber | null, // 单链表用来快速查找下一个side effect
  firstEffect: Fiber | null,  // 子树中第一个side effect
  lastEffect: Fiber | null, // 子树中最后一个side effect
  ....
};
```

其中有几个属性需要重点关注：**return(父节点)、child(子节点)、sibling(兄弟节点)、stateNode（对应的 DOM 节点）**，**expirationTime (到期时间)、Effect (变更)。**

- return：向上链接整颗树
- child：向下链接整棵树
- sibling：横向链接整颗树
- stateNode：与 DOM 树相连
- expirationTime：计算节点更新的优先级
- Effect**：**记录节点的变更

通过节点上的 child（孩子）、return（父）和 sibling （兄弟）属性串联着其他节点，形成了一棵 Fiber Tree (类似 Virtual DOM tree)

Fiber Tree 是由 Fiber Node 构成的，更像是一个单链表构成的树，便于向上/向下/向兄弟节点转换

![img](https://assets.ng-tech.icu/item/v2-cfaea6c0e9362b3701b1cf342ed4588b_1440w.webp)

简单总结一下：

组件是 React 应用中的基础单元，应用以组件树形式组织，渲染组件；

Fiber 调和的基础单元则是 fiber（调和单元），应用与 Fiber Tree 形式组织，应用 Fiber 算法；

组件树和 fiber 树结构对应，一个组件实例有一个对应的 fiber 实例；

Fiber 负责整个应用层面的调和，fiber 实例负责对应组件的调和；

### 2、**规定调度顺序：expirationTime 到期时间**

每个 Fiber Node 都会有一个 ExpirationTime 到期时间来确定当前时间片下是否执行该节点的更新任务。

它是以任务什么时候该执行完为描述信息的，到期时间越短，则代表优先级越高。

> 在 React 中，为防止某个 update 因为优先级的原因一直被打断而未能执行。React 会设置一个 ExpirationTime，当时间到了 ExpirationTime 的时候，如果某个 update 还未执行的话，React 将会强制执行该 update，这就是 ExpirationTime 的作用。

每一次 update 之前，Fiber 都会根据当下的时间（通过 requestCurrentTime 获取到）和 更新的触发条件为每个入更新队列的 Fiber Node 计算当下的到期时间。

到期时间的计算有两种方式, 一种是对交互引起的更新做计算 computeInteractiveExpiration , 另一种对普通更新做计算 computeAsyncExpiration

```js
function computeExpirationForFiber(currentTime: ExpirationTime, fiber: Fiber) {
  let expirationTime;
    // ......
    if (fiber.mode & ConcurrentMode) {
      if (isBatchingInteractiveUpdates) {
        // 交互引起的更新
        expirationTime = computeInteractiveExpiration(currentTime);
      } else {
        // 普通异步更新
        expirationTime = computeAsyncExpiration(currentTime);
      }
    }
    // ......
  }
  // ......
  return expirationTime;
}
```

**computeInteractiveExpiration**

```js
export const HIGH_PRIORITY_EXPIRATION = __DEV__ ? 500 : 150;
export const HIGH_PRIORITY_BATCH_SIZE = 100;

export function computeInteractiveExpiration(currentTime: ExpirationTime) {
  return computeExpirationBucket(
    currentTime,
    HIGH_PRIORITY_EXPIRATION, //150
    HIGH_PRIORITY_BATCH_SIZE //100
  );
}
```

**computeAsyncExpiration**

```js
export const LOW_PRIORITY_EXPIRATION = 5000;
export const LOW_PRIORITY_BATCH_SIZE = 250;

export function computeAsyncExpiration(
  currentTime: ExpirationTime
): ExpirationTime {
  return computeExpirationBucket(
    currentTime,
    LOW_PRIORITY_EXPIRATION, //5000
    LOW_PRIORITY_BATCH_SIZE //250
  );
}
```

查看上面两种方法，我们发现其实他们调用的是同一个方法：computeExpirationBucket，只是传入的参数不一样，而且传入的是常量。computeInteractiveExpiration 传入的是 150、100，computeAsyncExpiration 传入的是 5000、250。说明前者的优先级更高。那么我把前者称为高优先级更新（交互引起），后者称为低优先级更新（其他更新）。

**computeExpirationBucket**

```js
const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = 2;

function ceiling(num: number, precision: number): number {
  return (((num / precision) | 0) + 1) * precision;
}

function computeExpirationBucket(
  currentTime,
  expirationInMs,
  bucketSizeMs
): ExpirationTime {
  return (
    MAGIC_NUMBER_OFFSET +
    ceiling(
      currentTime - MAGIC_NUMBER_OFFSET + expirationInMs / UNIT_SIZE,
      bucketSizeMs / UNIT_SIZE
    )
  );
}
```

最终的公式是：((((currentTime - 2 + 5000 / 10) / 25) | 0) + 1) \* 25

其中只有只有 currentTime 是变量, currentTime 是通过浏览提供的 API（requestCurrentTime）获取的当前时间。

简单来说，以低优先级来说, 最终结果是以 25 为单位向上增加的，比如说我们输入 102 - 126 之间，最终得到的结果都是 625，但是到了 127 得到的结果就是 650 了，这就是除以 25 取整的效果。
即，低优先级更新的 expirationTime 间隔是 25ms，抹平了 25ms 内计算过期时间的误差，React 让两个相近（25ms 内）的得到 update 相同的 expirationTime ，目的就是让这两个 update 自动合并成一个 Update ，从而达到批量更新。

高优先级是 10ms 的误差.

也就是说 expirationTime 的计算是将一个时间段内的所有**任务都统一成一个 expirationTime** ，并且允许一定误差的存在。

随着时间的流逝，一个更新的优先级会越来越高，这样就可以避免 **starvation** 问题（即低优先级的工作一直被高优先级的工作打断，而无法完成）。

> 另外，之前存在过一个 PriorityLevel 的优先级评估变量，但在 16.x 中使用的是 expirationTime 来评估，但为了兼容仍然会考虑 PriorityLevel 来计算 expirationTime。

### 3、workInProgress Tree ： 保存更新进度快照

workInProgress Tree 保存当先更新中的进度快照，用于下一个时间片的断点恢复, 跟 Fiber Tree 的构成几乎一样, 在一次更新的开始时跟 Fiber Tree 是一样的.

### 4、Fiber Tree 和 WorkInProgress tree 的关系

在首次渲染的过程中，React 通过 react-dom 中提供的方法创建组件和与组件相应的 Fiber (Tree) ，此后就不会再生成新树，运行时永远维护这一棵树，调度和更新的计算完成后 Fiber Tree 会根据 effect 去实现更新。

而 workInProgress Tree 在每一次刷新工作栈（prepareFreshStack ）时候都会重新根据当前的 fiber tree 构建一次。

这两棵树构成了双缓冲树, 以 fiber tree 为主，workInProgress tree 为辅。

双缓冲具体指的是 workInProgress tree 构造完毕，得到的就是新的 fiber tree ，每个 fiber 上都有个 alternate 属性，也指向一个 fiber ，创建 workInProgress 节点时优先取 alternate ，没有的话就创建一个。

fiber 与 workInProgress 互相持有引用，把 current 指针指向 workInProgress tree ，丢掉旧的 fiber tree 。旧 fiber 就作为新 fiber 更新的预留空间，达到复用 fiber 实例的目的。

![img](https://assets.ng-tech.icu/item/v2-dcc6a08b49d8ae2ab47e01b600d4586d_1440w.webp)

一次更新的操作都是在 workInProgress Tree 上完成的，当更新完成后再用 workInProgress Tree 替换掉原有的 Fiber Tree ；

这样做的好处：

1. 能够复用内部对象（fiber）
2. 节省内存分配、GC 的时间开销
3. 就算运行中有错误，也不会影响 View 上的数据

### 5、更新

**怎么触发的更新**

- this.setState();
- props 的改变（因为 props 改变也是由父组件的 setState 引起的，其实也是第一种）;
- this.forceUpdate();

**触发更新后 Fiber 做了什么**

首先, 当前是哪个组件触发的更新, React 是知道的( this 指向), 于是 React 会针对**当前组件**计算其相应的到期时间(上面提到了[计算方法](https://link.zhihu.com/?target=https%3A//km.sankuai.com/page/156013163%23id-%E8%A7%84%E5%AE%9A%E8%B0%83%E5%BA%A6%E9%A1%BA%E5%BA%8F---expirationTime%E5%88%B0%E6%9C%9F%E6%97%B6%E9%97%B4)), 并且基于这个到期时间, 创建一个**更新 update ,** 将引起改变的 payload (比如说 state/props ), 作为此次更新的一个属性, 并插入当前组件对应的 Fiber Node 的更新队列（它是一个单向链表数据结构。只要有 setState 或者其他方式触发了更新，就会在 fiber 上的 updateQueue 里插入一个 update，这样在更新的时候就可以合并一起更新。）中, 之后开始调度任务。

整个调度的过程是计算并重新构建 workInProgress Tree 的过程，在 workInProgress Tree 和原有 Fiber Tree 对比的时候记录下 Diff，标记对应的 Effect，完成之后会生成一个 Effect List，这个 Effect List 就是最终 Commit 阶段用来处理副作用的阶段，如果在这个过程中有了交互事件等高优先级的任务进来，那么 fiber 会终止当前任务，执行更紧急的任务，但为了避免 “饥饿现象”，上一个吊起的任务的优先级会被相应的提升。

```js
let workInProgress = current.alternate;
if (workInProgress === null) {
  //...这里很有意思
  workInProgress.alternate = current;
  current.alternate = workInProgress;
} else {
  // We already have an alternate.
  // Reset the effect tag.
  workInProgress.effectTag = NoEffect;

  // The effect list is no longer valid.
  workInProgress.nextEffect = null;
  workInProgress.firstEffect = null;
  workInProgress.lastEffect = null;
}
```

### 6、effect

每一个 Fiber Node 都有与之相关的 effect ，effect 是用于记录由于 state 和 props 改变引起的工作类型，对于不同类型的 Fiber Node 有不同的改变类型，比如对 DOM 元素，工作包括添加，更新或删除元素。对于 class 组件，React 可能需要更新 ref 并调用 componentDidMount 和 componentDidUpdate 生命周期方法。

每个 Fiber Node 都有个 nextEffect 用来快速查找下一个改变 effect，他使得更新的修改能够快速遍历整颗树，跳过没有更改的 Fiber Node。

例如，我们的更新导致 c2 被插入到 DOM 中，d2 和 c1 被用于更改属性，而 b2 被用于触发生命周期方法。副作用列表会将它们链接在一起，以便 React 稍后可以跳过其他节点。

![img](https://assets.ng-tech.icu/item/v2-69ce531374f9268ff0a53418ca28697b_1440w.webp)

可以看到具有副作用的节点是如何链接在一起的。当遍历节点时，React 使用 Fiber Node 的 firstEffect 指针来确定列表的开始位置。所以上面的图表可以表示为这样的线性列表：

![img](https://assets.ng-tech.icu/item/v2-52d6e669d39a5bd512cf13626f9a9ea9_1440w.webp)

### 7、**获取浏览器的控制权 --- requestIdleCallback 和 requestAnimationFrame**

构建出 Effect List 就已经完成了一次更新的前半部分工作调和，在这个过程中，React 通过浏览器提供的 Api 来开始于暂停其中的调和任务。

requestIdleCallback(callback) 这是浏览器提供的 API ，他在 window 对象上，作为参数写给这个函数的回调函数，将会在浏览器空闲的时候执行。回调函数会有一个 deadline 参数，deadline.timeRemaining() 会告诉外界，当前时间片还有多少时间。利用这个 API ，结合 Fiber 拆分好的工作单元，在合适的时机来安排工作。

![img](https://assets.ng-tech.icu/item/v2-8b91d684daf36ece04a2edf2761741cf_1440w.webp)

不过这个 API 只负责低优先的级的任务处理，而高优先级的（比如动画相关）则通过 requestAnimationFrame 来控制 。

如果浏览器支持这两个 API 就直接使用，如果不支持就要重新定义了，如果没有自行定义的[https://juejin.im/post/5a2276d5518825619a027f57](https://link.zhihu.com/?target=https%3A//juejin.im/post/5a2276d5518825619a027f57)

### 8、调度器（Scheduler）

1. 调和器主要作用就是在组件状态变更时，调用组件树各组件的 render 方法，渲染，卸载组件，而 Fiber 使得应用可以更好的协调不同任务的执行，调和器内关于高效协调的实现，我们可以称它为调度器（Scheduler）。
   Fiber 中的调度器主要的关注点是：

2. 1. 合并多次更新：没有必要在组件的每一个状态变更时都立即触发更新任务，有些中间状态变更其实是对更新任务所耗费资源的浪费，就比如用户发现错误点击时快速操作导致组件某状态从 A 至 B 再至 C，这中间的 B 状态变更其实对于用户而言并没有意义，那么我们可以直接合并状态变更，直接从 A 至 C 只触发一次更新；
   2. 任务优先级：不同类型的更新有不同优先级，例如用户操作引起的交互动画可能需要有更好的体验，其优先级应该比完成数据更新高；
   3. 推拉式调度：基于推送的调度方式更多的需要开发者编码间接决定如何调度任务，而拉取式调度更方便 React 框架层直接进行全局自主调度；

调度的实现逻辑主要是

1. 1. 通过 fiber.return 属性，从当前 fiber 实例层层遍历至组件树根组件；
   2. 依次对每一个 fiber 实例进行到期时间判断，若大于传入的期望任务到期时间参数，则将其更新为传入的任务到期时间；
   3. 调用 requestWork 方法开始处理任务，并传入获取的组件树根组件 FiberRoot 对象和任务到期时间；

## Fiber 执行流程

![img](https://assets.ng-tech.icu/item/v2-9fcf2cfa698301ce7bc78bc3857904ed_1440w.webp)

Fiber 总的来说可以分成两个部分，一个是调和过程（可中断），一个是提交过程（不可中断）。

在调和过程中以 fiber tree 为基础，把每个 fiber 作为一个工作单元，自顶向下逐节点构造 workInProgress tree（构建中的新 fiber tree ）

具体过程如下：

![img](https://assets.ng-tech.icu/item/v2-8c3b88ee7471ba1303c4460967da36fa_1440w.webp)

通过每个节点更新结束时向上归并 effect list 来收集任务结果，reconciliation 结束后，根节点的 effect list 里记录了包括 DOM change 在内的所有 side effect

所以，构建 workInProgress tree 的过程就是 diff 的过程，通过 requestIdleCallback 来调度执行一组任务，每完成一个任务后回来看看有没有插队的（更紧急的），每完成一组任务，把时间控制权交还给主线程，直到下一次 requestIdleCallback 回调再继续构建 workInProgress tree

而提交过程阶段是一口气直接做完（同步执行），不被控制和中止，这个阶段的实际工作量是比较大的，所以尽量不要在后 3 个生命周期函数里干重活儿

1. 处理 effect list（包括 3 种处理：更新 DOM 树、调用组件生命周期函数以及更新 ref 等内部状态）
2. 该阶段结束时，所有更新都 commit 到 DOM 树上了。

DEMO 对比：

- - 未使用 Fiber 的例子： [https://claudiopro.github.io/react-fiber-vs-stack-demo/stack.html](https://link.zhihu.com/?target=https%3A//claudiopro.github.io/react-fiber-vs-stack-demo/stack.html)
  - 使用 Fiber 的例子：[https://claudiopro.github.io/re

## Fiber 为什么是 React 性能的一个飞跃？

### 什么是 Fiber

Fiber 的英文含义是“纤维”，它是比线程（Thread）更细的线，比线程（Thread）控制得更精密的执行模型。在广义计算机科学概念中，Fiber 又是一种协作的（Cooperative）编程模型（协程），帮助开发者用一种【既模块化又协作化】的方式来编排代码。

在 React 中，**Fiber 就是 React 16 实现的一套新的更新机制，让 React 的更新过程变得可控，避免了之前采用递归需要一气呵成影响性能的做法**。

### React Fiber 中的时间分片

把一个**耗时长的任务分成很多小片**，每一个小片的运行时间很短，虽然总时间依然很长，但是在每个小片执行完之后，都**给其他任务一个执行的机会**，这样唯一的线程就不会被独占，其他任务依然有运行的机会。

React Fiber 把更新过程**碎片化**，每执行完一段更新过程，就把控制权交还给 React 负责任务协调的模块，看看有没有其他紧急任务要做，如果没有就继续去更新，如果有紧急任务，那就去做紧急任务。

### Stack Reconciler

基于栈的 Reconciler，浏览器引擎会从执行栈的顶端开始执行，执行完毕就弹出当前执行上下文，开始执行下一个函数，**直到执行栈被清空才会停止**。然后将执行权交还给浏览器。由于 React 将页面视图视作一个个函数执行的结果。每一个页面往往由多个视图组成，这就意味着多个函数的调用。

如果一个页面足够复杂，形成的函数调用栈就会很深。每一次更新，执行栈需要一次性执行完成，中途不能干其他的事儿，只能"**一心一意**"。结合前面提到的浏览器刷新率，JS 一直执行，浏览器得不到控制权，就不能及时开始下一帧的绘制。如果这个时间超过 16ms，当页面有动画效果需求时，动画因为浏览器**不能及时绘制下一帧**，这时动画就会出现卡顿。不仅如此，因为事件响应代码是在每一帧开始的时候执行，如果不能及时绘制下一帧，事件响应也会延迟。

### Fiber Reconciler

### 链表结构

在 React Fiber 中**用链表遍历的方式替代了 React 16 之前的栈递归方案**。在 React 16 中使用了大量的链表。

- 使用多向链表的形式替代了原来的树结构；

```html
<div id="A">
  A1
  <div id="B1">
    B1
    <div id="C1"></div>
  </div>
  <div id="B2">B2</div>
</div>
```

![img](https://assets.ng-tech.icu/item/v2-b520d0b65d9149c351a9b01698d79beb_1440w.webp)

- 副作用单链表；

![img](https://assets.ng-tech.icu/item/v2-b411c7ecbdc65d40107fc92f929e977b_1440w.webp)

- 状态更新单链表；

![img](https://assets.ng-tech.icu/item/v2-2621b96819af8c5d66ac668ad22ab9a9_1440w.webp)

- ...

链表是一种简单高效的数据结构，它在当前节点中保存着指向下一个节点的指针；遍历的时候，通过操作指针找到下一个元素。

![img](https://assets.ng-tech.icu/item/v2-f091ecbc95c48b20b050d55a14497c33_1440w.webp)

链表相比顺序结构数据格式的**好处**就是：

1. 操作更高效，比如顺序调整、删除，只需要改变节点的指针指向就好了。
2. 不仅可以根据当前节点找到下一个节点，在多向链表中，还可以找到他的父节点或者兄弟节点。

但链表也不是完美的，**缺点**就是：

1. 比顺序结构数据更占用空间，因为每个节点对象还保存有指向下一个对象的指针。
2. 不能自由读取，必须找到他的上一个节点。

React 用**空间换时间**，更高效的操作可以方便根据优先级进行操作。同时**可以根据当前节点找到其他节点，在下面提到的挂起和恢复过程中起到了关键作用**。

### 斐波那契数列的 Fiber

递归形式的斐波那契数列写法：

```js
function fib(n) {
  if (n <= 2) {
    return 1;
  } else {
    return fib(n - 1) + fib(n - 2);
  }
}
```

采用 **Fiber 的思路**将其改写为循环（这个例子并不能和 React Fiber 的对等）：

```js
function fib(n) {
  let fiber = { arg: n, returnAddr: null, a: 0 },
    consoled = false;

  // 标记循环
  rec: while (true) {
    // 当展开完全后，开始计算
    if (fiber.arg <= 2) {
      let sum = 1;
      // 寻找父级
      while (fiber.returnAddr) {
        if (!consoled) {
          // 在这里打印查看形成的链表形式的 fiber 对象
          consoled = true;
          console.log(fiber);
        }
        fiber = fiber.returnAddr;
        if (fiber.a === 0) {
          fiber.a = sum;
          fiber = { arg: fiber.arg - 2, returnAddr: fiber, a: 0 };
          continue rec;
        }
        sum += fiber.a;
      }
      return sum;
    } else {
      // 先展开
      fiber = { arg: fiber.arg - 1, returnAddr: fiber, a: 0 };
    }
  }
}
```

## React Fiber 是如何实现更新过程可控？

更新过程的可控主要体现在下面几个方面：

- 任务拆分
- 任务挂起、恢复、终止
- 任务具备优先级

### 任务拆分

在 React Fiber 机制中，它采用"**化整为零**"的思想，将调和阶段（Reconciler）递归遍历 VDOM 这个大任务分成若干小任务，每个任务只负责**一个节点**的处理。

### 任务挂起、恢复、终止

### workInProgress tree

workInProgress 代表**当前正在执行更新的 Fiber 树**。在 render 或者 setState 后，会构建一颗 Fiber 树，也就是 workInProgress tree，这棵树在构建每一个节点的时候会**收集当前节点的副作用**，整棵树构建完成后，会形成一条完整的**副作用链**。

### currentFiber tree

currentFiber 表示**上次渲染构建的 Filber 树**。**在每一次更新完成后 workInProgress 会赋值给 currentFiber**。在新一轮更新时 workInProgress tree 再重新构建，新 workInProgress 的节点通过 alternate 属性和 currentFiber 的节点建立联系。

在新 workInProgress tree 的创建过程中，会同 currentFiber 的对应节点进行 Diff 比较，收集副作用。同时也会**复用**和 currentFiber 对应的节点对象，减少新创建对象带来的开销。也就是说**无论是创建还是更新、挂起、恢复以及终止操作都是发生在 workInProgress tree 创建过程中的**。workInProgress tree 构建过程其实就是循环的执行任务和创建下一个任务。

### 挂起

当第一个小任务完成后，先判断这一帧是否还有**空闲时间**，没有就挂起下一个任务的执行，**记住**当前挂起的节点，让出控制权给浏览器执行更高优先级的任务。

### 恢复

在浏览器渲染完一帧后，判断当前帧是否有**剩余时间**，如果有就恢复执行之前挂起的任务。如果没有任务需要处理，代表调和阶段完成，可以开始进入渲染阶段。

如何判断一帧是否有空闲时间的呢？

使用前面提到的 RIC (RequestIdleCallback) 浏览器原生 API，React 源码中为了兼容低版本的浏览器，对该方法进行了 Polyfill。

恢复执行的时候又是如何知道下一个任务是什么呢？

是在前面提到的**链表**。在 React Fiber 中每个任务其实就是在处理一个 FiberNode 对象，然后又生成下一个任务需要处理的 FiberNode。

### 终止

其实并不是每次更新都会走到提交阶段。当在调和过程中触发了新的更新，在执行下一个任务的时候，判断**是否有优先级更高的执行任务**，如果有就终止原来将要执行的任务，开始新的 workInProgressFiber 树构建过程，开始新的更新流程。这样可以避免重复更新操作。这也是**在 React 16 以后生命周期函数 componentWillMount 有可能会执行多次**的原因。

![img](https://assets.ng-tech.icu/item/v2-61d21ff26edd0c49ed969cac6a9f5a93_1440w.webp)

### 任务具备优先级

React Fiber 除了通过挂起，恢复和终止来控制更新外，还给每个任务分配了优先级。具体点就是在创建或者更新 FiberNode 的时候，通过算法给每个任务分配一个到期时间（**expirationTime**）。在每个任务执行的时候除了判断剩余时间，如果当前处理节点已经过期，那么无论现在是否有空闲时间都必须执行该任务。**过期时间的大小还代表着任务的优先级**。

**任务在执行过程中顺便收集了每个 FiberNode 的副作用**，将有副作用的节点通过 firstEffect、lastEffect、nextEffect 形成一条副作用单链表 `A1(TEXT)-B1(TEXT)-C1(TEXT)-C1-C2(TEXT)-C2-B1-B2(TEXT)-B2-A`。

其实**最终都是为了收集到这条副作用链表，有了它，在接下来的渲染阶段就通过遍历副作用链完成 DOM 更新**。这里需要注意，**更新真实 DOM 的这个动作是一气呵成的**，不能中断，不然会造成视觉上的不连贯（commit）。

```html
<div id="A1">
  A1
  <div id="B1">
    B1
    <div id="C1">C1</div>
    <div id="C2">C2</div>
  </div>
  <div id="B2">B2</div>
</div>
```

![img](https://assets.ng-tech.icu/item/v2-45a9e181175c358339a0124b88d5ca59_1440w.webp)

### 直观展示

正是基于以上这些过程，使用 Fiber，我们就有了在社区经常看到的[两张对比图](https://link.zhihu.com/?target=https%3A//link.segmentfault.com/%3Fenc%3D76jmA9HJDnS4akh4JaqSqw%3D%3D.LuFE7VzoBqJqJK5ywxrdlubXzRgj6TGqH5UetvbHijpbb13makMvG0o1t5WY27niPurw3i8iW%2FEYroNZnOT%2Bdw%3D%3D)。

![动图封面](https://assets.ng-tech.icu/item/v2-6d3e3d4bbf86c494dfb293b6d9ae4321_b.jpg)

![动图封面](https://assets.ng-tech.icu/item/v2-dd52d924d7c7431c061fde2f4135854b_b.jpg)

清晰展示及交互、源码可通过下面两个链接进入，查看网页源代码。

- [Stack Example](https://link.zhihu.com/?target=https%3A//link.segmentfault.com/%3Fenc%3DzpcqjyAZz1tpt88CKyVqqA%3D%3D.gzNUmA688u%2Bm2xYbjTlDxamSnl7hOwKwb4yJUBUrGTdtIS%2B0s8Oz%2B16e1mzoWUPCxvYAmJxnBQLzvTK3lvgP%2FEt3LEmB3cve3G6ko9ObtFE%3D)
- [Fiber Example](https://link.zhihu.com/?target=https%3A//link.segmentfault.com/%3Fenc%3DxXmERgV%2FrJMXXvMZRTOLeA%3D%3D.IMxKYfRNZDqDsZRkTTXDBWpe4h%2FTMFb2c1ua5fahkGj6on2VBDucTyIOBVYBn3s2wYExsgADJ%2FUt2j0lIkMab43f39mZjYHdvlvlTUVdoM0%3D)

### Fiber 结构长什么样？

基于时间分片的增量更新需要**更多的上下文信息**，之前的 vDOM tree 显然难以满足，所以扩展出了 fiber tree（即 Fiber 上下文的 vDOM tree），更新过程就是根据输入数据以及现有的 fiber tree 构造出新的 fiber tree（workInProgress tree）。

FiberNode 上的属性有很多，根据笔者的理解，以下这么几个属性是值得关注的：return、child、sibling（主要负责 fiber 链表的链接）；stateNode；effectTag；expirationTime；alternate；nextEffect。各属性介绍参看下面的`class FiberNode`：

```js
class FiberNode {
  constructor(tag, pendingProps, key, mode) {
    // 实例属性
    this.tag = tag; // 标记不同组件类型，如函数组件、类组件、文本、原生组件...
    this.key = key; // react 元素上的 key 就是 jsx 上写的那个 key ，也就是最终 ReactElement 上的
    this.elementType = null; // createElement的第一个参数，ReactElement 上的 type
    this.type = null; // 表示fiber的真实类型 ，elementType 基本一样，在使用了懒加载之类的功能时可能会不一样
    this.stateNode = null; // 实例对象，比如 class 组件 new 完后就挂载在这个属性上面，如果是RootFiber，那么它上面挂的是 FiberRoot,如果是原生节点就是 dom 对象
    // fiber
    this.return = null; // 父节点，指向上一个 fiber
    this.child = null; // 子节点，指向自身下面的第一个 fiber
    this.sibling = null; // 兄弟组件, 指向一个兄弟节点
    this.index = 0; //  一般如果没有兄弟节点的话是0 当某个父节点下的子节点是数组类型的时候会给每个子节点一个 index，index 和 key 要一起做 diff
    this.ref = null; // reactElement 上的 ref 属性
    this.pendingProps = pendingProps; // 新的 props
    this.memoizedProps = null; // 旧的 props
    this.updateQueue = null; // fiber 上的更新队列执行一次 setState 就会往这个属性上挂一个新的更新, 每条更新最终会形成一个链表结构，最后做批量更新
    this.memoizedState = null; // 对应  memoizedProps，上次渲染的 state，相当于当前的 state，理解成 prev 和 next 的关系
    this.mode = mode; // 表示当前组件下的子组件的渲染方式
    // effects
    this.effectTag = NoEffect; // 表示当前 fiber 要进行何种更新（更新、删除等）
    this.nextEffect = null; // 指向下个需要更新的fiber
    this.firstEffect = null; // 指向所有子节点里，需要更新的 fiber 里的第一个
    this.lastEffect = null; // 指向所有子节点中需要更新的 fiber 的最后一个
    this.expirationTime = NoWork; // 过期时间，代表任务在未来的哪个时间点应该被完成
    this.childExpirationTime = NoWork; // child 过期时间
    this.alternate = null; // current 树和 workInprogress 树之间的相互引用
  }
}
```

![img](https://assets.ng-tech.icu/item/v2-80536897c9c006a20f2c9255a2a5e8b6_1440w.webp)

> 图片来源：[完全理解 React Fiber](https://link.zhihu.com/?target=https%3A//link.segmentfault.com/%3Fenc%3DJ6qPJJLhXgk%2FlqmrRndrew%3D%3D.JhzybPqTzKUeWsc%2F5VjTfVDNgkI%2BmkcF2gw72%2BRySRwaAPtVrPjMHzOdM5f1IsLZ)

```js
function performUnitWork(currentFiber) {
  //beginWork(currentFiber) //找到儿子，并通过链表的方式挂到currentFiber上，没有儿子就找后面那个兄弟
  //有儿子就返回儿子
  if (currentFiber.child) {
    return currentFiber.child;
  }
  //如果没有儿子，则找弟弟
  while (currentFiber) {
    //一直往上找
    //completeUnitWork(currentFiber);//将自己的副作用挂到父节点去
    if (currentFiber.sibling) {
      return currentFiber.sibling;
    }
    currentFiber = currentFiber.return;
  }
}
```

### Concurrent Mode （并发模式）

Concurrent Mode 指的就是 React 利用上面 Fiber 带来的新特性开启的新模式 (mode)。react17 开始支持 concurrent mode，这种模式的根本目的是为了**让应用保持 cpu 和 io 的快速响应**，它是一组新功能，**包括 Fiber、Scheduler、Lane**，可以根据用户硬件性能和网络状况调整应用的响应速度，核心就是为了**实现异步可中断的更新**。concurrent mode 也是未来 react 主要迭代的方向。

目前 React 实验版本允许用户选择三种 mode：

1. Legacy Mode: 就相当于目前稳定版的模式
2. Blocking Mode: 应该是以后会代替 Legacy Mode 而长期存在的模式
3. Concurrent Mode: 以后会变成 default 的模式

Concurrent Mode 其实开启了一堆新特性，其中有两个最重要的特性可以用来解决我们开头提到的两个问题：

1. [Suspense](https://link.zhihu.com/?target=https%3A//link.segmentfault.com/%3Fenc%3DaU7%2FtNBChDWMnwein7oWOg%3D%3D.ztkRkIqDxdwJfR4SyBbUz23JkkZr1Vei7pq3WGiC5maYIsneQwdEb4mCq%2FKISD4G)：Suspense 是 React 提供的一种**异步处理的机制**, 它不是一个具体的数据请求库。它是 React 提供的原生的组件异步调用原语。
2. [useTrasition](https://link.zhihu.com/?target=https%3A//link.segmentfault.com/%3Fenc%3DRbL21xHWKgEDDyx3jWed8Q%3D%3D.8aqbm2Qpz6rip75nCaEMqZNZpefrWKIoCESkQx8S1zOuPnKVdWENgwbbXaW09qxU)：让页面实现 `Pending -> Skeleton -> Complete` 的更新路径, 用户在切换页面时可以停留在当前页面，让页面保持响应。相比展示一个无用的空白页面或者加载状态，这种**用户体验**更加友好。

其中 Suspense 可以用来解决请求阻塞的问题，UI 卡顿的问题其实开启 concurrent mode 就已经解决的，但如何利用 concurrent mode 来实现更友好的交互还是需要对代码做一番改动的。
