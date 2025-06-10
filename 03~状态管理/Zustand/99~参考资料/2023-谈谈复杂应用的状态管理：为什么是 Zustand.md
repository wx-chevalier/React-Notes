> [原文地址](https://zhuanlan.zhihu.com/p/591981209)

# 谈谈复杂应用的状态管理：为什么是 Zustand

作为一名主业做设计，业余搞前端的小菜鸡，到 2020 年底为止都是用云谦大佬的 dva 一把梭。当时整体的使用体验还是挺好的，对于我这样的前端菜鸡上手门槛低，而且学一次哪都可用，当时从来没愁过状态管理。

![img](https://assets.ng-tech.icu/item/v2-eacdce905a3f8bd6f0ff8083a038fa9c_1440w.jpg)

至今 Kitchen3 里仍然躺着用 dva 做状态管理的功能模块，写于 2020 年

直到 hooks 横空出世，TypeScript 逐步流行。一方面，从 react hooks 出来以后，大量的文章开始鼓吹「你不需要 Redux」、「useState + Context」完全可用、「next-unstated」YYDS 等等。另一方面，由于 Dva 不再维护，其在 ts 下的都没有任何提示的问题也逐步暴露。

在尝试一些小项目中使用 hooks 后感觉还行之后，作为小萌新的我也全面转向了 hooks 的怀抱。中间其实一直没怎么遇到问题，因为大部分前端应用的复杂度也就那样，hooks 问题不大。然后呢？然后从去年开始就在复杂应用里踩坑了。

![img](https://assets.ng-tech.icu/item/v2-0aeb6c1b8e764a2959c62dc64f7e61ed_1440w.jpg)

## 复杂应用的状态管理天坑

> ProEditor 是内部组件库 TechUI Studio 的编辑器组件。

业务组件 ProEditor 就是一个很典型的例子。由于 ProEditor 是个编辑器，对用户来说编辑体验非常重要，是一个重交互操作的应用，这就会牵扯到大量的状态管理需求。

![img](https://assets.ng-tech.icu/item/v2-3689dd47f4377957481ec37c459022b8_1440w.webp)

先简单来列下 ProEditor 的状态管理需求有哪些：

**❶ Editor 容器状态管理与组件（Table）状态管理拆分，但可联动消费；**

容器状态负责了一些偏全局配置的状态维护，比如画布、代码页的切换，是否激活画布交互等等，而组件的状态则是保存了组件本身的所有配置和状态。

这么做的好处在于不同组件可能会有不同的状态，而 Editor 的容器状态可以复用，比如做 ProForm 的时候，Editor 的容器仍然可以是同一个，组件状态只需额外实现 ProForm 的 Store 即可。

![img](https://assets.ng-tech.icu/item/v2-7e715a3a6a16332c87d838be4b928f2c_1440w.webp)

从上图可以看到，Table 的状态就是 Editor 的 config 字段，当 Table 改时，会触发 Editor 的 config 字段同步更新。当 Editor 更新时，也会触发该数据更新。

最初的版本，我使用了 Provider + Context 的方式来做全局状态管理。大概的写法是这样的：

```js
// 定义
export const useStudioStore = (props?: ProEditorProps) => {
  // ...
  const tableStore = useTableStore(props?.value);
  const [tabKey, switchTab] = useState(TabKey.canvas);
  const [activeConfigTab, switchConfigTab] = useState<TableConfigGroup>(TableConfigGroup.Table);
  // ...
}

export const StudioStore = createContextStore(useStudioStore, {});

// 消费
const NavBar: FC<NavBarProps> = ({ logo }) => {
  const { tabKey } = useContext(StudioStore);
  return ...
}
```

由于这一版是 Context 一杆推到底，这造成了一些很离谱的交互反馈，就是每一次点击其他任何地方（例如画布代码、组件的配置项），都会造成面板的 Tabs 重新渲染（左下图）。右下图是相应的重渲染分析图，可以看到任何动作都造成了重新所有页面元素的重渲染。而这还是最早期的 demo 版本，功能和数据量的才实现到 20% 左右。所以可以预见到如果不做任何优化，使用体验会差到什么程度。

![动图封面](https://assets.ng-tech.icu/gif/v2-ae99855c2a9696fce27c8afe8edb6963_b.webp)

**❷ 需要进行复杂的数据处理**

ProEditor 针对表格编辑，做了大量的数据变换操作。比如 ProTable 中针对 `columns` 这个字段的更新就有 14 种操作。比如其中一个比较容易被感知的`updateColumnByOneAPI` 就是基于 oneAPI 的字段信息更新，细颗粒度地调整 columns 里的字段信息。而这样的字段修改类型的 store，在 ProEditor 中除了 `columns` 还有一个 `data`。

当时，为了保证数据变更方法的可维护性与 action 的不变性，我采用了 userReducer 做变更方法的管理。

![img](https://assets.ng-tech.icu/item/v2-51a3b7ef9f1b70672dffea8e2abc0e46_1440w.webp)

因为一旦采用自定义 hooks ，就得写成下面这样才能保证不会重复渲染，会造成极大的心智负担，一旦出现数据不对的情况，很难排查到底是哪个方法或者依赖有问题。

```js
// 自定 hook 的写法
const useDataColumns = () => {
  const createOrUpdateColumnsByMockData = useCallback(() => {
    // ...
  }, [a, b]);
  const createColumnsByOneAPI = useCallback(() => {
    // ...
  }, [c, d]);
  const updateColumnsByOneAPI = useCallback(() => {
    // ...
  }, [a, b, c, d]);
  // ...
};
```

但 useReducer 也有很大的局限性，例如不支持异步函数、不支持内部的 reducer 互相调用，不支持和其他 state 联动（比如要当参数穿进去才可用），所以也不是最优解。

**❸ 是个可被外部消费的组件**

一旦提到组件，势必要提非受控模式和受控模式。为了支持好我们自己的场景，且希望把 ProEditor 变成一个好用的业务组件，所以我们做了受控模式，毕竟一个好用的组件一定是要能同时支持好这两种模式的。

在实际场景下，我们既需要配置项（`config`）受控，同时也需要画布交互状态（`interaction`）受控，例如下面的场景：在激活某个单元格状态时点击生成，我们需要将这个选中状态进行重置，才能生成符合预期的设计稿。

![动图封面](https://assets.ng-tech.icu/item/v2-53ec6d58aae111b7b06cea3d58b9fa73_b.jpg)

所以为了支持细颗粒度的受控能力，我们提供了多个受控值，供外部受控模式。

```js
// ProEditor 外部消费的 Demo 示意
export default () => {
  const [status, setStatus] = useState();
  const { config, getState } = useState();

  return (
    <ProEditor
      // config 和 onConfigChange 是一对
      config={config}
      onConfigChange={({ config }) => {
        setConfig(config);
      }}
      // interaction 和 onInteractionChange 是另一对受控
      interaction={status}
      onInteractionChange={(s) => {
        setStatus(s);
      }}
    />
  );
};
```

但当我们一开始写好这个受控 api，得到结果是这样的：

![动图](https://assets.ng-tech.icu/item/v2-450ae687d1643806d45c2d673d114217_b.webp)

对，你没看错，**死循环了**。遇到这个问题时让人头极度秃，因为原本以为是个很简单的功能，但是在 React 生命周期里的表现让人费解，尤其是使用 useEffect 做状态管理的时候。

```js
// 导致死循环的写法
const useTableStore = (state: Partial<Omit<ProTableConfigStore, 'columns' | 'data'>>) => {
  const { defaultConfig, config: outsourceValue, mode } = props;
  const { columns, isEmptyColumns, dispatchColumns } = useColumnStore(defaultConfig?.columns, mode);
  // 受控模式 内部值与外部双向通信
  useEffect(() => {
    // 没有外部值和变更时不更改
    if (!outsourceValue) return;
    // 相等值的时候不做更新
    if (isEqual(dataStore, outsourceValue)) return;
    if (outsourceValue.columns) {
      dispatchColumns({ type: 'setAll', columns: outsourceValue.columns });
    }
  }, [dataStore, outsourceValue]);

  const dataStore = useMemo(() => {
    const v = { ...store, data, columns } as ProTableConfigStore;
    // dataStore 变更时需要对外变更一次
    if (props.onChange && !isEqual(v, outsourceValue)) {
      props.onChange?.({
        config: v,
        props: tableAsset.generateProps(v),
        isEmptyColumns,
      });
    }
    return v;
  }, [data, store, columns, outsourceValue]);

  // ...
}
```

造成上述问题的原因大部分都是因为组件内 onChange 的时机设置。一旦代码里用 useEffect 的方式去监听变更触发 onChange，有很大的概率会造成死循环。

**❹ 未来还希望能支持撤销重做、快捷键等能力**

毕竟，现代的编辑器都是支持快捷键、历史记录、多人协同等增强型的功能的。这些能力怎么在编辑器的状态管理中以低成本、易维护的方式进行实施，也非常重要。

![img](https://assets.ng-tech.icu/item/v2-95b4d554b6458799e5424e35784ac5da_1440w.webp)

总之，开发 ProEditor 的经历，一句话的血泪教训就是：

**复杂应用的状态管理真的不能裸写 hooks！**

那些鼓吹裸写 hooks 的人大概率是没遇到过复杂 case，性能优化、受控、action 互调、数据切片、状态调试等坑，每一项都不是好惹的主，够人喝上一壶。

![img](https://assets.ng-tech.icu/item/v2-45aafb15ee043899edeba77fa720c708_1440w.webp)

## 为什么是 Zustand？

其实，复杂应用只是开发者状态管理需求的集中体现。如果我们把状态管理当成一款产品来设计，我们不妨看看开发者在状态管理下的核心需求是什么。

我相信通过以下这一串分析，你会发现 zustand 是真真正正满足「几乎所有」状态管理需求的工具，并且在很多细节上做到了体验更优。

![img](https://assets.ng-tech.icu/item/v2-e632cd069391fd85654bb9ea76bd0400_1440w.webp)

### ❶ 状态共享

**状态管理最必要的一点就是状态共享**。这也是 context 出来以后，大部分文章说不需要 redux 的根本原因。因为 context 可以实现最最基础的状态共享。但这种方法（包括 redux 在内），都需要在最外层包一个 Provider。Context 中的值都在 Provider 的作用域下有效。

```js
// Context 状态共享

// store.ts
export const StoreContext = createStoreContext(() => { ... });

// index.tsx
import { appState, StoreContext } from './store';

root.render(
    <StoreContext.Provider value={appState}>
      <App />
    </StoreContext.Provider>
);

// icon.tsx
import { StoreContext } from './store';

const ReplaceGuide: FC = () => {
  const { i18n, hideGuide, settings } = useContext(StoreContext);

  // ...
  return ...
}
```

而 zustand 做到的第一点创新就是：**默认不需要 Provider**。直接声明一个 hooks 式的 useStore 后就可以在不同组件中进行调用。它们的状态会直接共享，简单而美好。

```js
// Zustand 状态共享

// store.ts
import create from "zustand";

export const useStore = create((set) => ({
  count: 1,
  inc: () => set((state) => ({ count: state.count + 1 })),
}));

// Control.tsx
import { useStore } from "./store";

function Control() {
  return (
    <button
      onClick={() => {
        useStore.setState((s) => ({ ...s, count: s.count - 5 }));
      }}
    >
      －5
    </button>
  );
}

// AnotherControl.tsx
import { useStore } from "./store";

function AnotherControl() {
  const inc = useStore((state) => state.inc);
  return <button onClick={inc}> +1 </button>;
}

// Counter.tsx
import { useStore } from "./store";

function Counter() {
  const { count } = useStore();
  return <h1>{count}</h1>;
}
```

由于没有 Provider 的存在，所以声明的 useStore 默认都是单实例，如果需要多实例的话，zustand 也提供了对应的 Provider 的[书写方式](https://link.zhihu.com/?target=https%3A//github.com/pmndrs/zustand%23react-contexthttps%3A//github.com/pmndrs/zustand%23react-context)，这种方式在组件库中比较常用。ProEditor 也是用的这种方式做到了多实例。

此外，zustand 的 store 状态既可以在 react 世界中消费，也可以在 react 世界外消费。

### ❷ 状态变更

状态管理除了状态共享外，另外第二个极其必要的能力就是状态变更。在复杂的场景下，我们往往需要自行组织相应的状态变更方法，不然不好维护。这也是考验一个状态管理库好不好用的一个必要指标。

hooks 的 `setState` 是原子级的变更状态，hold 不住复杂逻辑；而 `useReducer` 的 hooks 借鉴了 redux 的思想，提供了 dispatch 变更的方式，但和 redux 的 reducer 一样，这种方式没法处理异步，且没法互相调用，一旦遇上就容易捉襟见肘。

至于 redux ，哪怕是最新的 `redux-toolkit` 中优化大量 redux 的模板代码，针对同步异步方法的书写仍然让人心生畏惧。

```js
// redux-toolkit 的用法

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { userAPI } from "./userAPI";

// 1. 创建异步函数
const fetchUserById = createAsyncThunk(
  "users/fetchByIdStatus",
  async (userId, thunkAPI) => {
    const response = await userAPI.fetchById(userId);
    return response.data;
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState: { entities: [], loading: "idle" },
  // 同步的 reducer 方法
  reducers: {},
  // 异步的 AsyncThunk 方法
  extraReducers: (builder) => {
    // 2. 将异步函数添加到 Slice 中
    builder.addCase(fetchUserById.fulfilled, (state, action) => {
      state.entities.push(action.payload);
    });
  },
});

// 3. 调用异步方法
dispatch(fetchUserById(123));
```

而在 zustand 中，函数可以直接写，完全不用区分同步或者异步，一下子把区分同步异步的心智负担降到了 0。

```js
// zustand store 写法

// store.ts
import create from "zustand";

const initialState = {
  // ...
};

export const useStore = create((set, get) => ({
  ...initialState,
  createNewDesignSystem: async () => {
    const { params, toggleLoading } = get();

    toggleLoading();
    const res = await dispatch("/hitu/remote/create-new-ds", params);
    toggleLoading();

    if (!res) return;

    set({ created: true, designId: res.id });
  },
  toggleLoading: () => {
    set({ loading: !get().loading });
  },
}));

// CreateForm.tsx
import { useStore } from "./store";

const CreateForm: FC = () => {
  const { createNewDesignSystem } = useStore();

  // ...
};
```

另外一个让人非常舒心的点在于，**zustand 会默认将所有的函数保持同一引用**。所以用 zustand 写的方法，默认都不会造成额外的重复渲染。（PS：这里再顺带吹一下 WebStorm 对于函数和变量的识别能力，非常好用）

![img](https://assets.ng-tech.icu/item/v2-bc685c4f6c102dfbe1920973c1af42e9_1440w.webp)

在下图可以看到，所有 zustand 的 useStore 出来的值或者方法，都是橙色的变量，具有稳定引用，不会造成不必要的重复渲染。

![img](https://assets.ng-tech.icu/item/v2-1c6db37065be87860bfe576802acb95d_1440w.webp)

而状态变更函数的最后一个很重要，但往往又会被忽略的一点，就是**方法需要调用当前快照下的值或方法**。

在常规的开发心智中，我们往往会在异步方法中直接调用当前快照的值来发起请求，或使用同步方法进行状态变更，这会有极好的状态内聚性。

比如说，我们有一个方法叫「废弃草稿」，需要获取当前的一个 id ，向服务器发起请求做数据变更，同时为了保证当前界面的数据显示有效性，变更完毕后，我们需要重新获取数据。

我们来看看 hooks 版本和 zustand 的写法对比，如下所示：

```js
// hooks 版本

export const useStore = () => {
  const [designId, setDesignId] = useState();
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(() => {
    if (designId) {
      mutateKitchenSWR('/hitu/remote/ds/versions', designId);
    }
  }, [designId]);

  const deprecateDraft = useCallback(async () => {
    setLoading(true);
    const res = await dispatch('/hitu/remote/ds/deprecate-draft', designId);
    setLoading(false);

    if (res) {
      message.success('草稿删除成功');
    }

    // 重新获取一遍数据
    refetch();
  }, [designId, refetch]);

  return {
    designId,
    setDesignId,
    loading,
    deprecateDraft,
    refetch,
  }
};
// zustand 写法

const initialState = { designId: undefined, loading: false };

export const useStore = create((set, get) => ({
  ...initialState,
  deprecateDraft: async () => {
    set({ loading: true });
    const res = await dispatch('/hitu/remote/ds/deprecate-draft', get().designId);
    set({ loading: false });

    if (res) {
      message.success('草稿删除成功');
    }

    // 重新获取一遍数据
    get().refetch();
  },
  refetch: () => {
    if (get().designId) {
      mutateKitchenSWR('/hitu/remote/ds/versions', get().designId);
    }
  },
})
```

可以明显看到，光是从代码量上 zustand 的 store 比 hooks 减少了 30% 。不过另外容易被大家忽略，但其实更重要的是，**hooks 版本中互调带来了引用变更的问题**。

由于 `deprecateDraft` 和 `refetch` 都调用了 `designId`，这就会使得当 `designId` 发生变更时，`deprecateDraft` 和 `refetch` 的引用会发生变更，致使 react 触发刷新。而这在有性能优化需求的场景下非常阴间，会让不该渲染的组件重新渲染。那这也是为什么 react 要搞一个 `useEvent` 的原因（[RFC](https://link.zhihu.com/?target=https%3A//github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md)）。

而 zustand 则把这个问题解掉了。由于 zustand 在 create 方法中提供了 `get` 对象，使得我们可以用 get 方法直接拿到当前 store 中最新的 state 快照。这样一来，变更函数的引用始终不变，而函数本身却一直可以拿到最新的值。

在这一趴，最后一点要夸 zustand 的是，它可以直接集成 useReducer 的模式，而且直接在官网提供了[示例](https://link.zhihu.com/?target=https%3A//github.com/pmndrs/zustand%23cant-live-without-redux-like-reducers-and-action-types)。这样就意味着之前在 ProEditor 中的那么多 action 可以极低成本完成迁移。

```js
// columns 的 reducer 迁移

import { columnsConfigReducer } from './columns';

const createStore = create((set,get)=>({
  /**
   * 控制 Columns 的复杂数据变更方法
   */
  dispatchColumns: (payload) => {
    const { columns, internalUpdateTableConfig, updateDataByColumns } = get();
    // 旧的 useReducer 直接复用过来
    const nextColumns = columnsConfigReducer(columns, payload);

    internalUpdateTableConfig({ columns: nextColumns }, 'Columns 配置');

    updateDataByColumns(nextColumns);
  },
})
```

### ❸ 状态派生

状态派生是状态管理中一个不被那么多人提起，但是在实际场景中被大量使用的东西，只是大家没有意识到，这理应也是状态管理的一环。

状态派生可以很简单，也可以非常复杂。简单的例子，比如基于一个`name` 字段，拼接出对应的 url 。

![img](https://assets.ng-tech.icu/item/v2-f971d015e6416629b5c1c92e34becd1b_1440w.webp)

复杂的例子，比如基于 rgb、hsl 值和色彩模式，得到一个包含色彩空间的对象。

![img](https://assets.ng-tech.icu/item/v2-12e48692aedbb8e73572c567837cba0b_1440w.webp)

如果不考虑优化，其实都可以写一个中间的函数作为派生方法，但作为状态管理的一环，我们必须要考虑相应的优化。

在 hooks 场景下，状态派生的方法可以使用 `useMemo`，例如：

```js
// hooks 写法

const App = () => {
  const [name, setName] = useState("");
  const url = useMemo(() => URL_HITU_DS_BASE(name || ""), [name]);
  // ...
};
```

而 zustand 用了类似 redux selector 的方法，实现相应的状态派生，这个方式使得 useStore 的用法变得极其灵活和实用。而这种 selector 的方式使得 zustand 下细颗粒度的性能优化变为可能，且优化成本很低。

```js
// zustand 的 selector 用法

// 写法1
const App = () => {
  const url = useStore((s) => URL_HITU_DS_BASE(s.name || ""));
  // ...
};

// 写法2 将 selector 单独抽为函数
export const dsUrlSelector = (s) => URL_HITU_DS_BASE(s.name || "");
const App = () => {
  const url = useStore(dsUrlSelector);
  // ...
};
```

由于写法 2 可以将 selector 抽为独立函数，那么我们就可以将其拆分到独立文件来管理派生状态。由于这些 selector 都是纯函数，所以能轻松实现测试覆盖。

![img](https://assets.ng-tech.icu/item/v2-12f404b5c0d455a1809ec56a25d30816_1440w.webp)

### ❹ 性能优化

讲完状态派生后把 zustand 的 selector 能力后，直接很顺地就能来讲讲 zustand 的性能优化了。

在裸 hooks 的状态管理下，要做性能优化得专门起一个专项来分析与实施。但基于 zustand 的 useStore 和 selector 用法，我们可以实现低成本、渐进式的性能优化。

比如 ProEditor 中一个叫 `TableConfig` 的面板组件，对应的左下图中圈起来的部分。而右下图则是相应的代码，可以看到这个组件从 `useStore` 中 解构了 `tabKey` 和 `internalSetState` 的方法。

![img](https://assets.ng-tech.icu/item/v2-07f98ce71bde53ef06b8f3d24fd93f1a_1440w.webp)

然后我们用 `useWhyDidYouUpdate` 来检查下，如果直接用解构引入，会造成什么样的情况：

![动图封面](https://assets.ng-tech.icu/item/v2-383f2cac7a5e9edce9a8f3dc3fb343c4_b.jpg)

在上图中可以看到，虽然 `tabs`、`internalSetState` 没有变化，但是其中的 config 数据项（data、columns 等）发生了变化，进而使得 `TableConfig` 组件触发重渲染。

而我们的性能优化方法也很简单，只要利用 zustand 的 selector，将得到的对象聚焦到我们需要的对象，只监听这几个对象的变化即可。

```js
// 性能优化方法

import shallow from "zustand/shallow"; // zustand 提供的内置浅比较方法
import { useStore, ProTableStore } from "./store";

const selector = (s: ProTableStore) => ({
  tabKey: s.tabKey,
  internalSetState: s.internalSetState,
});

const TableConfig: FC = () => {
  const { tabKey, internalSetState } = useStore(selector, shallow);
};
```

这样一来，TableConfig 的性能优化就做好了~

![动图封面](https://assets.ng-tech.icu/item/v2-5f9f7ab0f6a84c2be5cde2066cc02b70_b.jpg)

基于这种模式，性能优化就会变成极其简单无脑的操作，而且对于前期的功能实现的侵入性极小，代码的后续可维护性极高。

![img](https://assets.ng-tech.icu/item/v2-d08bfd2a5e56f9e127562ba0b922886b_1440w.webp)

剩下的时间就可以和小伙伴去吹咱优雅的性能优化技巧了~（￣︶￣）↗

![img](https://assets.ng-tech.icu/item/v2-214b6be53fd846b007cb18eb4c8cda35_1440w.webp)

就我个人的感受上，zustand 使用 selector 来作为性能优化的思路真的很精巧，就像是给函数式的数据流加上了一点点主观意愿上的响应式能力，堪称优雅。

![img](https://assets.ng-tech.icu/item/v2-832bf6d03d1b0fc6f99e07f6fd75b1ec_1440w.webp)

### ❺ 数据分形与状态组合

如果子组件能够以同样的结构，作为一个应用使用，这样的结构就是分形架构。

数据分形在状态管理里我觉得是个比较高级的概念。但从应用上来说很简单，就是更容易拆分并组织代码，而且具有更加灵活的使用方式，如下所示是拆分代码的方式。但这种方式其实我还没大使用，所以不多展开了。

```js
// 来自官方文档的示例

// https://github.com/pmndrs/zustand/blob/main/docs/typescript.md#slices-pattern

import create, { StateCreator } from 'zustand'

interface BearSlice {
  bears: number
  addBear: () => void
  eatFish: () => void
}
const createBearSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  BearSlice
> = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  eatFish: () => set((state) => ({ fishes: state.fishes - 1 })),
})

interface FishSlice {
  fishes: number
  addFish: () => void
}
const createFishSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  FishSlice
> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
})

const useBoundStore = create<BearSlice & FishSlice>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))
```

**我用的更多的是基于这种分形架构下的各种中间件**。由于这种分形架构，状态就具有了很灵活的组合性，例如将当前状态直接缓存到 localStorage。在 zustand 的架构下，不用额外改造，直接加个 `persist` 中间件就好。

```js
// 使用自带的 Persist Middleware
import create from 'zustand'
import {  persist } from 'zustand/middleware'

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>(
  persist((set) => ({
    bears: 0,
    increase: (by) => set((state) => ({ bears: state.bears + by })),
  }))
);
```

在 ProEditor 中，我使用最多的就是 `devtools` 这个中间件。这个中间件具有的功能就是：将这个 Store 和 Redux Devtools 绑定。

```js
// devtools 中间件

// store 逻辑
const vanillaStore = (set, get) => ({
  syncOutSource: (nextState) => {
    set(
      { ...get(), ...nextState },
      false,
      `受控更新：${Object.keys(nextState).join(" ")}`
    );
  },
  syncOutSourceConfig: ({ config }) => {
    // ...
    set({ ...get(), ...config }, false, `受控更新：  组件配置`);
    // ...
  },
});

const createStore = create(devtools(vanillaStore, { name: "ProTableStore" }));
```

然后我们就可以在 redux-devtools 中愉快地查看数据变更了：

![动图封面](https://assets.ng-tech.icu/item/v2-005224d644ec7d9551a787733dc5dde4_b.jpg)

可能有小伙伴会注意到，为什么我这边的状态变更还有中文名，那是因为 `devtools` 中间件为 zustand 的 set 方法，提供了一个额外参数。只要设置好相应的 set 值的最后一个变量，就可以直接在 devtools 中看到相应的变更事件名称。

正是这样强大的分形能力，我们基于社区里做的一个 [zundo](https://link.zhihu.com/?target=https%3A//github.com/charkour/zundo) 中间件，在 ProEditor 中提供了一个简易的撤销重做 的 Demo 示例。

![img](https://assets.ng-tech.icu/item/v2-61ca2f9c78cd507fdb6ea4dd35f702c2_1440w.webp)

而实现核心功能的代码就只有一行~

![img](https://assets.ng-tech.icu/item/v2-7d2598a16e8214c11ac730a384863d55_1440w.webp)

PS：至于一开始提到的协同能力，我在社区中也有发现中间件 [zustand-middleware-yjs](https://link.zhihu.com/?target=https%3A//github.com/joebobmiles/zustand-middleware-yjs) （不过还没尝试）。

### ❻ 多环境集成（react 内外环境联动 ）

实际的复杂应用中，一定会存在某些不在 react 环境内的状态数据，以图表、画布、3D 场景最多。一旦要涉及到多环境下的状态管理，可以让人掉无数头发。

而 zustand 说了，不慌，我已经考虑到了，`useStore` 上直接可以拿值，是不是很贴心~

```js
// 官方示例

// 1. 创建Store
const useDogStore = create(() => ({ paw: true, snout: true, fur: true }))

// 2. react 环境外直接拿值
const paw = useDogStore.getState().paw

// 3. 提供外部事件订阅
const unsub1 = useDogStore.subscribe(console.log)

// 4. react 世界外更新值
useDogStore.setState({ paw: false })

const Component = () => {
  // 5. 在 react 环境内使用
  const paw = useDogStore((state) => state.paw)
  ...
```

虽然这个场景我还没遇到，但是一想到 zustand 在这种场景下也能支持，真的是让人十分心安。

![img](https://assets.ng-tech.icu/item/v2-3f862861a58e76f144c962c9bee7025f_1440w.webp)

其实还有其他不太值得单独提的点，比如 zustand 在测试上也相对比较容易做，直接用 test-library/react-hooks 即可。类型定义方面做的非常齐全……但到现在洋洋洒洒已经写了 6k 多字了，就不再展开了。

## 总结：zustand 是当下复杂状态管理的最佳选择

大概从去年 12 月份开始，我就一直在提炼符合我理想的状态管理库的需求，到看到 zustand 让我眼前一亮。而通过在 `pro-editor` 中大半年的实践验证，我很笃定地认为，**zustand 就是我当下状态管理的最佳选择，甚至是大部分复杂应用的状态管理的最佳选择**。

本来最后还想讲讲，我是怎么样基于 Zustand 来做渐进式的状态管理的（从小应用到复杂应用的渐进式生长方案）。然后还想拿 ProEditor 为例讲讲 ProEditor 具体的状态管理是如何逐步生长的，包括如何组织的受控模式、如何集成 RxJS 处理复杂交互等等，算是几个比较有意思的点。不过限于篇幅原因，这些内容估计就得留到下次了。

### 银弹存在吗？

在上篇[《为什么是 Zustand》](https://zhuanlan.zhihu.com/p/591981209)中，我总结了在 ProEditor 这个重交互操作的场景下对状态管理的诉求，本篇将会从具体使用的角度来详细介绍下我是怎么用 zustand 这一个状态管理库，解决目前我所遇到的所有状态管理诉求的。

首先想从云谦老师[《数据流 2022》](https://link.zhihu.com/?target=https%3A//mp.weixin.qq.com/s%3F__biz%3DMjM5NDgyODI4MQ%3D%3D%26mid%3D2247485468%26idx%3D1%26sn%3Db0b7935c12feff14488e6961f285f167%26scene%3D21%23wechat_redirect)最后的总结开始说起。

> **所以怎么选？** 没有银弹！如果站在社区开发者的角度来看。先看远程状态库是否满足需求，满足的话就无需传统数据流方案了；然后如果是非常非常简单的场景用 useState + Context，复杂点的就不建议了，因为需要自行处理渲染优化，手动把 Context 拆很细或者尝试用 use-context-selector；再看心智模型，按内部 store 或外部 store 区分选择，个人已经习惯后者，前者还在观望；如果选外部 store，无兼容性要求的场景优先用类 Valtio 基于 proxy 的方案，写入数据时更符合直觉，同时拥有全自动的渲染优化，有兼容性要求时则选 Zustand。

其实我对上述的这个决策方案并不是非常太认同，原因是状态管理会有一个重要但容易被忽略的核心需求：**在遇到更加复杂的场景时，我们能不能用当前的模式轻松地承接住？** 例如：

- 当前只是 5 个状态，但业务突然加了一坨复杂的业务需求，然后要膨胀到 15 个状态。这个时候状态还容不容易维护？性能还能保证和之前一样吗？
- 当前是 React 环境，但突然业务说要加个 canvas 图表的需求，图表又有一些配置切换功能，还是用 React ，这个时候还能愉快地共享状态么？
- 当前是个业务应用，突然某个时候业务说要把这个应用板块抽成组件供外部复用，当前的模式能不能轻松实现受控的模式改造成组件？（设想一下将语雀编辑器从应用抽取变成组件）

如果承接不住，那么就意味着推翻重写，这在我看来是不可接受的。理想的架构选型，就应该为可以预见的未来避开大部分坑，而不是遇到了再换一枪打一发。所以我自己做状态管理库决策选型的两个核心原则是： 1. 这个库本身的 DX 好不好；2. 这个库在未来一旦要遇到复杂场景的时候，能不能用简单、低成本的方式兜住我的需求？

虽然我自己的实践有限，**但我还想说 zustand 是银弹。**

### 基于 Zustand 的渐进式状态管理

最近在给 ProEditor 做 ProLayout 的可视化装配器。其中一个很重要的编辑能力就是图标的选择。而这个组件也存在一点点复杂度，刚好拿来作为 Zustand 用法的案例，可谓是**「真·实战案例」**。首先简单介绍一下图标选择器这个组件。它的核心用途就是让用户可以快速选择所需的图标。用户可以选择内置的 Ant Design 的图标，也可以使用 Iconfont 的图标。简单的演示如下：

![动图封面](https://assets.ng-tech.icu/item/v2-8eafbed4f073c4bc901b27e15185a2a2_b.jpg)

基础的展示、选择、移除、搜索

![动图封面](https://assets.ng-tech.icu/item/v2-f4fccc965fbc43e8ddece3cc783041ce_b.jpg)

iconfont 的添加、切换、删除

为了满足上述的目标，这个组件具有下述功能：

1. 展示图标列表；
2. 选择、删除图标；
3. 搜索图标；
4. 切换 antd 图标和 iconfont 图标类目；
5. 添加与删除 Iconfont 脚本（暂不准备加编辑）；
6. 切换 iconfont 脚本展示不同的 iconfont 脚本下的图标；

同时，由于这个组件需要被多个场景复用，因此它需要支持非受控模式与受控模式。同时为了提升研发效率，我也希望能用 devtools 检查相应的状态情况。

讲完基础的需求后，一起来看看这个组件是如何通过 Zustand 完整实现的。

### Step 1: store 初始化 ：State

首先拿最简单的 tabs 切换做一个组件 tabs 切换的功能。新建一个 `store.ts` 文件，然后写下如下代码：

```ts
import create from 'zustand';

// 注意一个小细节，建议直接将该变量直接称为 useStore
export const useStore = create(() => ({
  panelTabKey: 'antd',
})
```

在相应的组件（`PickerPanel`）中引入 `useStore` ，用 hooks 的方式即可解构获得 `panelTabKey`。而需要修改状态时，可直接使用 `useStore.setState` 即可对 `panelTabKey` 进行修改。这样，zustand 最简单的状态管理方法就完成了~

```ts
import { Segmented } from "antd";

import { useStore } from "../store";

const PickerPanel = () => {
  const { panelTabKey } = useStore();

  return (
    // ...
    <Segmented
      value={panelTabKey}
      onChange={(key) => {
        useStore.setState({ panelTabKey: key });
      }}
      // 其他配置
      size={"small"}
      options={[
        { label: "Ant Design", value: "antd" },
        { label: "Iconfont", value: "iconfont" },
      ]}
      block
    />

    // ...
  );
};
```

:::info 为了续统一心智，我在这里先将 create 中声明的状态部分，都称为 **State**。::: 由于 zustand 默认全局单例，因此只要声明一个 useStore 即可在所有地方使用，不用在外层套一个 Context ，非常舒心。同时 `useStore` 又包含了一个 `setState` 的方法，因此在需要 React 中修改状态时，可以直接使用 `setState` 进行状态修改。这是 zustand 的最最简单的使用方式，在场景初始化的时候，这样就能直接上手使用，非常简单，直接干掉 useStore + Context 妥妥的。

### Step 2: 状态变更方法：Action

在 Step 1 中，我们用 `setState` 来管理非常简单的状态，这些状态基本上用不着为其单独设定相应的变更功能。但是随着业务场景的复杂性增多，我们不可避免地会遇到存在一次操作需要变更多个状态的场景。:::info 而这些具有特定功能的状态变更方法，我统一称之为 **Action**。::: 在图标选择器中，Action 其中之一的体现就是选择图标的操作。选择图标这个操作，除了设定当前选中的图标以外，还需要关闭 popover、清除筛选关键词（否则下次打开还是有筛选词的）。

![动图封面](https://assets.ng-tech.icu/item/v2-6516c4a0a72c12650e0fd1ecd569354f_b.jpg)

因此我们首先在 store 中添加三个状态：

```ts
import create from 'zustand';


export const useStore = create(() => ({
  panelTabKey: 'antd',
  iconList: ...,

  open: false,
  filterKeywords: '',
  icon: null,
})
```

如果我们直接用 Step1 的方式，大致的写法如下：

```ts
import { useStore } from '../store';

const IconList = () => {
  const { iconList } = useStore();
  return (
    <div>
      {iconList.map((icon) => (
        <IconThumbnail onClick={(icon) => {
            useStore.setState({ icon, open: false, filterKeywords: undefined });
        })} />
      ))}
    </div>
  );
};
```

但此时会遇到新的问题，如果我在另外一个地方也需要使用这样一段操作逻辑时，我要写两次么？当然不，这既不利于开发，也不利于维护。所以，在这里我们需要抽取一个 `selectIcon` 方法专门用于选择图标这个操作，相关的状态只要都写在那里即可。而这就引出了状态管理的第二步：**自定义 Action**。在 `store.ts` 中直接声明并定义 `selectIcon` 函数，然后第一个入参改为 set，就可以在 store.ts 的方法内部直接修改状态了，代码如下所示：

```ts
import create from 'zustand';


// 添加第一个入参 set
export const useStore = create((set) => ({
  panelTabKey: 'antd',
  iconList: ...,

  open: false,
  filterKeywords: '',
  icon: null,

  // 新增选择图标的 action
  selectIcon: (icon) => {
    set({ icon, open: false, filterKeywords: undefined });
    },
})
```

对应在 `IconList` 中，只需引入 `selectIcon` 方法即可。

```ts
import { useStore } from "../store";

const IconList = () => {
  const { iconList, selectIcon } = useStore();
  return (
    <div>
      {iconList.map((icon) => (
        <IconThumbnail onClick={selectIcon} />
      ))}
    </div>
  );
};
```

另外值得一提的两个小点：

- Action 支持 `async/await`，直接给函数方法添加 async 符号即可；
- zustand 默认做了变量的优化，只要是从 `useStore`解构获得的函数，默认是引用不变的，也就是使用 zustand store 的函数本身并不会造成不必要的重复渲染。

### Step 3: 复杂状态派生：Selector

在 Step2 中大家应该有看到 iconList 这个状态，在上例中由于 iconList 并不是重点，因此简化了写法。但事实上在图标选择器组件中，iconList 并不是一个简简单单的状态，而是一个复合的派生状态。在选择器组件中，iconList 首先需要基于 是 Ant Design 的 tab 或者 Iconfont 的 tabs 做原始图标数据源的进行切换，同时还需要支持相应的检索能力。而由于 Ant Design Tab 和 Iconfont 下的 list 具有不同的数据结构，因此筛选逻辑的实现也是不同的。

![动图封面](https://assets.ng-tech.icu/item/v2-5a76a8a6c646f06422eed0ca1e6b3b05_b.jpg)

那在 zustand 的 Store 中，这个 iconList 是怎么实现的呢？在这里就要介绍 zustand 的又一个利器： **Selector** 。此 selector 和 redux 的 selector 的理念基本上是一致的，因此如果之前了解过 zustand 的 selector，zustand 的也一样很容易理解。但从使用上来说，我认为 zustand 的 selector 更加灵活易用。首先是定义 selector，selector 的入参是完整的 store （包含 state 和 action ），出参是目标对象。

```ts
import create from 'zustand';


export const useStore = create(() => ({
  // 数据源
  panelTabKey: 'antd',
  antdIconList,
  iconfontIconList,

  //...
})

// 展示用户会看到 icon list
export const displayListSelector = (s: typeof useStore) => {
  // 首先判断下来自哪个数据源
  const list = s.panelTabKey === 'iconfont' ? s.iconfontIconList : s.antdIconList
  // 解构拿到 store 中的关键词
  const { filterKeywords } = s;

  // 然后做一轮筛选判断
  return list.filter((i) => {
    if (!filterKeywords) return true;

    // 根据不同的图标类型使用不同的筛选逻辑
    switch (i.type) {
      case 'antd':
      case 'internal':
        return i.componentName.toLowerCase().includes(filterKeywords.toLowerCase());

      case 'iconfont':
        return i.props.type.toLowerCase().includes(filterKeywords.toString());
    }
  });
};
```

当定义完成 selector 后，在组件层面作为 useStore 的第一个入参即可：

```ts
import { useStore, displayListSelector } from "../store";

const IconList = () => {
  const { selectIcon } = useStore();
  const iconList = useStore(displayListSelector);

  return (
    <div>
      {iconList.map((icon) => (
        <IconThumbnail onClick={selectIcon} />
      ))}
    </div>
  );
};
```

如此一来，就完成了复杂状态的派生实现。因为 useStore 可以像多个 hooks 一样进行引入，因此我们就可以利用 selector 选出自己需要的各种状态，也可以多个 selector 间进行组合，复用通用逻辑。

![多组 selector](https://assets.ng-tech.icu/item/v2-24e9ade8a8503459ecf51945a42b01da_1440w.webp)

![Selector 间的组合](https://assets.ng-tech.icu/item/v2-ab192080d1d12a904795a6f9c0d0c0ef_1440w.webp)

另外，如果用 selector 选择出来的变量也属于 react 世界中的状态，因此为了避免不必要的重复渲染，可以对复杂的对象或者数组使用 isEqual 方法做比较，保证它的不变性。

```ts
import { useStore, displayListSelector } from "../store";
import { isEqual } from "lodash";

const IconList = () => {
  const { selectIcon } = useStore();
  // 通过加入 isEqual 方法即可实现对 iconList 的性能优化
  const iconList = useStore(displayListSelector, isEqual);

  return (
    <div>
      {iconList.map((icon) => (
        <IconThumbnail onClick={selectIcon} />
      ))}
    </div>
  );
};
```

最后，由于 selector 本身的定义只是个纯函数，也能非常方便地集成单元测试。

### Step 4: 结构组织与类型定义

经过一部分功能开发，一开始简单的 `store.ts` 文件开始变得很长了，同时估计也开始遇到类型定义不准确或找不到的情况了。那这对于后续项目的规模化发展非常不利，是时候做一次组织与整理了。

```ts
import create from 'zustand';


// 添加第一个入参 set
export const useStore = create((set) => ({
  panelTabKey: 'antd',
  iconList: ...,
  antdIconList,

  open: false,
  filterKeywords: '',
  icon: null,


  iconfontScripts: [],
  iconfontIconList: [],
  onIconChange: null,

  // 新增选择图标方法
  selectIcon: (icon) => {
    set({ icon, open: false, filterKeywords: undefined });
    },
  // 移除图标方法
  resetIcon: () => {
    set({ icon: undefined });
  },

  addSript:()=>{ /*...*/ },
  updateScripts:()=>{ /*...*/ },
  removeScripts:()=>{ /*...*/ },
  selectScript:async (url)=>{ /*...*/ }
  // ...
})

// 展示用户会看到 icon list
export const displayListSelector = (s: typeof useStore) => {
  // 首先判断下来自哪个数据源
  const list = s.panelTabKey === 'iconfont' ? s.iconfontIconList : s.antdIconList
  // 解构拿到 store 中的关键词
  const { filterKeywords } = s;

  // 然后做一轮筛选判断
  return list.filter((i) => {
    if (!filterKeywords) return true;

    // 根据不同的图标类型使用不同的筛选逻辑
    switch (i.type) {
      case 'antd':
      case 'internal':
        return i.componentName.toLowerCase().includes(filterKeywords.toLowerCase());

      case 'iconfont':
        return i.props.type.toLowerCase().includes(filterKeywords.toString());
    }
  });
};
```

所以在我建议在 Step4 开始，就要对 Zustand 的 Store 进行更加合理地划分。首先是从 `store.ts` 重构为 `store` 文件夹，目录结构如下：

```bash
./store
├── createStore.ts        // Action 与 store
├── selectors.ts          // 状态派生
├── initialState.ts       // State 类型定义与 初始状态
└── index.ts
```

如此划分的依据本质上还是基于 State、Action 与 Selector 的三者切分：

- `initialState.ts`：负责 State —— 添加状态类型与初始化状态值；
- `createStore.ts`： 负责书写创建 Store 的方法与 Action 方法；
- `selectors.ts`： 负责 Selector ——派生类选择器逻辑；

---

首先来看看 `initialState` ，这个文件中主要用于定于并导出后续在 Store 所有需要的状态。导出的部分包含两个： `State` 类型定义与 初始状态 `initialState`。将 State 和 initialState 定义在一个文件中会有一个好处：类型跳转会直接指向到这里，方便添加类型与类型的初始值。由于 state 单独新建了一个文件，因此哪怕后续状态再多，也能在这一个文件中看得清清楚楚。

```ts
import type {
  ExternalScripts,
  IconfontIcon,
  IconUnit,
  ReactIcon,
} from "../types";
import { antdIconList } from "../contents/antdIcons";

export interface State {
  iconfontScripts: ExternalScripts[];
  icon?: IconUnit;
  showEditor: boolean;

  open: boolean;
  panelTabKey: "antd" | "iconfont";
  filterKeywords?: string;

  activeIconfontScript?: string;
  antdIconList: ReactIcon[];
  iconfontIconList: IconfontIcon[];
}

export const initialState: State = {
  open: false,
  showEditor: false,
  panelTabKey: "antd",
  filterKeywords: "",
  antdIconList,

  iconfontScripts: [],
  iconfontIconList: [],
  onIconChange: null,
};
```

再来看看 `createStore` ，这个文件由于包含了 Action 和 Store，会稍显复杂一点，但是核心逻辑还是比较简单的。

```ts
import create from "zustand";

import type { State } from "./initialState";
import { initialState } from "./initialState";

interface Action {
  resetIcon: () => void;
  togglePanel: () => void;
  selectIcon: (icon: IconUnit) => void;
  removeScripts: (url: string) => void;
  selectScript: (url: string) => void;
  toggleEditor: (visible: boolean) => void;
  addScript: (script: ExternalScripts) => void;
  updateScripts: (scripts: ExternalScripts[]) => void;
}

export type Store = State & Action;

export const useStore = create<Store>((set, get) => ({
  ...initialState,

  resetIcon: () => {
    set({ icon: undefined });
  },

  selectIcon: (icon) => {
    set({ icon, open: false, filterKeywords: undefined });
  },

  addSript: () => {
    /*...*/
  },
  updateScripts: () => {
    /*...*/
  },
  removeScripts: () => {
    /*...*/
  },
  selectScript: async (url) => {
    /*...*/
  },
}));
```

它做了这么几件事：

1. 定义了 store 中 Action 的类型，然后将 State 和 Action 合并为 Store 类型，并**导出了 Store 的类型**（比较重要）；
2. 给 create 方法添加了 Store 的类型，让 store 内部识别到自己这个 store 包含了哪些方法；
3. 将 `initialState` 解构导入 store（原来定义 state 的部分已经抽出去到 initialState 里了）；
4. 在 useStore 里逐一实现 Action 中定义的方法；

所以将从 `store.ts` 重构到 `createStore.ts` ，基本上只有补充类型定义的工作量。

接下来再看下 selectors，这个文件很简单，只需要导入 Store 的类型，然后逐一导出相应的 selector 即可。

```ts
import type { Store } from "./createStore";
import type { IconUnit } from "../types";

export const isEmptyIconfontScripts = (s: Store) =>
  s.iconfontScripts.length === 0;

export const selectedListSelector = (s: Store): IconUnit[] =>
  s.panelTabKey === "iconfont" ? s.iconfontIconList : s.antdIconList;

export const isEmptyIconListSelector = (s: Store) =>
  selectedListSelector(s).length === 0;

export const displayListSelector = (s: Store) => {
  const list = selectedListSelector(s);
  const { filterKeywords } = s;

  return list.filter((i) => {
    if (!filterKeywords) return true;

    switch (i.type) {
      case "antd":
      case "internal":
        return i.componentName
          .toLowerCase()
          .includes(filterKeywords.toLowerCase());

      case "iconfont":
        return i.props.type.toLowerCase().includes(filterKeywords.toString());
    }
  });
};
```

最后在 `index.ts` 中输出相应的方法和类型即可：

```ts
export { useStore } from "./createStore";
export type { Store } from "./createStore";
export type { State } from "./initialState";
export * from "./selectors";
```

如此一来，我们通过 将 store.ts 单一职责的文件，拆分成各司其职的多个文件后，就初步解决了接下来可能的状态大量扩展的问题与类型定义不准确的问题，基本上可以保证项目的可维护性。

### Step 5: 复杂 Action 交互：get()

Step1~Step3 可能在很大程度上就能满足大部分场景的状态管理诉求，从 Step4 开始，其实意味着状态管理的复杂性开始上升，因此 Step4 也是为了驾驭复杂性而做的一个铺垫。在图标选择器这个组件中，ant design 的图标选择部分并没有太复杂的逻辑，最复杂的部分也只是关键词搜索的展示。但 iconfont 部分的图标不同，这一部分由于存在用户的输入和多个数据源的配置、切换，复杂性是急剧上升的。譬如存在的展示状态就有：空数据、空数据但要添加数据源、有数据未选中态、有数据选中态等总共 7 种状态。所以在状态管理的复杂性也是急剧上升。

![img](https://assets.ng-tech.icu/item/v2-eae60a73d306aed8aad9a8ddc470e0a8_1440w.webp)

那 zustand 如何做到有效地收敛这些操作呢？核心思路就是基于用户行为分层拆解一级承接的 Action ，最后在多个方法的基础上统一抽取原子操作 Action。

![img](https://assets.ng-tech.icu/item/v2-35d02119a88eb3fc588c37c598aaf13a_1440w.webp)

首先是要识别用户操作维度上的行为，在 Iconfont 这个场景下，用户的行为有三类：**添加数据源**、**选择数据源**和 **移除数据源**。

- 先来看「添加数据源」 ：用户感知到的添加数据源这个行为看起来简单，但在数据流上其实包含四个步骤：❶ 显示表单 -> ❷ 将数据源添加到数据源数组中 -> ❸ 隐藏表单-> ❹ 选中添加的数据源。

![动图封面](https://assets.ng-tech.icu/item/v2-6c854c1f06fd4497a90cb374968556e2_b.jpg)

- 再来看「选择数据源」：选择数据源就是当用户存在多个 Iconfont 图标源的时候，用户可以按自己的诉求切换不同的 Iconfont 数据源；

![动图封面](https://assets.ng-tech.icu/item/v2-e14b070e335320d4554c338c4ea1b306_b.jpg)

- 最后再看下「移除数据源」：移除数据源看似很简单，但是其实也存在坑。即：移除当前选中的数据源时，怎么处理选中态的逻辑？基于良好的用户体验考虑，我们会自动帮用户切换一个选中的数据源。但这里就会有边界问题：如果删除的数据源第一个，那么应该往后选择，如果删除的是最后一个数据源，那么应该往前选择。|

![动图封面](https://assets.ng-tech.icu/item/v2-dd7bf30129bd4e1f2e9f5b5e17a413ae_b.jpg)

删除第一个

|

![动图封面](https://assets.ng-tech.icu/item/v2-8cdfd1de14270977736f01facc104446_b.jpg)

删除最后一个

那这样的功能从数据流来看，移除数据源会包含三个阶段：❶ 从数据源数组中移除相应项 -> ❷ 决策需要选中哪个数据源 -> ❸ 选中相应的数据源。

基于上述的分析，我们可以发现三层方法会存在一些重复的部分，主要是对数据源数组的更新与设定激活数据源。所以相应的 Action 可以拆解如下：

![img](https://assets.ng-tech.icu/item/v2-71885e2c3ade44fff3d119795ca6d014_1440w.webp)

所以我们在 store 中定义这些这些方法：

```ts
import create from "zustand";

import type { State } from "./initialState";
import { initialState } from "./initialState";

interface Action {
  /* 一级 action */
  addScript: (script: ExternalScripts) => void;
  removeScripts: (url: string) => void;
  selectScript: (url: string) => void;

  /* 原子操作 action */
  updateScripts: (scripts: ExternalScripts[]) => void;
  toggleForm: (visible: boolean) => void;
}

export type Store = State & Action;
```

来看下具体的实现，在 zustand 中能实现上述架构的核心能力在于一个 `get()` 方法，能从自身中拿到所有的状态（State & Action）。

```ts
// ...

export type Store = State & Action;

// create 函数的第二个参数 get 方法
export const useStore = create<Store>((set, get) => ({
  ...initialState,

  // 用户行为 action //

  addScript: (script) => {
    // 从 get() 中就可以拿到这个 store 的所有的状态与方法
    const { selectScript, iconfontScripts, updateScripts, toggleForm } = get();

    // 1. 隐藏 Form
    toggleForm(false);

    // 2. 更新数据源
    updateScripts(
      produce(iconfontScripts, (draft) => {
        if (!draft.find((i) => i.url === script.url)) {
          draft.push(script);
        }
      })
    );

    // 3. 选择脚本
    selectScript(script.url);
  },
  removeScripts: (url) => {
    const { iconfontScripts, selectScript, updateScripts } = get();

    const nextIconfontScripts = iconfontScripts.filter((i) => i.url !== url);

    // 找到临近的图标库并选中

    const currentIndex = iconfontScripts.findIndex((i) => i.url === url);

    const nextIndex =
      currentIndex === 0
        ? 0
        : nextIconfontScripts.length <= currentIndex + 1
        ? currentIndex - 1
        : currentIndex;

    const nextScript = nextIconfontScripts[nextIndex]?.url;

    updateScripts(nextIconfontScripts);

    selectScript(nextScript);
  },

  // 原子操作方法 //

  toggleForm: (visible) => {
    set((s) => ({
      ...s,
      showForm: typeof visible === "undefined" ? !s.showForm : visible,
    }));
  },
  selectScript: async (url) => {
    // 如果没有 url ，就说明是取消选择
    if (!url) {
      set({ activeIconfontScript: "", iconfontIconList: [] });
      return;
    }

    // 2. 一个异步方法获取脚本中的图标列表
    const iconfontList = await fetchIconList(url);

    // 3. 设定选中后的数据更新
    set({
      activeIconfontScript: url,
      iconfontIconList: iconfontList.map((i) => ({
        type: "iconfont",
        componentName: iconfontScripts.name,
        scriptUrl: url,
        props: { type: i },
      })),
    });
  },
  updateScripts: (scripts) => {
    const { iconfontScripts } = get();

    if (isEqual(iconfontScripts, scripts)) return;
    set({ iconfontScripts: scripts });
  },
}));
```

当完成相应的功能实现后，只需要在相应的触发入口中添加方法即可。

```tsx
const IconfontScripts: FC = memo(() => {
  const {
    iconfontScripts,
    showForm,
    activeIconfontScript,
    removeScripts,
    selectScript,
    toggleEditor,
  } = useStore();
  const isEmptyScripts = useStore(isEmptyIconfontScripts);

  return (
    <Flexbox gap={8}>
      <Flexbox gap={4} horizontal>
        {showForm ? (
          <ActionIcon
            onClick={() => toggleEditor(false)}
            icon={<UpOutlined />}
          />
        ) : (
          <Tag
            onClick={() => {
              toggleEditor(true);
            }}
          >
            <PlusOutlined /> 添加
          </Tag>
        )}
        <Flexbox horizontal>
          {iconfontScripts.map((s) => {
            const checked = s.url === activeIconfontScript;

            return (
              <Tag
                onClose={() => {
                  removeScripts(s.url);
                }}
                onClick={() => {
                  selectScript(checked ? "" : s.url);
                }}
              >
                {s.name}
              </Tag>
            );
          })}
        </Flexbox>
      </Flexbox>
      {showForm ? <ScriptEditor /> : null}
    </Flexbox>
  );
});

export default IconfontScripts;
```

基于这样的一种模式，哪怕是这样一个复杂的组件，在实现层面的研发心智仍然非常简单：

- React 层面仍然只是一个渲染层；
- 复杂的状态逻辑仍然以 hooks 式的模式进行引入；
- 复杂的入口方法通过拆分子 Action 进行组合与复用；

而且我们在 Step2 中已经知道，在这种模式下，所有的 Action 都是默认不需要包 useCallback 的~

### Step 6: 从应用迈向组件：Context 与 StoreUpdater

不知道有没有小伙伴从 Step1 开始就在纳闷，你不是说这是个组件吗？为啥一直没提受控模式呢？在你这个模式下，不是就变成全局单例了么？怎么搞成组件？那这一步不就来了么，就让我们来看看在 zustand 模式下，一个已经略显复杂的应用，如何轻轻松松变成一个受控的业务组件。因为 zustand 是默认全局单例，所以如果需要变成组件，那么一定需要使用 Context 来隔离多个实例。而 这其中的关键，就是 zustand 提供的 `createContext` 方法。这个改造分为四步：

![img](https://assets.ng-tech.icu/item/v2-f65905eb175fba67b0e795696cdb8d54_1440w.webp)

第一步： **创建 Context 并添加 Provider** 先在 `createStore.ts` 下

```ts
import create from 'zustand';
import createContext from 'zustand/context';
import type { StoreApi } from 'zustand';

import type { State } from './initialState';
import { initialState } from './initialState';

interface Action {
  // *** /
}

export type Store = State & Action;

// 将 useStore 改为 createStore，并把它改为 create 方法
export const createStore = ()=> create<Store>((set, get) => ({
  ...initialState,

  resetIcon: () => {
    set({ icon: undefined });
  },

  selectIcon: (icon) => {
    set({ icon, open: false, filterKeywords: undefined });
  },

  addSript:()=>{ /*...*/ },
  updateScripts:()=>{ /*...*/ },
  removeScripts:()=>{ /*...*/ },
  selectScript:async (url)=>{ /*...*/ }
}));

// 新建并导出一下 Provider、useStore、useStoreApi 三个对象
export const { Provider, useStore, useStoreApi } = createContext<StoreApi<Store>>();
import type { FC } from 'react';
import React, { memo } from 'react';
import App from './App';

import { Provider, createStore } from '../store';

type IconPickerProps = StoreUpdaterProps;

const IconPicker: FC<IconPickerProps> = (props) => {
  return (
    <Provider createStore={createStore}>
      <App /> /* <- 这个App就是之前的引用入口 */
    </Provider>
  );
};
export default memo(IconPicker);
```

第二步：**创建并添加受控更新组件** `**StoreUpdater**`

首先在组件入口处添加 `StoreUpdater` 组件。

```ts
import type { FC } from "react";
import React, { memo } from "react";
import App from "./App";
import StoreUpdater from "./StoreUpdater";
import type { StoreUpdaterProps } from "./StoreUpdater";

import { Provider, createStore } from "../store";

type IconPickerProps = StoreUpdaterProps;
const IconPicker: FC<IconPickerProps> = (props) => {
  return (
    <Provider createStore={createStore}>
      <App />
      <StoreUpdater {...props} />
    </Provider>
  );
};
export default memo(IconPicker);
```

那 StoreUpdater 具体是干什么的？ 看下面这张图，我想大家就懂了。

![img](https://assets.ng-tech.icu/item/v2-5316d575e5dc43e8728e4c399f1387d4_1440w.webp)

简单来说，就是通过 `StoreUpdater` 这个组件，做到外部 props 和内部状态的隔离。这样一来，当没有外部 props 时，我们直接可以把这个 App 当成普通应用。而当有外部的 props 时，可以通过 `StoreUpdater` 实现外部状态的受控。利用这样的思想，我们就可以很简单地把一个 App 改造成受控的业务组件。这种架构模式，也称为「分形架构」。

> 如果子组件能够以同样的结构，作为一个应用使用，这样的结构就是分形架构。在分形架构下，每个应用都可以变成组件，被更大的应用合并消费。

具体来看看代码：

```ts
import type { FC } from "react";

import type { State } from "../store";
import type { IconUnit, ExternalScripts } from "../types";

import { useStoreApi } from "../store";

/**
 * 更新方法
 */
export const useStoreUpdater = (
  key: keyof T,
  value: any,
  deps = [value],
  updater?
) => {
  const store = useStoreApi();

  useEffect(() => {
    if (typeof value !== "undefined") {
      store.setState({ [key]: value });
    }
  }, deps);
};

export interface StoreUpdaterProps
  extends Partial<
    Pick<
      State,
      "icon" | "onIconChange" | "iconfontScripts" | "onIconfontScriptsChange"
    >
  > {
  defaultIcon?: IconUnit;
  defaultIconfontScripts?: ExternalScripts[];
  defaultActiveScripts?: ExternalScripts[];
}

const StoreUpdater: FC<StoreUpdaterProps> = ({
  icon,
  defaultIcon,
  iconfontScripts,

  defaultIconfontScripts,
  onIconChange,
  onIconfontScriptsChange,
}) => {
  useStoreUpdater("icon", defaultIcon, []);
  useStoreUpdater("icon", icon);
  useStoreUpdater("onIconChange", onIconChange);

  useStoreUpdater("iconfontScripts", iconfontScripts);
  useStoreUpdater("iconfontScripts", defaultIconfontScripts, []);
  useStoreUpdater("onIconfontScriptsChange", onIconfontScriptsChange);

  return null;
};
export default StoreUpdater;
```

在 `StoreUpdater` 这个组件中，核心分为三个部分：

- `useStoreUpdater` ：将外部的 props 同步到 store 内部的方法；
- `StoreUpdaterProps`：从 store 的 State 中 pick 出需要受控的状态，并相应补充 defaultXX 的 props；
- `StoreUpdater`：逐一补充调用外部组件 props 的受控状态，将外部 props 更新到 store 的内部状态中；

针对受控组件来说，要实现一个状态 props 的受控，一定会有的孪生的两个 props。例如一个 props 叫 value ，一定会有一个 defaultValue 和一个 onValueChange，才能满足所有和这个 value 相关的场景诉求。因此我在 `StoreUpdater` 中是也完全基于这个规则书写受控代码。不过这里有个很有意思的点：**就是在受控模式下，把 onChange 也当成 store 的自持的状态去思考**。所有的 onChange 类方法，只有两种状态 `null` 和 `function`。这样就能在 store 内部很轻松地完成受控方法的集成。

而 zustand 在这个过程中发挥最关键一点的 hooks 叫做 `useStoreApi`。这个 props 可能大家在 Step1~ Step5 中都没看到过，因为这个 hooks 只在 context 的场景下出现。它的功能就是获得相应 `Context` 下的 `useStore` 方法。如果直接使用 `useStore`，那么是获得不到挂在在 useStore 上的变量的。大家是否还记得 Step1 中的 `useStore.setState({ ... })`这个方法？它在这个场景下发挥了巨大的作用，大大减少了更新受控 props 的代码量。这是我们需要在这里使用 `useStoreApi` 的原因。

这一步写完之后，组件接受外部 props ，并受控的部分就完成了。最后就只剩内部状态变更需要 onChange 出来了。

第三步：**在相应的 Action 里添加 onChange 方法** 在第二步中看到，我们需要在 Store 的 State 中把 onChange 方法作为状态自持，因此在 initalState 文件中，就需要补充相应的类型定义和初始值：

```ts
import type {
  ExternalScripts,
  IconfontIcon,
  IconUnit,
  ReactIcon,
} from "../types";
import { antdIconList } from "../contents/antdIcons";

export interface State {
  iconfontScripts: ExternalScripts[];
  icon?: IconUnit;
  showForm: boolean;
  /**
   * 开启面板
   */
  open: boolean;
  panelTabKey: "antd" | "iconfont";

  filterKeywords?: string;

  activeIconfontScript?: string;
  antdIconList: ReactIcon[];
  iconfontIconList: IconfontIcon[];

  // 外部状态
  onIconChange?: (icon: IconUnit) => void;
  onIconfontScriptsChange?: (iconfontScripts: ExternalScripts[]) => void;
}

export const initialState: State = {
  open: false,
  showForm: false,
  panelTabKey: "antd",
  filterKeywords: "",
  antdIconList,

  iconfontScripts: [],
  iconfontIconList: [],

  onIconChange: null,
  onIconfontScriptsChange: null,
};
```

而因为我们在 Step5 中通过收敛了一些原子级的 Action，基本做到了一个 State 有一个对应的 Action，因此只需要相应的 Action 处添加受控更新的 onChange 方法即可。

```ts
// ...

export type Store = State & Action;

export const createStore = () =>
  create<Store>((set, get) => ({
    ...initialState,

    selectIcon: (icon) => {
      set({ icon, open: false, filterKeywords: undefined });

      // 受控更新 icon
      get().onIconChange?.(icon);
    },
    // 用户行为 action //

    addScript: (script) => {
      // 从 get() 中就可以拿到这个 store 的所有的状态与方法
      const { selectScript, iconfontScripts, updateScripts, toggleForm } =
        get();

      // 1. 隐藏 Form
      toggleForm(false);

      // 2. 更新数据源
      updateScripts(
        produce(iconfontScripts, (draft) => {
          if (!draft.find((i) => i.url === script.url)) {
            draft.push(script);
          }
        })
      );

      // 3. 选择脚本
      selectScript(script.url);
    },
    removeScripts: (url) => {
      const { iconfontScripts, selectScript, updateScripts } = get();

      const nextIconfontScripts = iconfontScripts.filter((i) => i.url !== url);

      // 找到临近的图标库并选中

      const currentIndex = iconfontScripts.findIndex((i) => i.url === url);

      const nextIndex =
        currentIndex === 0
          ? 0
          : nextIconfontScripts.length <= currentIndex + 1
          ? currentIndex - 1
          : currentIndex;

      const nextScript = nextIconfontScripts[nextIndex]?.url;

      updateScripts(nextIconfontScripts);

      selectScript(nextScript);
    },

    // 原子操作方法 //

    toggleForm: (visible) => {
      set((s) => ({
        ...s,
        showForm: typeof visible === "undefined" ? !s.showForm : visible,
      }));
    },
    selectScript: async (url) => {
      // 如果没有 url ，就说明是取消选择
      if (!url) {
        set({ activeIconfontScript: "", iconfontIconList: [] });
        return;
      }

      // 2. 一个异步方法获取脚本中的图标列表
      const iconfontList = await fetchIconList(url);

      // 3. 设定选中后的数据更新
      set({
        activeIconfontScript: url,
        iconfontIconList: iconfontList.map((i) => ({
          type: "iconfont",
          componentName: iconfontScripts.name,
          scriptUrl: url,
          props: { type: i },
        })),
      });
    },
    updateScripts: (scripts) => {
      const { iconfontScripts } = get();

      if (isEqual(iconfontScripts, scripts)) return;
      set({ iconfontScripts: scripts });

      // 受控更新 IconfontScripts
      get().onIconfontScriptsChange?.(scripts);
    },
  }));
```

如此一来，组件的受控就完成了。

（可选）第四步：**查找 useStore.setState 用法，补充 useStoreApi** 如果有一些状态非常简单，从写下的一开始就始终是 `useStore.setState` 的写法，那么这些写法在组件化之后需要做一点点小调整。因为 useStore 是完全来自于 context 下的 useStore，因此会丢失 setState 的相关方法。因此需要额外引入 `useStoreApi` ，并用 storeApi 来实施 setState。这可能算是算 zustand 从应用迁移到组件的一点点小瑕疵。

```ts
import { useStore, useStoreApi } from '../store';

const IconList = () => {
  const { iconList } = useStore();

  const storeApi = useStoreApi()

  return (
    <div>
      {iconList.map((icon) => (
        <IconThumbnail onClick={(icon) => {
            storeApi.setState({ icon, open: false, filterKeywords: undefined });
        })} />
      ))}
    </div>
  );
};
```

不过如果是真正的复杂应用，经历过 Step1~Step5 之后，估计大部分状态变更都会收敛到 Store 中，因此如果需要修改 setState 的部分，在我实际使用下来并不算太多。最后来看下这样的一个效果：

![动图封面](https://assets.ng-tech.icu/item/v2-60910696c0ee8491fd5fd5cc0c80c5c7_b.jpg)

可以看到，基于 zustand 的这样的开发模式，一个业务应用可以非常简单地迁移成为一个受控的业务组件，且任何一个需要对外暴露的数据源，都可以非常轻松地做到受控。而这是我认为 zustand 作为状态管理库极其好用的一点。

PS：这个 `StoreUpdater` 的用法我也是翻了 react-flow 才了解到的。它的 `StoreUpdater` 比我这个组件可是多多了。而这样的 props，使得 react-flow 这个复杂组件的灵活度和可玩性得到了保障。（有兴趣的同学可以看看它的源码 [传送门 ->](https://link.zhihu.com/?target=https%3A//github.com/wbkd/react-flow/blob/main/src/components/StoreUpdater/index.tsx)）

### Step 7: 性能优化：又是 selector ?

作为一个制作精良的组件，性能上一定不能拉胯。因此我们需要来做下优化了。最近云谦老师写了篇《关于 React Re-Render》，可以看到如果要裸写 hooks 做性能优化，得学习一堆基础知识和踩一堆坑，最后代码里一坨一坨的 useXXX，心智负担非常重。那在 zustand 中怎么做性能优化呢？

首先，在 Step2 中我们已经知道，所有 zustand 的 action 都默认不会造成重复渲染，因此，理论上只有 state 会造成重复渲染。我们来看下实际情况。首先我使用 `useWhyDidYouUpdate` 的 hooks 来检查并确认 PickerPanel 组件的 state 和 action 是否会会发变化，从下图中可以看到，无论是 resetIcon 还是还是 storeApi ，它们的引用在其他状态变化下，都保持不变，没有造成重复渲染。

![动图封面](https://assets.ng-tech.icu/item/v2-bba194374ac65e8c90c0e94d5b763ed4_b.jpg)

但在上图中我们可以看到一个挺诡异的现象。就是明明 `useWhyDidYouUpdate` 已经包含了所有的该组件使用的状态，在修改搜索关键词时，State 都没有变化，但是 Segment 那部分却可以看到有重复渲染。那这是为什么？ 我们来改一下，写法，将 store 从单独定义为一个变量，然后用 `useWhyDidYouUpdate` 来检查变更，可以看到下面这样的情况：

![动图封面](https://assets.ng-tech.icu/item/v2-777c12719dd80ac8873b6a9b0fd95f09_b.jpg)

即当关键词 state 修改了，就会造成 store 的变化。而 store 的变化就会触发当前这个界面的重新渲染。哎？那这个不就是和 context 一模一样了么？对，你想的没错，zustand 并不像 valtio 这样会自动收集依赖，并做性能优化。所以我们是需要手动搞一轮优化的。那咋搞呢？思路上其实也非常简单：既然我在 PickerPanel 这个组件中只关心`{ panelTabKey, icon, resetIcon }` 这几个状态，那我「手动」做一个依赖收集不就好了么？那怎么手动做呢？ 还记得 step2 中的 selector 吗？又轮到它出场了。

![动图封面](https://assets.ng-tech.icu/item/v2-58c001d1e687037b86debba0cfea79ca_b.jpg)

只需要利用 zustand 的 useStore 的 selector 能力，配合 zustand 默认提供的 `shallow` 浅比较能力。我们就能实现「人工的依赖收集」。如此一来，性能优化也就做好了。我们来看看优化前和优化后的代码区别：

PickerPanel 优化前：

```ts
import { useStore, useStoreApi } from '../store';


const PickerPanel = () => {
  const { panelTabKey, icon, resetIcon } = useStore();

  // 其他

  return <>{ /*... */ }<>
}
```

PickerPanel 优化后：

```ts
import shallow from 'zustand/shallow';

import type { Store } from '../store';
import { useStore, useStoreApi } from '../store';

const selector = (s: Store) => ({
  panelTabKey: s.panelTabKey,
  icon: s.icon,
  resetIcon: s.resetIcon,
});

const PickerPanel = () => {
  const { panelTabKey, icon, resetIcon } = useStore(selector,shallow);

  // 其他

  return <>{ /*... */ }<>
}
```

可以看到，除了多一个几乎一样的 selector 和一个 shallow，其他代码没有任何区别，但是性能优化就是这么做好了。那这是基于 zustand selector 的写法可以做到的渐进式性能优化。「需要优化？加个 selector 就好~」这样的研发心智，可以让业务开发有很多选择，譬如：

- 前期撒开来默认解构 useStore，不必担心未来的性能优化难题。等发现某些地方真的需要优化时，相应的套上 selector 就好；
- 反正只是加个 selector，也可以写完应用定型后也可以顺手加一下；
- 既然 selector 可以做优化，那我干脆全部都直接 `const x = useStore(s=>s.x)`，这样引入好，也直接优化完了。

### Step 8: 研发增强：Devtools

当 Store 复杂度到现在这样之后，接下来每一步 debug 都有可能变得比较麻烦，因此我们可以集成一下 devtools，将 Store 研发模式变得更加可视化，做到可控。而写法也非常简单，只需在 create 方法下包一个 devtools 即可，并在 create 后多一个 () 执行。

```ts
// ...
import { devtools } from "zustand/middleware";

export type Store = State & Action;

// 多一个函数执行，然后包裹 devtools
export const createStore = () =>
  create<Store>()(
    devtools(
      (set, get) => ({
        ...initialState,

        // ... action
      }),
      { name: "IconPicker" }
    )
  );
```

如此一来，我们就能够使用 redux-dev-tools 可视化地查看 IconPicker 的数据流了。

![img](https://assets.ng-tech.icu/item/v2-bee8687afc37fd8c5e4b7ba0c760ff11_1440w.webp)

image.png

不过大家可能会发现，这个时候每一次的数据变更，都是是 anoymous 的变更说明，那有没有可能让每条变更都更加语义化呢？可以！ 只需在 set 方法的第三个参数中添加更新说明文本，就可以让 devtools 识别到这项状态变更。

```ts
// ...
import "";

export type Store = State & Action;

// 多一个函数执行，然后包裹 devtools
export const createStore = () =>
  create<Store>()(
    devtools(
      (set, get) => ({
        ...initialState,

        // ... action
        selectIcon: (icon) => {
          set(
            { icon, open: false, filterKeywords: undefined },
            false,
            "选择 Icon"
          );

          get().onIconChange?.(icon);
        },
      }),
      { name: "IconPicker" }
    )
  );
```

![img](https://assets.ng-tech.icu/item/v2-b57c5a667d0a393e9a9ba2df6688ebff_1440w.webp)

基于这样的写法，我们甚至可以畅享一个面向用户的历史记录能力~

### 还有吗？

写完上面 Step1~Step 8，基本上绝大多数状态管理的需求就都能满足了。但在一些各种边界条件与复杂场景下，一定还是会有各种奇奇怪怪的诉求的。所以我在这里再列了一些自己 zustand 的其他用法，但不再细讲：

- 集成 redux reducer 或 react useReducer 的写法；
- 觉得事件处理麻烦，需要借用 rxjs 简化事件流处理；
- 需要结合一些请求库，比如 swr 的使用方式，将 hooks 集成到 store 中；
- 结合 persist 做本地数据缓存的方式；
- 结合社区库 zundo 简单实现的一个历史记录功能；
- 利用 subscribe 监听状态变更，自动更新内部状态；
- 单一 store 的切片化；
- 集成一些复杂三方库（例如 y-js）；

写到这里，就基本上把这大半年所有基于 zustand 的状态管理经验写完了。希望对大家做状态管理的相关决策有些帮助吧~
