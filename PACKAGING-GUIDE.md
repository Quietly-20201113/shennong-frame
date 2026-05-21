# 神农信息系统 · 打包发布与消费指南

> 本文档基于 P0-1 ~ P0-5.5 阶段（2026-05）真实踩坑总结，覆盖：①子包按类型选打包工具 / ②发布到私服 Verdaccio / ③主程序（monorepo 内）消费 / ④乙方（独立仓库）消费。

---

## 目录

1. [速览：5 类包 ↔ 4 套配置模板](#一速览5-类包--4-套配置模板)
2. [打包配置模板](#二打包配置模板)
3. [发布到私服](#三发布到私服)
4. [主程序消费方式](#四主程序消费方式monorepo-内)
5. [乙方独立项目消费方式](#五乙方独立项目消费方式)
6. [踩坑速查](#六踩坑速查)

---

## 一、速览：5 类包 ↔ 4 套配置模板

| 包类型 | 例子 | 打包工具 | 模板 |
| --- | --- | --- | --- |
| **A. 纯 TS** | `@shennong/types` `@shennong/utils` `@shennong/access` `@shennong/hooks` | `tsdown` | A |
| **B. 含 Vue SFC（有 scoped css）** | `@shennong-core/menu-ui` `@shennong/common-ui` `@shennong/layouts` | `vite library` | B |
| **C. 含 Vue SFC（无 css）** | `@shennong-core/form-ui` `@shennong-core/popup-ui` `@shennong-core/layout-ui` | `vite library` | B（同 B） |
| **D. 资源包（CSS / SCSS / SVG）** | `@shennong/styles` `@shennong/icons` | C / D | C / D |
| **E. 工程配置（无 build）** | `@shennong/tsconfig` `@shennong/tailwind-config` | 直接发 src 文件 | E |
| **F. 多组件包**（同包导出多个独立组件） | `@shennong-core/shadcn-ui`（32 子组件） | `vite library` 单入口 / 多入口 | **F**（见下） |

**关键判断**：

- 包内有 `.vue` 文件 → 必须用 **vite library**（tsdown + unplugin-vue 处理 css 有 bug）
- 包内有 SCSS `@use` / `import.meta.glob` / `?raw` 等 vite 特性 → **vite library**
- 包内导出 ≥ 3 个独立组件且预期组件数会增长 → 走 **模板 F**（多组件包专项约定）
- 否则 → **tsdown**（更轻量、build 更快）

---

## 二、打包配置模板

### 模板 A：纯 TS 包（tsdown）

**`tsdown.config.ts`**：

```ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: { resolver: 'tsc' },
  outExtensions: () => ({ js: '.mjs', dts: '.d.ts' }),
});
```

**`package.json` 关键字段**：

```jsonc
{
  "type": "module",
  "scripts": { "build": "pnpm exec tsdown" },
  "files": ["dist"],
  "main": "./dist/index.mjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts", // ← dev 期 monorepo 直引源码
      "default": "./src/index.ts",
    },
  },
  "publishConfig": {
    "exports": {
      ".": {
        "types": "./dist/index.d.ts", // ← publish 时切换为 dist
        "default": "./dist/index.mjs",
      },
    },
  },
  "devDependencies": { "tsdown": "catalog:" },
}
```

### 模板 B：含 Vue SFC（vite library + auto inject css）

**`vite.config.ts`**：

```ts
// eslint-disable-next-line no-restricted-imports
import { defineConfig } from '@shennong/vite-config';

export default defineConfig(async () => ({
  library: { dts: true },
}));
```

**`package.json` 关键字段**（与 A 不同的部分）：

```jsonc
{
  "scripts": { "build": "pnpm vite build" },
  "files": ["dist"],
  "types": "./dist/src/index.d.ts", // ← vite library 把 dts 输出到 dist/src/
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts",
    },
  },
  "publishConfig": {
    "exports": {
      ".": {
        "types": "./dist/src/index.d.ts",
        "default": "./dist/index.mjs",
      },
      "./style.css": "./dist/<package-name>.css", // ← 有 css 时加（被 lib-inject-css 自动注入到 mjs，消费方零负担）
    },
  },
  "devDependencies": {
    "@shennong/vite-config": "workspace:*",
    "vite": "catalog:",
  },
}
```

> `@shennong/vite-config` 的 `library` 模式**自动**给 `dist/index.mjs` 顶部注入 `import './<name>.css'`，消费方装包后**不需要**显式 import css。

### 模板 C：CSS/SCSS 资源包（直接发 src）

`@shennong/styles` 的实践：

```jsonc
{
  "files": ["src", "dist"],
  "exports": {
    ".": { "default": "./src/index.ts" },
    "./antd": { "default": "./src/antd/index.css" },
    "./global": { "default": "./src/global/index.scss" },
  },
  "publishConfig": {
    "exports": {
      ".": { "default": "./dist/index.mjs" },
      "./antd": { "default": "./src/antd/index.css" }, // ← css 资源走 src 不变
      "./global": { "default": "./src/global/index.scss" },
    },
  },
}
```

### 模板 D：含 vite 特性的资源包

`@shennong/icons` 用了 `import.meta.glob('?raw')` 加载 svg，必须用 vite library：

```ts
// vite.config.ts
import { defineConfig } from '@shennong/vite-config';

export default defineConfig(async () => ({
  library: { dts: true },
}));
```

其余同模板 B。

### 模板 E：工程配置包（无 build）

`@shennong/tsconfig` 类：

```jsonc
{
  "files": ["base.json", "library.json", "web-app.json"],
  "main": "./web-app.json",
}
```

不需要 build script，发布时 npm 直接打包 files 列出的 .json。

### 模板 F：多组件包（重点 — 组件会越来越多）

> 适用：一个包内承载多个独立组件（≥ 3），如 `@shennong-core/shadcn-ui`、未来的 `@shennong/biz-ui`（业务组件库）、`@shennong/charts` 等。核心问题：**组件多 → 配置不能爆炸 → 必须靠目录约定 + 自动化**。

#### F.1 工程目录约定（强制）

```
packages/<some-component-pkg>/
├── src/
│   ├── index.ts                 # 总 barrel：export * from './ui'; export * from './components';
│   ├── ui/
│   │   ├── index.ts             # ui barrel：export * from './button'; export * from './input'; ...
│   │   ├── button/
│   │   │   ├── index.ts         # 子 barrel：export * from './button'; export { default as Button } from './Button.vue'; export type * from './types';
│   │   │   ├── Button.vue
│   │   │   ├── button.ts        # variants / props 定义
│   │   │   └── types.ts
│   │   ├── input/
│   │   │   └── ...（同 button 结构）
│   │   └── ...
│   └── components/              # 复合组件（基于 ui/* 组装），可选
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**铁律**：

1. **每个组件一个文件夹**：文件夹名 = kebab-case（`number-field`），导出名 = PascalCase（`NumberField`）。
2. **每层 barrel `index.ts`**：禁止跨层 `import '../../button/Button.vue'`，全部走 barrel。
3. **types 单独成文件**：`button/types.ts`，barrel 用 `export type *` 转出。这样多入口拆 chunk 时类型不会被打进 js。
4. **样式在 `.vue` 内 `<style>` 或同名 `.css`**：禁止在 `index.ts` 顶部 `import './style.css'`（会破坏 tree-shaking 的 sideEffects 推断）。

#### F.2 模式选择：单入口 → 多入口（按需求演进，不要一步到位）

| 模式 | 何时用 | 配置成本 | 体积/性能 |
| --- | --- | --- | --- |
| **F-① 单入口 + tree-shaking** | 组件数 ≤ 30，或 css 总量 < 100KB gzipped | ★低（与模板 B 完全一致） | js 能 tree-shake，**css 全量加载** |
| **F-② 多入口 + 子路径 exports** | 组件数 > 30，或单组件 css 大（如富文本/图表/3D），或乙方按需加载 | ★★中（需 vite-config 扩展 + 生成 exports） | js + css 都按需 |

> **2026-05 现状**：所有多组件包统一走 **F-①**。`@shennong/vite-config@5.7.3` 的 `library` 模式硬编码 `entry: 'src/index.ts'`，要走 F-② 必须先扩 vite-config（见第七节路线图）。

#### F.3 模式 F-①：单入口 + tree-shaking（当前推荐）

`vite.config.ts`、`package.json` 主体与**模板 B 完全相同**，关键差异在三个字段：

```jsonc
{
  // ① 关键：sideEffects 标注，告诉打包器"只有 css 有副作用，js barrel 可放心 tree-shake"
  "sideEffects": ["**/*.css", "**/*.scss"],

  // ② peerDependencies：vue / ant-design-vue / 大型 runtime 全部下沉为 peer，避免重复打包
  "peerDependencies": {
    "vue": "^3.5.0",
    "ant-design-vue": "^4.2.0",
  },

  // ③ publishConfig.exports：单子路径暴露 css，无需为每个组件单列入口
  "publishConfig": {
    "exports": {
      ".": {
        "types": "./dist/src/index.d.ts",
        "default": "./dist/index.mjs",
      },
      "./style.css": "./dist/<package-name>.css",
    },
  },
}
```

**消费方写法**：

```ts
// rolldown 通过 sideEffects + ESM static analysis 自动只保留 Button / Input
import { Button, Input } from '@shennong-core/shadcn-ui';
// css 由 lib-inject-css 自动注入到 dist/index.mjs 顶部，乙方无感
```

**新增组件清单**（F-① 模式下）：

1. `src/ui/<new-component>/` 创建文件夹（按 F.1 结构）
2. `src/ui/index.ts` 加一行 `export * from './<new-component>';`
3. `pnpm build` → bump version → publish。**package.json 不动**

#### F.4 模式 F-②：多入口 + 子路径 exports（未来扩展，文档先行）

> **当前 `@shennong/vite-config` 不支持，先看清楚未来形态，避免现在踩死。**

##### F.4.1 vite-config 需要扩展的能力

```ts
// internal/vite-config/src/typing.ts —— 未来扩展
interface DefineLibraryConfigOptions {
  dts?: boolean;
  /** 多入口模式：传 glob 自动发现，或手动 entry map */
  entries?: string | string[] | Record<string, string>;
  /** 是否给每个 entry 独立注入对应 css */
  cssCodeSplit?: boolean;
}
```

`internal/vite-config/src/config/library.ts` 需要：

- `build.lib.entry` 支持对象形式（多入口）
- `build.cssCodeSplit: true` 让每个 entry 产独立 css
- `libInjectCssPlugin` 改成"按 chunk 名匹配同名 css 注入"（当前是"找第一个 css 注入到所有 entry"，多入口下错误）

##### F.4.2 包的 vite.config.ts（未来形态）

```ts
import { defineConfig } from '@shennong/vite-config';
import { glob } from 'tinyglobby';

export default defineConfig(async () => {
  // 自动发现 src/ui/*/index.ts 作为入口
  const componentEntries = await glob('src/ui/*/index.ts');
  const entries = {
    index: 'src/index.ts',
    ...Object.fromEntries(
      componentEntries.map((p) => {
        const name = p.match(/src\/ui\/([^/]+)\/index\.ts$/)![1];
        return [`ui/${name}/index`, p];
      }),
    ),
  };

  return {
    library: {
      dts: true,
      entries,
      cssCodeSplit: true, // 每个组件独立 css 文件
    },
  };
});
```

产物：

```
dist/
├── index.mjs            # 总 barrel
├── shadcn-ui.css        # 总样式（兼容老消费方）
├── ui/
│   ├── button/index.mjs
│   ├── button/index.css
│   ├── input/index.mjs
│   ├── input/index.css
│   └── ...
└── chunks/              # 共享代码自动提取
    └── shared-<hash>.mjs
```

##### F.4.3 publishConfig.exports 不可手维护，必须脚本生成

**禁止**手写 32 行子路径 exports。在 monorepo 根加一个脚本：

```js
// scripts/gen-component-exports.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'tinyglobby';

const pkgPath = process.argv[2]; // 用法：node scripts/gen-component-exports.mjs packages/@core/ui-kit/shadcn-ui
const pkg = JSON.parse(readFileSync(`${pkgPath}/package.json`, 'utf8'));
const components = (await glob('src/ui/*/index.ts', { cwd: pkgPath })).map(
  (p) => p.match(/src\/ui\/([^/]+)\/index\.ts$/)[1],
);

pkg.publishConfig ??= {};
pkg.publishConfig.exports = {
  '.': {
    types: './dist/src/index.d.ts',
    default: './dist/index.mjs',
  },
  './style.css': `./dist/${pkg.name.split('/').pop()}.css`,
  ...Object.fromEntries(
    components.flatMap((c) => [
      [
        `./${c}`,
        {
          types: `./dist/src/ui/${c}/index.d.ts`,
          default: `./dist/ui/${c}/index.mjs`,
        },
      ],
      [`./${c}/style.css`, `./dist/ui/${c}/index.css`],
    ]),
  ),
};

writeFileSync(`${pkgPath}/package.json`, JSON.stringify(pkg, null, 2) + '\n');
console.log(`✓ 生成 ${components.length} 个组件子路径 exports`);
```

**钩到 build 流程前自动跑**：

```jsonc
// 多组件包的 package.json
{
  "scripts": {
    "build": "node ../../../scripts/gen-component-exports.mjs . && pnpm vite build",
  },
}
```

**消费方按需加载写法**：

```ts
// 只引一个组件 + 对应 css
import { Button } from '@shennong-core/shadcn-ui/button';
// css 由 lib-inject-css 注入到 ui/button/index.mjs 顶部

// 或全量
import { Button, Input } from '@shennong-core/shadcn-ui';
```

##### F.4.4 新增组件清单（F-② 模式下）

1. `src/ui/<new-component>/` 创建文件夹
2. `src/ui/index.ts` 加 `export *`
3. `pnpm build`（脚本自动重生 `publishConfig.exports`）
4. 验证：`pnpm pack --dry-run` 看 tarball 含新子路径
5. publish

**完全无需手改 package.json**。

#### F.5 sideEffects 配置详解（多组件包必读）

错误的 `sideEffects` 会让 tree-shaking 失效或样式丢失。规则：

| 场景 | sideEffects 该写什么 | 为什么 |
| --- | --- | --- |
| 全部 .vue 内联 `<style scoped>` | `["**/*.css", "**/*.scss"]` | css 文件由 vite 生成，必须保留 |
| 组件 `index.ts` 顶部有 `import './polyfill'` | `["**/*.css", "**/*.scss", "**/polyfill.ts"]` | 显式列出有副作用的纯 ts 文件 |
| 组件需要全局注册（`Vue.component`） | `false` 整体禁用 tree-shaking | 全局注册必然有副作用，但更推荐改成显式 `app.use(plugin)` |

**反例**：

```jsonc
"sideEffects": false  // ❌ 多组件包千万不能这么写，css 会被 tree-shake 掉
```

#### F.6 peerDependencies vs dependencies（多组件包必读）

| 类型 | 该放哪 | 例子 |
| --- | --- | --- |
| 框架 runtime（消费方一定有） | `peerDependencies` | `vue`、`vue-router`、`pinia` |
| 大型 UI 库（消费方一定有） | `peerDependencies` | `ant-design-vue`、`element-plus` |
| 组件实现内部依赖（消费方未必有） | `dependencies` | `class-variance-authority`、`reka-ui`、`lucide-vue-next` |
| 工程依赖 | `devDependencies` | `@shennong/vite-config`、`vite` |

**为什么严守这个分类**：vite-config `library.ts` 的 external 逻辑是 `[...dependencies, ...peerDependencies]` 全部 external 化。peer 放错成 dep 会导致 vue 被打进 dist，运行时多份 vue 实例 → reactivity 全乱。

#### F.7 类型声明子路径（F-② 必备）

`@shennong/vite-config` 的 dts 是用 `vite-plugin-dts` 输出，多入口时会自动给每个 entry 生成对应 d.ts：

```
dist/src/
├── index.d.ts
└── ui/
    ├── button/index.d.ts
    ├── input/index.d.ts
    └── ...
```

`publishConfig.exports` 里每个子路径都要写 `types` 字段（见 F.4.3 脚本），否则 IDE 跳转和类型推断会断。

#### F.8 演进 checklist（什么时候从 F-① 升级到 F-②）

逐项打勾，三项以上就该升：

- [ ] 组件数 > 30
- [ ] 总 css 体积（gzipped） > 100KB
- [ ] 单个组件 css > 30KB（如富文本编辑器、图表）
- [ ] 乙方反馈"只用一两个组件但样式全量加载浪费"
- [ ] 多个乙方应用并存，希望共享 chunks 命中浏览器缓存
- [ ] 计划用 CDN 单组件分发

#### F.9 多组件包工程债清单（已知）

- [ ] `@shennong-core/shadcn-ui` 32 子组件目前走 F-①，css 全量约 80KB gzipped，临界但够用
- [ ] vite-config 扩展多入口能力（F-② 前置工作，未排期）
- [ ] `scripts/gen-component-exports.mjs` 未实现（F-② 前置工作）
- [ ] `lib-inject-css` plugin 多 chunk 适配未做（当前实现见 `internal/vite-config/src/config/library.ts:16-32`，只取第一个 css 文件，多入口下错）

---

## 三、发布到私服

### 一次性环境（甲方运维一次）

```bash
# 起本地 Verdaccio（详见 docker/verdaccio/README.md）
cd docker/verdaccio
docker compose up -d

# 创建账号
npm adduser --registry http://localhost:4873

# 验证
npm whoami --registry http://localhost:4873
```

### 单包发布（日常）

```bash
cd packages/<some-pkg>

# 1. bump 版本（verdaccio 默认禁止覆盖同版本）
node -e "const f='package.json';const p=require('./'+f);const [a,b,c]=p.version.split('.');p.version=a+'.'+b+'.'+(+c+1);require('fs').writeFileSync(f, JSON.stringify(p,null,2)+'\n')"

# 2. build
pnpm build

# 3. publish
pnpm publish --registry http://localhost:4873 --no-git-checks --access=public
```

### 批量发布（推荐）

```bash
# 在 monorepo 根
cd shennong-frame

# 全 build
pnpm -r --filter "@shennong/*" --filter "@shennong-core/*" run build

# 全发布
pnpm publish -r --filter "@shennong/*" --filter "@shennong-core/*" \
  --registry http://localhost:4873 --no-git-checks --access=public
```

### 误发版本回滚

```bash
# unpublish 单版本（注意是临时 hack，正式环境慎用）
npm unpublish @shennong/some-pkg@5.7.0 --registry http://localhost:4873 --force
```

### 发布前 checklist

- [ ] `package.json` 含 `publishConfig.exports`（不是顶层 `exports`）
- [ ] `files` 字段限制只发 `dist`（避免 src 泄漏 → 见踩坑 #1）
- [ ] `version` 是新的，且未在 verdaccio 上存在
- [ ] 跑过 `pnpm pack --dry-run` 看 tarball 内容是预期的
- [ ] 含 .vue 的包用 vite library 不是 tsdown（见踩坑 #2）

---

## 四、主程序消费方式（monorepo 内）

**场景**：框架团队在 `shennong-frame` 内同时维护核心包 + 业务应用，dogfooding。

### 配置（已在 monorepo 内现成）

`pnpm-workspace.yaml`：

```yaml
packages:
  - apps/*
  - packages/*
  - packages/@core/**
  - packages/effects/*
```

`apps/erp-admin/package.json`：

```jsonc
{
  "dependencies": {
    "@shennong/access": "workspace:*",   // ← workspace 协议直引
    "@shennong/utils": "workspace:*",
    ...
  }
}
```

### 开发流程

```bash
cd shennong-frame
pnpm install                # 装一次

# 跑业务应用
pnpm dev:erp-admin
# 或者：pnpm -F @shennong/erp-admin run dev

# 改 packages/effects/access/src/use-access.ts
# → vite HMR 自动重载，浏览器立刻看到改动（不需要 build / publish）
```

### 优点

- **HMR 即改即看**：改核心包源码立刻反映到 app
- **类型实时**：`exports` 顶层指向 `src/index.ts`，IDE 跳转到源码
- **零 publish**：开发期完全不接触 verdaccio

### 缺点

- 监管不到"乙方场景"——乙方拿到的是 dist，不能改
- 测试不到"私服包链路"

---

## 五、乙方独立项目消费方式

**场景**：乙方拿到 `shennong-erp-admin` 仓库（独立 git，不在 monorepo 内），从私服拉编译产物开发业务。

参考实例：`C:\work\document\isme\guanhub\shennong\shennong-erp-admin`

### 5.1 项目结构

```
shennong-erp-admin/                    （独立仓库）
├── src/
│   ├── main.ts                        # 入口（必须注入 window 全局）
│   ├── bootstrap.ts                   # 启动流程
│   ├── api/                           # ★ 业务 API
│   ├── views/                         # ★ 业务页面
│   ├── router/                        # 业务路由
│   ├── store/                         # 业务 store
│   └── ...
├── package.json                       # 依赖锁到具体版本（^5.7.x）
├── .npmrc                             # @shennong scope → 私服
├── vite.config.ts
└── tsconfig.json
```

### 5.2 关键配置（必备）

#### `.npmrc`：scope 路由

```ini
@shennong:registry=http://<私服地址>:4873/
@shennong-core:registry=http://<私服地址>:4873/
registry=https://registry.npmmirror.com/
strict-peer-dependencies=false
auto-install-peers=true
```

#### `package.json`：固定到私服版本（不用 workspace）

```jsonc
{
  "dependencies": {
    "@shennong/access": "^5.7.0",
    "@shennong/common-ui": "^5.7.3",
    "@shennong/layouts": "^5.7.3",
    "@shennong-core/menu-ui": "^5.7.3",
    "@shennong-core/shadcn-ui": "^5.7.4",
    "@shennong-core/design": "^5.7.4",
    "vue": "^3.5.32",
    "vue-router": "^5.0.4",
  },
  "pnpm": {
    "overrides": {
      "@shennong-core/shadcn-ui": "5.7.4",
      "vue-router": "5.0.6",
      "@shennong/vite-config": "5.7.3",
    },
  },
  "devDependencies": {
    "@shennong/tsconfig": "^5.7.0",
    "@shennong/vite-config": "^5.7.3",
    "sass": "^1.90.0",
    "vite": "^8.0.10",
  },
}
```

> **`pnpm.overrides` 是关键**：核心包之间彼此依赖时可能拉到混杂版本（如 vue-router 4 vs 5），用 overrides 强制统一。

#### `src/main.ts`：必须注入 window 全局

```ts
// 上游 @shennong/* dist 在 module 顶层调 useAppConfig，
// production 分支永远读 window._SHENNONG_ADMIN_PRO_APP_CONF_，
// 消费方 dev 模式必须手动注入，否则 destructure undefined。
(window as any)._SHENNONG_ADMIN_PRO_APP_CONF_ = {
  VITE_GLOB_API_URL: import.meta.env.VITE_GLOB_API_URL || '/api',
};
```

#### `vite.config.ts`：CJS interop + sass api

```ts
import { defineConfig } from '@shennong/vite-config';

export default defineConfig(async () => ({
  application: {},
  vite: {
    // Node 24 + sass-embedded EPIPE 兼容
    css: { preprocessorOptions: { scss: { api: 'modern' } } },
    // 提前 bundle dayjs CJS 子模块（避免运行时 default export 失败）
    optimizeDeps: {
      include: [
        'dayjs/plugin/timezone.js',
        'dayjs/plugin/utc.js',
        'dayjs/plugin/customParseFormat',
        'dayjs/plugin/duration',
        'dayjs/plugin/relativeTime',
      ],
    },
    server: {
      proxy: {
        '/api': {
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
          target: 'http://localhost:5320/api', // ← mock / 后端地址
          ws: true,
        },
      },
    },
  },
}));
```

### 5.3 启动流程

```bash
git clone <shennong-erp-admin 远程>
cd shennong-erp-admin

# 配私服 token（一次性，写到 ~/.npmrc 不入库）
npm config set //<私服地址>:4873/:_authToken=<只读token> --location=user

# 装包
pnpm install

# 起 mock 后端（需要 monorepo 内的 @shennong/backend-mock，开发期甲方提供）
# 终端 1：
cd ../shennong-frame && pnpm -F @shennong/backend-mock run start

# 终端 2：起前端
cd shennong-erp-admin
pnpm dev
# 访问 http://localhost:5666/
# 默认账号 vben / 123456
```

### 5.4 业务开发主战场

```
src/
├── views/               ← ★ 写业务页面
├── api/                 ← ★ 写业务 API 调用（用 @shennong/request 提供的 client）
├── router/business.ts   ← ★ 自建业务路由模块
├── store/               ← 业务 store（用 @shennong/stores）
└── locales/langs/       ← 业务文案 i18n
```

### 5.5 升级核心包

```bash
# 甲方框架团队发布新版后，乙方按需升级
pnpm update @shennong/access      # 升级单个包
pnpm update --latest              # 全部升到 latest

# 重要：重装会重新解析 overrides
pnpm install
```

### 5.6 核心隔离验证

```bash
# 任何时候都可验证乙方拿不到框架源码
ls node_modules/@shennong/access
# → LICENSE  dist  package.json     （没 src 目录！）

find node_modules/@shennong -name "*.ts" -not -name "*.d.ts"
# → 应该完全为空
```

---

## 六、踩坑速查

按"我遇到 X 现象 → 看哪条"组织。

### #1：消费方装包后看到 src 源文件（核心隔离失败）

**根因**：`package.json` 的 `files` 字段含了 `src`，或者 `scripts.build` 没正确生成 dist。  
**修法**：

- `files: ["dist"]`（不要含 `src`）
- 检查 build 实际有没有产 dist（不要写 `"#build"` 这种带前缀的脚本，pnpm `-r run build` 会跳过）
- 实例：`@shennong-core/preferences` P0-4 阶段的源码泄漏 bug。

### #2：含 .vue 的包样式坍塌

**根因**：用 `tsdown + unplugin-vue` build .vue，css 文件生成了但 mjs 不 import 它们。  
**修法**：换成 `vite library` 模式（`@shennong/vite-config` 5.7.3+）。

### #3：消费方报 `"./xxx" is not exported`

**根因**：`publishConfig.exports` 不含子路径（如 `./bem` `./style.css`），但顶层 `exports` 有。publish 时 publishConfig **完全替换** exports。  
**修法**：把所有要暴露的子路径全部列在 `publishConfig.exports`。

### #4：消费方报 `Cannot destructure property 'VITE_GLOB_API_URL' of '(intermediate value)' as it is undefined`

**根因**：vben 上游 `useAppConfig` 在 module 顶层调用，build 时 `import.meta.env.PROD` 被替换为 `true`，运行时永远走 production 分支读 `window._SHENNONG_ADMIN_PRO_APP_CONF_`。  
**修法**：消费方 `src/main.ts` 顶部手动注入此 window 全局（见 5.2）。

### #5：消费方 dev 启动 sass-embedded EPIPE 崩溃（Windows + Node 24）

**根因**：sass-embedded 1.99 + Node 24 + Windows 子进程通信 bug。  
**修法**：`vite.config.ts` 加 `css.preprocessorOptions.scss.api = 'modern'` 强制用 dart-sass。

### #6：消费方报 `does not provide an export named 'default'`（CJS 子模块）

**根因**：dist 把 `lodash.clonedeep` / `dayjs/plugin/timezone` 等 CJS 包 external 化，消费方 vite optimizer 转 default export 失败。  
**修法**：

- 源码层最佳：换 ESM 等价（如 `lodash-es`）
- 兜底：消费方 `vite.config.ts` `optimizeDeps.include` 显式列这些 CJS 子模块

### #7：消费方装到多个 vue-router 版本（`getRoutes` undefined）

**根因**：核心包间彼此依赖时 catalog 版本约束不严，pnpm 装多版本。  
**修法**：消费方 `package.json` 加 `pnpm.overrides` 强制单版本。

### #8：vite proxy 报 502 Bad Gateway

**根因**：mock 后端 / 真实后端没起。  
**修法**：单独终端起 `pnpm -F @shennong/backend-mock run start` 监听 5320。

### #9：登录后跳到 `/workspace` 404

**根因**：mock 后端给所有用户返 `homePath: '/workspace'`，覆盖了消费方的 `defaultHomePath`。  
**修法**：`src/store/auth.ts` `fetchUserInfo` 强制 override `userInfo.homePath = preferences.app.defaultHomePath`。

### #10：发布同版本被 verdaccio 拒

**根因**：verdaccio 默认禁止覆盖（合理）。  
**修法**：要么 bump 版本（推荐），要么 `npm unpublish @scope/pkg@x.y.z --force`（仅开发期）。

---

## 七、未来路线图

| 项 | 何时做 |
| --- | --- |
| **vite-config 扩展多入口能力**（模板 F-② 前置） | 任一多组件包触发 F.8 演进 checklist |
| **`lib-inject-css` plugin 多 chunk 适配**（同上） | 同上 |
| **`scripts/gen-component-exports.mjs`**（多组件包 publishConfig 自动生成） | 同上 |
| `@shennong/plugins` 多 entry vite library，恢复子路径 tree-shaking | 性能优化阶段 |
| `@shennong/icons` 子路径 publishConfig | 真有业务需要分块加载 svg 时 |
| 一键 `pnpm release` 脚本（changesets + 自动 bump + 批量 publish） | 团队规模 ≥ 2 人时 |
| 私服 token 区分发布 / 只读，乙方只给只读 | 真接乙方时 |
| 上游同步 vue-vben-admin 时跑 `scripts/rebrand.mjs` | 每次同步 |

---

## 附：本仓库文件索引

| 文件 | 用途 |
| --- | --- |
| `MIGRATION.md` | 框架团队运维手册（同步上游、发版日志、待办） |
| `PACKAGING-GUIDE.md`（本文件） | 打包发布消费完整指南 |
| `docker/verdaccio/README.md` | 私服部署指南（甲方运维） |
| `scripts/rebrand.mjs` | 上游同步后批量重命名脚本 |
| `apps/erp-admin/` | 主程序（monorepo 内 dogfooding） |
| `../shennong-erp-admin/` | 乙方独立项目示例（与本仓库平级目录） |
