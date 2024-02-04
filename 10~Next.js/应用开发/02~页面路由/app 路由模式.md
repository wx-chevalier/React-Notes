# Next.js 页面路由

每个应用程序的框架都是路由，在 Next.js 中我们会涉及如下的术语：

![Next.js 路由](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fterminology-component-tree.png&w=3840&q=75&dpl=dpl_DH5xKAuaukkuYxLS4EniEknoutiK)

- 树：用于可视化层次结构的约定。例如，具有父组件和子组件的组件树、文件夹结构等。
- 子树：树的一部分，从新根（第一个）开始，到叶子（最后一个）结束。
- 根：树或子树中的第一个节点，例如根布局。
- 叶子：子树中没有子节点的节点，例如 URL 路径中的最后一个段。

![URL 分层](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fterminology-url-anatomy.png&w=3840&q=75&dpl=dpl_DH5xKAuaukkuYxLS4EniEknoutiK)

- URL 段：由斜杠分隔的 URL 路径的一部分。
- 网址路径：网域后面的网址的一部分（由区段组成）。

# app 路由器

在版本 13 中，Next.js 引入了基于 React 服务器组件构建的新应用路由器，它支持共享布局、嵌套路由、加载状态、错误处理等。

App Router 在名为 app 的新目录中工作。该 app 目录与 pages 目录一起工作，以允许增量采用。这允许您选择应用程序的某些路由进入新行为，同时将其他路由保留在以前行为的 pages 目录中。需要注意的是，App Router 优先于 Pages Router。跨目录的路由不应解析为相同的 URL 路径，并且会导致生成时错误以防止冲突。

![app 路由与 pages 路由](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fnext-router-directories.png&w=3840&q=75&dpl=dpl_DH5xKAuaukkuYxLS4EniEknoutiK)

默认情况下，里面 app 的组件是 React Server 组件。这是一种性能优化，允许您轻松采用它们，还可以使用客户端组件。
