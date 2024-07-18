# Vercel Postgres 搭配本地数据库

在 Learn Next.js 教程中数据库链接采用的是 `Vercel Postgres`，本地开发会遇到一些网络问题，导致体验并不是很好。
因此，在本地开发时我期望能将本地数据库与 Vercel Postgres 一起使用，但目前支持的并不是很好。才有了下面这篇文章介绍。

## 安装 Postgres 数据库

选择你熟悉的方式搭建本地数据库，以下使用 Docker 命令：

```
docker run --name myPostgresDb -p 5432:5432 -e POSTGRES_USER=postgresUser -e POSTGRES_PASSWORD=postgresPW -e POSTGRES_DB=postgresDB -d postgres
```

## 遇到的问题

替换 `.env` 中的数据库配置为本地数据库信息：

```bash
POSTGRES_URL="postgres://postgresUser:postgresPW@127.0.0.1:5432/postgresDB"
POSTGRES_PRISMA_URL="postgres://postgresUser:postgresPW@127.0.0.1:5432/postgresDB?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgres://postgresUser:postgresPW@127.0.0.1:5432/postgresDB"
POSTGRES_USER="postgresUser"
POSTGRES_HOST="127.0.0.1"
POSTGRES_PASSWORD="postgresPW"
POSTGRES_DATABASE="postgresDB"
```

执行 Examples 的 `yarn seed` 命令，起初会得到如下错误：

```
An error occurred while attempting to seed the database: VercelPostgresError: VercelPostgresError - 'invalid_connection_string': This connection string is meant to be used with a direct connection. Make sure to use a pooled connection string or try `createClient()` instead.
```

