# 神农信息系统 · 前端框架（shennong-frame）

> 神农集团信息数字化平台的前端**框架 monorepo**。基于 [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin) 二次开发，整体重命名为「神农信息系统」品牌，对外产出 `@shennong/*` / `@shennong-core/*` 系列编译包，供各业务项目消费。

---

## 一、这个仓库是什么

`shennong-frame` 是**框架层**，不是业务系统本身。它做两件事：

1. **维护框架包** —— `packages/` 下的 `@shennong/*`、`@shennong-core/*`，发布到私服 npm
2. **承载示例/模板应用** —— `apps/` 下多套技术栈样板（antd / tdesign / ele / naive 等）

真正的业务系统（如 **shennong-erp-admin**）是**独立仓库**，从私服安装 `@shennong/*` 包来开发，不需要进入本仓库。

```
              ┌─────────────────────────┐
              │   shennong-frame        │  框架 monorepo（本仓库）
              │   packages/@shennong/*  │
              └───────────┬─────────────┘
                          │ 发布到私服 npm（Verdaccio）
                          ▼
       ┌──────────────────────────────────────┐
       │  业务项目（独立仓库，消费框架包）         │
       │  · shennong-erp-admin   神农 ERP       │
       │  · 其他乙方业务项目 …                   │
       └──────────────────────────────────────┘
```

---

## 二、项目血统

```
上游      vbenjs/vue-vben-admin
fork 基线  b5dacd992
品牌改名   vue-vben-admin → 神农信息系统（shennong）
版本       5.7.0
```

与上游同步、rebrand 流程见 [MIGRATION.md](./MIGRATION.md)。

---

## 三、目录结构

```
shennong-frame/
├── apps/                   业务/示例应用
│   ├── erp-admin           神农 ERP 模板应用
│   ├── backend-mock        开发期 mock 后端
│   └── web-antd / web-tdesign / web-ele / web-naive / web-antdv-next
├── packages/               框架公共包（发布物）
│   ├── @core/              核心层 → @shennong-core/*
│   │   ├── base  composables  preferences  ui-kit
│   ├── effects/            能力层 → @shennong/*
│   │   ├── access  common-ui  hooks  layouts  plugins  request
│   ├── constants  icons  locales  preferences  stores  styles  types  utils
│   └── publish-demo/       发布链路验证示例（不参与业务）
├── docker/verdaccio/       私服 npm 编排（Docker）
├── internal/               工程配置（非发布物）
├── docs/                   项目文档站（vitepress）
├── scripts/rebrand.mjs     vben → shennong 重命名脚本
└── .changeset/             多包版本管理
```

---

## 四、环境要求

| 项      | 版本                                            |
| ------- | ----------------------------------------------- |
| Node.js | `^22.18.0` 或 `^24.0.0`（禁用 22.15.x 等旧 22） |
| pnpm    | `10.33.0`（见 `packageManager` 字段）           |

---

## 五、快速开始

```bash
# 安装依赖
pnpm install

# 启动某个示例应用
pnpm dev:antd          # web-antd
pnpm dev:erp-admin     # erp-admin 模板应用
pnpm dev               # 交互式选择要启动的应用

# 构建
pnpm build             # 全量构建
pnpm build:antd        # 仅构建 web-antd

# 质量检查
pnpm check             # 循环依赖 + 依赖 + 类型 + 拼写
pnpm lint              # 代码规范
```

开发期业务应用要联调后端，另起 mock 后端：

```bash
pnpm -F @shennong/backend-mock run start   # 监听 http://localhost:5320
```

---

## 六、框架包说明

| 包 | 作用 |
| --- | --- |
| `@shennong-core/base` `composables` `preferences` `ui-kit` | 核心层：无业务依赖的基础能力 |
| `@shennong/access` | 权限 / 动态路由 / 菜单 |
| `@shennong/layouts` | 布局（BasicLayout / AuthPageLayout 等） |
| `@shennong/common-ui` | 通用 UI（Page / Modal / Drawer 等） |
| `@shennong/request` | 请求层（RequestClient、拦截器、SSE） |
| `@shennong/hooks` `plugins` | 通用 hooks / 插件 |
| `@shennong/stores` `preferences` | 状态管理 / 偏好设置 |
| `@shennong/constants` `icons` `locales` `styles` `types` `utils` | 常量 / 图标 / 国际化 / 样式 / 类型 / 工具 |

业务项目按需 `import` 这些包的能力，**不修改包源码**；框架升级走私服包版本号。

---

## 七、私服发布

框架包通过本地 Verdaccio 私服发布、被业务项目消费。

```bash
# 起私服（Docker）
cd docker/verdaccio && docker compose up -d   # 默认 http://localhost:4873

# 多包版本管理
pnpm changeset                 # 记录变更
pnpm version                   # changeset version + 重装
# 发布脚本见 PACKAGING-GUIDE.md
```

完整的「打包模板 / 私服发布 / 主程序消费 / 乙方独立项目消费 / 踩坑速查」见 [PACKAGING-GUIDE.md](./PACKAGING-GUIDE.md)。

---

## 八、文档索引

| 文档 | 面向 | 内容 |
| --- | --- | --- |
| [MIGRATION.md](./MIGRATION.md) | 框架维护者 / 运维 | 项目血统、上游同步、rebrand、私服运维 |
| [PACKAGING-GUIDE.md](./PACKAGING-GUIDE.md) | 框架维护者 / 乙方 | 5 类包打包模板、发布消费全流程、10 个踩坑速查 |
| `apps/erp-admin/README.md` | 业务开发者 | ERP 模板应用开发说明 |
| 独立仓库 `shennong-erp-admin/README.md` | 乙方业务团队 | 独立业务项目接入说明 |

---

## 九、License

本项目基于 [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin)（MIT License）二次开发，框架部分沿用 MIT；神农集团业务代码与品牌资产版权归云南神农农业产业集团股份有限公司所有。
