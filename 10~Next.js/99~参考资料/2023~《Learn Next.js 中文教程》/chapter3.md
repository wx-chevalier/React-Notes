import QuizComponent from './components/quiz-component';

# 优化字体和图片

在上一章中，您学习了如何为 Next.js 应用程序添加样式。让我们继续通过添加自定义字体和主页图片来完善您的主页。

以下是本章中将涵盖的主题：

- 如何使用 `next/font` 添加自定义字体。
- 如何使用 `next/image` 添加图片。
- Next.js 中如何优化字体和图片。

## 为什么要优化字体？

字体在网站设计中起着重要作用，但在项目中使用自定义字体可能会影响性能，特别是当需要获取和加载字体文件时。

[累积布局移位](https://web.dev/articles/cls?hl=zh-cn)（Cumulative Layout Shift）是 Google 用于评估网站性能和用户体验的度量标准。对于字体而言，布局移位发生在浏览器最初使用备用或系统字体呈现文本，然后在加载完自定义字体后进行替换。这种替换可能导致文本大小、间距或布局发生变化，从而使其周围的元素发生移位。

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter3-font-layout-shift.avif)

Next.js 在您使用 `next/font` 模块时会自动优化应用程序中的字体。它在构建时下载字体文件并将其托管在您的其他静态资产之中。这意味着当用户访问您的应用程序时，不会有额外的字体网络请求，从而不会影响性能。

<QuizComponent
name="Next.js 如何优化字体？"
answers={[
"它导致额外的网络请求，从而提高性能。",
"它禁用所有自定义字体。",
"它在运行时预加载所有字体。",
"它将字体文件与其他静态资源一起托管，因此没有额外的网络请求。",
]}
correctAnswer="它将字体文件与其他静态资源一起托管，因此没有额外的网络请求。"
/>

## 添加主要字体

让我们向您的应用程序添加一个自定义的 Google 字体，看看它是如何工作的！

在 `/app/ui` 文件夹中，创建一个名为 `fonts.ts` 的新文件。您将使用此文件来保存将在整个应用程序中使用的字体。

从 `next/font/google` 模块导入 `Inter` 字体 - 这将是您的主要字体。然后，指定您想要加载的子集。在这种情况下，是 `'latin'`：

```tsx showLineNumbers {1, 3} filename="/app/ui/fonts.ts" copy
import { Inter } from "next/font/google";

export const inter = Inter({ subsets: ["latin"] });
```

最后，在 /app/layout.tsx 中的 `<body>` 元素中添加字体：

```tsx showLineNumbers {2, 11} filename="/app/layout.tsx" copy
import "@/app/ui/global.css";
import { inter } from "@/app/ui/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
```

通过将 Inter 添加到 `<body>` 元素中，该字体将应用于整个应用程序。在这里，您还添加了 Tailwind 的 antialiased 类，该类可使字体更加平滑。使用这个类并不是必需的，但它会增添一些美感。

在浏览器中导航到开发者工具，选择 body 元素。您应该会在样式下看到 Inter 和 Inter_Fallback 已经被应用。

## 实践：添加次要字体

您还可以将字体添加到应用程序的特定元素。

现在轮到您了！在您的 fonts.ts 文件中，导入一个名为 Lusitana 的次要字体，并将其传递给 `/app/page.tsx` 文件中的 `<p>` 元素。除了像之前一样指定一个子集，您还需要指定字体的粗细。

准备好后，展开下面的代码片段以查看解决方案。

> 提示：
>
> - 如果您不确定要传递给字体的权重选项，请在代码编辑器中检查 TypeScript 错误。
> - 访问 Google Fonts 网站并搜索 Lusitana，查看可用的选项。
> - 查看添加多个字体和所有选项的完整列表的文档。

<details>
  <summary>点击展开/折叠</summary>

```tsx showLineNumbers {1, 5-8} filename="/app/ui/fonts.ts" copy
import { Inter, Lusitana } from "next/font/google";

export const inter = Inter({ subsets: ["latin"] });

export const lusitana = Lusitana({
  weight: ["400", "700"],
  subsets: ["latin"],
});
```

```tsx showLineNumbers {3, 8-11} filename="/app/page.tsx" copy
import AcmeLogo from "@/app/ui/acme-logo";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { lusitana } from "@/app/ui/fonts";

export default function Page() {
  return (
    // ...
    <p
      className={`${lusitana.className} text-xl text-gray-800 md:text-3xl md:leading-normal`}
    >
      <strong>Welcome to Acme.</strong> This is the example for the{" "}
      <a href="https://nextjs.org/learn/" className="text-blue-500">
        Learn Next.js Course
      </a>
      , brought to you by Vercel.
    </p>
    // ...
  );
}
```

</details>

最后，`<AcmeLogo />` 组件也使用了 Lusitana 字体。之前被注释掉是为了防止错误，现在你可以取消注释它：

