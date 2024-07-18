# Mutating 数据

在上一章节中，使用 URL 搜索参数和 Next.js API 实现了搜索和分页。让我们继续在发票（Invoices）页面上工作，添加创建、更新和删除发票的功能！

以下是本章中将涵盖的主题：

- React Server Actions 是什么以及如何使用它们来改变数据。
- 如何处理表单和 Server Components。
- 使用原生 `formData` 对象的最佳实践，包括类型验证。
- 如何使用 `revalidatePath` API 重新验证客户端缓存。
- 如何创建具有特定 IDs 的动态路由段。
- 如何使用 React 的 `useFormStatus` hook 进行乐观更新。

## 什么是 Server Actions？

React Server Actions 允许您在服务器上直接运行异步代码。它们消除了通过创建 API 改变数据的方式。相反，您编写的在服务器上执行的异步函数，可以在客户端或 Server Components 中直接调用。

对于 Web 应用程序安全性是最重要的，因为它们可能受到各种威胁。这就是 Server Actions 发挥作用的地方。它们提供了一种有效的安全解决方案，防范各种类型的攻击，保护您的数据，并确保访问是经过授权的。Server Actions 通过诸如 POST 请求、加密闭包、严格的输入检查、错误消息 hashing 和主机限制等技术实现这一点，所有这些技术共同作用以显着增强应用程序的安全性。

## Server Actions 和 forms

在 React 中，您可以在 `<form>` 元素中使用 `action` 属性来调用操作。该操作将自动接收包含捕获数据的原生 `FormData` 对象。

例如：

```tsx showLineNumbers copy
// Server Component
export default function Page() {
  // Action
  async function create(formData: FormData) {
    "use server";

    // Logic to mutate data...
  }

  // Invoke the action using the "action" attribute
  return <form action={create}>...</form>;
}
```

在 Server Component 中调用 Server Action 的一个优势是渐进增强 - 即使客户端上禁用了 JavaScript，forms 仍可以工作。

## Next.js with Server Actions

Server Actions 与 Next.js [缓存](https://nextjs.org/docs/app/building-your-application/caching)深度集成。通过 Server Action 提交表单时，您不仅可以使用该操作来改变数据，还可以使用 `revalidatePath` 和 `revalidateTag` 等 API 来重新验证相关的缓存。

<QuizComponent
name="使用 Server Actions 的一个好处是什么？"
answers={["提高 SEO", "渐进增强", "更快的网站", "数据加密"]}
correctAnswer="渐进增强"
/>

让我们看看它是如何协同工作的！

## 创建发票

以下是创建一个新发票的步骤：

- 创建一个捕获用户输入的 form。
- 创建一个 Server Action，并从 form 中调用它。
- 在 Server Action 中，从 formData 对象中提取数据。
- 验证和准备要插入数据库的数据。
- 插入数据并处理任何错误。
- 重新验证缓存并将用户重定向回发票页面。

### 1. 创建新 route 和 form

首先，在 `/invoices` 目录内，添加一个名为 `/create` 的新路由段，包含一个 `page.tsx` 文件：

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter-12-create-invoice-route.avif)

您将使用此路由来创建新的发票。在您的 `page.tsx` 文件中，粘贴以下代码，然后花些时间研究它：

```tsx showLineNumbers filename="/dashboard/invoices/create/page.tsx" copy
import Form from "@/app/ui/invoices/create-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { fetchCustomers } from "@/app/lib/data";

export default async function Page() {
  const customers = await fetchCustomers();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Invoices", href: "/dashboard/invoices" },
          {
            label: "Create Invoice",
            href: "/dashboard/invoices/create",
            active: true,
          },
        ]}
      />
      <Form customers={customers} />
    </main>
  );
}
```

您的页面是一个 Server Component，用于获取 `customers` 并将其传递给 `<Form>` 组件。为了节省时间，我们已经为您创建了 `<Form>` 组件。

转到 `<Form>` 组件，您会看到该表单：

