# 页面之间导航

在上一章中，您创建了 dashboard 的布局和页面。现在，让我们添加一些链接，以便用户可以在仪表板路由之间进行导航。

以下是本章中将涵盖的主题：

- 如何使用 `next/link` 组件。
- 如何使用 `usePathname()` 钩子显示活动链接。
- Next.js 中导航的工作原理。

## 为什么要优化导航？

为了在页面之间创建链接，传统上会使用 `<a>` HTML 元素。目前，侧边栏链接使用 `<a>` 元素，但请注意在浏览器中在主页、发票和客户页面之间导航时发生了什么。

您看到了吗？

每次页面导航时都会出现完整的页面刷新！

## `<Link>` 组件

在 Next.js 中，您可以使用 `<Link />` 组件在应用程序的页面之间进行链接。`<Link>` 允许您使用 JavaScript 进行[客户端导航](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#how-routing-and-navigation-works)。

要使用 `<Link />` 组件，请打开 `/app/ui/dashboard/nav-links.tsx`，并从 [next/link](https://nextjs.org/docs/app/api-reference/components/link) 导入 `Link` 组件。然后，将 `<a>` 标签替换为 `<Link>`：

```jsx showLineNumbers filename="/app/ui/dashboard/nav-links.tsx" {6,16,23} copy
import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

// ...

export default function NavLinks() {
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
```

正如您所见，Link 组件类似于使用 `<a>` 标签，但是您使用的不是 `<a href="…">`，而是 `<Link href="…">`。

保存更改并检查它是否在您的 localhost 上运行。现在，您应该能够在页面之间导航，而无需看到完整的刷新。尽管应用程序的某些部分是在服务器上渲染的，但没有完整的页面刷新，使其感觉像一个 web 应用程序。这是为什么呢？

## 自动代码拆分和预取

为了提高导航体验，Next.js 会自动按路由段拆分您的应用程序。这与传统的 React [SPA](https://developer.mozilla.org/en-US/docs/Glossary/SPA) 不同，传统 SPA 在初始加载时会加载应用程序的所有代码。

按路由拆分代码意味着页面变得隔离。如果某个页面抛出错误，应用程序的其余部分仍将正常工作。

此外，在生产环境中，每当 `<Link>` 组件出现在浏览器的视口中时，Next.js 会自动在后台预取链接路由的代码。当用户点击链接时，目标页面的代码将在后台已经加载，这就是使页面过渡几乎瞬间完成的原因！

了解更多关于[导航如何工作](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#how-routing-and-navigation-works)的信息。

<QuizComponent
  name="当在生产环境中浏览器的视口中出现一个 <Link> 组件时，Next.js 会执行以下哪个操作？"
  answers={[
    "下载额外的 CSS",
    "预加载图片",
    "预取链接路由的代码",
    "为链接的路由启用懒加载",
  ]}
  correctAnswer="预取链接路由的代码"
/>

## 模式：显示活动链接

一种常见的用户界面模式是显示活动链接，以向用户指示他们当前所在的页面。为了做到这一点，您需要从 URL 中获取用户当前的路径。Next.js 提供了一个名为 `usePathname()` 的钩子，您可以使用它来检查路径并实现此模式。

由于 [usePathname()](https://nextjs.org/docs/app/api-reference/functions/use-pathname) 是一个钩子，您需要将 `nav-links.tsx` 转换为客户端组件。在文件顶部添加 React 的 `"use client"` 指令，然后从 `next/navigation` 导入 `usePathname()`：

```jsx showLineNumbers filename="/app/ui/dashboard/nav-links.tsx" {1,9} copy
"use client";

import {
  UserGroupIcon,
  HomeIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ...
```

接下来，在你的 `<NavLinks />` 组件内部，将路径赋值给一个名为 pathname 的变量：

```jsx filename="/app/ui/dashboard/nav-links.tsx" {2} copy
export default function NavLinks() {
  const pathname = usePathname();
  // ...
}
```

你可以使用在 [CSS 样式](https://nextjs.org/learn/dashboard-app/css-styling)章节介绍的 `clsx` 库，在链接处于活动状态时有条件地应用类名。当 `link.href` 与 `pathname` 匹配时，链接应该显示为蓝色文本和浅蓝色背景。

以下是 `nav-links.tsx` 的最终代码：

```jsx showLineNumbers filename="/app/ui/dashboard/nav-links.tsx" {10,25-30} copy
"use client";

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// ...

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              "flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
              {
                "bg-sky-100 text-blue-600": pathname === link.href,
              }
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
```

保存并检查你的本地主机。现在，你应该看到活动链接以蓝色突出显示。