```tsx showLineNumbers {7} filename="/app/page.tsx" copy
// ...

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-52">
        <AcmeLogo />
        {/* ... */}
      </div>
    </main>
  );
}
```

好的，您已将两种自定义字体添加到应用程序！接下来，让我们向主页添加一个主图像。

## 为什么要优化图片？

Next.js 可以在顶层 [/public](https://nextjs.org/docs/app/building-your-application/optimizing/static-assets) 文件夹下提供静态资源，如图片。`/public` 中的文件可以在你的应用程序中引用。

在常规的 HTML 中，你可以如下添加图片：

```html copy
<img
  src="/hero.png"
  alt="Screenshots of the dashboard project showing desktop version"
/>
```

然而，这意味着你必须手动：

- 确保你的图片在不同屏幕尺寸上具有响应性。
- 为不同设备指定图片大小。
- 防止图片加载时的布局变化。
- 对用户视口外的图片进行懒加载。

图片优化是 Web 开发中一个庞大的主题，可以被认为是一门专业领域。与手动实现这些优化相比，你可以使用 `next/image` 组件来自动优化你的图片。

## `<Image>` 组件

`<Image>` 组件是 HTML `<img>` 标签的扩展，具有自动图像优化功能，包括：

- 图片加载时自动防止布局移位。
- 调整图像大小，避免向视口较小的设备传送大图像。
- 默认情况下懒加载图像（图像在进入视口时加载）。
- 在浏览器支持的情况下，以现代格式提供图像，如 [WebP](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#webp) 和 [AVIF](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#avif_image)。

## 添加桌面版主图

让我们使用 `<Image>` 组件。如果你查看 `/public` 文件夹，你会看到有两张图片：`hero-desktop.png` 和 `hero-mobile.png`。这两张图片完全不同，它们将根据用户设备是桌面还是移动端而显示不同的图片。

在你的 `/app/page.tsx` 文件中，从 `next/image` 导入该组件。然后，在注释下方添加图片：

```jsx showLineNumbers {5, 12-18} filename="/app/page.tsx" copy
import AcmeLogo from "@/app/ui/acme-logo";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { lusitana } from "@/app/ui/fonts";
import Image from "next/image";

export default function Page() {
  return (
    // ...
    <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">
      {/* Add Hero Images Here */}
      <Image
        src="/hero-desktop.png"
        width={1000}
        height={760}
        className="hidden md:block"
        alt="Screenshots of the dashboard project showing desktop version"
      />
    </div>
    //...
  );
}
```

在这里，你将宽度设置为 `1000` 像素，高度设置为 `760` 像素。设置图像的宽度和高度以避免布局变化是一种良好的实践，这些应该是与源图像相同的纵横比。

你还会注意到使用了 `hidden` 类，这会在移动屏幕上从 DOM 中移除图片，而 `md:block` 会在桌面屏幕上显示图片。

你的主页现在应该是这个样子：

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter3-home-page-with-hero.avif)

## 实践：添加移动端主页图片

现在轮到你了！在刚刚添加的图片下面，再添加另一个用于 `hero-mobile.png` 的 `<Image>` 组件。

这张图片的宽度应该是 `560` 像素，高度是 `620` 像素。

它应该在移动屏幕上显示，在桌面上隐藏 - 你可以使用开发工具检查桌面和移动图片是否正确切换。

当你准备好时，展开下面的代码片段查看解决方案。

```jsx showLineNumbers {19-25} filename="/app/page.tsx" copy
import AcmeLogo from "@/app/ui/acme-logo";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { lusitana } from "@/app/ui/fonts";
import Image from "next/image";

export default function Page() {
  return (
    // ...
    <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">
      {/* Add Hero Images Here */}
      <Image
        src="/hero-desktop.png"
        width={1000}
        height={760}
        className="hidden md:block"
        alt="Screenshots of the dashboard project showing desktop version"
      />
      <Image
        src="/hero-mobile.png"
        width={560}
        height={620}
        className="block md:hidden"
        alt="Screenshot of the dashboard project showing mobile version"
      />
    </div>
    //...
  );
}
```

太好了！你的主页现在已经使用了自定义字体和主页图片。

<QuizComponent
name="True 或 False：没有指定尺寸的图像和 Web 字体是布局移位的常见原因。"
answers={[
"True",
"False",
]}
correctAnswer="True"
/>

## 推荐阅读

关于这些主题，还有很多可以学习的内容，包括优化远程图像和使用本地字体文件。如果您想深入了解字体和图像，请参阅：

- [图像优化文档](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [字体优化文档](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [使用图像改善 Web 性能 (MDN)](https://developer.mozilla.org/en-US/docs/Learn/Performance/Multimedia)
- [Web 字体 (MDN)](https://developer.mozilla.org/en-US/docs/Learn/CSS/Styling_text/Web_fonts)
