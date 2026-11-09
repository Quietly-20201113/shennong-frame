# 神农框架 · 发布与更新 SOP（私服工作流）

> 面向三类人：**框架维护者**（改 `@shennong/*` 包并发布）、**消费方**（业务项目装/更新框架）、**私服运维**（部署 Verdaccio，见 [`docker/verdaccio/README.md`](docker/verdaccio/README.md)）。私服地址：**`http://172.10.254.68:4873/`**（内网 · 匿名可读 · **匿名可发**，已放行，见 §1.1）。改地址只需全文替换这个 host。

---

## 0. 全景

```
改 @shennong 包 ──①改版本──►②构建──►③发布到私服(172.10.254.68:4873)──►④消费方更新
   (shennong-frame)     changesets    turbo        publish(内网免登录)       pnpm update
```

- 包：`@shennong/*`、`@shennong-core/*`（**各包独立版本号**，用 **changesets** 管理；目前同时有 `5.7.x`、`5.8.x` 及唯一预发布版本）。
- 私服权限（当前方案）：**读匿名 + 写也匿名**（内网放行，发布/安装都不用登录）；要收紧成账号鉴权见 §1.1 末。
- 硬约束不变：私服只存**编译产物 dist**，消费方拿不到框架 `.ts` 源码。
- **默认发布规则（2026-10-15 用户确认）**：通过验证并发布成功后，必须把每个本次升级包的 `latest` 指向本次已验证版本，并读回确认；即使版本号带预发布后缀也执行。只有用户明确要求“仅预发布、不更新 latest”才例外。补齐历史依赖时不能将 latest 降回旧版。Git 提交本身不等于私包发布。

---

## 1. 框架维护者 · 发布

### 1.1 一次性配置：内网匿名发布（当前方案，不用登录）

私服已放行**内网匿名发布**（服务器 `config.yaml` 里 `@shennong/*`、`@shennong-core/*` 为 `publish: $all`）。发布端只需 `shennong-frame/.npmrc` 里有这几行，**无需 `npm login`**：

```ini
@shennong:registry=http://172.10.254.68:4873/
@shennong-core:registry=http://172.10.254.68:4873/
# npm 客户端「没 token 不肯发」→ 给个占位串满足它（服务器按匿名处理，无实际意义）
//172.10.254.68:4873/:_authToken=anonymous
```

> ⚠️ **挂 Clash/VPN 的人必做一次**：本地代理会劫持发布请求，导致 `pnpm publish` 打完 `npm notice` 后**卡死**。让内网 IP 绕开代理：
>
> ```powershell
> npm config set noproxy "172.10.254.68,localhost,127.0.0.1"
> ```
>
> （详见 §3「publish 卡住不报错」。）

**后期要收紧成账号鉴权**（内网转公网 / 想控制谁能发）：服务器 `config.yaml` 把两个 scope 的 `publish` 改回 `$authenticated`、删掉 `.npmrc` 的占位 token，改用登录——

```bash
# --auth-type=legacy 必加！否则 npm 9+ 走网页登录，卡在 "Log in on http://..."
npm adduser --registry http://172.10.254.68:4873/ --auth-type=legacy
npm whoami --registry http://172.10.254.68:4873/   # 确认已登录
```

### 1.2 每次改完 `@shennong` 包（标准流程）

在 **shennong-frame 仓库根**：

```bash
# ① 记录变更 + 选版本号（交互：勾选改了哪些包 → patch/minor/major → 写变更说明）
pnpm changeset

# ② 按 changeset 抬版本号 + 重装（= changeset version + pnpm install）
pnpm run version

# ③ 构建（turbo 只重编受影响的包）
pnpm build

# ④ 发布到私服（发布目标由 .npmrc 的 @shennong:registry 决定，见下方 ⚠️）
pnpm publish -r --filter "@shennong/*" --filter "@shennong-core/*" \
  --no-git-checks --access=public
```

> ⚠️ **核对实际发布目标**：scope registry、用户/项目配置及包内 `publishConfig` 都可能影响目标，不要只看 `--registry`。建议在隔离目录显式配置两个 scope，先执行 `npm publish <原始包.tgz> --dry-run --ignore-scripts --tag <标签>`，确认输出 `Publishing to http://172.10.254.68:4873/`。不要为临时发布改动消费项目配置。

> **版本号语义**：`patch`=修 bug / 不改 API；`minor`=加功能、向后兼容；`major`=破坏性变更（消费方要改代码）。 **同一 registry 不允许覆盖同版本**。代码或构建内容改变必须新版本；将本地已验证的原始包同步到尚无该版本的远程 registry，不抬版本、不重建。两端同版本但哈希不一致必须停止。

