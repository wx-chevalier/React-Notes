# 获取数据

既然你已经创建并填充了你的数据库，让我们讨论一下获取应用程序数据的不同方式，以及构建 Dashboard 概览页面。

以下是本章中将涵盖的主题：

- 了解一些获取数据的方法：API、ORM、SQL 等。
- 如何使用 Server Components 更安全地访问后端资源。
- 什么是网络瀑布。
- 如何使用 JavaScript 模式实现并行数据获取。

## 选择如何获取数据

### API 层

API 是你的应用程序代码和数据库之间的中间层。有几种情况下你可能会使用 API：

- 如果你使用提供 API 的第三方服务。
- 如果你从客户端获取数据，你希望有一个在服务器上运行的 API 层，以避免将数据库秘密暴露给客户端。

在 Next.js 中，你可以使用[路由处理程序](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)创建 API 端点。

### 数据库查询

当你创建一个全栈应用程序时，你还需要编写与数据库交互的逻辑。对于像 Postgres 这样的[关系数据库](https://aws.amazon.com/cn/relational-database/)，你可以使用 SQL 或像 [Prisma](https://vercel.com/docs/storage/vercel-postgres/using-an-orm#) 这样的 [ORM](https://vercel.com/docs/storage/vercel-postgres/using-an-orm#) 来实现。

有几种情况下你需要编写数据库查询：

- 当创建 API 端点时，你需要编写与数据库交互的逻辑。
- 如果你正在使用 React Server Components（在服务器上获取数据），你可以跳过 API 层，直接查询数据库，而不会有暴露数据库秘密给客户端的风险。

<QuizComponent
name="在以下哪种情况下，你不应该直接查询你的数据库？"
answers={[
"当在客户端获取数据时",
"当在服务器上获取数据时",
"当创建自己的 API 层与数据库交互时",
]}
correctAnswer="当在客户端获取数据时"
/>

让我们更深入地了解 React Server Components。

### 使用 Server Components 获取数据

默认情况下，Next.js 应用程序使用 React Server Components。使用 Server Components 获取数据是一种相对较新的方法，使用它们有一些好处：

- Server Components 支持 promises，为异步任务（如数据获取）提供了更简单的解决方案。你可以使用 async/await 语法，而无需使用 useEffect、useState 或数据获取库。
- Server Components 在服务器上执行，因此你可以将昂贵的数据获取和逻辑保留在服务器上，并仅将结果发送到客户端。

如前所述，由于 Server Components 在服务器上执行，你可以直接查询数据库，而无需额外的 API 层。

<QuizComponent
name="使用 React Server Components 获取数据的一个优势是什么？"
answers={[
"它们会自动保护你免受 SQL 注入。",
"它们允许你直接从服务器查询数据库，而无需额外的 API 层。",
"它们要求你使用 API 层并创建端点。",
]}
correctAnswer="它们允许你直接从服务器查询数据库，而无需额外的 API 层。"
/>

### 使用 SQL

在你的仪表板项目中，你将使用 [Vercel Postgres SDK](https://vercel.com/docs/storage/vercel-postgres/sdk) 和 SQL 编写数据库查询。我们使用 SQL 的原因有几点：

- 在关系查询数据库中 SQL 是行业标准（例如，ORM 在底层生成 SQL）。
- 对 SQL 的基本理解可以帮助你理解关系数据库的基础知识，使你能够将你的知识应用于其他工具。
- SQL 是多才多艺的，允许你获取和操作特定的数据。
- Vercel Postgres SDK 提供了对[ SQL 注入](https://vercel.com/docs/storage/vercel-postgres/sdk#preventing-sql-injections)的保护。

如果你以前没有使用过 SQL，不用担心 - 我们已经为你提供了查询。

打开 `/app/lib/data.ts`，这里你会看到我们正在从 @vercel/postgres 导入 [sql](https://vercel.com/docs/storage/vercel-postgres/sdk#sql) 函数。这个函数允许你查询你的数据库：

```js showLineNumbers filename="/app/lib/data.ts" copy
import { sql } from "@vercel/postgres";
```

你可以在任何 Server Component 中调用 sql。但为了让你更轻松地浏览组件，我们将所有数据查询都保留在 data.ts 文件中，你可以将它们导入到组件中。

<QuizComponent
name="SQL 在获取数据方面允许你做什么？"
answers={[
"无差别地获取所有数据",
"获取和操作特定的数据",
"自动缓存数据以提高性能",
"动态更改数据库架构",
]}
correctAnswer="获取和操作特定的数据"
/>

> **注意**：如果在第 6 章中使用了自己的数据库提供程序，你需要更新数据库查询以适应你的提供程序。你可以在 `/app/lib/data.ts` 中找到这些查询。

## 获取 Dashboard 概览页面的数据

既然你了解了不同的获取数据方式，让我们获取 Dashboard 概览页面的数据。导航到 `/app/dashboard/page.tsx`，粘贴以下代码，并花些时间来探索它：

```js showLineNumbers filename="/app/dashboard/page.tsx" copy
import { Card } from "@/app/ui/dashboard/cards";
import RevenueChart from "@/app/ui/dashboard/revenue-chart";
import LatestInvoices from "@/app/ui/dashboard/latest-invoices";
import { lusitana } from "@/app/ui/fonts";

export default async function Page() {
  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        仪表板
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* <Card title="已收款" value={totalPaidInvoices} type="collected" /> */}
        {/* <Card title="待处理" value={totalPendingInvoices} type="pending" /> */}
        {/* <Card title="总发票数" value={numberOfInvoices} type="invoices" /> */}
        {/* <Card
          title="总客户数"
          value={numberOfCustomers}
          type="customers"
        /> */}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        {/* <RevenueChart revenue={revenue}  /> */}
        {/* <LatestInvoices latestInvoices={latestInvoices} /> */}
      </div>
    </main>
  );
}
```

在上面的代码中：

- Page 是一个异步组件。这允许你使用 await 来获取数据。
- 还有 3 个组件接收数据：`<Card>`、`<RevenueChart>` 和 `<LatestInvoices>`。它们当前被注释掉，以防止应用程序出错。

## 获取 `<RevenueChart/>` 组件的数据

要获取 `<RevenueChart/>` 组件的数据，从 `data.ts` 中导入 `fetchRevenue` 函数，并在你的组件内调用它：

```js showLineNumbers filename="/app/dashboard/page.tsx" {5,8} copy
import { Card } from "@/app/ui/dashboard/cards";
import RevenueChart from "@/app/ui/dashboard/revenue-chart";
import LatestInvoices from "@/app/ui/dashboard/latest-invoices";
import { lusitana } from "@/app/ui/fonts";
import { fetchRevenue } from "@/app/lib/data";

export default async function Page() {
  const revenue = await fetchRevenue();
  // ...
}
```

然后，取消注释 `<RevenueChart/>` 组件，导航到组件文件（/`app/ui/dashboard/revenue-chart.tsx`）并取消注释其中的代码。检查你的 localhost，你应该能够看到一个使用收入数据的图表。

![收入图表显示过去 12 个月的总收入](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter7-recent-revenue.avif)

让我们继续导入更多的数据查询！

## 获取 `<LatestInvoices />` 组件的数据

对于 `<LatestInvoices />` 组件，我们需要获取最新的 5 张发票，并按日期排序。

你可以获取所有的发票，然后使用 JavaScript 进行排序。这对于我们的小型数据来说不是问题，但随着应用程序的增长，它可能会显著增加每个请求传输的数据量和用于排序的 JavaScript。

与在内存中对最新发票进行排序不同，你可以使用 SQL 查询仅获取最近的 5 张发票。例如，这是你的 `data.ts` 文件中的 SQL 查询：

```js showLineNumbers filename="/app/lib/data.ts" copy
// 获取最近的 5 张发票，按日期排序
const data =
  (await sql) <
  LatestInvoiceRaw >
  `
  SELECT invoices.amount, customers.name, customers.image_url, customers.email
  FROM invoices
  JOIN customers ON invoices.customer_id = customers.id
  ORDER BY invoices.date DESC
  LIMIT 5`;
```

在你的页面中，导入 `fetchLatestInvoices` 函数：

```jsx showLineNumbers filename="/app/dashboard/page.tsx" {5,9} copy
import { Card } from "@/app/ui/dashboard/cards";
import RevenueChart from "@/app/ui/dashboard/revenue-chart";
import LatestInvoices from "@/app/ui/dashboard/latest-invoices";
import { lusitana } from "@/app/ui/fonts";
import { fetchRevenue, fetchLatestInvoices } from "@/app/lib/data";

export default async function Page() {
  const revenue = await fetchRevenue();
  const latestInvoices = await fetchLatestInvoices();
  // ...
}
```

然后，取消注释 `<LatestInvoices />` 组件。你还需要在 `<LatestInvoices />` 组件本身（位于 `/app/ui/dashboard/latest-invoices`）中取消注释相关代码。

如果你访问 localhost，你应该会看到只有最近的 5 张发票从数据库返回。希望你开始看到直接查询数据库的优势了！

![最新发票组件和收入图表一起显示](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter7-latest-invoices.avif)

## 练习：为 `<Card>` 组件获取数据

现在轮到你为 `<Card>` 组件获取数据了。卡片将显示以下数据：

- 已收款的发票总额。
- 待处理的发票总额。
- 发票的总数。
- 客户的总数。

再次，你可能会诱惑地获取所有发票和客户，并使用 JavaScript 操纵数据。例如，你可以使用 `Array.length` 来获取发票和客户的总数：

```js showLineNumbers copy
const totalInvoices = allInvoices.length;
const totalCustomers = allCustomers.length;
```

但是使用 SQL，你可以仅获取需要的数据。虽然使用 Array.length 要短一些，但这意味着在请求期间需要传输的数据较少。这是 SQL 的替代方法：

```js showLineNumbers filename="/app/lib/data.ts" copy
const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
```

你需要导入的函数叫做 `fetchCardData`。你需要解构函数返回的值。

提示：

- 检查卡片组件，看看它们需要什么数据。
- 检查 data.ts 文件，看看该函数返回什么。

当你准备好后，展开下面的切换以查看最终代码：

<details>
  <summary>点击展开/折叠</summary>

```jsx showLineNumbers filename="/app/dashboard/page.tsx" {8,14-19} copy
import { Card } from "@/app/ui/dashboard/cards";
import RevenueChart from "@/app/ui/dashboard/revenue-chart";
import LatestInvoices from "@/app/ui/dashboard/latest-invoices";
import { lusitana } from "@/app/ui/fonts";
import {
  fetchRevenue,
  fetchLatestInvoices,
  fetchCardData,
} from "@/app/lib/data";

export default async function Page() {
  const revenue = await fetchRevenue();
  const latestInvoices = await fetchLatestInvoices();
  const {
    numberOfInvoices,
    numberOfCustomers,
    totalPaidInvoices,
    totalPendingInvoices,
  } = await fetchCardData();

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Collected" value={totalPaidInvoices} type="collected" />
        <Card title="Pending" value={totalPendingInvoices} type="pending" />
        <Card title="Total Invoices" value={numberOfInvoices} type="invoices" />
        <Card
          title="Total Customers"
          value={numberOfCustomers}
          type="customers"
        />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <RevenueChart revenue={revenue} />
        <LatestInvoices latestInvoices={latestInvoices} />
      </div>
    </main>
  );
}
```

</details>

太好了！你现在已经为仪表板概览页面获取了所有数据。你的页面应该看起来像这样：

![仪表板页面，已获取所有数据](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter7-complete-dashboard.avif)

然而...有两件事情需要注意：

- 数据请求无意中相互阻塞，形成请求瀑布。
- 默认情况下，Next.js 对路由进行预渲染以提高性能，这称为静态渲染。因此，如果你的数据发生变化，它不会反映在你的 Dashboard 中。

让我们在本章中讨论第一点，然后在下一章详细了解第二点。

## 请求瀑布是什么？

"瀑布" 指的是一系列的网络请求序列，这些请求依赖于前面请求的完成。在数据获取的情况下，每个请求只能在前一个请求返回数据后才能开始。

![示意图显示按时间顺序进行顺序数据获取和并行数据获取](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter7-sequential-parallel-data-fetching.avif)

例如，我们需要等待 `fetchRevenue()` 执行完毕，然后 `fetchLatestInvoices()` 才能开始运行，以此类推。

```jsx showLineNumbers filename="/app/dashboard/page.tsx" copy
const revenue = await fetchRevenue();
const latestInvoices = await fetchLatestInvoices(); // 等待 fetchRevenue() 完成
const {
  numberOfInvoices,
  numberOfCustomers,
  totalPaidInvoices,
  totalPendingInvoices,
} = await fetchCardData(); // 等待 fetchLatestInvoices() 完成
```

这种模式不一定是不好的。有些情况下，你可能希望有瀑布，因为你希望在进行下一个请求之前满足某个条件。例如，你可能希望先获取用户的 ID 和个人资料信息。一旦有了 ID，你可能会继续获取他们的朋友列表。在这种情况下，每个请求都依赖于前一个请求返回的数据。

然而，这种行为也可能是无意的，并且会影响性能。

<QuizComponent
name="何时可能想要使用瀑布模式？"
answers={[
"在进行下一个请求之前满足条件时。",
"同时进行所有请求",
"通过一次只进行一次获取来减轻服务器负载",
]}
correctAnswer="在进行下一个请求之前满足条件时。"
/>

## 并行数据获取

避免瀑布的一种常见方式是同时启动所有数据请求 - 进行并行处理。

在 JavaScript 中，您可以使用 `Promise.all()` 或 `Promise.allSettled()` 函数同时启动所有 Promise。例如，在 `data.ts` 中，我们在 `fetchCardData()` 函数中使用了 `Promise.all()`：

```js showLineNumbers filename="/app/lib/data.js" {10-14} copy
export async function fetchCardData() {
  try {
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);
    // ...
  }
}
```

通过使用这种模式，您可以：

- 同时开始执行所有数据获取，这可能会带来性能提升。
- 使用可应用于任何库或框架的本机 JavaScript 模式。

然而，仅依赖此 JavaScript 模式有一个缺点：如果一个数据请求比其他所有请求慢，会发生什么？
