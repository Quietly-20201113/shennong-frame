# 神农信息系统 · 私服 npm 部署指南

本目录是 [Verdaccio](https://verdaccio.org) 的 Docker 编排配置，用于发布与消费 `@shennong/*` 包。

## 一、本地开发期启动

```bash
# 在本目录下
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

启动后：

- Web UI：<http://localhost:4873>
- registry：`http://localhost:4873`

## 二、首次使用（创建账号）

```bash
# 进入项目根（任一目录均可）；--auth-type=legacy 必加！
npm adduser --registry http://localhost:4873 --auth-type=legacy
# 逐行输入 username / password / email 即可
```

> ⚠️ **必须带 `--auth-type=legacy`**：npm 9+ 默认走「网页登录」流程（终端会卡在 `Log in on http://...` 等你去浏览器），而 Verdaccio 只支持传统的账号密码登录。加上 `--auth-type=legacy` 才会在终端里逐行问。`npm login` 同理。

凭证持久化在 `./storage/htpasswd`，重启容器不丢失。

## 三、发布 `@shennong/*` 包

```bash
# 在 shennong-frame 仓库根
pnpm publish -r --filter "@shennong/*" --registry http://localhost:4873
```

`@shennong-core/*` 同理（按需切换 filter）。

## 四、消费方（apps/erp-admin 或乙方仓库）配置

在消费方仓库根目录加 `.npmrc`：

```ini
# 自家 scope 走私服
@shennong:registry=http://localhost:4873
@shennong-core:registry=http://localhost:4873

# 三方依赖仍走公共镜像（更快）
registry=https://registry.npmmirror.com/
```

然后 `pnpm install` 即可。

## 五、团队共享部署（多人协作 · 把私服搬到服务器）

> 目标：多人共用一个私服。把本目录搬到一台**团队都能访问**的机器，`storage/`（已发布的包）一起带过去，无需重新发布。下文 `<REGISTRY_HOST>` = 你的服务器 IP 或域名（如 `10.0.0.10`），部署时统一替换。

### 5.1 前期 · 内网 · 免账号（推荐先这样）

内网机器 + 前期不想管账号，就**保持匿名可读**（`config.yaml` 里 `@shennong/*`、`@shennong-core/*` 维持 `access: $all`），消费方零登录：

**1. 服务器**：内网一台机器，装 Docker，放通 **4873** 端口。

**2. 搬运**：把整个 `docker/verdaccio/` 目录（`docker-compose.yml` + `conf/` + `storage/`）拷到服务器。`storage/`（约 1.5M，含全部 `@shennong/*`、`@shennong-core/*` 包）一起带 → 服务器上直接就有包。

**3. 启动**：`cd docker/verdaccio && docker compose up -d`（`config.yaml` 里 `listen: 0.0.0.0` 已支持外部访问）。Web UI：`http://<REGISTRY_HOST>:4873`。

> ⚠️ **storage 必须可写**：容器以非 root 用户跑，而 root 解压/拷贝的 `storage/` 它写不了（会导致发布、创建账号报 **503**）。启动后执行一次：`chmod -R a+rwX storage && docker compose restart`。⚠️ **放通端口**：确认服务器防火墙对 `4873/tcp` 放行（`firewall-cmd --permanent --add-port=4873/tcp && firewall-cmd --reload`），否则消费方 TCP 连不上。

**4. 各成员消费**：项目 `.npmrc`（入库共享）指向服务器——

```ini
@shennong:registry=http://<REGISTRY_HOST>:4873/
@shennong-core:registry=http://<REGISTRY_HOST>:4873/
registry=https://registry.npmmirror.com/
```

直接 `pnpm install`，**不用 `npm login`**（匿名可读）。

**5. 发布新版本（内网匿名 · 免登录 · 当前方案）**：把 `config.yaml` 里 `@shennong/*`、`@shennong-core/*` 的 `publish` 也设成 `$all`（匿名可发），发布端不用账号——`.npmrc` 加一行占位 token 满足 npm 客户端即可：

```ini
# 发布端 shennong-frame/.npmrc
@shennong:registry=http://<REGISTRY_HOST>:4873/
@shennong-core:registry=http://<REGISTRY_HOST>:4873/
# npm「没 token 不肯发」→ 占位串（服务器按匿名处理）
//<REGISTRY_HOST>:4873/:_authToken=anonymous
```

```bash
# 挂 Clash/VPN 的人先让内网绕开代理，否则 publish 卡死：
#   npm config set noproxy "<REGISTRY_HOST>,localhost,127.0.0.1"
pnpm publish -r --filter "@shennong/*" --filter "@shennong-core/*" --no-git-checks --access=public
```

> 想保留账号鉴权就别改 `publish`（维持 `$authenticated`），发布人 `npm adduser --auth-type=legacy` 登录后再发（见 §二）。

### 5.2 后期 · 上公网 / 要收紧访问时

内网转公网、或想控制谁能拉包时，再加鉴权 + HTTPS：

- **鉴权**：`config.yaml` 把 `@shennong/*`、`@shennong-core/*` 的 `access: $all` 改成 `access: $authenticated`，每人 `npm adduser` + `.npmrc` 后 `npm login --registry http://<REGISTRY_HOST>:4873/ --auth-type=legacy`。
- **HTTPS**：公网前面套 nginx/caddy 反代 + TLS，`.npmrc` 与 `npm login` 用 `https://域名/`（登录传密码必须走 HTTPS）。详见 §七、§八。

## 六、数据备份

需要备份的目录：

```
docker/verdaccio/storage/   # 所有包数据 + 用户凭证
docker/verdaccio/conf/      # 配置文件
```

## 七、甲方生产部署清单

> 本地开发版可直接搬到生产，但建议补上以下事项：

1. **域名 + HTTPS**：在前面挡一层 Nginx，反代 4873 → 443，配上 Let's Encrypt 证书。
2. **存储扩容**：把 `./storage` 挂到独立卷（NAS / EBS），避免容器挂时丢数据。
3. **关闭注册**：生产环境只允许超管创建账号——在 `conf/config.yaml` 的 `auth.htpasswd` 段加 `max_users: -1`。
4. **审计日志**：把 `log.type` 从 `stdout` 改为 `file`，写到独立日志卷。
5. **token 寿命**：把 `security.api.jwt.sign.expiresIn` 从 60d 收紧到 7d，强制定期轮换。
6. **备份策略**：每日 cron 把 `storage/` 打包到对象存储。
7. **只读 token**：给乙方发只读 token（仅 `access`，不 `publish`）——通过 Verdaccio 内置的 token 管理 API 创建。

## 八、故障排查

| 现象 | 排查 |
| --- | --- |
| `pnpm publish` 报 401 | 跑 `npm whoami --registry http://localhost:4873` 确认登录有效 |
| `publish`/`adduser` 报 **503** | `storage/` 不可写（容器非 root，root 解压的文件写不了）→ `chmod -R a+rwX storage && docker compose restart` |
| `publish` **卡住不报错**（`npm notice` 后不动） | 发布端本地代理（Clash/VPN）劫持了请求。查 `$env:HTTP_PROXY`；有值就 `npm config set noproxy "<REGISTRY_HOST>,localhost,127.0.0.1"`。`Test-NetConnection <REGISTRY_HOST> -Port 4873` 为 True 但仍卡即是此因 |
| 消费方 **TCP 连不上 4873** | 服务器防火墙没放通：`firewall-cmd --permanent --add-port=4873/tcp && firewall-cmd --reload` |
| 装包慢 / 拉不到上游 | 看 `docker compose logs` 是否报 `ETIMEDOUT`，可能是 npmmirror 不通 |
| Web UI 打不开 | 容器 `docker ps` 看是否 healthy，端口 4873 有无被占 |
| 凭证忘了 | 直接编辑 `storage/htpasswd`（bcrypt），或删除该行后重新 adduser |
