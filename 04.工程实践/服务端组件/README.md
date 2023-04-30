# React Server Components

服务端组件允许开发人员构建跨越服务器和客户端的应用程序，将客户端应用程序的丰富交互性与传统服务器渲染的改进性能相结合。

- 服务端组件只在服务器上运行，对捆绑包大小没有影响。它们的代码永远不会下载到客户端，有助于减少捆绑包大小，改善启动时间。
- 服务端组件可以访问服务器端的数据源，如数据库、文件系统或（微）服务。
- 服务端组件可与客户端组件（即传统的 React 组件）无缝集成。服务端组件可以在服务器上加载数据，并将其作为 Props 传递给客户端组件，允许客户端处理渲染页面的交互部分。
- 服务端组件可以动态地选择要渲染的客户端组件，允许客户端只下载渲染页面所需的最少代码。
- 服务端组件在重新加载时保留客户端状态。这意味着当服务端组件树被重新加载时，客户端的状态、焦点、甚至正在进行的动画都不会被中断或重置。
- 服务端组件是以渐进式和增量式的方式将 UI 的渲染单元流向客户端。结合 Suspense，这使得开发人员能够制作有意的加载状态，并在等待页面剩余部分加载时快速显示重要内容。
- 开发人员还可以在服务器和客户端之间共享代码，允许用一个组件在一个路由上渲染服务器上某些内容的静态版本，并在不同的路由上渲染客户端上该内容的可编辑版本。

# 基础示例

这个例子渲染了一个带有标题和正文的简单 Note。它使用服务器组件渲染 Note 的不可编辑视图，并使用客户端组件（传统的 React 组件）选择性地渲染 Note 的编辑器。首先，我们在服务器上渲染 Note。我们的工作惯例是用.server.js 后缀（或.server.jsx、.server.tsx 等）来命名服务器组件。

```js
// Note.server.js - Server Component

import db from "db.server";
// (A1) We import from NoteEditor.client.js - a Client Component.
import NoteEditor from "NoteEditor.client";

function Note(props) {
  const { id, isEditing } = props;
  // (B) Can directly access server data sources during render, e.g. databases
  const note = db.posts.get(id);

  return (
    <div>
      <h1>{note.title}</h1>
      <section>{note.body}</section>
      {/* (A2) Dynamically render the editor only if necessary */}
      {isEditing ? <NoteEditor note={note} /> : null}
    </div>
  );
}
```

这个例子说明了几个关键点。

- 这 "只是" 一个 React 组件：它接收道具并渲染一个视图。服务器组件有一些限制--例如，它们不能使用状态或效果--但总的来说，它们的工作与你所期望的一样。更多的细节在下面的 Capabilities & Constraints of Server and Client Components 中提供。
- 服务器组件可以直接访问服务器数据源，如数据库，如（B）所示。这是通过一个通用机制实现的，允许社区创建兼容的 API，与各种数据源一起工作。
- 服务器组件可以通过导入和渲染一个 "客户端" 组件将渲染工作交给客户端，如（A1）和（A2）中分别说明。客户端组件使用 .client.js 后缀（或 .client.jsx、.client.tsx 等）。捆绑程序会将这些导入与其他动态导入进行类似的处理，有可能根据各种启发式方法将它们拆分到另一个捆绑程序中。在这个例子中，只有当 props.isEditing 为真时，NodeEditor.client.js 才会被加载到客户端。

相比之下，客户端组件是你已经习惯的典型组件。它们可以访问 React 的全部功能：状态、效果、访问 DOM 等。"客户端组件" 这个名字并没有任何新的含义，它只是为了将这些组件与服务器组件区分开来。继续我们的例子，下面是我们如何实现 Note 编辑器。

```js
// NodeEditor.client.js - Client Component

export default function NoteEditor(props) {
  const note = props.note;
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const updateTitle = (event) => {
    setTitle(event.target.value);
  };
  const updateBody = (event) => {
    setTitle(event.target.value);
  };
  const submit = () => {
    // ...save note...
  };
  return (
    <form action="..." method="..." onSubmit={submit}>
      <input name="title" onChange={updateTitle} value={title} />
      <textarea name="body" onChange={updateBody}>
        {body}
      </textarea>
    </form>
  );
}
```

这看起来像一个普通的 React 组件，因为它就是。客户端组件只是普通的组件。一个重要的考虑因素是，当 React 在客户端上渲染 Server Components 的结果时，它保留了之前可能已经渲染的 Client Components 的状态。具体来说，React 会将从服务器传递过来的新道具合并到现有的 Client Components 中，维护这些组件的状态（和 DOM），以保留焦点、状态和任何正在进行的动画。
