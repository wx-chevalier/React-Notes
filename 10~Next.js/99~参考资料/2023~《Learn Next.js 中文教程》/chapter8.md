# 静态和动态渲染

在上一章中，您为 Dashboard 概述页面获取了数据。但是，我们简要讨论了当前设置的两个局限性：

- 数据请求正在创造一个无意的瀑布。
- Dashboard 是静态的，因此任何数据更新都不会反映在您的应用程序上。

以下是本章中将涵盖的主题：

- 什么是静态渲染，以及它如何提高应用程序的性能。
- 什么是动态渲染以及何时使用它。
- 使 Dashboard 动态化的不同方法。
- 模拟一个缓慢的数据获取，看看会发生什么。

## 什么是静态渲染？

使用静态渲染，数据获取和渲染在构建时（部署时）或[重新验证期间](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data)在服务器上进行。然后，结果可以在[内容分发网络（CDN）](https://nextjs.org/docs/app/building-your-application/rendering/server-components#static-rendering-default)中分发和缓存。

![显示用户在请求页面时如何访问 CDN 而不是服务器的图](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter8-static-site-generation.avif)

每当用户访问你的应用程序时，缓存的结果都会被提供。静态渲染有几个好处：

- **更快的网站** - 预渲染的内容可以被缓存和全球分布。这确保了世界各地的用户可以更快、更可靠地访问您的网站内容。
- **减少服务器负载** - 由于内容被缓存，您的服务器不必为每个用户请求动态生成内容。
- **搜索引擎优化** - 预渲染内容更容易被搜索引擎爬虫索引，因为当页面加载时，内容已经可用。这可以提高搜索引擎排名。

静态渲染对于**没有数据**或**跨用户共享数据**的 UI（如静态博客文章或产品页面）非常有用。它可能不适合具有定期更新的个性化数据的 Dashboard。

与静态渲染相反的是动态渲染。

<QuizComponent
name="为什么静态渲染不适合 Dashboard 应用程序？"
answers={[
"因为它会使网站变慢",
"因为服务器负载会增加",
"因为应用程序不会反映最新的数据更改",
"因为你需要一个内容分发网络（CDN）",
]}
correctAnswer="因为应用程序不会反映最新的数据更改"
/>

## 什么是动态渲染？

通过动态渲染，内容在请求时（当用户访问页面时）在服务器上为每个用户呈现。动态渲染有几个好处：

- **实时数据** - 动态渲染允许您的应用程序显示实时或频繁更新的数据。这对于数据经常变化的应用程序来说是理想的。
- **用户特定内容** - 提供个性化内容（如 Dashboard 或用户配置文件）并根据用户交互更新数据更容易。
- **请求时间信息** - 动态渲染允许您访问只能在请求时知道的信息，如 Cookie 或 URL 搜索参数。

<QuizComponent
name="哪些信息只能在请求时知道？"
answers={["数据库模式", "URL 路径", "Cookie 和 URL 搜索参数"]}
correctAnswer="Cookie 和 URL 搜索参数"
/>

## 使 Dashboard 动态化

默认情况下，`@vercel/postgresql` 不设置自己的缓存语义。这允许框架设置自己的静态和动态行为。

您可以在服务器组件或数据获取函数中使用名为 `unstable_noStore` 的 Next.js API 来选择退出静态呈现。让我们添加这个。

在你的 `data.ts` 中，从 `next/cache` 导入 `unstable_noStore`，并在数据获取函数的顶部调用它：

```js showLineNumbers filename="/app/lib/data.ts" {2,7,13,18,26,31,36,41} copy
// ...
import { unstable_noStore as noStore } from "next/cache";

export async function fetchRevenue() {
  // Add noStore() here to prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  noStore();

  // ...
}

export async function fetchLatestInvoices() {
  noStore();
  // ...
}

export async function fetchCardData() {
  noStore();
  // ...
}

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number
) {
  noStore();
  // ...
}

export async function fetchInvoicesPages(query: string) {
  noStore();
  // ...
}

export async function fetchFilteredCustomers(query: string) {
  noStore();
  // ...
}

export async function fetchInvoiceById(query: string) {
  noStore();
  // ...
}
```

> **注意**：`unstable_noStore` 是一个实验性的 API，可能在将来发生变化。如果您更喜欢在自己的项目中使用稳定的 API，您也可以使用 [Segment 配置选项](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) `export const dynamic = "force-dynamic"`。

## 模拟慢速数据获取

使 Dashboard 动态化是迈出的良好第一步。然而... 还有一个我们在上一章提到的问题。如果一个数据请求比其他所有请求都慢，会发生什么？

让我们模拟一次慢速数据获取。在您的 `data.ts` 文件中，取消注释 `fetchRevenue()` 函数内部的 `console.log` 和 `setTimeout`：

```ts showLineNumbers filename="/app/lib/data.ts" {5-6,10} copy
export async function fetchRevenue() {
  try {
    // 为演示目的，我们人为延迟响应。
    // 在生产中请勿这样做 :)
    console.log("Fetching revenue data...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue>`SELECT * FROM revenue`;

    console.log("Data fetch completed after 3 seconds.");

    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}
```

现在在新标签页中打开 http://localhost:3000/dashboard/， 注意页面加载所需的时间较长。在终端中，您还应该看到以下消息：

```
Fetching revenue data...
Data fetch completed after 3 seconds.
```

在这里，您添加了一个人为的 3 秒延迟，以模拟慢速数据获取。结果是在获取数据时整个页面被阻塞。

这引出了开发者必须解决的一个常见挑战：

使用动态渲染，**您的应用程序速度只有在最慢的数据获取完成时才能达到**。