- 有一个包含 `customers` 列表的 `<select>`（下拉）元素。
- 有一个用于 `amount` 的带有 `type="number"` 的 `<input>` 元素。
- 有两个带有 `type="radio"` 的 `<input>` 元素，用于状态。
- 有一个 `type="submit"` 的按钮。

在 http://localhost:3000/dashboard/invoices/create 上，您应该看到以下 UI：

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter12-create-invoice-page.avif)

### 2. 创建 Server Action

太好了，现在让我们创建一个 Server Action，当 form 提交时将调用该 Server Action。

导航到您的 `lib` 目录并创建一个名为 `actions.ts` 的新文件。在该文件顶部添加 React 的 · 指令：

```ts showLineNumbers filename="/app/lib/actions.ts" copy
"use server";
```

通过添加 `'use server'`，您将文件中的所有导出函数标记为服务器函数。然后可以将这些服务器函数导入到 Client 和 Server 组件中，使它们变得非常灵活。

您还可以通过在 action 内部添加 `"use server"` 直接在 Server Component 中编写 Server Actions。但是在本课程中，我们将把它们都组织在一个单独的文件中。

在您的 `actions.ts` 文件中，创建一个接受 `formData` 的新异步函数：

```ts showLineNumbers filename="/app/lib/actions.ts" {3} copy
"use server";

export async function createInvoice(formData: FormData) {}
```

然后，在您的 `<Form>` 组件中，从 `actions.ts` 文件中导入 `createInvoice`。给 `<form>` 元素添加 action 属性，并调用 `createInvoice` action。

```ts showLineNumbers filename="/app/ui/invoices/create-form.tsx" {12,20} copy
'use client';

import { customerField } from '@/app/lib/definitions';
import Link from 'next/link';
import {
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createInvoice } from '@/app/lib/actions';

export default function Form({
  customers,
}: {
  customers: customerField[];
}) {
  return (
    <form action={createInvoice}>
      // ...
  )
}
```

> 值得知道：在 HTML 中，您会将 URL 传递给 `action` 属性。此 URL 将是您的 form 数据应提交的目标（通常是 API 端点）。  
> 然而，在 React 中，action 属性被视为一个特殊的 prop - 这意味着 React 在其之上构建，以允许调用 actions。  
> 在幕后，Server Actions 创建一个 POST API 端点。这就是在使用 Server Actions 时为什么不需要手动创建 API 端点的原因。

### 3. 从 formData 中提取数据

回到您的 `actions.ts` 文件，您需要提取 formData 的值，有几种方法可以使用。在本例中，让我们使用 `.get(name)` 方法。

```ts showLineNumbers filename="/app/lib/actions.ts" {3-10} copy
"use server";

export async function createInvoice(formData: FormData) {
  const rawFormData = {
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  };
  // Test it out:
  console.log(rawFormData);
}
```

> 提示：如果您正在处理包含许多字段的 forms，您可能想考虑使用 JavaScript 的 `Object.fromEntries()` 方法与 `entries()` 方法。例如：  
> `const rawFormData = Object.fromEntries(formData.entries())`

为了检查一切是否连接正确，尝试填写 form。提交后，您应该在终端中看到您刚刚输入到 forms 中的数据。

现在，您的数据呈对象形式，将更容易处理。

### 4. 验证和准备数据

在将 form 数据发送到数据库之前，您希望确保它具有正确的格式和正确的类型。如果您还记得在本课程前面的部分，您的 invoices 表期望以下格式的数据：

```ts showLineNumbers filename="/app/lib/definitions.ts" copy
export type Invoice = {
  id: string; // Will be created on the database
  customer_id: string;
  amount: number; // Stored in cents
  status: "pending" | "paid";
  date: string;
};
```

到目前为止，您只有来自 form 的 `customer_id`、`amount` 和 `status`。

**类型验证和强制转换**

验证来自 form 的数据是否符合数据库中期望的类型非常重要。例如，如果您在 action 中添加一个 console.log：

