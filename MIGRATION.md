# 神农信息系统 · 迁移与运维手册

> 本文档面向**框架维护者**和**甲方运维**。给业务开发者（含乙方）的文档另见 `apps/erp-admin/README.md`（P0-5 阶段产出）。

---

## 一、项目血统

```
upstream: vbenjs/vue-vben-admin    (https://github.com/vbenjs/vue-vben-admin.git)
fork base: b5dacd992               (feat: add time zone option to preference settings #7871)
brand:     vue-vben-admin → 神农信息系统（shennong）
```

---

## 二、目录速览

```
shennong-frame/
├── apps/                       # 业务应用
├── packages/                   # 框架公共包（@shennong/*、@shennong-core/*）
│   └── publish-demo/           # ★ 发布链路验证示例（不参与业务）
├── internal/                   # 工程配置（非发布物）
├── docs/                       # 项目文档（vitepress）
├── docker/
│   └── verdaccio/              # ★ 私服 npm 编排（Docker）
├── scripts/
│   └── rebrand.mjs             # ★ vben → shennong 重命名脚本
├── .changeset/                 # 多包版本管理
├── .npmrc                      # 项目级 npm 配置（scope 路由）
└── MIGRATION.md                # 本文档
```

---

## 三、与上游同步流程

vbenjs/vue-vben-admin 持续在演进。同步上游修复/特性的步骤：

```bash
# 1. 拉取上游最新
git fetch upstream

# 2. 创建同步分支（不直接上 main，避免冲突）
git checkout -b sync/upstream-$(date +%Y%m%d)

# 3. 合并上游（会有冲突，主要是 vben/shennong 字符串差异）
git merge upstream/main

# 4. 解决冲突后跑 rebrand 脚本，把上游新增的 vben 字样统一改名
node scripts/rebrand.mjs

# 5. 验证 build
pnpm install && pnpm build:antd

# 6. 提交合并 commit，PR 到 main
git add -A
git commit -m "chore(project): [变更][项目] 同步上游 $(git rev-parse --short upstream/main) 并 rebrand"
```

**关键约束**：

- `scripts/rebrand.mjs` 是**幂等的**——上游改了什么、新增了什么 vben 字样，跑一次脚本就统一改完。
- 改 rebrand 脚本本身（增删替换规则）必须当作工程变更对待，单独 commit、走 review。

---

## 四、本地私服（Verdaccio）

### 起服

```bash
cd docker/verdaccio
docker compose up -d
```

- Web UI：<http://localhost:4873>
- registry：`http://localhost:4873`

详细见 `docker/verdaccio/README.md`。

### 创建账号

首次起服后必须创建账号。两种方式：

**方式 A：交互式（推荐）**

```bash
npm adduser --registry http://localhost:4873
```

按提示输入用户名/密码/邮箱。

**方式 B：API 直创（脚本用）**

```bash
curl -X PUT "http://localhost:4873/-/user/org.couchdb.user:<username>" \
  -H "Content-Type: application/json" \
  -d '{"name":"<username>","password":"<password>","email":"<email>"}'
```

返回 `token` 字段写入用户级 `~/.npmrc`：

```bash
npm config set //localhost:4873/:_authToken "<token>" --location=user
```

验证：

```bash
npm whoami --registry http://localhost:4873
# 输出 <username> 即 OK
```

### 发布

任意 `@shennong/*` 或 `@shennong-core/*` 包：

```bash
cd packages/<some-pkg>
pnpm publish --registry http://localhost:4873 --no-git-checks
```

**前提**：包 `package.json` 必须配好 hybrid 发布模式（见下一节）。

---

## 五、包发布模式（hybrid）

为满足"乙方装包只能拿到 dist，看不到核心源码"的硬约束，所有要发布的包都用以下模式：

### 5.1 package.json 模板

```json
{
  "name": "@shennong/some-pkg",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "tsdown",
    "stub": "tsdown"
  },
  "files": ["dist"],
  "main": "./dist/index.mjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "publishConfig": {
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs"
      }
    }
  },
  "devDependencies": {
    "tsdown": "catalog:"
  }
}
```

**关键字段**：

| 字段 | 作用 |
| --- | --- |
| `exports`（顶层） | dev 期 monorepo 内部消费，走 src 源码（无需 build） |
| `publishConfig.exports` | publish 时**自动覆盖** exports，让消费方走 dist |
| `files: ["dist"]` | publish 包内只有 dist，src 不会被打包 |
| `main`/`types` | 给老 bundler 兜底（指向 dist） |

### 5.2 tsdown.config.ts 模板

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

### 5.3 验证发布物隔离

```bash
# 在临时目录
mkdir /tmp/check && cd /tmp/check
echo '{"name":"check","dependencies":{"@shennong/some-pkg":"0.1.0"}}' > package.json
echo '@shennong:registry=http://localhost:4873/' > .npmrc
pnpm install

# 应该只看到 dist + package.json + LICENSE
ls node_modules/@shennong/some-pkg/

# 应该返回空（无 .ts 源文件）
find node_modules/@shennong/some-pkg -name "*.ts" -not -name "*.d.ts"
```

