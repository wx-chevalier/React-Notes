# 提高可访问性

在上一章中，我们讨论了如何捕获错误（包括 404 错误）并向用户显示备用界面。然而，我们仍然需要讨论谜题的另一部分：form 验证。让我们看看如何使用 Server Actions 实现服务器端验证，以及如何使用 `useFormState` hook 在保持可访问性的同时展示 form 错误。

以下是本章中将涵盖的主题：

- 如何使用 `eslint-plugin-jsx-a11y` 与 Next.js 一起实现可访问性的最佳实践。
- 如何实现服务器端 form 验证。
- 如何使用 React 的 `useFormState` hook 处理 form 错误，并将其展示给用户。

## 什么是可访问性？

可访问性是指设计和实现每个人都可以使用的 Web 应用程序，包括那些具有残障的人。这是一个广泛的主题，涵盖了许多领域，如键盘导航，语义 HTML，图像，颜色，视频等。

虽然在这个课程中我们不会深入讨论可访问性，但我们将讨论 Next.js 中可用的可访问性功能以及一些常见的实践，以使您的应用程序更具可访问性。

> 如果您想了解更多关于可访问性的信息，我们建议参阅 [web.dev](https://web.dev/?hl=zh-cn) 的 “[学习可访问性](https://web.dev/learn/accessibility/)” 课程。

## 在 Next.js 中使用 ESLint 可访问性插件

默认情况下，Next.js 包含 [eslint-plugin-jsx-a11y](https://www.npmjs.com/package/eslint-plugin-jsx-a11y) 插件，以帮助早发现可访问性问题。例如，该插件会在没有 alt 文本的图像、错误使用 `aria-*` 和 `role` 属性等情况下发出警告。

让我们看看这是如何工作的！

在您的 `package.json` 文件中将 `next lint` 添加为一个脚本：

```json showLineNumbers filename="/package.json" {6} copy
"scripts": {
    "build": "next build",
    "dev": "next dev",
    "seed": "node -r dotenv/config ./scripts/seed.js",
    "start": "next start",
    "lint": "next lint"
},
```

然后在终端中运行 `npm run lint`：

```bash filename="Terminal" copy
npm run lint
```

您应该会看到以下警告：

```bash filename="Terminal" copy
✔ No ESLint warnings or errors
```

然而，如果您有一个没有 alt 文本的图像会发生什么呢？让我们试试！

转到 `/app/ui/invoices/table.tsx` 并从图像中删除 `alt` 属性。您可以使用编辑器的搜索功能快速找到 `<Image>`：

```tsx showLineNumbers filename="/app/ui/invoices/table.tsx" {6} copy
<Image
  src={invoice.image_url}
  className="rounded-full"
  width={28}
  height={28}
  alt={`${invoice.name}'s profile picture`} // 删除这一行
/>
```

现在再次运行 `npm run lint`，您应该会看到以下警告：

```bash showLineNumbers filename="Terminal" copy
./app/ui/invoices/table.tsx
45:25  Warning: Image elements must have an alt prop,
either with meaningful text, or an empty string for decorative images. jsx-a11y/alt-text
```

如果您尝试将应用程序部署到 Vercel，此警告还将显示在构建日志中。这是因为 `next lint` 作为构建过程的一部分运行。因此，您可以在部署应用程序之前在本地运行 `lint` 以捕获可访问性问题。

## 提升 form 可访问性

在我们的 form 中，已经有三件事情可以改进可访问性：

- **语义化 HTML**：使用语义元素（如`<input>`、`<option>` 等）而不是 `<div>`。这使辅助技术（AT）能够专注于输入元素，并向用户提供适当的上下文信息，使 form 更易于导航和理解。
- **标签**：包括 `<label>` 和 `htmlFor` 属性确保每个 form 字段都有一个描述性的文本标签。这通过提供上下文来改善 AT 支持，并通过允许用户单击标签以聚焦到相应的输入字段来增强可用性。
  \*\* **聚焦轮廓（Focus Outline）**：字段在聚焦时被正确地样式化，以显示轮廓。这对于可访问性至关重要，因为它在视觉上指示页面上的活动元素，帮助键盘和屏幕阅读器用户理解他们在 form 上的位置。您可以通过按 `Tab` 键进行验证。

这些实践为使您的 forms 更适用于许多用户打下了良好的基础。然而，它们并没有解决 **form 验证**和**错误**的问题。

## Form 验证

访问 http://localhost:3000/dashboard/invoices/create 并提交一个空 form。会发生什么？

您会收到一个错误！这是因为您正在将空 form 值发送到您的 Server Action。您可以通过在客户端或服务器上验证 form 来防止这种情况。

### 客户端验证

有几种方法可以在客户端验证 forms。最简单的方法是依赖浏览器提供的 form 验证，通过在 form 的 `<input>` 和`<select>` 元素中添加 `required` 属性。例如：

```tsx showLineNumbers filename="/app/ui/invoices/create-form.tsx" {7} copy
<input
  id="amount"
  name="amount"
  type="number"
  placeholder="Enter USD amount"
  className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
  required
/>
```

再次提交 form，如果尝试提交带有空值的 form，您现在应该会看到浏览器发出的警告。

这种方法通常是可以的，因为一些 ATs 支持浏览器验证。

客户端验证的另一种选择是服务器端验证。让我们在下一节中看看如何实现它。目前，如果已添加 `required` 属性，请删除它们。

### 服务端验证

通过在服务器上验证 form，您可以：

- 确保数据发送到数据库之前是预期的格式。
- 减少恶意用户绕过客户端验证的风险。
- 拥有一个被认为是有效数据的真实来源。

在 `create-form.tsx` 组件中，从 `react-dom` 中导入 `useFormState` hook。由于 `useFormState` 是一个 hook，您将需要使用 `"use client"` 指令将您的 form 转换为客户端组件：

```tsx showLineNumbers filename="/app/ui/invoices/create-form.tsx" {1, 4} copy
"use client";

// ...
import { useFormState } from "react-dom";
```

在 Form 组件内，使用 `useFormState` hook：

- 接收两个参数：`(action，initialState)`。
- 返回两个值：`[state，dispatch]` - form 状态和一个 dispatch 函数（类似于 [useReducer](https://react.dev/reference/react/useReducer)）。

将 `createInvoice` action 作为 `useFormState` 的参数传递，并在 `<form action={}>` 属性内调用 `dispatch`。

```tsx showLineNumbers filename="/app/ui/invoices/create-form.tsx" {5, 7} copy
// ...
import { useFormState } from "react-dom";

export default function Form({ customers }: { customers: CustomerField[] }) {
  const [state, dispatch] = useFormState(createInvoice, initialState);

  return <form action={dispatch}>...</form>;
}
```

`initialState` 可以是您定义的任何内容，在这个案例中，创建一个带有两个空 key（`message` 和 `errors`）的对象。

```tsx showLineNumbers filename="/app/ui/invoices/create-form.tsx" {5} copy
// ...
import { useFormState } from "react-dom";

export default function Form({ customers }: { customers: CustomerField[] }) {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(createInvoice, initialState);

  return <form action={dispatch}>...</form>;
}
```

这一开始看起来也许有点混乱，但一旦您更新 Server Action，它就会更加清晰。现在让我们做这个。

在 `action.ts` 文件中，您可以使用 Zod 来验证 form 数据。更新您的 `FormSchema` 如下：

```tsx showLineNumbers filename="/app/lib/action.ts" {4,8,10} copy
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});
```

- `customerId` - 如果 customer 字段为空，Zod 会抛出一个错误，因为它期望是一个 `string` 类型。但是，让我们添加一条友好的提示消息，以防用户没有选择 customer。
- `amount` - 由于您正在将 amount 类型从 `string` 强制转换为 `number`，如果字符串为空，则默认为零。使用 `.gt()` 函数告诉 Zod 我们始终希望 `amount` 大于 0。
- `status` - 如果 status 字段为空，Zod 会抛出一个错误，因为它期望是 `"pending"` 或 `"paid"`。让我们添加一条友好的提示消息，以防用户没有选择 status。

接下来，更新您的 `createInvoice` 动作以接受两个参数：

```tsx showLineNumbers filename="/app/lib/action.ts" {2-9,11} copy
// This is temporary until @types/react-dom is updated
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // ...
}
```

- `formData` - 与之前相同。
- `prevState` - 包含从 `useFormState` hook 传递的状态。在此示例中，您将不会在 action 中使用它，但它是一个必需的属性。

然后，将 Zod 的 `parse()` 函数更改为 `safeParse()`：

```tsx showLineNumbers filename="/app/lib/action.ts" {3} copy
export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // ...
}
```

`safeParse()` 将返回一个包含 `success` 或 `error` 字段的对象。这将有助于更优雅地处理验证，而无需将此逻辑放在 `try/catch` 块中。

在将信息发送到数据库之前，请使用条件语句检查 form 字段是否已正确验证：

```tsx showLineNumbers filename="/app/lib/action.ts" {10-15} copy
export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  // ...
}
```

如果 `validatedFields` 不成功，我们将提前返回带有 Zod 错误消息的函数。

> **Tip**：使用 console.log `validatedFields`，并提交一个空 form 以查看其结构。

最后，由于您正在单独处理 form 验证，不在 try/catch 块中，您可以为任何数据库错误返回一个特定的消息，您的最终代码应如下所示：

```tsx showLineNumbers filename="/app/lib/action.ts" copy
export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
```

太好了，现在让我们在您的 form 组件中展示错误。回到 `create-form.tsx` 组件，在该组件中，您可以使用 form 状态访问错误。

添加一个三元运算符，检查每个特定的错误。例如，在 customer 字段之后，您可以添加：

```tsx showLineNumbers filename="/app/ui/invoices/create-form.tsx" {14,27-34} copy
<form action={dispatch}>
  <div className="rounded-md bg-gray-50 p-4 md:p-6">
    {/* Customer Name */}
    <div className="mb-4">
      <label htmlFor="customer" className="mb-2 block text-sm font-medium">
        Choose customer
      </label>
      <div className="relative">
        <select
          id="customer"
          name="customerId"
          className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
          defaultValue=""
          aria-describedby="customer-error"
        >
          <option value="" disabled>
            Select a customer
          </option>
          {customers.map((name) => (
            <option key={name.id} value={name.id}>
              {name.name}
            </option>
          ))}
        </select>
        <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
      </div>
      <div id="customer-error" aria-live="polite" aria-atomic="true">
        {state.errors?.customerId &&
          state.errors.customerId.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>
              {error}
            </p>
          ))}
      </div>
    </div>
    // ...
  </div>
