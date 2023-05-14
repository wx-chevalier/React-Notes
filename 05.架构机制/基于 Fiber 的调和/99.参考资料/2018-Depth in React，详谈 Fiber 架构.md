> [原文地址](http://taoweng.site)

# Depth in React，详谈 Fiber 架构

## 前言

2016 年都已经透露出来的概念，这都 9102 年了，我才开始写 Fiber 的文章，表示惭愧呀。不过现在好的是关于 Fiber 的资料已经很丰富了，在写文章的时候参考资料比较多，比较容易深刻的理解。

React 作为我最喜欢的框架，没有之一，我愿意花很多时间来好好的学习他，我发现对于学习一门框架会有四种感受，刚开始没使用过，可能有一种很神奇的感觉；然后接触了，遇到了不熟悉的语法，感觉这是什么垃圾东西，这不是反人类么；然后当你熟悉了之后，真香，设计得挺好的，这个时候它已经改变了你编程的思维方式了；再到后来，看过他的源码，理解他的设计之后，设计得确实好，感觉自己也能写一个的样子。

所以我**今年**(对，没错，就是一年)就是想完全的学透 React，所以开了一个 **Deep In React** 的系列，把一些新手在使用 API 的时候不知道为什么的点，以及一些为什么有些东西要这么设计写出来，与大家共同探讨 React 的奥秘。

我的思路是自上而下的介绍，先理解整体的 Fiber 架构，然后再细挖每一个点，所以这篇文章主要是谈 Fiber 架构的。

## 介绍

在详细介绍 Fiber 之前，先了解一下 Fiber 是什么，以及为什么 React 团队要话两年时间重构协调算法。

### React 的核心思想

**内存中维护一颗虚拟 DOM 树，数据变化时（setState），自动更新虚拟 DOM，得到一颗新树，然后 Diff 新老虚拟 DOM 树，找到有变化的部分，得到一个 Change(Patch)，将这个 Patch 加入队列，最终批量更新这些 Patch 到 DOM 中**。

### React 16 之前的不足

首先我们了解一下 React 的工作过程，当我们通过`render() `和 `setState()` 进行组件渲染和更新的时候，React 主要有两个阶段：

![](https://assets.ng-tech.icu/item/2019-06-25-151228.png)

**调和阶段(Reconciler)：**[官方解释](https://zh-hans.reactjs.org/docs/reconciliation.html)。React 会自顶向下通过递归，遍历新数据生成新的 Virtual DOM，然后通过 Diff 算法，找到需要变更的元素(Patch)，放到更新队列里面去。

**渲染阶段(Renderer)**：遍历更新队列，通过调用宿主环境的 API，实际更新渲染对应元素。宿主环境，比如 DOM、Native、WebGL 等。

在协调阶段阶段，由于是采用的递归的遍历方式，这种也被成为 **Stack Reconciler**，主要是为了区别 **Fiber Reconciler** 取的一个名字。这种方式有一个特点：一旦任务开始进行，就**无法中断**，那么 js 将一直占用主线程， 一直要等到整棵 Virtual DOM 树计算完成之后，才能把执行权交给渲染引擎，那么这就会导致一些用户交互、动画等任务无法立即得到处理，就会有卡顿，非常的影响用户体验。

### 如何解决之前的不足

> 之前的问题主要的问题是任务一旦执行，就无法中断，js 线程一直占用主线程，导致卡顿。

可能有些接触前端不久的不是特别理解上面为什么 js 一直占用主线程就会卡顿，我这里还是简单的普及一下。

#### 浏览器每一帧都需要完成哪些工作？

页面是一帧一帧绘制出来的，当每秒绘制的帧数（FPS）达到 60 时，页面是流畅的，小于这个值时，用户会感觉到卡顿。

1s 60 帧，所以每一帧分到的时间是 1000/60 ≈ 16 ms。所以我们书写代码时力求不让一帧的工作量超过 16ms。

![image-20190603163205451](https://assets.ng-tech.icu/item/2019-06-25-151230.png)

_浏览器一帧内的工作_

通过上图可看到，一帧内需要完成如下六个步骤的任务：

- 处理用户的交互
- JS 解析执行
- 帧开始。窗口尺寸变更，页面滚去等的处理
- rAF(requestAnimationFrame)
- 布局
- 绘制

如果这六个步骤中，任意一个步骤所占用的时间过长，总时间超过 16ms 了之后，用户也许就能看到卡顿。

而在上一小节提到的**调和阶段**花的时间过长，也就是 js 执行的时间过长，那么就有可能在用户有交互的时候，本来应该是渲染下一帧了，但是在当前一帧里还在执行 JS，就导致用户交互不能麻烦得到反馈，从而产生卡顿感。

#### 解决方案

**把渲染更新过程拆分成多个子任务，每次只做一小部分，做完看是否还有剩余时间，如果有继续下一个任务；如果没有，挂起当前任务，将时间控制权交给主线程，等主线程不忙的时候在继续执行。**这种策略叫做 [Cooperative Scheduling（合作式调度）](https://www.w3.org/TR/requestidlecallback/)，操作系统常用任务调度策略之一。

> **补充知识**，操作系统常用任务调度策略：先来先服务（FCFS）调度算法、短作业（进程）优先调度算法（SJ/PF）、最高优先权优先调度算法（FPF）、高响应比优先调度算法（HRN）、时间片轮转法（RR）、多级队列反馈法。

合作式调度主要就是用来分配任务的，当有更新任务来的时候，不会马上去做 Diff 操作，而是先把当前的更新送入一个 Update Queue 中，然后交给 **Scheduler** 去处理，Scheduler 会根据当前主线程的使用情况去处理这次 Update。为了实现这种特性，使用了`requestIdelCallback`API。对于不支持这个 API 的浏览器，React 会加上 pollyfill。

在上面我们已经知道浏览器是一帧一帧执行的，在两个执行帧之间，主线程通常会有一小段空闲时间，`requestIdleCallback`可以在这个**空闲期（Idle Period）调用空闲期回调（Idle Callback）**，执行一些任务。

![image-20190625225130226](https://assets.ng-tech.icu/item/2019-06-25-151231.png)

- 低优先级任务由`requestIdleCallback`处理；

- 高优先级任务，如动画相关的由`requestAnimationFrame`处理；

- `requestIdleCallback `可以在多个空闲期调用空闲期回调，执行任务；

- `requestIdleCallback `方法提供 deadline，即任务执行限制时间，以切分任务，避免长时间执行，阻塞 UI 渲染而导致掉帧；

这个方案看似确实不错，但是怎么实现可能会遇到几个问题：

- 如何拆分成子任务？
- 一个子任务多大合适？
- 怎么判断是否还有剩余时间？
- 有剩余时间怎么去调度应该执行哪一个任务？
- 没有剩余时间之前的任务怎么办？

接下里整个 Fiber 架构就是来解决这些问题的。

## 什么是 Fiber

为了解决之前提到解决方案遇到的问题，提出了以下几个目标：

- 暂停工作，稍后再回来。
- 为不同类型的工作分配优先权。
- 重用以前完成的工作。
- 如果不再需要，则中止工作。

为了做到这些，我们首先需要一种方法将任务分解为单元。从某种意义上说，这就是 Fiber，Fiber 代表一种**工作单元**。

但是仅仅是分解为单元也无法做到中断任务，因为函数调用栈就是这样，每个函数为一个工作，每个工作被称为**堆栈帧**，它会一直工作，直到堆栈为空，无法中断。

所以我们需要一种增量渲染的调度，那么就需要重新实现一个堆栈帧的调度，这个堆栈帧可以按照自己的调度算法执行他们。另外由于这些堆栈是可以自己控制的，所以可以加入并发或者错误边界等功能。

因此 Fiber 就是重新实现的堆栈帧，本质上 Fiber 也可以理解为是一个**虚拟的堆栈帧**，将可中断的任务拆分成多个子任务，通过按照优先级来自由调度子任务，分段更新，从而将之前的同步渲染改为异步渲染。

所以我们可以说 Fiber 是一种数据结构(堆栈帧)，也可以说是一种解决可中断的调用任务的一种解决方案，它的特性就是**时间分片(time slicing)**和**暂停(supense)**。

> 如果了解**协程**的可能会觉得 Fiber 的这种解决方案，跟协程有点像(区别还是很大的)，是可以中断的，可以控制执行顺序。在 JS 里的 generator 其实就是一种协程的使用方式，不过颗粒度更小，可以控制函数里面的代码调用的顺序，也可以中断。

## Fiber 是如何工作的

1. `ReactDOM.render()` 和 `setState` 的时候开始创建更新。
2. 将创建的更新加入任务队列，等待调度。
3. 在 requestIdleCallback 空闲时执行任务。
4. 从根节点开始遍历 Fiber Node，并且构建 WokeInProgress Tree。
5. 生成 effectList。
6. 根据 EffectList 更新 DOM。

下面是一个详细的执行过程图：

![](https://assets.ng-tech.icu/item/2019-06-25-151232.png)

1. 第一部分从 `ReactDOM.render()` 方法开始，把接收的 React Element 转换为 Fiber 节点，并为其设置优先级，创建 Update，加入到更新队列，这部分主要是做一些初始数据的准备。
2. 第二部分主要是三个函数：`scheduleWork`、`requestWork`、`performWork`，即安排工作、申请工作、正式工作三部曲，React 16 新增的异步调用的功能则在这部分实现，这部分就是 **Schedule 阶段**，前面介绍的 Cooperative Scheduling 就是在这个阶段，只有在这个解决获取到可执行的时间片，第三部分才会继续执行。具体是如何调度的，后面文章再介绍，这是 React 调度的关键过程。
3. 第三部分是一个大循环，遍历所有的 Fiber 节点，通过 Diff 算法计算所有更新工作，产出 EffectList 给到 commit 阶段使用，这部分的核心是 beginWork 函数，这部分基本就是 **Fiber Reconciler ，包括 reconciliation 和 commit 阶段**。

### Fiber Node

FIber Node，承载了非常关键的上下文信息，可以说是贯彻整个创建和更新的流程，下来分组列了一些重要的 Fiber 字段。

```javascript
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

### Fiber Reconciler

在第二部分，进行 Schedule 完，获取到时间片之后，就开始进行 reconcile。

Fiber Reconciler 是 React 里的调和器，这也是任务调度完成之后，如何去执行每个任务，如何去更新每一个节点的过程，对应上面的第三部分。

reconcile 过程分为 2 个阶段（phase）：

1. （可中断）render/reconciliation 通过构造 WorkInProgress Tree 得出 Change。
2. （不可中断）commit 应用这些 DOM change。

#### reconciliation 阶段

在 reconciliation 阶段的每个工作循环中，每次处理一个 Fiber，处理完可以中断/挂起整个工作循环。通过每个节点更新结束时向上归并 **Effect List** 来收集任务结果，reconciliation 结束后，**根节点**的 Effect List 里记录了包括 DOM change 在内的所有 **Side Effect**。

render 阶段可以理解为就是 Diff 的过程，得出 Change(Effect List)，会执行声明如下的声明周期方法：

- [UNSAFE_]componentWillMount（弃用）
- [UNSAFE_]componentWillReceiveProps（弃用）
- getDerivedStateFromProps
- shouldComponentUpdate
- [UNSAFE_]componentWillUpdate（弃用）
- render

由于 reconciliation 阶段是可中断的，一旦中断之后恢复的时候又会重新执行，所以很可能 reconciliation 阶段的生命周期方法会被多次调用，所以在 reconciliation 阶段的生命周期的方法是不稳定的，我想这也是 React 为什么要废弃 `componentWillMount` 和 `componentWillReceiveProps`方法而改为静态方法 `getDerivedStateFromProps` 的原因吧。

#### commit 阶段

commit 阶段可以理解为就是将 Diff 的结果反映到真实 DOM 的过程。

在 commit 阶段，在 commitRoot 里会根据 `effect `的 `effectTag`，具体 effectTag 见[源码](https://github.com/facebook/react/blob/504576306461a5ff339dc99691842f0f35a8bf4c/packages/shared/ReactSideEffectTags.js) ，进行对应的插入、更新、删除操作，根据 `tag` 不同，调用不同的更新方法。

commit 阶段会执行如下的声明周期方法：

- getSnapshotBeforeUpdate
- componentDidMount
- componentDidUpdate
- componentWillUnmount

> P.S：注意区别 reconciler、reconcile 和 reconciliation，reconciler 是调和器，是一个名词，可以说是 React 工作的一个模块，协调模块；reconcile 是调和器调和的动作，是一个动词；而 reconciliation 只是 reconcile 过程的第一个阶段。

### Fiber Tree 和 WorkInProgress Tree

React 在 render 第一次渲染时，会通过 React.createElement 创建一颗 Element 树，可以称之为 **Virtual DOM Tree**，由于要记录上下文信息，加入了 Fiber，每一个 Element 会对应一个 Fiber Node，将 Fiber Node 链接起来的结构成为 **Fiber Tree**。它反映了用于渲染 UI 的应用程序的状态。这棵树通常被称为 **current 树（当前树，记录当前页面的状态）。**

在后续的更新过程中（setState），每次重新渲染都会重新创建 Element, 但是 Fiber 不会，Fiber 只会使用对应的 Element 中的数据来更新自己必要的属性，

Fiber Tree 一个重要的特点是链表结构，将递归遍历编程循环遍历，然后配合 requestIdleCallback API, 实现任务拆分、中断与恢复。

这个链接的结构是怎么构成的呢，这就要主要到之前 Fiber Node 的节点的这几个字段：

```javascript
// 单链表树结构
{
   return: Fiber | null, // 指向父节点
   child: Fiber | null,// 指向自己的第一个子节点
   sibling: Fiber | null,// 指向自己的兄弟结构，兄弟节点的return指向同一个父节点
}
```

每一个 Fiber Node 节点与 Virtual Dom 一一对应，所有 Fiber Node 连接起来形成 Fiber tree, 是个单链表树结构，如下图所示：

![](https://assets.ng-tech.icu/item/2019-06-25-151232.jpg)

对照图来看，是不是可以知道 Fiber Node 是如何联系起来的呢，Fiber Tree 就是这样一个单链表。

**当 render 的时候有了这么一条单链表，当调用 `setState` 的时候又是如何 Diff 得到 change 的呢？**

采用的是一种叫**双缓冲技术（double buffering）**，这个时候就需要另外一颗树：WorkInProgress Tree，它反映了要刷新到屏幕的未来状态。

WorkInProgress Tree 构造完毕，得到的就是新的 Fiber Tree，然后喜新厌旧（把 current 指针指向 WorkInProgress Tree，丢掉旧的 Fiber Tree）就好了。

这样做的好处：

- 能够复用内部对象（fiber）
- 节省内存分配、GC 的时间开销
- 就算运行中有错误，也不会影响 View 上的数据

每个 Fiber 上都有个`alternate`属性，也指向一个 Fiber，创建 WorkInProgress 节点时优先取`alternate`，没有的话就创建一个。

创建 WorkInProgress Tree 的过程也是一个 Diff 的过程，Diff 完成之后会生成一个 Effect List，这个 Effect List 就是最终 Commit 阶段用来处理副作用的阶段。

## 后记

本开始想一篇文章把 Fiber 讲透的，但是写着写着发现确实太多了，想写详细，估计要写几万字，所以我这篇文章的目的仅仅是在没有涉及到源码的情况下梳理了大致 React 的工作流程，对于细节，比如如何调度异步任务、如何去做 Diff 等等细节将以小节的方式一个个的结合源码进行分析。

说实话，自己不是特别满意这篇，感觉头重脚轻，在讲协调之前写得还挺好的，但是在讲协调这块文字反而变少了，因为我是专门想写一篇文章讲协调的，所以这篇仅仅用来梳理整个流程。

但是梳理整个流程又发现 Schedule 这块基本没什么体现，哎，不想写了，这篇文章拖太久了，请继续后续的文章。

可以关注我的 github：[Deep In React](https://github.com/crazylxr/deep-in-react)

## 一些问题

接下来留一些思考题。

- 如何去划分任务优先级？
- 在 reconcile 过程的 render 阶段是如何去遍历链表，如何去构建 workInProgress 的？
- 当任务被打断，如何恢复？
- 如何去收集 EffectList？
- 针对不同的组件类型如何进行更新？

## 参考

- [完全理解 React Fiber](<[http://www.ayqy.net/blog/dive-into-react-fiber/#articleHeader4](http://www.ayqy.net/blog/dive-into-react-fiber/#articleHeader4)>)
- [Fiber](https://happy-alex.github.io/js/react/fiber/)
- [React16 源码之 React Fiber 架构](https://github.com/HuJiaoHJ/blog/issues/7#)

# 详解 Diff 过程

## 前言

我相信在看这篇文章的读者一般都已经了解过 React 16 以前的 Diff 算法了，这个算法也算是 React 跨时代或者说最有影响力的一点了，使 React 在保持了可维护性的基础上性能大大的提高，但 Diff 过程不仅不是免费的，而且对性能影响很大，有时候更新页面的时候往往 Diff 所花的时间 js 运行时间比 Rendering 和 Painting 花费更多的时间，所以我一直传达的观念是 React 或者说框架的意义是**为了提高代码的可维护性**，而**不是为了提高性能**的，现在所做的提升性能的操作，只是在可维护性的基础上对性能的优化。具体可以参考我公众号以前发的这两篇文章：

- [别再说虚拟 DOM 快了，要被打脸的](https://mp.weixin.qq.com/s/XR3-3MNCYY2pg6yVwVQohQ)
- [深入理解虚拟 DOM，它真的不快](https://mp.weixin.qq.com/s/cz5DBpqFiadL4IQofiWY3A)

> 如果你对标题不满意，请把文章看完，至少也得把文章最后的结论好好看下

在上一篇将 React Fiber 架构中，已经说到过，React 现在将整体的数据结构从树改为了链表结构。所以相应的 Diff 算法也得改变，以为以前的 Diff 算法就是基于树的。

老的 Diff 算法提出了三个策略来保证整体界面构建的性能，具体是：

1. Web UI 中 DOM 节点跨层级的移动操作特别少，可以忽略不计。
2. 拥有相同类的两个组件将会生成相似的树形结构，拥有不同类的两个组件将会生成不同的树形结构。
3. 对于同一层级的一组子节点，它们可以通过唯一 id 进行区分。

基于以上三个前提策略，React 分别对 tree diff、component diff 以及 element diff 进行算法优化。

具体老的算法可以见这篇文章：[React 源码剖析系列 － 不可思议的 react diff](https://zhuanlan.zhihu.com/p/20346379)

说实话，老的 Diff 算法还是挺复杂的，你仅仅看上面这篇文章估计一时半会都不能理解，更别说看源码了。对于 React 16 的 Diff 算法(我觉得都不能把它称作算法，最多叫个 Diff 策略)其实还是蛮简单的，React 16 是整个调度流程感觉比较难，我在前面将 Fiber 的文章已经简单的梳理过了，后面也会慢慢的逐个攻破。

接下来就开始正式的讲解 React 16 的 Diff 策略吧！

## Diff 简介

**做 Diff 的目的就是为了复用节点。**

链表的每一个节点是 Fiber，而不是在 16 之前的虚拟 DOM 节点。

> 我这里说的虚拟 DOM 节点是指 React.createElement 方法所产生的节点。虚拟 DOM tree 只维护了组件状态以及组件与 DOM 树的关系，Fiber Node 承载的东西比 虚拟 DOM 节点多很多。

Diff 就是新旧节点的对比，在[上一篇](https://mp.weixin.qq.com/s/dONYc-Y96baiXBXpwh1w3A)中也说道了，这里面的 Diff 主要是构建 currentInWorkProgress 的过程，同时得到 Effect List，给下一个阶段 commit 做准备。

React16 的 diff 策略采用从链表头部开始比较的算法，是**层次遍历**，算法是建立在一个节点的插入、删除、移动等操作都是在节点树的**同一层级**中进行的。

对于 Diff， 新老节点的对比，我们以新节点为标准，然后来构建整个 currentInWorkProgress，对于新的 children 会有四种情况。

- TextNode(包含字符串和数字)
- 单个 React Element(通过该节点是否有 $$typeof 区分)
- 数组
- 可迭代的 children，跟数组的处理方式差不多

那么我们就来一步一步的看这四种类型是如何进行 diff 的。

## 前置知识介绍

这篇文章主要是从 React 的源码的逻辑出发介绍的，所以介绍之前了解下只怎么进入到这个 diff 函数的，react 的 diff 算法是从 `reconcileChildren` 开始的

```javascript
export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderExpirationTime: ExpirationTime
) {
  if (current === null) {
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderExpirationTime
    );
  } else {
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderExpirationTime
    );
  }
}
```

`reconcileChildren` 只是一个入口函数，如果首次渲染，current 空 null，就通过 `mountChildFibers` 创建子节点的 Fiber 实例。如果不是首次渲染，就调用 `reconcileChildFibers`去做 diff，然后得出 effect list。

接下来再看看 mountChildFibers 和 reconcileChildFibers 有什么区别：

```javascript
export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
```

他们都是通过 `ChildReconciler` 函数来的，只是传递的参数不同而已。这个参数叫`shouldTrackSideEffects`，他的作用是判断是否要增加一些`effectTag`，主要是用来优化初次渲染的，因为初次渲染没有更新操作。

```javascript
function reconcileChildFibers(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
  expirationTime: ExpirationTime
): Fiber | null {
  // 主要的 Diff 逻辑
}
```

`reconcileChildFibers` 就是 Diff 部分的主体代码，这个函数超级长，是一个包装函数，下面所有的 diff 代码都在这里面，详细的源码注释可以见[这里](https://github.com/crazylxr/deep-in-react/blob/master/analysis/06-rencocilerChildren.md)。

**参数介绍**

- `returnFiber` 是即将 Diff 的这层的父节点。
- `currentFirstChild`是当前层的第一个 Fiber 节点。
- `newChild` 是即将更新的 vdom 节点(可能是 TextNode、可能是 ReactElement，可能是数组)，不是 Fiber 节点
- `expirationTime` 是过期时间，这个参数是跟调度有关系的，本系列还没讲解，当然跟 Diff 也没有关系。

> 再次提醒，reconcileChildFibers 是 reconcile(diff) 的一层。

前置知识介绍完毕，就开始详细介绍每一种节点是如何进行 Diff 的。

## Diff TextNode

首先看 TextNode，因为它是最简单的，担心直接看到难的，然后就打击你的信心。

看下面两个小 demo：

```javascript
// demo1：当前 ui 对应的节点的 jsx
return (
  <div>
    // ...
    <div>
      <xxx></xxx>
      <xxx></xxx>
    </div>
    //...
  </div>
);

// demo2：更新成功后的节点对应的 jsx

return (
  <div>
    // ...
    <div>前端桃园</div>
    //...
  </div>
);
```

对应的单链表结构图：

![image-20190714223931338](https://assets.ng-tech.icu/item/2019-07-28-134126.png)

对于 diff TextNode 会有两种情况。

1. currentFirstNode 是 TextNode
2. currentFirstNode 不是 TextNode

> currentFirstNode 是当前该层的第一个节点，reconcileChildFibers 传进来的参数。

**为什么要分两种情况呢？**原因就是为了复用节点

**第一种情况**。xxx 是一个 TextNode，那么就代表这这个节点可以复用，有复用的节点，对性能优化很有帮助。既然新的 child 只有一个 TextNode，那么复用节点之后，就把剩下的 aaa 节点就可以删掉了，那么 div 的 child 就可以添加到 workInProgress 中去了。

源码如下：

```javascript
if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
  // We already have an existing node so let's just update it and delete
  // the rest.
  deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
  const existing = useFiber(currentFirstChild, textContent, expirationTime);
  existing.return = returnFiber;
  return existing;
}
```

在源码里 `useFiber` 就是复用节点的方法，`deleteRemainingChildren` 就是删除剩余节点的方法，这里是从 `currentFirstChild.sibling` 开始删除的。

**第二种情况。**xxx 不是一个 TextNode，那么就代表这个节点不能复用，所以就从 `currentFirstChild`开始删掉剩余的节点，对应到上面的图中就是删除掉 xxx 节点和 aaa 节点。

对于源码如下：

```javascript
deleteRemainingChildren(returnFiber, currentFirstChild);
const created = createFiberFromText(
  textContent,
  returnFiber.mode,
  expirationTime
);
created.return = returnFiber;
```

其中 `createFiberFromText` 就是根据 `textContent` 来创建节点的方法。

> 注意：删除节点不会真的从链表里面把节点删除，只是打一个 delete 的 tag，当 commit 的时候才会真正的去删除。

## Diff React Element

有了上面 TextNode 的 Diff 经验，那么来理解 React Element 的 Diff 就比较简单了，因为他们的思路是一致的：先找有没有可以复用的节点，如果没有就另外创建一个。

那么就有一个问题，**如何判断这个节点是否可以复用呢？**

有两个点：1. key 相同。 2. 节点的类型相同。

如果以上两点相同，就代表这个节点只是变化了内容，不需要创建新的节点，可以复用的。

对应的源码如下：

```javascript
if (child.key === key) {
  if (
    child.tag === Fragment
    ? element.type === REACT_FRAGMENT_TYPE
    : child.elementType === element.type
  ) {
    // 为什么要删除老的节点的兄弟节点？
    // 因为当前节点是只有一个节点，而老的如果是有兄弟节点是要删除的，是多于的。删掉了之后就可以复用老的节点了
    deleteRemainingChildren(returnFiber, child.sibling);
    // 复用当前节点
    const existing = useFiber(
      child,
      element.type === REACT_FRAGMENT_TYPE
      ? element.props.children
      : element.props,
      expirationTime,
    );
    existing.ref = coerceRef(returnFiber, child, element);
    existing.return = returnFiber;
    return existing;
}
```

相信这些代码都很好理解了，除了判断条件跟前面 TextNode 的判断条件不一样，其余的基本都一样，只是 React Element 多了一个跟新 ref 的过程。

同样，如果节点的类型不相同，就将节点从当前节点开始把剩余的都删除。

```javascript
deleteRemainingChildren(returnFiber, child);
```

到这里，可能你们就会觉得接下来应该就是讲解当没有可以复用的节点的时候是如果创建节点的。

不过可惜你们猜错了。因为 Facebook 的工程师很厉害，另外还做了一个工作来优化，来找到复用的节点。

我们现在来看这种情况：

![image-20190714232052778](https://assets.ng-tech.icu/item/2019-07-28-134319.jpg)

这种情况就是有可能更新的时候删除了一个节点，但是另外的节点还留着。

那么在对比 xxx 节点和 AAA 节点的时候，它们的节点类型是不一样，按照我们上面的逻辑，还是应该把 xxx 和 AAA 节点删除，然后创建一个 AAA 节点。

但是你看，明明 xxx 的 slibling 有一个 AAA 节点可以复用，但是被删了，多浪费呀。所以还有另外有一个策略来找 xxx 的所有兄弟节点中有没有可以复用的节点。

这种策略就是从 div 下面的所有子节点去找有没有可以复用的节点，而不是像 TextNode 一样，只是找第一个 child 是否可以复用，如果当前节点的 key 不同，就代表肯定不是同一个节点，所以把当前节点删除，然后再去找当前节点的兄弟节点，直到找到 key 相同，并且节点的类型相同，否则就删除所有的子节点。

> 你有木有这样的问题：为什么 TextNode 不采用这样的循环策略来找可以复用的节点呢？这个问题留给你思考，欢迎在评论区留下你的答案。

对应的源码逻辑如下：

```javascript
// 找到 key 相同的节点，就会复用当前节点
while (child !== null) {
  if (child.key === key) {
    if (
      child.tag === Fragment
        ? element.type === REACT_FRAGMENT_TYPE
        : child.elementType === element.type
    ) {
      // 复用节点逻辑，省略该部分代码，和上面复用节点的代码相同
      // code ...
      return existing;
    } else {
      deleteRemainingChildren(returnFiber, child);
      break;
    }
  } else {
    // 如果没有可以复用的节点，就把这个节点删除
    deleteChild(returnFiber, child);
  }
  child = child.sibling;
}
```

在上面这段代码我们需要注意的是，当 key 相同，React 会认为是同一个节点，所以当 key 相同，节点类型不同的时候，React 会认为你已经把这个节点重新覆盖了，所以就不会再去找剩余的节点是否可以复用。只有在 key 不同的时候，才会去找兄弟节点是否可以复用。

接下来才是我们前面说的，如果没有找到可以复用的节点，然后就重新创建节点，源码如下：

```javascript
// 前面的循环已经把该删除的已经删除了，接下来就开始创建新的节点了
if (element.type === REACT_FRAGMENT_TYPE) {
  const created = createFiberFromFragment(
    element.props.children,
    returnFiber.mode,
    expirationTime,
    element.key
  );
  created.return = returnFiber;
  return created;
} else {
  const created = createFiberFromElement(
    element,
    returnFiber.mode,
    expirationTime
  );
  created.ref = coerceRef(returnFiber, currentFirstChild, element);
  created.return = returnFiber;
  return created;
}
```

对于 Fragment 节点和一般的 Element 节点创建的方式不同，因为 Fragment 本来就是一个无意义的节点，他真正需要创建 Fiber 的是它的 children，而不是它自己，所以 `createFiberFromFragment` 传递的不是 `element `，而是 `element.props.children`。

## Diff Array

Diff Array 算是 Diff 中最难的一部分了，比较的复杂，因为做了很多的优化，不过请你放心，认真看完我的讲解，最难的也会很容易理解，废话不多说，开始吧！

因为 Fiber 树是单链表结构，没有子节点数组这样的数据结构，也就没有可以供两端同时比较的尾部游标。所以 React 的这个算法是一个简化的两端比较法，只从头部开始比较。

前面已经说了，Diff 的目的就是为了复用，对于 Array 就不能像之前的节点那样，仅仅对比一下元素的 key 或者 元素类型就行，因为数组里面是好多个元素。你可以在头脑里思考两分钟如何进行复用节点，再看 React 是怎么做的，然后对比一下孰优孰劣。

### 1. 相同位置(index)进行比较

相同位置进行对比，这个是比较容易想到的一种方式，还是举个例子加深一下印象。

![image-20190721212259855](https://assets.ng-tech.icu/item/2019-07-28-134317.jpg)

这已经是一个非常简单的例子了，div 的 child 是一个数组，有 AAA、BBB 然后还有其他的兄弟节点，在做 diff 的时候就可以从新旧的数组中按照索引一一对比，如果可以复用，就把这个节点从老的链表里面删除，不能复用的话再进行其他的复用策略。

那如果判断节点是否可以复用呢？有了前面的 ReactElement 和 TextNode 复用的经验，这个也类似，因为是一一对比嘛，相当于是一个节点一个节点的对比。

不过对于 newChild 可能会有很多种类型，简单的看下源码是如何进行判断的。

```javascript
const key = oldFiber !== null ? oldFiber.key : null;
```

前面的经验可得，判断是否可以复用，常常会根据 key 是否相同来决定，所以首先获取了老节点的 key 是否存在。如果不存在老节点很可能是 TextNode 或者是 Fragment。

接下来再看 newChild 为不同类型的时候是如何进行处理的。

**当 newChild 是 TextNode 的时候**

```javascript
if (typeof newChild === "string" || typeof newChild === "number") {
  // 对于新的节点如果是 string 或者 number，那么都是没有 key 的，
  // 所有如果老的节点有 key 的话，就不能复用，直接返回 null。
  // 老的节点 key 为 null 的话，代表老的节点是文本节点，就可以复用
  if (key !== null) {
    return null;
  }

  return updateTextNode(returnFiber, oldFiber, "" + newChild, expirationTime);
}
```

如果 key 不为 null，那么就代表老节点不是 TextNode，而新节点又是 TextNode，所以返回 null，不能复用，反之则可以复用，调用 `updateTextNode` 方法。

> 注意，updateTextNode 里面包含了首次渲染的时候的逻辑，首次渲染的时候回插入一个 TextNode，而不是复用。

**当 newChild 是 Object 的时候**

newChild 是 Object 的时候基本上走的就是 ReactElement 的逻辑了，判断 key 和 元素的类型是否相等来判断是否可以复用。

```javascript
if (typeof newChild === "object" && newChild !== null) {
  // 有 $$typeof 代表就是 ReactElement
  switch (newChild.$$typeof) {
    case REACT_ELEMENT_TYPE: {
      // ReactElement 的逻辑
    }
    case REACT_PORTAL_TYPE: {
      // 调用 updatePortal
    }
  }

  if (isArray(newChild) || getIteratorFn(newChild)) {
    if (key !== null) {
      return null;
    }

    return updateFragment(
      returnFiber,
      oldFiber,
      newChild,
      expirationTime,
      null
    );
  }
}
```

首先判断是否是对象，用的是 `typeof newChild === 'object' && newChild !== null` ，注意要加 `!== null`，因为 `typeof null` 也是 object。

然后通过 $$typeof 判断是 REACT_ELEMENT_TYPE 还是 REACT_PORTAL_TYPE，分别调用不同的复用逻辑，然后由于数组也是 Object ，所以这个 if 里面也有数组的复用逻辑。

我相信到这里应该对于应该对于如何相同位置的节点如何对比有清晰的认识了。另外还有问题，那就是如何循环一个一个对比呢？

这里要注意，新的节点的 children 是虚拟 DOM，所以这个 children 是一个数组，而对于之前提到的老的节点树是链表。

那么循环一个一个对比，就是遍历数组的过程。

```javascript
let newIdx = 0; // 新数组的索引
for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
  // 遍历老的节点
  nextOldFiber = oldFiber.sibling;
  // 返回复用节点的函数，newFiber 就是复用的节点。
  // 如果为空，就代表同位置对比已经不能复用了，循环结束。
  const newFiber = updateSlot(
    returnFiber,
    oldFiber,
    newChildren[newIdx],
    expirationTime
  );

  if (newFiber === null) {
    break;
  }

  // 其他 code，比如删除复用的节点
}
```

这并不是源码的全部源码，我只是把思路给贴出来了。

这是第一次遍历新数组，通过调用 `updateSlot` 来对比新老元素，前面介绍的如何对比新老节点的代码都是在这个函数里。这个循环会把所以的从前面开始能复用的节点，都复用到。比如上面我们画的图，如果两个链表里面的 **？？？**节点，不相同，那么 newFiber 为 null，这个循环就会跳出。

跳出来了，就会有两种情况。

- 新节点已经遍历完毕
- 老节点已经遍历完毕

### 2. 新节点已经遍历完毕

如果新节点已经遍历完毕的话，也就是没有要更新的了，这种情况一般就是从原来的数组里面删除了元素，那么直接把剩下的老节点删除了就行了。还是拿上面的图的例子举例，老的链表里**？？？**还有很多节点，而新的链表**？？？**已经没有节点了，所以老的链表**？？？**不管是有多少节点，都不能复用了，所以没用了，直接删除。

```javascript
if (newIdx === newChildren.length) {
  // 新的 children 长度已经够了，所以把剩下的删除掉
  deleteRemainingChildren(returnFiber, oldFiber);
  return resultingFirstChild;
}
```

注意这里是直接 `return` 了哦，没有继续往下执行了。

### 3. 老节点已经遍历完毕

如果老的节点在第一次循环的时候就被复用完了，新的节点还有，很有可能就是新增了节点的情况。那么这个时候只需要根据把剩余新的节点直接创建 **Fiber** 就行了。

```javascript
if (oldFiber === null) {
  // 如果老的节点已经被复用完了，对剩下的新节点进行操作
  for (; newIdx < newChildren.length; newIdx++) {
    const newFiber = createChild(
      returnFiber,
      newChildren[newIdx],
      expirationTime
    );
  }
  return resultingFirstChild;
}
```

`oldFiber === null` 就是用来判断老的 Fiber 节点变量完了的代码，Fiber 链表是一个单向链表，所以为 null 的时候代表已经结束了。所以就直接把剩余的 newChild 通过循环创建 Fiber。

到这里，目前简单的对数组进行增、删节点的对比还是比较简单，接下来就是移动的情况是如何进行复用的呢？

### 4. 移动的情况如何进行节点复用

对于移动的情况，首先要思考，怎么能判断数组是否发生过移动操作呢？

如果给你两个数组，你是否能判断出来数组是否发生过移动。

答案是：老的数组和新的数组里面都有这个元素，而且位置不相同。

从两个数组中找到相同元素(是指可复用的节点)，方法有很多种，来看看 React 是如何高效的找出来的。

**把所有老数组元素按 key 或者是 index 放 Map 里，然后遍历新数组，根据新数组的 key 或者 index 快速找到老数组里面是否有可复用的。**

```javascript
function mapRemainingChildren(
  returnFiber: Fiber,
  currentFirstChild: Fiber
): Map<string | number, Fiber> {
  const existingChildren: Map<string | number, Fiber> = new Map();

  let existingChild = currentFirstChild; // currentFirstChild 是老数组链表的第一个元素
  while (existingChild !== null) {
    // 看到这里可能会疑惑怎么在 Map 里面的key 是 fiber 的key 还是 fiber 的 index 呢？
    // 我觉得是根据数据类型，fiber 的key 是字符串，而 index 是数字，这样就能区分了
    // 所以这里是用的 map，而不是对象，如果是对象的key 就不能区分 字符串类型和数字类型了。
    if (existingChild.key !== null) {
      existingChildren.set(existingChild.key, existingChild);
    } else {
      existingChildren.set(existingChild.index, existingChild);
    }
    existingChild = existingChild.sibling;
  }
  return existingChildren;
}
```

这个 `mapRemainingChildren` 就是将老数组存放到 Map 里面。元素有 key 就 Map 的键就存 key，没有 key 就存 index，key 一定是字符串，index 一定是 number，所以取的时候是能区分的，所以这里用的是 Map，而不是对象，如果是对象，属性是字符串，就没办法区别是 key 还是 index 了。

现在有了这个 Map，剩下的就是循环新数组，找到 Map 里面可以复用的节点，如果找不到就创建，这个逻辑基本上跟 `updateSlot` 的复用逻辑很像，一个是从老数组链表中获取节点对比，一个是从 Map 里获取节点对比。

```javascript
// 如果前面的算法有复用，那么 newIdx 就不从 0 开始
for (; newIdx < newChildren.length; newIdx++) {
  const newFiber = updateFromMap(
    existingChildren,
    returnFiber,
    newIdx,
    newChildren[newIdx],
    expirationTime
  );
  // 省略删除 existingChildren 中的元素和添加 Placement 副作用的情况
}
```

到这里新数组遍历完毕，也就是**同一层**的 Diff 过程完毕，接下来进行总结一下。

### 效果演示

以下效果动态演示来自于文章：[React Diff 源码分析](https://slane.cn/2018/08/09/react-diff-yuan-ma-fen-xi/)，我觉得这个演示非常的形象，有助于理解。

这里渲染一个可输入的数组。

![1](https://assets.ng-tech.icu/item/2019-07-28-134128.png)

当第一种情况，新数组遍历完了，老数组剩余直接删除（12345→1234 删除 5）：

新数组没完，老数组完了（1234→1234567 插入 567）：

![img](https://assets.ng-tech.icu/item/2019-07-28-134136.gif)

移动的情况，即之前就存在这个元素，后续只是顺序改变（123 → 4321 插入 4，移动 2 1）：

![img](https://assets.ng-tech.icu/item/2019-07-28-134140.gif)

最后删除没有涉及的元素。

### 总结

对于数组的 diff 策略，相对比较复杂，最后来梳理一下这个策略，其实还是很简单，只是看源码的时候比较难懂。

我们可以把整个过程分为三个阶段：

1. 第一遍历新数组，新老数组相同 index 进行对比，通过 `updateSlot`方法找到可以复用的节点，直到找到不可以复用的节点就退出循环。
2. 第一遍历完之后，删除剩余的老节点，追加剩余的新节点的过程。如果是新节点已遍历完成，就将剩余的老节点批量删除；如果是老节点遍历完成仍有新节点剩余，则将新节点直接插入。
3. 把所有老数组元素按 key 或 index 放 Map 里，然后遍历新数组，插入老数组的元素，这是移动的情况。

## 后记

刚开始阅读源码的过程是非常的痛苦的，但是当你一遍一遍的把作者想要表达的理解了，为什么要这么写 理解了，会感到作者的设计是如此的精妙绝伦，每一个变量，每一行代码感觉都是精心设计过的，然后感受到自己与大牛的差距，激发自己的动力。

更多的对于 React 原理相关，源码相关的内容，请关注我的 github：[Deep In React](https://github.com/crazylxr/deep-in-react) 或者 个人博客：[桃园](http://www.taoweng.site/)

我是桃翁，一个爱思考的前端 er，想了解关于更多的前端相关的，请关注我的公号：「前端桃园」
