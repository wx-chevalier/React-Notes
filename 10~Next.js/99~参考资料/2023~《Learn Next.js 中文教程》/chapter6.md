# 建立你的数据库

在继续工作于你的 dashboard 之前，你需要一些数据。在这一章中，你将使用 @vercel/postgres 来设置一个 PostgreSQL 数据库。如果你已经熟悉 PostgreSQL 并且更愿意使用自己的提供者，你可以跳过这一章并自行设置。否则，让我们继续吧！

以下是本章中将涵盖的主题：

- 将你的项目推送到 GitHub。
- 设置 Vercel 账户并链接你的 GitHub 存储库以进行即时预览和部署。
- 创建并将你的项目链接到一个 PostgreSQL 数据库。
- 使用初始数据填充数据库。

## 创建 GitHub 存储库

首先，如果你还没有这样做，让我们将你的存储库推送到 GitHub。这将使设置数据库和部署变得更容易。

如果你需要帮助设置你的存储库，请查看 GitHub 上的[这篇指南](https://help.github.com/en/github/getting-started-with-github/create-a-repo)。

> 需要注意的是：
>
> - 你也可以使用其他 Git 提供者，如 GitLab 或 Bitbucket。
> - 如果你对 GitHub 不熟悉，我们推荐使用 [GitHub Desktop App](https://desktop.github.com/) 以简化开发工作流程。

## 创建 Vercel 账户

访问 [vercel.com/signup](https://vercel.com/signup) 创建一个账户。选择免费的 "`hobby`" 计划。选择 **"Continue with GitHub"** 来连接你的 GitHub 和 Vercel 账户。

## 连接并部署你的项目

接下来，你将被带到这个屏幕，在这里你可以选择导入你刚刚创建的 GitHub 存储库：

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter6-import-git-repo.avif)

给你的项目取一个名字，然后点击 Deploy（部署）。

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter6-configure-project.avif)

太棒了！🎉 你的项目现在已经部署完成。

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter6-deployed-project.avif)

