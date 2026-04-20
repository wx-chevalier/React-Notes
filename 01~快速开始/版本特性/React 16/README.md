# React 16

为了解决同步更新长时间占用线程导致页面卡顿的问题，也为了探索运行时优化的更多可能，React 开始重构并一直持续至今。重构的目标是实现 Concurrent Mode（并发模式）。

从 v15 到 v16，React 团队花了两年时间将源码架构中的 Stack Reconciler 重构为 Fiber Reconciler。

React16 架构可以分为三层：

- Scheduler（调度器）—— **调度任务的优先级**，高优任务优先进入 Reconciler；
- Reconciler（协调器）—— 负责找出变化的组件：**更新工作从递归变成了可以中断的循环过程。Reconciler 内部采用了 Fiber 的架构**；
- Renderer（渲染器）—— 负责将变化的组件渲染到页面上。