</form>
```

> **Tip**：您可以在组件内使用 console.log(state) 来检查是否一切都连接正确。在 Dev Tools 中检查控制台，因为您的 form 现在是一个客户端组件。

在上面的代码中，您还添加了以下 aria 标签：

- `aria-describedby="customer-error"`：这在 `select` 元素和错误消息容器之间建立了关系。它表示具有 `id="customer-error"` 的容器描述了 `select` 元素。屏幕阅读器在用户与选择框交互时将阅读此描述，以通知他们存在错误。
- `id="customer-error"`：此 id 属性唯一标识包含 `select` 输入错误消息的 HTML 元素。这对于 `aria-describedby` 建立关系是必要的。
- `aria-live="polite"`：屏幕阅读器应在 div 内的错误更新时礼貌地通知用户。当内容发生更改时（例如，用户更正错误），屏幕阅读器将在用户处于空闲状态时宣布这些更改，以免打断他们。

## 练习：添加 aria 标签

使用上面的示例，添加错误到你的其余 form 字段。如果任何字段是错误的，您还应该在 form 底部展示一个消息。您的 UI 看起来应该如下所示：

![](https://ngte-superbed.oss-cn-beijing.aliyuncs.com/book/nextjs-learn-cn/public/chapter14-form-validation-page.avif)

一切准备就绪后，运行 `npm run lint` 检查您是否正确使用了 aria 标签。

如果您想挑战自己，请将本章学到的知识添加到 `edit-form.tsx` 组件中并进行 form 验证。

您需要：

- 在 `edit-form.tsx` 组件中添加 `useFormState`。
- 编辑 `updateInvoice` 操作以处理来自 Zod 的验证错误。
- 在组件中展示错误，并添加 aria 标签以提高可访问性。

准备好后，请展开下面的代码片段查看解决方案：

<details>
  <summary>点击展开/折叠</summary>

**编辑发票 Form:**

```tsx showLineNumbers filename="/app/ui/invoices/edit-form.tsx" copy
export default function EditInvoiceForm({
  invoice,
  customers,
}: {
  invoice: InvoiceForm;
  customers: CustomerField[];
}) {
  const initialState = { message: null, errors: {} };
  const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);
  const [state, dispatch] = useFormState(updateInvoiceWithId, initialState);

  return <form action={dispatch}></form>;
}
```

**Server Action:**

```tsx showLineNumbers filename="/app/ui/invoices/edit-form.tsx" copy
export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: "Database Error: Failed to Update Invoice." };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
```

</details>
