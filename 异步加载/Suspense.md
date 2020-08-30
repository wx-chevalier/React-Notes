# Suspense

React Suspense 全部涉及处理具有异步数据需求的视图之间的转换：

```js
import { createCache } from "react-cache";
import { createResource } from "react-cache";

export let cache = createCache();

export let InvoiceResource = createResource((id) => {
  return fetch(`/invoices/${id}`).then((response) => {
    return response.json();
  });
});
```

```js
import cache from "./cache";
import InvoiceResource from "./InvoiceResource";

let Invoice = ({ invoiceId }) => {
  let invoice = InvoiceResource.read(cache, invoiceId);
  return <h1>{invoice.number}</h1>;
};
```

React 开始渲染（在内存中）。它打到了 InvoicesResource.read() 调用。该键的缓存（id 为键）将为空，因此它将调用我们提供给 createResource 的函数，从而触发异步获取。然后缓存将抛出我们返回的承诺（是的，我也从未考虑过抛出任何错误，但也有错误，但是如果需要可以抛出窗口。）抛出之后，不再执行任何代码。React 等待承诺解决。诺言解决。React 尝试再次渲染发票（在内存中）。它再次点击 InvoicesResource.read() 。这次数据位于缓存中，因此可以从 ApiResource.read() 同步返回我们的数据。React 将页面呈现到 DOM：

```js
// the store and reducer
import { createStore } from "redux";
import { connect } from "react-redux";

let reducer = (state, action) => {
  if (action.type === "LOADED_INVOICE") {
    return {
      ...state,
      invoice: action.data,
    };
  }
  return state;
};

let store = createStore(reducer);

/////////////////////////////////////////////
// the action
function fetchInvoice(dispatch, id) {
  fetch(`/invoices/${id}`).then((response) => {
    dispatch({
      type: "LOADED_INVOICE",
      data: response.json(),
    });
  });
}

/////////////////////////////////////////////
// the component, all connected up
class Invoice extends React.Component {
  componentDidMount() {
    fetchInvoice(this.props.dispatch, this.props.invoiceId);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.invoiceId !== this.props.invoiceId) {
      fetchInvoice(this.props.dispatch, this.props.invoiceId);
    }
  }

  render() {
    if (!this.props.invoice) {
      return null;
    }
    return <h1>{invoice.number}</h1>;
  }
}

export default connect((state) => {
  return { invoices: state.invoices };
})(Invoices);
```

```js
import React, { Suspense, Fragment, memo } from "react";
import { unstable_createResource } from "react-cache";

const Fetcher = unstable_createResource(() =>
  fetch("https://jsonplaceholder.typicode.com/todos").then((r) => r.json())
);

const List = () => {
  const data = Fetcher.read();
  return (
    <ul>
      {data.map((item) => (
        <li style={{ listStyle: "none" }} key={item.id}>
          {item.title}
        </li>
      ))}
    </ul>
  );
};

const App = () => (
  <Fragment>
    <h2 style={{ textAlign: "center" }}>{`React: ${React.version} Demo`}</h2>
    <Suspense fallback={<div>Loading...</div>}>
      <List />
    </Suspense>
  </Fragment>
);

const MemoApp = memo(App);

export default MemoApp;
```
