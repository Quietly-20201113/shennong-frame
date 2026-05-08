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
|---|---|---|---|
| **A. 纯 TS** | `@shennong/types` `@shennong/utils` `@shennong/access` `@shennong/hooks` | `tsdown` | A |
| **B. 含 Vue SFC（有 scoped css）** | `@shennong-core/menu-ui` `@shennong-core/shadcn-ui` `@shennong/common-ui` `@shennong/layouts` | `vite library` | B |
| **C. 含 Vue SFC（无 css）** | `@shennong-core/form-ui` `@shennong-core/popup-ui` `@shennong-core/layout-ui` | `vite library` | B（同 B） |
| **D. 资源包（CSS / SCSS / SVG）** | `@shennong/styles` `@shennong/icons` | C / D | C / D |
| **E. 工程配置（无 build）** | `@shennong/tsconfig` `@shennong/tailwind-config` | 直接发 src 文件 | E |

**关键判断**：
- 包内有 `.vue` 文件 → 必须用 **vite library**（tsdown + unplugin-vue 处理 css 有 bug）
- 包内有 SCSS `@use` / `import.meta.glob` / `?raw` 等 vite 特性 → **vite library**
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
      "types": "./src/index.ts",      // ← dev 期 monorepo 直引源码
      "default": "./src/index.ts"
    }
  },
  "publishConfig": {
    "exports": {
      ".": {
        "types": "./dist/index.d.ts", // ← publish 时切换为 dist
        "default": "./dist/index.mjs"
      }
    }
  },
  "devDependencies": { "tsdown": "catalog:" }
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
  "types": "./dist/src/index.d.ts",   // ← vite library 把 dts 输出到 dist/src/
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "publishConfig": {
    "exports": {
      ".": {
        "types": "./dist/src/index.d.ts",
        "default": "./dist/index.mjs"
      },
      "./style.css": "./dist/<package-name>.css"   // ← 有 css 时加（被 lib-inject-css 自动注入到 mjs，消费方零负担）
    }
  },
  "devDependencies": {
    "@shennong/vite-config": "workspace:*",
    "vite": "catalog:"
  }
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
    "./global": { "default": "./src/global/index.scss" }
  },
  "publishConfig": {
    "exports": {
      ".": { "default": "./dist/index.mjs" },
      "./antd": { "default": "./src/antd/index.css" },     // ← css 资源走 src 不变
      "./global": { "default": "./src/global/index.scss" }
    }
  }
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
  "main": "./web-app.json"
}
```
不需要 build script，发布时 npm 直接打包 files 列出的 .json。

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
    "vue-router": "^5.0.4"
  },
  "pnpm": {
    "overrides": {
      "@shennong-core/shadcn-ui": "5.7.4",
      "vue-router": "5.0.6",
      "@shennong/vite-config": "5.7.3"
    }
  },
  "devDependencies": {
    "@shennong/tsconfig": "^5.7.0",
    "@shennong/vite-config": "^5.7.3",
    "sass": "^1.90.0",
    "vite": "^8.0.10"
  }
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
          target: 'http://localhost:5320/api',  // ← mock / 后端地址
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
|---|---|
| `@shennong/plugins` 多 entry vite library，恢复子路径 tree-shaking | 性能优化阶段 |
| `@shennong/icons` 子路径 publishConfig | 真有业务需要分块加载 svg 时 |
| 一键 `pnpm release` 脚本（changesets + 自动 bump + 批量 publish） | 团队规模 ≥ 2 人时 |
| 私服 token 区分发布 / 只读，乙方只给只读 | 真接乙方时 |
| 上游同步 vue-vben-admin 时跑 `scripts/rebrand.mjs` | 每次同步 |

---

## 附：本仓库文件索引

| 文件 | 用途 |
|---|---|
| `MIGRATION.md` | 框架团队运维手册（同步上游、发版日志、待办） |
| `PACKAGING-GUIDE.md`（本文件） | 打包发布消费完整指南 |
| `docker/verdaccio/README.md` | 私服部署指南（甲方运维） |
| `scripts/rebrand.mjs` | 上游同步后批量重命名脚本 |
| `apps/erp-admin/` | 主程序（monorepo 内 dogfooding） |
| `../shennong-erp-admin/` | 乙方独立项目示例（与本仓库平级目录） |