```bash copy
console.log(typeof rawFormData.amount);
```

您会注意到 `amount` 是字符串类型，而不是数字。这是因为具有 `type="number"` 的输入元素实际上返回一个字符串，而不是数字！

为了处理类型验证，您有几个选择。虽然您可以手动验证类型，但使用类型验证库可以为您节省时间和精力。对于您的示例，我们将使用 [Zod](https://zod.dev/)，这是一个 TypeScript 优先的验证库，可以为你简化这些校验任务。

在您的 `actions.ts` 文件中，导入 Zod 并定义一个与 form 对象形状匹配的 schema。这个 schema 将在 formData 保存到数据库之前验证它。

```ts showLineNumbers filename="/app/lib/actions.ts" {3,5-11,13} copy
"use server";

import { z } from "zod";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  // ...
}
```

`amount` 字段被专门设置为强制（更改）从字符串更改为数字，同时还验证其类型。

然后，您可以将 `rawFormData` 传递给 `CreateInvoice` 以验证类型：

```ts showLineNumbers filename="/app/lib/actions.ts" {3} copy
// ...
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
}
```

**以分为单位存储值**

通常，将货币值以分为单位存储在数据库中是一种良好的做法，以消除 JavaScript 浮点错误并确保更高的准确性。

让我们将金额转换为分：

```ts showLineNumbers filename="/app/lib/actions.ts" {8} copy
// ...
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
}
```

**创建新日期**

最后，让我们为发票的创建日期创建一个新的格式为 "YYYY-MM-DD" 的日期：

```ts showLineNumbers filename="/app/lib/actions.ts" {9} copy
// ...
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];
}
```

### 5. 插入数据到数据库

现在您已经拥有数据库所需的所有值，您可以创建一个 SQL 查询，将新发票插入数据库并传入变量：

```ts showLineNumbers filename="/app/lib/actions.ts" {2, 15-18} copy
import { z } from "zod";
import { sql } from "@vercel/postgres"; // 这里需要注意

// ...

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
}
```

> **译者注**：因为 Vercel Postgres 搭配本地数据库还存在一些问题，在 [nextjs-learn-example](https://github.com/qufei1993/nextjs-learn-example) 示例中，我使用了一种 hack 的方式来处理，如果您在本地开发是按照我的 hack 方式，请替换 `import { sql } from '@vercel/postgres';` 为 `import { sql } from './sql-hack';` 详情参见 [https://qufei1993.github.io/nextjs-learn-cn/chapter17](https://qufei1993.github.io/nextjs-learn-cn/chapter17)

现在，我们还没有处理任何错误。我们将在下一章中处理错误。让我们继续进行下一步。

### 6. 重新验证和重定向

Next.js 拥有一个[客户端路由缓存](https://nextjs.org/docs/app/building-your-application/caching#router-cache)，它在用户的浏览器中存储路由段一段时间。除了[prefetching](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#1-prefetching)，此缓存确保用户在路由之间快速导航的同时减少向服务器发出的请求次数。

由于您正在更新发票路由中显示的数据，因此您希望清除此缓存并触发对服务器的新请求。您可以使用 Next.js 的 [revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) 函数来实现：

```ts showLineNumbers filename="/app/lib/actions.ts" {5, 23} copy
"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";

// ...

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidatePath("/dashboard/invoices");
}
```

一旦数据库已更新，将重新验证 `/dashboard/invoices` 路径，并从服务器获取新数据。

此时，您还希望将用户重定向回 `/dashboard/invoices` 页面。您可以使用 Next.js 的 `[redirect](https://nextjs.org/docs/app/api-reference/functions/redirect)` 函数来实现：

```ts showLineNumbers filename="/app/lib/actions.ts" {6, 14} copy
"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ...

export async function createInvoice(formData: FormData) {
  // ...

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
```

恭喜！您刚刚实现了您的第一个 Server Action。通过添加一个新的发票来测试它，如果一切正常：

- 在提交时，您应该被重定向到 `/dashboard/invoices` 路由。
- 您应该看到新发票在表格的顶部。

## 更新发票

更新发票 form 同创建发票 form 类似，唯一区别是你需要传递发票 `id` 来更新数据库中的记录。让我们看看如何获取并传递发票 `id`。

以下是更新发票的步骤：

- 创建一个带有发票 `id` 的新动态路由段。
- 从页面参数中读取发票 `id`。
- 从数据库中获取特定发票。
- 使用发票数据预填充 form。
- 更新数据库中的发票数据。

### 1. 创建带有发票 id 的动态路由段

Next.js 允许您在不知道确切段名称的情况下创建[动态路由段](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)，并希望基于数据创建路由。这可以是博客文章标题、产品页面等。您可以通过将文件夹名称包装在方括号中来创建动态路由段。例如，`[id]`、`[post]` 或 `[slug]`。

在 `/invoices` 文件夹中，创建一个名为 `[id]` 的新动态路由，然后创建一个名为 `edit` 的新路由，其中包含一个 `page.tsx` 文件。您的文件结构应如下所示：

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter12-edit-invoice-route.avif)

在您的 `<Table>` 组件中，请注意有一个 `<UpdateInvoice />` 按钮，它从表记录中接收发票的 `id`。

```ts showLineNumbers filename="/app/ui/invoices/table.tsx" {11} copy
export default async function InvoicesTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  return (
    // ...
    <td className="flex justify-end gap-2 whitespace-nowrap px-6 py-4 text-sm">
      <UpdateInvoice id={invoice.id} />
      <DeleteInvoice id={invoice.id} />
    </td>
    // ...
  );
}
```

导航到您的 `<UpdateInvoice />` 组件，并更新 `Link` 的 `href` 以接收 `id` 属性。您可以使用模板文字链接到动态路由段：

```ts showLineNumbers filename="/app/ui/invoices/buttons.tsx" {9} copy
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

// ...

export function UpdateInvoice({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/invoices/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}
```

### 2. 从页面参数中读取发票 `id`

回到您的 `<Page>` 组件，粘贴以下代码：

```tsx showLineNumbers filename="/app/dashboard/invoices/[id]/edit/page.tsx" copy
import Form from "@/app/ui/invoices/edit-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { fetchCustomers } from "@/app/lib/data";

export default async function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Invoices", href: "/dashboard/invoices" },
          {
            label: "Edit Invoice",
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}
```

请注意，它与您的 `/create` 发票页面类似，只是导入了不同的 form（来自 `edit-form.tsx` 文件）。该 form 应该使用客户的名称、发票金额和状态的 `defaultValue` 进行预填充。要预填充 form 字段，您需要使用 `id` 获取特定的发票。

除了 `searchParams` 之外，页面组件还接收一个称为 `params` 的属性，您可以使用它来访问 `id`。更新您的 `<Page>` 组件以接收此属性：

```ts showLineNumbers filename="/app/dashboard/invoices/[id]/edit/page.tsx" {5-6} copy
import Form from "@/app/ui/invoices/edit-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { fetchCustomers } from "@/app/lib/data";

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  // ...
}
```

### 3. 获取特定发票

然后：

- 导入一个名为 `fetchInvoiceById` 的新函数，并将 `id` 作为参数传递。
- 导入 `fetchCustomers` 以获取下拉列表的客户名称。

您可以使用 `Promise.all` 并行获取发票和客户：

```ts showLineNumbers filename="/app/dashboard/invoices/[id]/edit/page.tsx" {3,7-10} copy
import Form from "@/app/ui/invoices/edit-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { fetchInvoiceById, fetchCustomers } from "@/app/lib/data";

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
  ]);
  // ...
}
```

您将在终端中看到有关 `invoice` 属性的临时 TS 错误，因为 `invoice` 可能是 `undefined`。现在不要担心，当您添加错误处理时，将在下一章中解决它。

太好了！现在，测试一切是否连接正确。访问 http://localhost:3000/dashboard/invoices 然后单击铅笔图标以编辑发票。导航后，您应该看到一个预填充有发票详细信息的 form：

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter12-edit-invoice-page.avif)

URL 也应更新为带有 `id` 的形式：http://localhost:3000/dashboard/invoice/uuid/edit

> **UUID VS 自增键**
> 我们使用 `UUID` 而不是自增键（例如 1、2、3 等）。这会使 URL 变得更长；然而，UUID 消除了 ID 冲突的风险，是全球唯一的，并减少了枚举攻击的风险 - 这使它们非常适用于大型数据库。

然而，如果您喜欢更清晰的 URL，您可能更喜欢使用自增键。

### 4. 将 id 传递给 Server Action

最后，您希望将 `id` 传递给 Server Action，以便您可以在数据库中更新正确的记录。您不能像这样将 `id` 作为参数传递：

```ts showLineNumbers filename="/app/ui/invoices/edit-form.tsx" copy
// Passing an id as argument won't work
<form action={updateInvoice(id)}>
```

反而，您可以使用 JS `bind` 将 `id` 传递给 Server Action。这将确保传递给 Server Action 的任何值都被编码。

```ts showLineNumbers filename="/app/ui/invoices/edit-form.tsx" {2,11,14} copy
// ...
import { updateInvoice } from "@/app/lib/actions";

export default function EditInvoiceForm({
  invoice,
  customers,
}: {
  invoice: InvoiceForm;
  customers: CustomerField[];
}) {
  const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);

  return (
    <form action={updateInvoiceWithId}>
      <input type="hidden" name="id" value={invoice.id} />
    </form>
  );
}
```

注意：在 form 中使用隐藏的 input 字段也是可行的（例如 `<input type="hidden" name="id" value={invoice.id} />`）。然而，这些值将以完整文本形式出现在 HTML 源代码中，对于 id 等敏感数据来说并不理想。

然后，在您的 actions.ts 文件中，创建一个新的 action `updateInvoice`：

```ts showLineNumbers filename="/app/lib/actions.ts" copy
// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// ...

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
```

与 `createInvoice` action 类似，在这里您正在：

- 从 `formData` 中提取数据。
- 使用 Zod 验证类型。
- 将金额转换为分。
- 将变量传递给 SQL 查询。
- 调用 `revalidatePath` 以清除客户端缓存并发出新的服务器请求。
- 调用 `redirect` 将用户重定向到发票页面。

通过编辑发票进行测试。提交 form 后，您应该被重定向到发票页面，并且发票应该已更新。

## 删除发票

要使用 Server Action 删除发票，请将删除按钮包装在 `<form>` 元素中，并使用 `bind` 将 `id` 传递给 Server Action：

```ts showLineNumbers filename="/app/ui/invoices/buttons.tsx" {1,5-6,9,14} copy
import { deleteInvoice } from "@/app/lib/actions";

// ...

export function DeleteInvoice({ id }: { id: string }) {
  const deleteInvoiceWithId = deleteInvoice.bind(null, id);

  return (
    <form action={deleteInvoiceWithId}>
      <button className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-4" />
      </button>
    </form>
  );
}
```

在您的 `actions.ts` 文件中，创建一个名为 `deleteInvoice` 的新 action。

```ts showLineNumbers filename="/app/lib/actions.ts" copy
export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath("/dashboard/invoices");
}
```

由于此 action 是在 `/dashboard/invoices` 路径中调用的，您不需要调用 `redirect`。调用 `revalidatePath` 将触发新的服务器请求并重新渲染表格。

## 进一步阅读

在本章中，您学习了如何使用 Server Actions 来改变数据。您还学会了如何使用 `revalidatePath` API 来重新验证 Next.js 缓存，并使用 `redirect` 将用户重定向到新页面。

您还可以阅读更多关于[使用 Server Actions 进行安全性方面](https://nextjs.org/blog/security-nextjs-server-components-actions)的内容，以获取更多学习资料。