### 1.3 一键化（可选，已配脚本）

配了 `release:private` 脚本后，②③④ 合成一条：

```bash
pnpm changeset        # 描述变更、选版本
pnpm release:private  # 抬版本 + 构建 + 发布，一把梭
```

### 1.4 快速改单个包（不想走 changeset）

只修了一个包、想快发：

```bash
cd packages/<该包目录>
# 抬 patch 版本号（x.y.z → x.y.(z+1)）
node -e "const p=require('./package.json');const[a,b,c]=p.version.split('.');p.version=`${a}.${b}.${+c+1}`;require('fs').writeFileSync('package.json',JSON.stringify(p,null,2)+'\n')"
cd ../../..           # 回根
pnpm build
pnpm publish --filter "<@shennong/该包名>" --no-git-checks --access=public
# 或直接进包目录：cd packages/<该包目录> && pnpm publish --no-git-checks --access public
# 发布前按 §1.2 核对 scope / publishConfig 和 dry-run 的实际目标
```

### 1.5 验证发布成功

```bash
# 看某包最新版本
npm view @shennong/common-ui version --registry http://172.10.254.68:4873/
# 或浏览器打开私服 Web UI：http://172.10.254.68:4873
```

---

## 2. 消费方 · 安装与更新

### 2026-10-15 本地验证包同步到团队私库

本次先使用标签 **`validated-20261015`** 完成远程安装验证，随后按用户要求将6个包的 **`latest`** 更新到相同版本。完整版本、依赖闭包、SHA256 和验证边界见 [本次发布记录](releases/2026-10-15-private-package-sync.md)。更新 latest 不等同于生产业务验收。

维护者复用流程：

1. 从实际已安装 manifest / lockfile 确定版本，定位对应的框架工作树和验证证据，不能拿旧主工作树批量重建发布。
2. 递归核对私包 dependencies / optionalDependencies；peerDependencies 另做消费环境检查。精确依赖不能用较新的版本自动替代。例如 hooks 依赖 `utils@5.8.0-batch-b.20261001.1`，即使应用使用 `utils@5.8.2-decimal.20261009.1`，前者也必须可下载。
3. 从本地 registry 获取原始 tgz，验证 registry integrity、SHA256、包名/版本、公开 exports 目标文件。禁止携带实现源码或源映射；`dist` 内 `.d.ts` 类型声明允许。
4. 保存远程原有 dist-tags，依赖优先发布。已有同版本且完整性相同则跳过；不同则停止，不能覆盖。
5. 在 §1.1 配置的隔离目录执行（文件名替换为本批已校验的原始 tgz）：

```powershell
npm publish ./shennong-utils-5.8.0-batch-b.20261001.1.tgz --tag validated-20261015 --access public --ignore-scripts --dry-run
# 仅目标版本尚不存在时执行；已发布不要重复执行
npm publish ./shennong-utils-5.8.0-batch-b.20261001.1.tgz --tag validated-20261015 --access public --ignore-scripts
```

6. 读回远程版本和压缩包，校验完整性；在全新目录、独立 store / metadata cache 下在线安装。不能以本机缓存或 offline 安装证明远程可用。
7. 验证成功后，逐包将 latest 指向本次目标版本，并查询 dist-tags 确认。例如（其他升级包同样执行；补齐的旧依赖不提升）：

```powershell
npm dist-tag add @shennong/common-ui@5.8.6-form-container.20261011.1 latest --registry http://172.10.254.68:4873/ --offline=false --prefer-offline=false
npm view @shennong/common-ui dist-tags --registry http://172.10.254.68:4873/ --offline=false
```

消费方明确选择本批版本（项目 `.npmrc` 按 §2.1 配置）：

```powershell
pnpm add --save-exact @shennong/common-ui@5.8.6-form-container.20261011.1 @shennong/hooks@5.8.1-server-list.20261007.1 @shennong/utils@5.8.2-decimal.20261009.1 @shennong/plugins@5.7.4-document-preview.20261009.1 @shennong/request@5.7.1-error-identity.20261009.1 @shennong-core/menu-ui@5.7.4-menu-popup.20261009.3 --offline=false --prefer-offline=false
```

只安装项目需要的包；已有 `pnpm.overrides` 时必须同步核对，否则直接依赖与实际解析可能不一致。保留升级前 package.json / lockfile，升级后跑项目类型、测试、构建及代表页面验证。回退使用原依赖与 lockfile，不删除远程已发布版本。单独的远程安装检查不替代这些业务验收。

