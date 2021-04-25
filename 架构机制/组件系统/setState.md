# React setState

在代码中调用 `setState` 函数之后，React 会将传入的参数对象与组件当前的状态合并，然后触发所谓的调和过程(Reconciliation)。经过调和过程，React 会以相对高效的方式根据新的状态构建 React 元素树并且着手重新渲染整个 UI 界面。在 React 得到元素树之后，React 会自动计算出新的树与老树的节点差异，然后根据差异对界面进行最小化重渲染。在差异计算算法中，React 能够相对精确地知道哪些位置发生了改变以及应该如何改变，这就保证了按需更新，而不是全部重新渲染。

# setState 调用流程

# 事务

事务(Transaction)源于数据库理论，是数据库管理系统执行过程中的一个逻辑单位，由一个有限的数据库操作序列构成。React 中将多个操作封装到某个事务中，将操作与执行相剥离，下面的伪代码简述事务的基本流程：

```js
// 代码只是为了理解 transaction 和 react 无关
transactionManager = new TransactionManager();
transactionManager.add(
  new Transaction(function () {
    // 修改数据的操作1
  })
);
transactionManager.add(
  new Transaction(function () {
    // 修改数据的操作2
  })
);

transactionManager.perform();
```

React 和许多现代前端框架都借鉴了这一设计模式，将操作和执行分离。这样的好处是可以做到极大的性能优化，举个例子，我们知道 DOM 操作是极其耗时的，为了优化性能，我们可以将 DOM 操作合并一起执行。React 的 DOM 更新也是合并执行的，这得益于事务设计。

# 批次更新
