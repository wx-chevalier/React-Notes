> [原文地址](https://qufei1993.github.io/nextjs-learn-cn)，该页面提供了 Next.js v14 版本的免费学习教程。教程内容包括构建全栈 Web 应用程序，涵盖样式化、优化、路由、数据获取、搜索和分页、数据突变、错误处理、表单验证和可访问性、身份验证以及元数据等方面的知识。这个教程是官方教程的中文翻译版本，并且作者在翻译和整理过程中对每个章节的示例代码进行了测试和必要的修改。

# 欢迎来到 Learn Next.js 中文教程

Next.js v14 版本发布时，除了正常的版本更新之外，还发布了一个基于 App Router 架构的免费学习教程，通过构建全栈 Web 应用程序，可以让您更好的了解 Next.js 的主要功能。

本系列是基于[官方教程](https://nextjs.org/learn)的一个中文翻译版本。在翻译、整理的过程中，每个章节对应的 Example 代码，笔者也都进行了测试，有问题的部分也进行了修改，参见 Github 项目 [nextjs-learn-example](https://github.com/qufei1993/nextjs-learn-example)。

## 我们将要做的

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter0-dashboard.avif)

在这个课程中，我们将构建一个财务 Dashboard 的简化版本，其中包含以下内容：

- 一个公共首页。
- 一个登录页面。
- 受身份验证保护的仪表板页面。
- 用户能够添加、编辑和删除发票。

该 Dashboard 还将有一个相应的数据库，在后面的章节中将对其进行设置。

通过本课程，您将掌握构建全栈 Next.js 应用程序所需的基本技能。

## 概述

以下是本课程中您将学到的功能：

- **Styling（样式化）**： 在 Next.js 中样式化应用程序的不同方法。
- **Optimizations（优化）**： 如何优化图像、链接和字体。
- **Routing（路由）**： 使用文件系统路由创建嵌套布局和页面。
- **Data Fetching（数据获取）**： 如何在 Vercel 上设置数据库，以及获取和流式传输的最佳实践。
- **Search and Pagination（搜索和分页）**： 如何使用 URL 搜索参数实现搜索和分页。
- **Mutating Data（数据突变）**： 如何使用 React Server Actions 操作数据，并重新验证 Next.js 缓存。
- **Error Handling（错误处理）**： 如何处理一般错误和 404 未找到错误。
- **Form Validation and Accessibility（表单验证和可访问性）**： 如何进行服务器端表单验证以及提高可访问性的提示。
- **Authentication（身份验证）**： 如何使用 [NextAuth.js](https://next-auth.js.org/) 和中间件为应用程序添加身份验证。
- **Metadata（元数据）**： 如何添加元数据并为社交分享准备您的应用程序。

## 先决知识

本课程假设您对 React 和 JavaScript 有基本的了解。如果您是 React 的新手，我们建议您首先完成我们的 React 基础课程，以学习 [React 的基础知识](https://nextjs.org/learn/react-foundations)，如组件、props、state 和 hooks，以及像 Server Components 和 Suspense 这样的新功能。

## 系统要求

在开始本课程之前，请确保您的系统满足以下要求：

- 安装 Node.js 18.17.0 或更高版本。[下载地址](https://nodejs.org/en)
- 操作系统：macOS、Windows（包括 WSL）或 Linux。

另外，您还需要一个 GitHub 账号和一个 Vercel 账号。（Vercel 是用来部署用的，如果服务只是在本地运行，做为学习使用，Vercel 账号也不是必须的）。

## 加入讨论

如果您对本课程有疑问或想提供反馈，您可以通过以下渠道提问：

- [Next.js Discord](https://discord.com/invite/Q3AsD4efFC)
- [next-learn GitHub](https://github.com/vercel/next-learn) 。

如果你发现翻译的文档中有任何问题，欢迎指出！想加入 Next.js 技术交流群的请扫描下方二维码先添加作者 “五月君” 微信，备注：`nextjs`。同时也欢迎关注公众号「**编程界**」获取最新 Next.js 开发资讯！

<br />
<br />

<div className="text-center">
  如果本教程能为您得到帮助，请给予项目 **[Learn Next.js
  中文教程](https://github.com/qufei1993/nextjs-learn-cn)** 一个 ★ 做为支持！
</div>