这是因为 Vercel 对 URL 有一些硬编码的校验，这一块很难饶过，详情参见 [ISSUE#123](https://github.com/vercel/storage/issues/123)。

但根据上面的错误提示，可以导入 `createClient()` 方法进行尝试，于是修改代码 `scripts/seed.js` 如下所示：

```js
const { db, createClient } = require("@vercel/postgres");

async function main() {
  const client = await createClient({
    connectionString: process.env.POSTGRES_URL,
  });
  await client.connect();
  // ...
}
```

尝试更改之后又报错了，这报错信息让人也很不理解，就本地连接个数据库，为什么还需要链接 443 端口？

```bash
  Error: connect ECONNREFUSED 127.0.0.1:443
  at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1570:16) Emitted 'error' event on WebSocket instance at:
  at ClientRequest.emit (node:events:511:28)
  at TLSSocket.socketErrorListener (node:_http_client:495:9)
  at TLSSocket.emit (node:events:511:28)
  at emitErrorNT (node:internal/streams/destroy:151:8)
  at emitErrorCloseNT (node:internal/streams/destroy:116:3)
  at process.processTicksAndRejections (node:internal/process/task_queues:82:21) {
    errno: -61,
    code: 'ECONNREFUSED',
    syscall: 'connect',
    address: '127.0.0.1',
    port: 443
  }
```

这是因为在底层，Vercel Postgres 连接器使用 WebSocket 连接。`createClient()` 返回的 client 实例是来自 [node-postgres](https://node-postgres.com/apis/client)
模块，但是 PostgreSQL 本身并不支持 WebSocket。

除了运行本地数据库还要运行一个代理，这里有一篇文章介绍 [https://gal.hagever.com/posts/running-vercel-postgres-locally](https://gal.hagever.com/posts/running-vercel-postgres-locally) 。
但这种方式对本地开发不是太友好，没有一个清晰的步骤来介绍怎么使用。

在这些问题上浪费了不少时间。最后，决定采用 pg 库，按照 Learn Next.js 教程的使用示例，做了一些修改。

## seed 脚本中使用本地数据库 Postgres

安装 pg 模块：`yarn add pg`。

创建 `/scripts/pg-local.js` 文件。

注意：因为 Vercel Postgres 并没有提供 "sql``" 这样模版字符串的方式来根据 SQL 内容查询数据，因此，我们这里也需要做些修改，来适配 Learn Next.js 教程示例中的写法。

```js showLineNumbers filename="/scripts/pg-local.js" copy
const { Client } = require("pg");

const client = new Client(
  process.env.POSTGRES_URL ||
    "postgres://postgresUser:postgresPW@127.0.0.1:5432/postgresDB"
);

exports.getClient = async () => {
  if (!client._connected) {
    await client.connect();
  }

  // 适配这样的语句查询数据：client.sql`SHOW TIME ZONE;`
  client.sql = async (strings, ...values) => {
    if (!strings) {
      throw new "sql is required"();
    }
    const [query, params] = sqlTemplate(strings, ...values);
    const res = await client.query(query, params);
    return res;
  };

  return client;
};

function sqlTemplate(strings, ...values) {
  if (!isTemplateStringsArray(strings) || !Array.isArray(values)) {
    throw new Error(
      "incorrect_tagged_template_call",
      "It looks like you tried to call `sql` as a function. Make sure to use it as a tagged template.\n\tExample: sql`SELECT * FROM users`, not sql('SELECT * FROM users')"
    );
  }

  let result = strings[0] ?? "";

  for (let i = 1; i < strings.length; i++) {
    result += `$${i}${strings[i] ?? ""}`;
  }

  return [result, values];
}

function isTemplateStringsArray(strings) {
  return (
    Array.isArray(strings) && "raw" in strings && Array.isArray(strings.raw)
  );
}

// (async () => {
//    // Test script
//    try {
//       const clientInstance = await exports.getClient();
//       const res = await clientInstance.sql`SHOW TIME ZONE;`
//       console.log(res.rows[0].TimeZone) // 'Etc/UTC'
//    } catch (err) {
//       console.error(err);
//    } finally {
//       await client.end()
//    }
// })();
```

在 seed 脚本文件 `/scripts/seed.js` 中新增环境变量 LOCAL_VERCEL_POSTGRES 判断逻辑，如果是本地 postgres 数据库
调用我们刚写的 `getClient()` 方法获取 client 实例，否则还是使用 `Vercel Postgres` 提供的 client 实例。

```js showLineNumbers filename="/scripts/pg-local.js" {2, 7} copy
const { db } = require("@vercel/postgres");
const { getClient } = require("./pg-local");

// ...

async function main() {
  const client = process.env.LOCAL_VERCEL_POSTGRES
    ? await getClient()
    : await db.connect();

  await seedUsers(client);
  await seedCustomers(client);
  await seedInvoices(client);
  await seedRevenue(client);

  await client.end();
}
```

## 业务代码中使用本地数据库 Postgres

与 seed 脚本不同，Learn Next.js 教程中的其余代码都采用的 TypeScript 写法，因此我们还需要在写一个 TS 版本。

这里要使用的链接池，这里使用 `pg` 模块的 `Pool` 类创建链接池实例，详情参见 [Pooling](https://node-postgres.com/features/pooling)

创建 `/app/lib/pg-local.ts` 文件。

```ts showLineNumbers filename="/app/lib/pg-local.ts" copy
import { Pool } from "pg";
import type { QueryResult, QueryResultRow } from "@neondatabase/serverless";

const connectionString = process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
});

export async function sql<O extends QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
): Promise<QueryResult<O>> {
  const [query, params] = sqlTemplate(strings, ...values);

  // @ts-ignore
  const res = await pool.query(query, params);

  // @ts-ignore
  return res as unknown as Promise<QueryResult<O>>;
}

export type Primitive = string | number | boolean | undefined | null;

export function sqlTemplate(
  strings: TemplateStringsArray,
  ...values: Primitive[]
): [string, Primitive[]] {
  if (!isTemplateStringsArray(strings) || !Array.isArray(values)) {
    throw new Error(
      "It looks like you tried to call `sql` as a function. Make sure to use it as a tagged template.\n\tExample: sql`SELECT * FROM users`, not sql('SELECT * FROM users')"
    );
  }

  let result = strings[0] ?? "";

  for (let i = 1; i < strings.length; i++) {
    result += `$${i}${strings[i] ?? ""}`;
  }

  return [result, values];
}

function isTemplateStringsArray(
  strings: unknown
): strings is TemplateStringsArray {
  return (
    Array.isArray(strings) && "raw" in strings && Array.isArray(strings.raw)
  );
}
```

创建 `/app/lib/sql-hack.ts` 文件。根据环境变量做区分，本地开发时使用本地的 postgres 数据库。

```ts copy
import { sql as vercelSql } from "@vercel/postgres";
import { sql as pgLocalSql } from "./pg-local";

export const sql = process.env.LOCAL_VERCEL_POSTGRES ? pgLocalSql : vercelSql;
```

修改 `/app/lib/data.ts` 文件。

```ts
import { sql } from "./sql-hack";
```

**请注意：以上是一个 hack 的解决方案，只适用解决本教程示例中遇到的问题。如果选用 Next.js 做开发时，推荐关注一些 ORM 框架，例如 Prisma 还是很好用的，这不是这篇教程的重点，这里不会展开介绍**。