### 5.4 已知边界

- **首发示例 `@shennong/publish-demo`**（`packages/publish-demo/`）已跑通完整链路，作为后续业务包的参考。
- **业务包还没改造**：当前 `packages/utils`、`packages/effects/*`、`packages/@core/*` 仍是源码直引模式，**不能发布**。改造留给 P0-3 阶段（涉及连锁发布工程）。

---

## 六、版本管理（changesets）

每次改动后写 changeset：

```bash
pnpm changeset
# 交互选择：哪些包变更、版本类型（patch/minor/major）、说明文字
```

发布前 bump 版本号：

```bash
pnpm changeset version
# 自动 bump 各包 version + 生成 CHANGELOG
```

发布到私服：

```bash
pnpm publish -r --filter "@shennong/*" --registry http://localhost:4873 --no-git-checks
```

---

## 七、甲方生产部署清单

### 7.1 私服 Verdaccio

参照 `docker/verdaccio/README.md`，重点：

1. 域名 + HTTPS（Nginx 反代）
2. `storage/` 挂独立卷 + 每日备份
3. 关闭 `auth.htpasswd.max_users`（禁止开放注册）
4. `security.api.jwt.expiresIn` 收紧到 7d
5. 给乙方发只读 token

### 7.2 框架包发布流程

CI 触发（推荐 main 分支 merge 后自动）：

1. 跑 `pnpm install`
2. 跑 `pnpm build`（全 monorepo）
3. 跑 `pnpm changeset version`（如有 pending changeset）
4. 跑 `pnpm publish -r --filter "@shennong/*" --registry <私服>`

### 7.3 乙方接入流程

详见 `apps/erp-admin/README.md`（P0-5 阶段产出）。简要：

1. 乙方拿到独立的 `shennong-erp-admin` 仓库（不含核心源码）
2. 配置 `.npmrc` 指向甲方私服 + 只读 token
3. `pnpm install` 自动从私服拉编译产物
4. 业务开发只在 `src/views/`、`src/api/` 等业务目录

---

## 八、本次重大变更日志

### 2026-05-07：P0-1 神农化

- fork 自 vue-vben-admin@b5dacd992
- 全量 rebrand：`@vben/*` → `@shennong/*`
- 文件改名：6 个核心源文件 + code-workspace
- 新增：`scripts/rebrand.mjs`（幂等重命名工具）
- 验证：`pnpm build:antd` 11/11 task 全绿

### 2026-05-07：P0-2 私服与发布链路

- 新增：`docker/verdaccio/`（本地私服 Docker 编排）
- 新增：`packages/publish-demo`（hybrid 发布模式参考）
- 修改：`.npmrc` 增加 @shennong scope 路由
- 验证：`@shennong/publish-demo@0.1.0` 已发布到私服，消费方装包后无任何 .ts 源文件（核心隔离生效）

### 2026-05-08：P0-5 完整收尾 · 独立项目消费链路打通

- 新建独立项目 `shennong-erp-admin/`（与 shennong-frame 平级，独立 git 仓库）
  - 初次 commit: `912c3bd feat: [新增][项目] shennong-erp-admin 独立项目初始化`
- monorepo 内 27 包全部 hybrid 化：
  - 14 个 `@shennong/*` 业务包补 publishConfig + tsdown
  - 6 个 `@shennong-core/*` ui-kit 从 tsdown 切到 vite library（修 css 输出 bug）
  - 3 个业务 ui 包（common-ui / plugins / layouts）切 vite library
  - 4 个 internal 包（tsconfig/vite-config/node-utils/tailwind-config）去 private + 加 publishConfig
- 关键 bug 修复（这次踩坑沉淀）：
  - `@shennong-core/shared`: lodash.clonedeep（CJS）→ lodash-es（ESM）
  - `@shennong-core/preferences`: scripts.build "#build" + files: src 源码泄漏
  - `@shennong-core/design`: publishConfig.exports 子路径丢失（./bem ./theme ./style.css）
  - `@shennong-core/shadcn-ui`: 上游 main 指 src 源码暴露
  - `@shennong/plugins`: src/index.ts 不 re-export 子模块导致 EchartsUI 等找不到
  - `@shennong/vite-config`: runtime deps 错放 devDeps，消费方装不齐
  - vue-router 双版本（4.x vs 5.x）冲突 → pnpm.overrides 强制 5.0.6
- 验证：`shennong-erp-admin` 独立仓库 pnpm install + dev + 登录全链路通畅，
  `node_modules/@shennong/*` 全部仅含 dist + d.ts，**无任何 .ts 源码**

### 已知工程债（P0-5 留下）

- form-ui / popup-ui / layout-ui 三个 ui-kit 包改 vite library 后未输出 .css 文件
  （可能 .vue 没 scoped scss 内容，需排查）
- @shennong/plugins 子路径（./echarts ./tiptap ./vxe-table ./motion）publishConfig
  default 都指向同一个主入口 dist/index.mjs，失去 tree-shaking——多 entry vite library 待补