通过连接你的 GitHub 存储库，每当你推送更改到主分支时，Vercel 将自动重新部署你的应用程序，无需额外配置。在发起拉取请求时，你还将获得[即时预览](https://vercel.com/docs/deployments/preview-deployments#preview-urls)，这样你就可以及早发现部署错误，并与团队成员分享项目的预览以获得反馈。

## 创建一个 Postgres 数据库

接下来，为了设置数据库，点击 **Continue to Dashboard** 并从项目仪表板中选择 **Storage** 选项卡。选择 **Connect Store** → **Create New** → **Postgres** → **Continue**.

![Connect Store 屏幕显示了 Postgres 选项以及 KV、Blob 和 Edge Config](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter6-create-database.avif)

接受条款，为你的数据库分配一个名称，并确保你的数据库区域设置为 **Washington D.C (iad1)** - 这也是所有新 Vercel 项目的[默认区域](https://vercel.com/docs/functions/serverless-functions/regions#select-a-default-serverless-region)。通过将数据库放置在与应用程序代码相同的区域或靠近应用程序代码的区域，可以减少数据请求的延迟。

![数据库创建模态框显示了数据库名称和区域](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter6-database-region.avif)

**需要注意的是**：一旦初始化后，你无法更改数据库区域。如果你想使用不同的[区域](https://vercel.com/docs/storage/vercel-postgres/limits#supported-regions)，你应该在创建数据库之前设置它。

连接后，转到 `.env.local` 选项卡，点击 “Show secret” 并复制片段。

![.env.local 选项卡显示了隐藏的数据库秘密](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter6-database-dashboard.avif)

转到你的代码编辑器，将 `.env.example` 文件重命名为 `.env`。粘贴从 Vercel 复制的内容。

**重要提示**：进入你的 `.gitignore` 文件，确保 `.env` 是被忽略的文件之一，以防止在推送到 GitHub 时暴露你的数据库秘密。

最后，在终端中运行 `npm i @vercel/postgres` 安装 [Vercel Postgres SDK](https://vercel.com/docs/storage/vercel-postgres/sdk)。

## 填充你的数据库

既然你的数据库已经创建好了，让我们使用一些初始数据填充它。这将使你在构建 Dashboard 时有一些可用的数据。

在项目的 `/scripts` 文件夹中，有一个名为 `seed.js` 的文件。这个脚本包含了创建和填充发票、客户、用户、收入表的指令。

如果你不理解代码在做什么的话，不用担心，但为了给你一个概述，该脚本使用 SQL 来创建表，然后使用 `placeholder-data.js` 文件中的数据在表创建后填充它们。

接下来，在你的 `package.json` 文件中，添加以下行到你的 scripts：

```jsx showLineNumbers filename="/package.json" {5} copy
"scripts": {
  "build": "next build",
  "dev": "next dev",
  "start": "next start",
  "seed": "node -r dotenv/config ./scripts/seed.js"
},
```

这是执行 `seed.js` 的命令。

现在，运行 `npm run seed`。你应该在终端中看到一些 `console.log` 消息，让你知道脚本正在运行。

<QuizComponent
name="在数据库的上下文中，“seeding” 是指什么？"
answers={[
"删除数据库中的所有数据",
"导入数据库的架构",
"使用初始数据填充数据库",
"在数据库中创建表之间的关系",
]}
correctAnswer="使用初始数据填充数据库"
/>

**故障排除**：

- 确保在将数据库秘密复制到 `.env` 文件之前先将其显示出来。
- 脚本使用 bcrypt 对用户密码进行哈希，如果 bcrypt 与你的环境不兼容，你可以更新脚本以使用 [bcryptjs](https://www.npmjs.com/package/bcryptjs)。
- 如果在填充数据库时遇到任何问题并希望重新运行脚本，可以通过在数据库查询界面中运行 `DROP TABLE tablename` 来删除任何现有表。有关更多详细信息，请参阅下面的[执行查询部分](https://nextjs.org/learn/dashboard-app/setting-up-your-database#executing-queries)。但要小心，这个命令将删除表和它们的所有数据。由于你在示例应用中使用占位数据，因此在这种情况下可以这样做，但在生产应用中不应该运行此命令。
- 如果在填充你的 Vercel Postgres 数据库时继续遇到问题，请在 [GitHub 上发起讨论](https://github.com/vercel/next-learn/issues)。

## 浏览你的数据库

让我们看看你的数据库是什么样子。回到 Vercel，并点击侧边导航上的 **Data**。

在这个部分，你会找到四个新表：users、customers、invoices 和 revenue。

![数据库屏幕显示了下拉列表，其中有四个表：users、customers、invoices 和 revenue](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter6-database-tables.avif)

通过选择每个表，你可以查看其记录，并确保条目与 `placeholder-data.js` 文件中的数据一致。

## 执行查询

你可以切换到 `“query”` 选项卡与数据库进行交互。这个部分支持标准的 SQL 命令。例如，输入 `DROP TABLE customers` 将删除 `"customers"` 表以及所有其数据 - 所以要小心！

让我们运行你的第一个数据库查询。将以下 SQL 代码粘贴并运行到 Vercel 界面中：

```jsx showLineNumbers copy
SELECT invoices.amount, customers.name
FROM invoices
JOIN customers ON invoices.customer_id = customers.id
WHERE invoices.amount = 666;
```

<QuizComponent
name="这个发票属于哪个客户？"
answers={["Lee Robinson", "Evil Rabbit", "Delba de Oliveira", "Steph Dietz"]}
correctAnswer="Evil Rabbit"
/>

## Vercel Postgres 搭配本地数据库

在本地开发时你可能想使用本地搭建的 Postgres 数据库，但 `Vercel Postgres` 目前支持的并不是特别好，详情请参见 [扩展篇 1：Vercel Postgres 搭配本地数据库](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter17)
