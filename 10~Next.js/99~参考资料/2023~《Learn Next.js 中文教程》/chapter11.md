# 添加搜索和分页

在前一章中，通过流式传输提高了 Dashboard 的初始加载性能。现在让我们转到 `/invoices` 页面，学习如何添加搜索和分页！

以下是本章中将涵盖的主题：

- 学习如何使用 Next.js 的 API：searchParams、usePathname 和 useRouter。
- 使用 URL 搜索参数实现搜索和分页。

## 初始代码

在您的 `/dashboard/invoices/page.tsx` 文件中，粘贴以下代码：

```tsx showLineNumbers filename="/app/dashboard/invoices/page.tsx" copy
import Pagination from "@/app/ui/invoices/pagination";
import Search from "@/app/ui/search";
import Table from "@/app/ui/invoices/table";
import { CreateInvoice } from "@/app/ui/invoices/buttons";
import { lusitana } from "@/app/ui/fonts";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import { Suspense } from "react";

export default async function Page() {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        <CreateInvoice />
      </div>
      {/*  <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense> */}
      <div className="mt-5 flex w-full justify-center">
        {/* <Pagination totalPages={totalPages} /> */}
      </div>
    </div>
  );
}
```

花一些时间熟悉页面和您将要使用的组件：

- `<Search/>` 允许用户搜索特定的发票。
- `<Pagination/>` 允许用户在发票的页面之间导航。
- `<Table/>` 显示发票。

您的搜索功能将跨足客户端和服务器。当用户在客户端搜索发票时，URL 参数将被更新，在服务器上获取数据，并使用新数据重新呈现表格。

## 为什么使用 URL 搜索参数？

如上所述，您将使用 URL 搜索参数来管理搜索状态。如果您习惯于使用客户端状态进行搜索，这种模式可能是新的。

使用 URL 参数实现搜索有一些好处：

- **书签和共享的 URL**：由于搜索参数在 URL 中，用户可以将应用程序的当前状态，包括其搜索查询和过滤器，收藏夹起来以供将来参考或分享。
- **服务器端渲染和初始加载**：可以直接在服务器上使用 URL 参数以呈现初始状态，使处理服务器端渲染变得更容易。
- **分析和跟踪**：直接在 URL 中包含搜索查询和过滤器使得更容易跟踪用户行为，而无需额外的客户端逻辑。

## 添加搜索功能

以下是您将用于实现搜索功能的 Next.js 客户端 hooks：

