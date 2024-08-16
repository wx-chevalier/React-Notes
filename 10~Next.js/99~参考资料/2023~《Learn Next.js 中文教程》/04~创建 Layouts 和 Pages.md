# 创建 Layouts 和 Pages

到目前为止，你的应用只有一个主页。让我们学习如何使用布局和页面创建更多路由。

以下是本章中将涵盖的主题：

- 使用文件系统路由创建仪表板路由。
- 了解在创建新路由段时文件夹和文件的作用。
- 创建一个可以在多个仪表板页面之间共享的嵌套布局。
- 了解放置同位置、部分渲染和根布局的作用。

## 嵌套路由

Next.js 使用文件系统路由，其中文件夹用于创建嵌套路由。每个文件夹代表一个路由段，对应到一个 URL 段。

图示展示了文件夹如何映射到 URL 段

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter4-folders-to-url-segments.avif)

你可以使用 `layout.tsx` 和 `page.tsx` 文件为每个路由创建单独的用户界面。

`page.tsx` 是 Next.js 的一个特殊文件，它导出一个 React 组件，让该路由可访问是必需的。在你的应用中，已经有一个页面文件：`/app/page.tsx` - 这是与路由 `/` 相关联的主页。

要创建嵌套路由，可以将文件夹嵌套在彼此之内，并在其中添加 `page.tsx` 文件。例如：

![图示展示了如何添加名为 dashboard 的文件夹以创建新路由 '/dashboard'](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter4-static-site-generation.avif)

`/app/dashboard/page.tsx` 与路径 `/dashboard` 相关联。让我们创建页面看看它是如何工作的！

## 创建 Dashboard 页面

在 `/app` 中创建一个名为 `dashboard` 的新文件夹。然后，在 `dashboard` 文件夹内创建一个名为 `page.tsx` 的新文件，其内容如下：

```jsx showLineNumbers filename="/app/dashboard/page.tsx" copy
export default function Page() {
  return <p>Dashboard Page</p>;
}
```

现在，确保开发服务器正在运行，并访问 [http://localhost:3000/dashboard](http://localhost:3000/dashboard)。 你应该看到 "`Dashboard Page`" 文本。

这就是在 Next.js 中创建不同页面的方式：使用文件夹创建新的路由段，并在其中添加一个 `page` 文件。

通过为页面文件使用特殊的名称，Next.js 允许你将 UI 组件、测试文件和其他相关代码与路由放置在一起。只有页面文件内部的内容才会被公开访问。例如，`/ui` 和 `/lib` 文件夹与你的路由一起放置在 `/app` 文件夹中。

## 实践：创建仪表板页面

让我们练习创建更多的路由。在你的 `dashboard` 中，创建两个额外的页面：

- **顾客页面（Customers Page）**：该页面应该在 http://localhost:3000/dashboard/customers 上可访问。暂时返回一个 `<p>Customers Page</p>` 元素。
- **发票页面（Invoices Page）**：发票页面应该在 http://localhost:3000/dashboard/invoices 上可访问。暂时也返回一个 `<p>Invoices Page</p>` 元素。

花点时间解决这个练习，当你准备好时，展开下面的切换查看解决方案：

<details>
  <summary>点击展开/折叠</summary>

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter4-routing-solution.avif)

Customers Page:

```jsx showLineNumbers filename="/app/dashboard/customers/page.tsx" copy
export default function Page() {
  return <p>Customers Page</p>;
}
```

Invoices Page:

```jsx showLineNumbers filename="/app/dashboard/invoices/page.tsx" copy
export default function Page() {
  return <p>Invoices Page</p>;
}
```

</details>

## 创建 dashboard 布局

dashboard 通常具有在多个页面之间共享的导航。在 Next.js 中，你可以使用一个特殊的 layout.tsx 文件来创建在多个页面之间共享的 UI。让我们为 dashboard 页面创建一个布局！

在 `/dashboard` 文件夹中，添加一个名为 `layout.tsx` 的新文件，并粘贴以下代码：

```jsx showLineNumbers filename="/app/dashboard/layout.tsx" copy
import SideNav from "@/app/ui/dashboard/sidenav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}
```

这段代码中发生了一些事情，让我们来详细解释一下：

首先，你将 `<SideNav />` 组件导入到你的布局中。你导入到这个文件中的任何组件都将成为布局的一部分。

`<Layout />` 组件接收一个 `children` 属性。这个子组件可以是一个页面或另一个布局。在你的情况下，位于 `/dashboard` 中的页面将自动嵌套在 `<Layout />` 中，如下所示：

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter-4-shared-layout.avif)

检查一切是否正确运行，保存你的更改并检查你的本地主机。你应该会看到以下内容：

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter4-shared-layout-page.avif)

在 Next.js 中使用布局的一个好处是，在导航时，只有页面组件会更新，而布局不会重新渲染。这被称为[部分渲染](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#3-partial-rendering)。

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter4-partial-rendering-dashboard.avif)

## 根布局（layout）

在第三章中，你将 Inter 字体引入到另一个布局中：`/app/layout.tsx`。作为提醒：

```jsx showLineNumbers filename="/app/layout.tsx" copy
import "@/app/ui/global.css";
import { inter } from "@/app/ui/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
```

这被称为根布局，是必需的。你添加到根布局的任何 UI 将在应用程序中的所有页面之间共享。你可以使用根布局来修改 `<html>` 和 `<body>` 标签，添加元数据（关于元数据的更多内容将在后面的章节中学到）。

由于你刚刚创建的新布局（`/app/dashboard/layout.tsx`）专门用于 dashboard 页面，因此不需要在上述根布局中添加任何 UI。

<QuizComponent
name="Next.js 中 layout 文件的目的是什么？"
answers={[
"充当全局错误处理程序",
"获取数据并在整个应用程序中管理状态",
"在多个页面之间共享 UI",
"充当整个应用程序的入口点",
]}
correctAnswer="在多个页面之间共享 UI"
/>