- @shennong/icons 子路径未配 publishConfig
- vben 上游设计模式：dist 在 module 顶层调用 useAppConfig，导致消费方必须在
  入口注入 `window._SHENNONG_ADMIN_PRO_APP_CONF_`（已记录在 erp-admin/src/main.ts）
- 上游 dist 不自动 import css，消费方必须显式 `import 'pkg/style.css'`
  （已记录在 erp-admin/src/bootstrap.ts）

### 2026-05-07：P0-5 erp-admin 应用骨架

- 新增：`apps/erp-admin/` —— 神农信息系统 ERP 应用骨架
  - 基于 web-antd 复制 + 改造为最小可用 ERP 壳子
  - 包名 `@shennong/erp-admin`，version `0.1.0`，private:true
  - VITE_APP_TITLE = `神农信息系统`，namespace = `shennong-erp-admin`
- 删除：vben 上游 demos / vben 演示路由 + analytics / workspace 复杂 dashboard
- 替换：单一空白欢迎页 `views/dashboard/welcome/index.vue`
- 配置：preferences.ts override `defaultHomePath: '/welcome'`
- 验证：`pnpm -r --filter @shennong/erp-admin build` 全绿，dist 919 kB
- 待办：
  - mock 后端菜单数据（apps/backend-mock）含 /analytics 等已删路由——目前 erp-admin 用 frontend access mode 不依赖它，但若切 backend mode 需同步改 mock
  - 拆分独立仓库（给乙方）—— 等真有第三方接入需求时做

### 2026-05-07：P0-4 业务包发布矩阵（hybrid 化）

- 修复：`@shennong-core/preferences` 上游 `#build` 拼写 + `files: [dist, src]` 源码泄漏 bug
- 修复：vitest `prefer-lowercase-title` 误改中英混排测试名（项目根 oxlint.config.ts override）
- 修复：docs vue 死循环（eslint vue/multiline 规则要求改写 + lefthook lint-vue 链移除 oxlint 步）
- 改造：10 个 @shennong/\* 业务包补完 hybrid 配置（publishConfig + tsdown.config + main/types/files）
- 发布：12 个 @shennong-core/\* + 10 个 @shennong/\* 共 22 个包至 Verdaccio 私服
- 验证：消费方装 @shennong/access 后 node_modules 只含 LICENSE/dist/package.json，无任何 .ts 源文件
  - 核心隔离硬约束达成
- 待办：
  - icons 包暂保留源码直引（svg `?raw` 加载需 vite/特殊 plugin，留给后续）
  - common-ui / plugins / layouts 三个大包未做（11+ workspace deps，build 复杂度高）

### 2026-05-07：P0-3 access 权限模型增强

- 新增：`@shennong/access` 复合权限 AND/OR 三层 API
  - Hook：`hasAccessByCodes(codes, mode?)`、`hasAccessByRoles(roles, mode?)`，默认 `'any'`（OR）兼容旧调用
  - 指令：`v-access:code.all="['a','b']"`（AND）/ `v-access:code.any` 或缺省（OR）
  - 组件：`<AccessControl :codes mode="all|any">`
- 新增：`DataScope` 五档数据权限模型（与后端 enum 一致全大写）
  - 类型：`SELF / OWN_DEPT / OWN_DEPT_AND_CHILDREN / ALL / CUSTOM`（`@shennong-core/typings`）
  - Store：`useAccessStore` 增加 `dataScope` + `customDeptIds` 字段（持久化）
  - Hook：`useDataScope()` 提供 `dataScope` / `hasDataAccess(ctx)`
- 单元测试：13/13 通过（`use-access.test.ts` + `use-data-scope.test.ts`）
- 调研：基于 AI 聊天系统设计文档 16 文件 / 152 条 R-\* 规则识别出 12 个业务漏洞反馈给业务方，详见独立 review 报告（不入库）

---

## 九、待办（P0-3.5 起）

- [ ] **P0-3.5 拦截器层** `@shennong/business-interceptor`（鉴权 / 权限 / scope 注入 / 限流 / trace_id / 计费）—— Agent 调研报告认定为"地基的地基"
- [ ] **P0-3.5 字典中心** `@shennong/business-dict`（KV 表 + Redis + 启动同步）
- [ ] **P0-4 精简版** `@shennong/business-rbac`（动态角色 + 权限扫码同步）
- [ ] AI 聊天业务相关包（chat / quota / provider / audit / file）—— 真做 AI 项目时再启动
- [ ] icons 包 svg `?raw` 加载方案（待解决后再 hybrid 化）
- [ ] common-ui / plugins / layouts 三个大包 hybrid 化（11+ workspace deps，build 配置复杂度高）
- [ ] 配置 changesets CI 自动发版
- [ ] 拆分 `apps/erp-admin/` 为独立仓库（真有乙方接入时做）
- [ ] 落地 AI 聊天系统后台 9 个菜单
- [ ] README.md / LICENSE / .github 元数据人工撰写中文版
- [ ] 修复 docs demo `.vue` 文件 oxfmt vs stylelint 冲突