本批 latest 已更新，团队可通过 `pnpm update:sn` / `--latest` 更新，或显式锁定以上版本。须核对 overrides 和更新后的 lockfile；已有项目不会仅因服务器标签改变就自动替换已安装版本。Web UI 刷新后应展示最新标签对应版本，可用以下命令核实：

```powershell
npm view @shennong/common-ui dist-tags --registry http://172.10.254.68:4873/
npm view @shennong/common-ui@5.8.6-form-container.20261011.1 dist.integrity --registry http://172.10.254.68:4873/
```

若精确版本查询存在但安装仍说不存在，检查 `pnpm config get offline` 及当前进程的离线配置；本次隔离验证需显式 `--offline=false --prefer-offline=false`，并使用独立 `--store-dir` / `--cache-dir`。不要直接清空团队共享 store。代理绕行可只对当前 PowerShell 设置 `$env:NO_PROXY='172.10.254.68,localhost,127.0.0.1'`，无需关闭全部外网代理。

### 2.1 新项目首次接入

项目根加 `.npmrc`（**入库共享**，团队一致）：

```ini
; 自家包走内网私服（匿名可读，无需 login），三方包走公共镜像
@shennong:registry=http://172.10.254.68:4873/
@shennong-core:registry=http://172.10.254.68:4873/
registry=https://registry.npmmirror.com/
```

然后（连上 VPN / 内网可达后）：

```bash
pnpm install          # 从私服拉 @shennong/*，其余走 npmmirror
```

### 2.2 更新框架到最新（很方便）

配了 `update:sn` 脚本后：

```bash
pnpm update:sn        # 拉私服最新版 @shennong/*、@shennong-core/*（改 package.json + 装）
```

等价手动命令：

```bash
pnpm update "@shennong/*" "@shennong-core/*" --latest
```

> `--latest`：升到私服里的**最新版本**（会跨小/大版本，改 package.json 范围）。不加 `--latest`：只在 `package.json` 现有范围（如 `^5.7.x`）内更新，稳但拿不到新大版本。更新后 **提交 `pnpm-lock.yaml`** —— 团队锁到同一版本。

### 2.3 锁定 / 回退某个版本

```bash
pnpm add @shennong/common-ui@5.7.3     # 装指定版本
```

---

## 3. 常见问题

| 现象 | 排查 / 解决 |
| --- | --- |
| `publish` 报 **401 / 需要认证** | `npm whoami --registry http://172.10.254.68:4873/` 确认已登录；没登录先 §1.1 `npm adduser` |
| `publish` 报 **版本已存在** | npm 不许重发同版本 → 先抬版本号（§1.2 ②）再发 |
| `publish` **卡住不报错**（`npm notice` 打完就不动） | **本地代理劫持**：挂了 Clash/VPN 时 `$env:HTTP_PROXY`/`HTTPS_PROXY` 全局生效，npm 把发布请求塞进代理、到不了内网 → 卡死。查 `$env:HTTP_PROXY`；有值就让内网绕开：`npm config set noproxy "172.10.254.68,localhost,127.0.0.1"`（或当前窗口临时 `$env:HTTP_PROXY=""`）。`Test-NetConnection 172.10.254.68 -Port 4873` 为 True 但仍卡，基本就是这个 |
| 消费方 **拉不到刚发的新版** | 确认版本真的发上去了（§1.5）；`pnpm store prune` 清缓存后重试；`.npmrc` host 对不对 |
| **连不上私服** | 确认已连 VPN；`curl http://172.10.254.68:4873/` 有响应；服务器 `docker compose ps` healthy、4873 已放通 |
| 装到 `.ts` 源码 / 样式坍塌 / `is not exported` | 打包姿势问题，见 [`PACKAGING-GUIDE.md`](PACKAGING-GUIDE.md) 五类包模板 + 踩坑 |

---

## 4. 相关文档

| 文档 | 看什么 |
| --- | --- |
| [`docker/verdaccio/README.md`](docker/verdaccio/README.md) | 私服 Verdaccio 部署 / 团队共享 / 账号 / HTTPS（运维） |
| [`PACKAGING-GUIDE.md`](PACKAGING-GUIDE.md) | 5 类包打包模板 + 10 条踩坑（做包时看） |
| [`MIGRATION.md`](MIGRATION.md) | 上游 vben 同步流程 / 发版日志 |

> 消费方项目怎么从框架壳搭建，见工作区 `../shennong-information-system/新建AI-Admin项目-SOP.md`。