- `useSearchParams` - 允许您访问当前 URL 的参数。例如，此 URL `/dashboard/invoices?page=1&query=pending` 的搜索参数将是：`{page: '1', query: 'pending'}`。
- `usePathname` - 允许您读取当前 URL 的路径名。例如，对于路由 `/dashboard/invoices`，`usePathname` 将返回 `'/dashboard/invoices'`。
- `useRouter` - 使您能够在客户端组件内以编程方式在路由之间导航。有[多种方法](https://nextjs.org/docs/app/api-reference/functions/use-router#userouter)可供您使用。

以下是实现步骤的快速概述：

- 捕获用户的输入。
- 使用搜索参数更新 URL。
- 保持 URL 与输入字段同步。
- 更新表以反映搜索查询。

## 1. 捕获用户的输入

进入 `<Search>` 组件（`/app/ui/search.tsx`），您会注意到：

- `"use client"` - 这是一个客户端组件，这意味着您可以使用事件监听器和 hook。
- `<input>` - 这是搜索输入。

创建一个新的 `handleSearch` 函数，并为 `<input>` 元素添加一个 `onChange` 监听器。每当输入值发生变化时，`onChange` 将调用 `handleSearch`。

```ts showLineNumbers filename="/app/ui/search.tsx" {6-8,18-20} copy
"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function Search({ placeholder }: { placeholder: string }) {
  function handleSearch(term: string) {
    console.log(term);
  }

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
```

打开开发者工具中的控制台（console）测试上述代码是否正常工作，然后在搜索框架内输入内容。您应该在控制台中看到搜索词被记录。

太棒了！您已经捕获了用户的搜索输入。现在，您需要使用搜索词更新 URL。

## 2. 随着搜索参数更新 URL

从 `'next/navigation'` 导入 `useSearchParams` hook， 并将其赋值给一个变量：

```ts showLineNumbers filename="/app/ui/search.tsx" {4,7} copy
"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";

export default function Search() {
  const searchParams = useSearchParams();

  function handleSearch(term: string) {
    console.log(term);
  }
  // ...
}
```

在 handleSearch 中，使用新的 searchParams 变量创建一个新的 URLSearchParams 实例。

```ts showLineNumbers filename="/app/ui/search.tsx" {10} copy
"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";

export default function Search() {
  const searchParams = useSearchParams();

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams);
  }
  // ...
}
```

`URLSearchParams` 是一个 `Web API`，提供了操纵 `URL` 查询参数的实用方法。与创建复杂的字符串文字不同，您可以使用它获取参数字符串，例如 `?page=1&query=a`。

接下来，根据用户的输入设置 `params` 字符串。如果输入为空，您将要删除它：

```ts showLineNumbers filename="/app/ui/search.tsx" {11,15} copy
"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";

export default function Search() {
  const searchParams = useSearchParams();

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
  }
  // ...
}
```

现在您有了查询字符串。您可以使用 Next.js 的 `useRouter` 和 `usePathname` hook 来更新 URL。

从 `'next/navigation'` 导入 `useRouter` 和 `usePathname`，并在 `handleSearch` 中使用 `useRouter()` 的 `replace` 方法：

```ts showLineNumbers filename="/app/ui/search.tsx" {4,18} copy
"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

export default function Search() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }
}
```

这里是正在发生的事情的详细说明：

- `${pathname}` 是当前路径，在您的案例中是 `"/dashboard/invoices"`。
- 当用户在搜索栏中键入时，`params.toString()` 将此输入转换为友好的 URL 格式。
- `replace(${pathname}?${params.toString()})` 更新 URL，其中包含用户的搜索数据。例如，如果用户搜索 "Lee"，则为 `/dashboard/invoices?query=lee`。
- 由于 Next.js 的客户端导航（您在[导航页面的章节中](https://qufei1993.github.io/nextjs-learn-cn/chapter5)了解到的）URL 无需重新加载页面即可更新。

## 3. 保持 URL 和输入同步

为确保输入字段与 URL 同步，并在共享时填充，您可以通过从 `searchParams` 中读取传递一个 `defaultValue` 给 input：

```ts showLineNumbers filename="/app/ui/search.tsx" {7} copy
<input
  className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
  placeholder={placeholder}
  onChange={(e) => {
    handleSearch(e.target.value);
  }}
  defaultValue={searchParams.get("query")?.toString()}
/>
```

> defaultValue vs. value / 受控 vs. 不受控  
> 如果您使用状态来管理输入的值，您将使用 value 属性使其成为受控组件。这意味着 React 将管理输入的状态。  
> 然而，由于您没有使用状态，您可以使用 defaultValue。这意味着原生输入将管理自己的状态。这是可以的，因为您将搜索查询保存到 URL 而不是状态。

## 4. 更新表格

最后，您需要更新表格组件以反映搜索查询。

导航回到发票页面。

页面组件接受一个[名为 searchParams 的 prop](https://nextjs.org/docs/app/api-reference/file-conventions/page)，因此您可以将当前的 URL 参数传递给 `<Table>` 组件。

```ts showLineNumbers filename="/app/dashboard/invoices/page.tsx" {9-18, 29-31} copy
import Pagination from "@/app/ui/invoices/pagination";
import Search from "@/app/ui/search";
import Table from "@/app/ui/invoices/table";
import { CreateInvoice } from "@/app/ui/invoices/buttons";
import { lusitana } from "@/app/ui/fonts";
import { Suspense } from "react";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        <CreateInvoice />
      </div>
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        {/* <Pagination totalPages={totalPages} /> */}
      </div>
    </div>
  );
}
```

如果导航到 `<Table>` 组件，您将看到两个 prop，`query` 和 `currentPage`，传递给 `fetchFilteredInvoices()` 函数，该函数返回与查询匹配的发票。

```ts showLineNumbers filename="/app/ui/invoices/table.tsx" copy
// ...
export default async function InvoicesTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const invoices = await fetchFilteredInvoices(query, currentPage);
  // ...
}
```

有了这些变化，继续测试。如果搜索一个词，您将更新 URL，这将向服务器发送一个新的请求，在服务器上获取数据，只有与查询匹配的发票将被返回。

> **何时使用 `useSearchParams()` hook vs. `searchParams` prop？**  
> 您可能已经注意到您使用了两种不同的方法来提取搜索参数。您使用其中一种取决于您是在客户端还是服务器上工作。
>
> - `<Search>` 是一个客户端组件，因此您使用 `useSearchParams()` hook 从客户端访问参数。
> - `<Table>` 是一个服务器组件，它自己获取数据，因此您可以将 `searchParams prop` 从页面传递给组件。
>
> 作为一般规则，如果要从客户端读取参数，请使用 `useSearchParams()` hook，因为这样可以避免返回到服务器。

## 最佳实践：防抖

恭喜！您已经在 Next.js 中实现了搜索！但是有一些优化操作可以进行。

在您的 `handleSearch` 函数内部，添加以下 `console.log`：

```ts showLineNumbers filename="/app/ui/search.tsx" {2} copy
function handleSearch(term: string) {
  console.log(`Searching... ${term}`);

  const params = new URLSearchParams(searchParams);
  if (term) {
    params.set("query", term);
  } else {
    params.delete("query");
  }
  replace(`${pathname}?${params.toString()}`);
}
```

然后在搜索栏中键入 "Emil" 并检查开发工具中的控制台。发生了什么？

```bash showLineNumbers filename="Dev Tools Console" copy
Searching... E
Searching... Em
Searching... Emi
Searching... Emil
```

您在每次按键时都更新了 URL，因此在每次按键时都在查询数据库！虽然在我们的应用程序中这不是问题，但想象一下如果您的应用程序有数千用户，每个用户在每次按键时都向数据库发送新请求，那将会是一个问题。

防抖是一种编程实践，用于限制函数触发的速率。在我们的情况下，只有在用户停止输入时才希望查询数据库。

防抖的工作原理：

1. 触发事件：当发生应该被防抖的事件（比如搜索框中的按键）时，定时器启动。
2. 等待：如果在计时器到期之前发生新事件，则重置计时器。
3. 执行：如果计时器达到倒计时结束，将执行防抖函数。

您可以以几种方式实现防抖，包括手动创建自己的防抖函数。为了保持简单，我们将使用一个名为 use-debounce 的库。

安装 use-debounce：

```bash showLineNumbers filename="Terminal" copy
npm i use-debounce
```

在您的 `<Search>` 组件中，导入一个名为 `useDebouncedCallback` 的函数：

```ts showLineNumbers filename="/app/ui/search.tsx" {2,5,15} copy
// ...
import { useDebouncedCallback } from "use-debounce";

// Inside the Search Component...
const handleSearch = useDebouncedCallback((term) => {
  console.log(`Searching... ${term}`);

  const params = new URLSearchParams(searchParams);
  if (term) {
    params.set("query", term);
  } else {
    params.delete("query");
  }
  replace(`${pathname}?${params.toString()}`);
}, 300);
```

这个函数将包装 `handleSearch` 的内容，并且只有在用户停止输入一段时间后（300 毫秒）才运行代码。

现在再次在搜索栏中键入，并在开发工具中打开控制台。您应该会看到以下内容：

```bash showLineNumbers filename="Dev Tools Console" copy
Searching... Emil
```

通过防抖，您可以减少发送到数据库的请求数量，从而节省资源。

<QuizComponent
  name="防抖在搜索功能中解决了什么问题？"
  answers={[
    "它加速数据库查询",
    "它使 URL 可以被书签保存",
    "它防止在每次按键时进行新的数据库查询",
    "它有助于进行 SEO 优化",
  ]}
  correctAnswer="它防止在每次按键时进行新的数据库查询"
/>

## 添加分页

在引入搜索功能之后，您会注意到表格一次只显示 6 张发票。这是因为 `data.ts` 中的 `fetchFilteredInvoices()` 函数每页返回最多 6 张发票。

添加分页允许用户浏览不同页面以查看所有发票。让我们看看如何使用 URL 参数实现分页，就像您在搜索中所做的那样。

导航到 `<Pagination/>` 组件，您会注意到它是一个客户端组件。您不希望在客户端上获取数据，因为这会暴露您的数据库凭据（请记住，您没有使用 API 层）。相反，您可以在服务器上获取数据，并将其作为 prop 传递给组件。

在 `/dashboard/invoices/page.tsx` 中，导入一个名为 `fetchInvoicesPages` 的新函数，并将 `searchParams` 中的查询作为参数传递：

```ts showLineNumbers filename="/app/dashboard/invoices/page.tsx" {2,15} copy
// ...
import { fetchInvoicesPages } from '@/app/lib/data';

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string,
    page?: string,
  },
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const totalPages = await fetchInvoicesPages(query);

  return (
    // ...
  );
}
```

`fetchInvoicesPages` 根据搜索查询返回页面的总数。例如，如果有 12 张与搜索查询匹配的发票，并且每页显示 6 张发票，那么总页数将为 2。

接下来，将 `totalPages` 属性传递给 `<Pagination/>` 组件：

```ts showLineNumbers filename="/app/dashboard/invoices/page.tsx" {29} copy
// ...

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;

  const totalPages = await fetchInvoicesPages(query);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        <CreateInvoice />
      </div>
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
```

导航到 `<Pagination/>` 组件并导入 `usePathname` 和 `useSearchParams` hooks。我们将使用这两者来获取当前页并设置新的页数。确保在此组件中取消注释代码。由于您尚未实现 `<Pagination/>` 逻辑，您的应用程序将暂时中断。现在让我们来做这个！

```ts showLineNumbers filename="/app/ui/invoices/pagination.tsx" {7,10-12} copy
"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { generatePagination } from "@/app/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";

export default function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  // ...
}
```

接下来，在 `<Pagination>` 组件中创建一个名为 `createPageURL` 的新函数。类似于搜索，您将使用 `URLSearchParams` 来设置新的页码，并使用 `pathName` 创建 URL 字符串。

```ts showLineNumbers filename="/app/ui/invoices/pagination.tsx" {14-18} copy
"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { generatePagination } from "@/app/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";

export default function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // ...
}
```

这里是正在发生的事情的详细说明：

- `createPageURL` 创建当前搜索参数的实例。
- 然后，它更新 `"page"` 参数为提供的 `pageNumber`。
- 最后，使用 `pathname` 和更新后的搜索参数构造完整的 URL。

`<Pagination>` 组件的其余部分涉及样式和不同状态（第一页、最后一页、活动、禁用等）。我们不会详细介绍这门课程，但请随时查看代码以查看 `createPageURL` 在哪里被调用。

最后，当用户键入新的搜索查询时，您希望将页码重置为 1。您可以通过更新 `<Search>` 组件中的 `handleSearch` 函数来实现这一点：

```ts showLineNumbers filename="/app/ui/search.tsx" {14} copy
"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);
}
```

## 总结

恭喜你！你刚刚使用 URL 参数和 Next.js API 实现了搜索和分页。

总结一下，在本章中：

- 你使用 URL 搜索参数而不是客户端状态处理了搜索和分页。
- 你在服务器上获取了数据。
- 你使用了 useRouter 路由 Hook 以实现更平滑的客户端过渡。

这些模式与你在使用客户端 React 时可能习惯的方式有所不同，但希望现在你更好地理解了使用 URL 搜索参数并将该状态提升到服务器的好处。
