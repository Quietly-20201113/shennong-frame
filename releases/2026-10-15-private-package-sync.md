# 2026-10-15 私包共享发布记录

目标：`http://172.10.254.68:4873/`。用户明确授权补齐依赖、验证并发布。初始发布标签 `validated-20261015`；远程安装验证后，用户明确要求发布必须更新 latest，本次6个目标包随后同步提升至 `latest`。

## 来源与范围

不是在五月的主 checkout 上重新构建。以 ERP 实际安装的六个版本为根，从本地 Verdaccio 获取原始已验证 tgz，递归核查私包运行依赖。共25个包版本，18个远程已有，新增7个版本。包括 hooks 精确依赖的 `utils@5.8.0-batch-b.20261001.1`，不能用新版 utils 自动替代。

框架源工作树为 `.codex-worktrees/shennong-frame-image-upload`，基线 commit `00d1e51b2e40105e486d24decc4fd70b31776d74`，有未提交增量；该 commit **不能单独复现本批产物**。原始包 SHA256 才是本次迁移身份，未改源码、未重新构建、未提交/推送 Git。历史测试证据位于 ERP OpenSpec 的 batch-b、server-list、decimal、document-preview、request-error-identity、menu-popup、responsive-forms 对应记录；不把历史测试写成此次重新执行。

## 制品清单

文件名规则：去掉 scope 的 `@`，将 `/` 替换为 `-`，加 `-<版本>.tgz`。

| 包 | 版本 | 字节 | SHA256 |
| --- | --- | --: | --- |
| @shennong/utils | 5.8.0-batch-b.20261001.1 | 5372 | `8dcaee018f3b5ea6a4bc70a929e2865fd0fd7179447eecce8dd6dc13bebbffb0` |
| @shennong/hooks | 5.8.1-server-list.20261007.1 | 11725 | `f1e024631f3bbb394b232f2dddd789d734c2fc5df693ecbb3240587ec986c1e6` |
| @shennong/common-ui | 5.8.6-form-container.20261011.1 | 94491 | `253d97addfbef99b249973e860e845eaf6f643ba04aaa160061d990dd0ec6f1c` |
| @shennong/utils | 5.8.2-decimal.20261009.1 | 7813 | `50fd579140c60b000ef5d5dfd6d3d6e62e5c966d9e3c236d2dba888beb29d3e8` |
| @shennong/plugins | 5.7.4-document-preview.20261009.1 | 57184 | `075c24c65585d90885ffb9928382e742431946ad606b51c42b3dcfe6a0a10ad0` |
| @shennong/request | 5.7.1-error-identity.20261009.1 | 5703 | `7765e608ea6c779ae913400103237c6e7541a4feccd02954e8207a4631655f5a` |
| @shennong-core/menu-ui | 5.7.4-menu-popup.20261009.3 | 13799 | `b85cea6f1d97371a0f9ef2cd6d14a10bbece1a1f72cadbe1178f5bd067ab181e` |

utils 的本批标签最终指向 `5.8.2-decimal.20261009.1`；较早的 batch-b 版本通过精确版本安装。原 latest：common-ui5.7.3、hooks5.7.0、utils5.7.1、plugins5.7.1、request5.7.0、menu-ui5.7.3。

## 本次验证

- 发布前：递归运行依赖检查、原始 tgz SHA512 对 registry integrity、包名/版本、exports 目标存在、无实现源码/源映射，允许 dist 内类型声明。
- 发布命令：在独立 scope 配置目录执行 `npm publish ./<原始包.tgz> --tag validated-20261015 --access public --ignore-scripts`，先 dry-run 核实目标。
- 发布后：25个精确版本 metadata 完整性核验通过，7个远程 tgz 重新下载的 SHA256 全部相同；原 latest 均未改变。
- 首次消费检查失败：离线解析使用旧元数据。显式 `--offline=false --prefer-offline=false` 加独立 store/cache 后解决。
- 公共镜像首次发生 lodash.uniq ECONNRESET；公共 npm 源回退尝试也有 TLS 连接失败。恢复镜像并对网络下载有限重试，不修改私包、不掩盖测试断言。
- 隔离在线安装：pnpm10.30.3，514个依赖安装成功（exit0）；独立 store/cache 从本轮在线下载产生，未借用 ERP node_modules、workspace 链接或原有本地包 store。关闭生命周期脚本以避免安装时执行未知脚本。
- 安装后冒烟：6个目标包版本一致、公开 exports 能解析且目标存在；6包共212个 dist 文件逐一与原始 tar 哈希一致。hooks 内实际解析的 utils 为 `5.8.0-batch-b.20261001.1`，无 overrides 掩盖缺失依赖。
- 运行断言：公开 `@shennong/utils/decimal` 入口执行乘法0.1×0.2=0.02、除法1÷3保留两位=0.33、减法0.3−0.1=0.2，3项通过。未将模块解析检查冒充所有组件浏览器回归。

安装命令（在临时 consumer 目录；scope 配置仍指向内网私库）：

```powershell
pnpm install --ignore-scripts --offline=false --prefer-offline=false --fetch-retries=2 --store-dir ../remote-install-store --cache-dir ../remote-install-cache --reporter=append-only
```

完整闭包及依赖关系保存在同目录 [机器发布清单](2026-10-15-private-package-sync.json)，包含源 registry integrity、远程原标签、七个归档的精确文件名/大小/SHA256；凭证不进入清单。

## 验收边界与回退

状态是共享私库 **PUBLISHED**，不是所有系统生产 **ADOPTED**。本次未升级 ERP 工作目录依赖，未重跑全业务/真实后端/物理设备验收。ERP 角色表单审计过期仍是应用侧独立待办，不得声称全仓治理已通过。

后续 latest 提升：common-ui、hooks、utils、plugins、request、menu-ui 均指向本次清单中的最新目标版本；utils 指向5.8.2而非补齐依赖的5.8.0。仅修改标签，未重发或更改压缩包；保留 validated-20261015 标签。此前“latest 未变”的验证是初始发布阶段记录，不是当前状态。

已升级的消费者需要回退时，恢复升级前 package.json 与 lockfile，再执行 frozen-lockfile 安装。若需要团队级回退默认版本，由用户确认后用 `npm dist-tag add <包>@<本记录中的原latest版本> latest` 恢复标签，并读回验证；仅改标签不会回退已经安装的项目。不要删除远程版本，其他包可能精确依赖它。

可重复指令和消费注意事项见 [发布与更新 SOP](../发布与更新-SOP.md)。临时原包、依赖清单、验证 JSON、隔离安装目录保留于主工作区 `.local-release-20261015/`（已忽略，不入库）；机器清理后以本记录哈希和远程原包为准。
