# CSS 样式

当前，您的首页没有任何样式。让我们看看为 Next.js 应用程序添加样式的不同方法。

以下是本章中将涵盖的主题：

- 如何向应用程序添加全局 CSS 文件。
- 两种不同的样式方式：Tailwind 和 CSS Modules。
- 如何使用 clsx 实用程序包有条件地添加类名。

## 全局样式

如果您查看 `/app/ui` 文件夹内，您会看到一个名为 `global.css` 的文件。您可以使用此文件向应用程序的所有路由添加 CSS 规则，例如 CSS 重置规则、用于链接等 HTML 元素的全局样式等。

您可以在应用程序中的任何组件中导入 `global.css`，但通常最好的做法是将其添加到顶级组件中。在 Next.js 中，这就是根布局（稍后会详细介绍）。

在 `/app/layout.tsx` 文件内导入 `global.css` 样式文件，将全局样式添加到您的应用程序：

```js showLineNumbers {1} filename="/app/layout.tsx" copy
import "@/app/ui/global.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

保存更改并在浏览器中预览。您的首页现在应该如下所示：

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter2-home-page-with-tailwind.avif)

但等一下，您并没有添加任何 CSS 规则，样式是从哪里来的？

如果您查看 `global.css` 内部，您会注意到一些 `@tailwind` 指令：

```css showLineNumbers filename="/app/ui/global.css" copy
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Tailwind

[Tailwind](https://tailwindcss.com/) 是一个 CSS 框架，通过允许您在 TSX 标记中直接快速编写[实用类](https://tailwindcss.com/docs/utility-first)，加速开发过程。

在 Tailwind 中，您通过添加类名来为元素添加样式。例如，添加类 `"text-blue-500"` 将使 `<h1>` 文本变成蓝色：

```html copy
<h1 className="text-blue-500">I'm blue!</h1>
```

尽管 CSS 样式在全局共享，但每个类都是单独应用于每个元素。这意味着如果您添加或删除一个元素，您不必担心维护单独的样式表、样式冲突或者随着应用程序规模扩大而增加 CSS 捆绑的大小。

当您使用 `create-next-app` 启动新项目时，Next.js 会询问您是否要使用 Tailwind。如果选择 `Yes`，Next.js 将自动安装必要的包并在您的应用程序中配置 Tailwind。

如果您查看 `/app/page.tsx`，您将看到我们在示例中使用 Tailwind 类。

```jsx showLineNumbers filename="/app/page.tsx" copy
import AcmeLogo from '@/app/ui/acme-logo';
import Link from 'next/link';

export default function Page() {
  return (
    // These are Tailwind classes:
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-52">
    // ...
  )
}
```

如果这是您第一次使用 Tailwind，请不要担心。为了节省时间，我们已经为您样式化了所有要使用的组件。

让我们玩一下 Tailwind！复制下面的代码并将其粘贴到 `/app/page.tsx` 中 `<p>` 元素上方：

```jsx showLineNumbers filename="/app/page.tsx" copy
<div className="h-0 w-0 border-b-[30px] border-l-[20px] border-r-[20px] border-b-black border-l-transparent border-r-transparent" />
```

<QuizComponent
name="在使用上述代码片段时，你看到的形状是"
answers={[
"一个黄色的星星",
"一个蓝色的三角形",
"一个黑色的三角形",
"一个红色的圆圈",
]}
correctAnswer="一个黑色的三角形"
/>

如果你更喜欢编写传统的 CSS 规则或者希望将样式与 JSX 代码分开 - CSS Modules 是一个很好的选择。

## CSS Modules

[CSS Modules](https://nextjs.org/docs/pages/building-your-application/styling) 允许你通过自动生成独特的类名将 CSS 限定在一个组件中，这样你就不必担心样式冲突。

在这个课程中，我们将继续使用 Tailwind，但让我们花一点时间看看如何使用 CSS 模块来实现上面小测验的相同效果。

在 `/app/ui` 目录下，创建一个名为 `home.module.css` 的新文件，然后添加以下 CSS 规则：

```css showLineNumbers filename="/app/ui/home.module.css" copy
.shape {
  height: 0;
  width: 0;
  border-bottom: 30px solid black;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
}
```

然后，在你的 `/app/page.tsx` 文件中导入这些样式，并用 `styles.shape` 替换你添加的 `<div>` 中的 Tailwind 类名：

```jsx showLineNumbers {1, 5} filename="/app/page.tsx" copy
import styles from '@/app/ui/home.module.css';

//...
<div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
    <div className={styles.shape}></div>;
// ...
```

保存更改并在浏览器中预览。你应该看到与之前相同的形状。

Tailwind 和 CSS 模块是样式化 Next.js 应用程序的两种最常见的方法。使用其中之一取决于个人喜好 - 你甚至可以在同一个应用程序中同时使用它们两者！

<QuizComponent
name="CSS Modules 的一个优势是什么？"
answers={[
"扩大 CSS 类的全局范围，使其在不同文件中更易管理。",
"默认情况下，提供使 CSS 类在组件范围内局部作用的方法，实现更好的模块化，减少样式冲突的风险。",
"自动压缩和缩小 CSS 文件以加快页面加载速度。",
]}
correctAnswer="默认情况下，提供使 CSS 类在组件范围内局部作用的方法，实现更好的模块化，减少样式冲突的风险。"
/>

## 使用 clsx 库切换类名

在某些情况下，您可能需要根据状态或其他条件有条件地为元素设置样式。

[clsx](https://www.npmjs.com/package/clsx) 是一个库，让您可以轻松地切换类名。我们建议查看[文档](https://github.com/lukeed/clsx)以获取更多详细信息，但以下是基本用法：

- 假设您想要创建一个名为 `InvoiceStatus` 的组件，该组件接受状态。状态可以是 `'pending'` 或 `'paid'`。
- 如果是 `'paid'`，您希望颜色是绿色。如果是 'pending'，您希望颜色是灰色。

您可以使用 clsx 来有条件地应用类，例如：

```tsx showLineNumbers {9-10} filename="/app/ui/invoices/status.tsx" copy
import clsx from 'clsx';

export default function InvoiceStatus({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-1 text-sm',
        {
          'bg-gray-100 text-gray-500': status === 'pending',
          'bg-green-500 text-white': status === 'paid',
        },
      )}
    >
    // ...
)}
```

<QuizComponent
name="在代码编辑器中搜索 'clsx'，哪些组件使用它来有条件地应用类名？"
answers={[
"status.tsx 和 pagination.tsx",
"table.tsx 和 status.tsx",
"nav-links.tsx 和 table.tsx",
]}
correctAnswer="status.tsx 和 pagination.tsx"
/>

## 其他样式解决方案

除了我们讨论过的方法之外，您还可以使用以下方式为 Next.js 应用程序添加样式：

- Sass： 允许您导入 `.css` 和 `.scss` 文件。
- CSS-in-JS 库： 例如 [styled-jsx](https://github.com/vercel/styled-jsx)、[styled-components](https://github.com/vercel/next.js/tree/canary/examples/with-styled-components) 和 [emotion](https://github.com/vercel/next.js/tree/canary/examples/with-emotion)。
- 查看 [CSS 文档](https://nextjs.org/docs/app/building-your-application/styling)以获取更多信息。
