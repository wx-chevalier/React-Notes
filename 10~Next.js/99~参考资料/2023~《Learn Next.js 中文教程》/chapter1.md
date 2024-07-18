# 入门

## 创建新项目

要创建一个 Next.js 应用程序，请打开终端，进入您想要存储项目的文件夹，并运行以下命令：

```javascript copy
npx create-next-app@latest nextjs-dashboard --use-npm --example "https://github.com/vercel/next-learn/tree/main/dashboard/starter-example"
```

该命令使用 [create-next-app](https://nextjs.org/docs/app/api-reference/create-next-app)，这是一个命令行接口（CLI）工具，可以为您设置一个 Next.js 应用程序。在上述命令中，您还使用 `--example` 标志与此课程的入门 [示例](https://github.com/vercel/next-learn/tree/main/dashboard/starter-example) 一起使用。

## 浏览项目

与让您从头编写代码的教程不同，这门课程的大部分代码已经为您编写了。这更好地反映了现实世界的开发，您可能会与现有的代码库一起工作。

我们的目标是帮助您专注于学习 Next.js 的主要特性，而无需编写所有应用程序代码。

安装后，在代码编辑器中打开项目并导航到 `nextjs-dashboard`。

让我们花些时间来探索项目。

## 文件夹结构

您会注意到项目具有以下文件夹结构：

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter1-learn-folder-structure.avif)

- `/app`：包含应用程序的所有路由、组件和逻辑，这是您将主要从中工作的地方。
- `/app/lib`：包含在应用程序中使用的函数，例如可重用的实用函数和数据获取函数。
- `/app/ui`：包含应用程序的所有 UI 组件，例如卡片、表格和表单。为节省时间，我们已经为您预先样式化了这些组件。
- `/public`：包含应用程序的所有静态资产，例如图片。
- `/script/`：包含一个 seeding（这里翻译为 “播种” 可以理解为数据库的 Migration）脚本，您将在后面的章节中使用它来填充您的数据库。
- `配置文件`：您还会注意到应用程序根目录下有一些配置文件，例如 `next.config.js`。大多数这些文件在使用 `create-next-app`` 启动新项目时会被创建和预配置。在本课程中，您不需要修改它们。

随意探索这些文件夹，如果您还不理解代码正在执行的一切，不用担心。

## Placeholder data（占位数据）

在构建用户界面时，使用一些占位数据很有帮助。如果尚未提供数据库或 API，您可以：

- 使用 JSON 格式的占位数据或作为 JavaScript 对象。
- 使用第三方服务，如 [mockAPI](https://mockapi.io/)。

对于此项目，我们在 `app/lib/placeholder-data.js` 中提供了一些占位数据。文件中的每个 JavaScript 对象代表数据库中的一张表。例如，对于发票表：

```javascript showLineNumbers filename="/app/lib/placeholder-data.js" copy
const invoices = [
  {
    customer_id: customers[0].id,
    amount: 15795,
    status: "pending",
    date: "2022-12-06",
  },
  {
    customer_id: customers[1].id,
    amount: 20348,
    status: "pending",
    date: "2022-11-14",
  },
  // ...
];
```

在设置数据库的章节中，您将使用这些数据来填充数据库（用一些初始数据填充它）。

## TypeScript

您可能还注意到大多数文件都带有 `.ts` 或 `.tsx` 后缀。这是因为该项目是使用 TypeScript 编写的。我们希望创建一个反映现代 web 环境的课程。

如果您不熟悉 TypeScript，没关系 - 在需要时，我们将提供 TypeScript 代码片段。

现在，请查看 `/app/lib/definitions.ts` 文件。在这里，我们手动定义了将从数据库返回的类型。例如，发票表具有以下类型：

```javascript showLineNumbers filename="/app/lib/definitions.ts" copy
export type Invoice = {
  id: string,
  customer_id: string,
  amount: number,
  date: string,
  // In TypeScript, this is called a string union type.
  // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
  status: "pending" | "paid",
};
```

通过使用 TypeScript，您可以确保不会意外地将错误的数据格式传递给组件或数据库，比如将 `number` 类型传递给发票 `amount` 属性而不是 `string` 类型。

如果您是 TypeScript 开发者：

- 我们手动声明数据类型，但为了更好的类型安全性，我们建议使用 [Prisma](https://www.prisma.io/)，它会根据数据库架构自动生成类型。
- Next.js 会检测到您的项目使用 TypeScript，并自动安装必要的软件包和配置。Next.js 还为您的代码编辑器提供了一个 [TypeScript 插件](https://nextjs.org/docs/app/building-your-application/configuring/typescript#typescript-plugin)，以帮助自动完成和提供类型安全性。

## 运行开发服务器

运行 `npm i` 来安装项目的软件包。

```javascript copy
npm i
```

然后运行 `npm run dev` 来启动开发服务器。

```javascript copy
npm run dev
```

`npm run dev` 会在端口 3000 上启动您的 Next.js 开发服务器。让我们检查一下它是否工作。在浏览器中打开 [http://localhost:3000](http://localhost:3000)。您的首页应该如下所示：

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter1-acme-unstyled.avif)
