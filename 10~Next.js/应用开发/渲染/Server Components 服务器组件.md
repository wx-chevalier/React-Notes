# Server Components

React 服务器组件允许你编写可以在服务器上渲染和缓存的 UI。在 Next.js 中，渲染工作进一步按路由段拆分，以实现流式处理和部分渲染，并且有三种不同的服务器渲染策略：

- 静态渲染
- 动态渲染
- 流渲染

# 服务端渲染的好处

在服务器上进行渲染工作有几个好处，包括：

- 数据提取：服务器组件允许您将数据提取移动到更靠近数据源的服务器。这可以通过减少获取渲染所需数据所需的时间以及客户端需要发出的请求数来提高性能。

- 安全性：服务器组件允许您在服务器上保留敏感数据和逻辑，例如令牌和 API 密钥，而不会有将它们暴露给客户端的风险。

- 缓存：通过在服务器上呈现，结果可以缓存并在后续请求和用户之间重复使用。这可以通过减少对每个请求完成的渲染和数据提取量来提高性能并降低成本。

- 捆绑包大小：服务器组件允许您保留以前会影响服务器上客户端 JavaScript 捆绑包大小的大型依赖项。这对于互联网速度较慢或设备功能较弱的用户是有益的，因为客户端不必下载、解析和执行任何用于服务器组件的 JavaScript。

- 初始页面加载和首次内容绘制 （FCP）：在服务器上，我们可以生成 HTML，允许用户立即查看页面，而无需等待客户端下载、解析和执行渲染页面所需的 JavaScript。

- 搜索引擎优化和社交网络可共享性：搜索引擎机器人可以使用呈现的 HTML 来索引您的页面，并使用社交网络机器人为您的页面生成社交卡片预览。

- 流式处理：服务器组件允许您将渲染工作拆分为块，并在准备就绪时将它们流式传输到客户端。这允许用户更早地看到页面的某些部分，而不必等待整个页面在服务器上呈现。

默认情况下，Next.js 使用服务器组件。这允许您自动实现服务器呈现，而无需其他配置，并且可以在需要时选择使用 Client Components。

# Server Components 是如何渲染的？

在服务器上，Next.js 使用 React 的 API 来编排渲染。渲染工作被分成几块：按单独的路由和 Suspense Boundaries。每个块都分两个步骤呈现：

- React 将服务器组件渲染成一种特殊的数据格式，称为 React Server Component Payload (RSC Payload)。
- Next.js 使用 RSC Payload 和 Client Components JavaScript 指令在服务器上呈现 HTML。

然后，在客户端上：

- HTML 用于立即显示路由的快速非交互式预览，这仅用于初始页面加载。
- React Server Components Payload 用于协调客户端和服务器组件树，并更新 DOM。
- JavaScript 指令用于 hydrate Client Components 并使应用程序具有交互性。

RSC Payload 是渲染的 React Server 组件树的紧凑二进制表示。客户端上的 React 使用它来更新浏览器的 DOM。RSC 有效载荷包含：

- Server Components 的渲染结果；
- Client Components 应呈现位置的占位符以及对其 JavaScript 文件的引用；
- 从 Server Components 传递到客户端组件的任何 Props；

# Server Rendering Strategies

服务器呈现有三个子集：静态、动态和流式处理。

## 静态渲染（默认）

使用静态渲染时，路由在构建时渲染，或在数据重新验证后在后台渲染。结果将被缓存，并可以推送到内容分发网络 （CDN）。此优化允许您在用户和服务器请求之间共享渲染工作的结果。当路由的数据不是针对用户个性化的，并且可以在构建时知道时（例如静态博客文章或产品页面）时，静态呈现非常有用。

## 动态渲染

使用动态渲染，在请求时为每个用户渲染路由。当路由具有针对用户的个性化数据或具有只能在请求时知道的信息（例如 Cookie 或 URL 的搜索参数）时，动态呈现非常有用。

在大多数网站中，路线不是完全静态的或完全动态的。例如，您可以有一个电子商务页面，该页面使用缓存的产品数据，这些数据会每隔一段时间重新验证，但也具有未缓存的个性化客户数据。在 Next.js 中，您可以动态呈现具有缓存和未缓存数据的路由。这是因为 RSC 有效负载和数据是分开缓存的。这允许您选择动态渲染，而不必担心在请求时获取所有数据对性能的影响。

在渲染过程中，如果发现动态函数或未缓存的数据请求，Next.js 将切换到动态渲染整个路由。下表总结了动态函数和数据缓存如何影响路由是静态呈现还是动态呈现：

| Dynamic Functions 动态函数 | Data 数据         | Route 路线                    |
| -------------------------- | ----------------- | ----------------------------- |
| No                         | Cached 缓存       | Statically Rendered 静态渲染  |
| Yes                        | Cached 缓存       | Dynamically Rendered 动态渲染 |
| No                         | Not Cached 未缓存 | Dynamically Rendered 动态渲染 |
| Yes                        | Not Cached 未缓存 | Dynamically Rendered 动态渲染 |

在上表中，要使路由完全静态，必须缓存所有数据。但是，您可以拥有一个动态呈现的路由，该路由同时使用缓存和非缓存的数据提取。作为开发人员，您无需在静态和动态渲染之间进行选择，因为 Next.js 会根据所使用的功能和 API 自动为每条路由选择最佳渲染策略。相反，您可以选择何时缓存或重新验证特定数据，并且可以选择流式传输 UI 的某些部分。

### Dynamic Functions 动态函数

动态函数依赖于只能在请求时知道的信息，例如用户的 cookie、当前请求标头或 URL 的搜索参数。在 Next.js 中，这些动态函数是：

- cookies() 和 headers()：在服务器组件中使用这些将在请求时选择整个路由进入动态渲染。
- searchParams：使用 Pages 属性将在请求时选择页面进入动态渲染。

使用这些函数中的任何一个都会在请求时将整个路由选择为动态渲染。

## Streaming 流

![Streaming 流](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fsequential-parallel-data-fetching.png&w=3840&q=75&dpl=dpl_DH5xKAuaukkuYxLS4EniEknoutiK)

流式处理使你能够从服务器逐步呈现 UI。工作被拆分为多个块，并在准备就绪时流式传输到客户端。这允许用户在整个内容完成呈现之前立即看到页面的某些部分。

![流渲染示意图](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fserver-rendering-with-streaming.png&w=3840&q=75&dpl=dpl_DH5xKAuaukkuYxLS4EniEknoutiK)

默认情况式传输内置于 Next.js App Router 中。这有助于提高初始页面加载性能，以及依赖于较慢数据提取的 UI，这将阻止呈现整个路由。例如，产品页面上的评论。你可以使用 loading.js React Suspense 的 UI 组件开始流式传输路由段。有关详细信息，请参阅加载 UI 和流式处理部分。
