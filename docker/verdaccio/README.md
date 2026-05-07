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
# 进入项目根（任一目录均可）
npm adduser --registry http://localhost:4873
# 输入 username / password / email，按提示完成
```

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

## 五、数据备份

需要备份的目录：

```
docker/verdaccio/storage/   # 所有包数据 + 用户凭证
docker/verdaccio/conf/      # 配置文件
```

## 六、甲方生产部署清单

> 本地开发版可直接搬到生产，但建议补上以下事项：

1. **域名 + HTTPS**：在前面挡一层 Nginx，反代 4873 → 443，配上 Let's Encrypt 证书。
2. **存储扩容**：把 `./storage` 挂到独立卷（NAS / EBS），避免容器挂时丢数据。
3. **关闭注册**：生产环境只允许超管创建账号——在 `conf/config.yaml` 的 `auth.htpasswd` 段加 `max_users: -1`。
4. **审计日志**：把 `log.type` 从 `stdout` 改为 `file`，写到独立日志卷。
5. **token 寿命**：把 `security.api.jwt.sign.expiresIn` 从 60d 收紧到 7d，强制定期轮换。
6. **备份策略**：每日 cron 把 `storage/` 打包到对象存储。
7. **只读 token**：给乙方发只读 token（仅 `access`，不 `publish`）——通过 Verdaccio 内置的 token 管理 API 创建。

## 七、故障排查

| 现象 | 排查 |
| --- | --- |
| `pnpm publish` 报 401 | 跑 `npm whoami --registry http://localhost:4873` 确认登录有效 |
| 装包慢 / 拉不到上游 | 看 `docker compose logs` 是否报 `ETIMEDOUT`，可能是 npmmirror 不通 |
| Web UI 打不开 | 容器 `docker ps` 看是否 healthy，端口 4873 有无被占 |
| 凭证忘了 | 直接编辑 `storage/htpasswd`（bcrypt），或删除该行后重新 adduser |
