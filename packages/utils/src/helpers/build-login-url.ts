interface BuildLoginUrlOptions {
  /** window.location.origin，如 https://host */
  origin: string;
  /** 应用 base 前缀（消费方 VITE_BASE），如 / 或 /design/。默认 / */
  base?: string;
  /** 登录路径（LOGIN_PATH），如 /auth/login */
  loginPath: string;
  /** 是否 hash 路由模式（消费方 VITE_ROUTER_HISTORY === 'hash'）。默认 false */
  isHash?: boolean;
}

/**
 * 拼接「跳登录页」的绝对地址，供无 router 依赖处（如请求拦截器 401 强跳）使用。
 *
 * 为何逻辑在框架、值由 app 传：框架发布为预编译 dist，`import.meta.env.VITE_BASE`
 * 在框架构建时即被内联冻结，读不到消费方 app 的 base / 路由模式；这些值只有 app
 * 自己构建时才知道，故由 app 传入。这样算法单一事实源，各派生项目复用不再各写各错。
 *
 * - history 模式：`{origin}{base 去尾斜杠}{loginPath}`，如 `https://host/design/auth/login`
 * - hash 模式   ：`{origin}{base}#{loginPath}`，如 `https://host/design/#/auth/login`
 *
 * 用 base 前缀（而非 window.location.pathname）拼，避免 `/foo/bar#/auth/login` 混合路径。
 */
function buildLoginUrl(options: BuildLoginUrlOptions): string {
  const { base = '/', isHash = false, loginPath, origin } = options;
  return isHash
    ? `${origin}${base}#${loginPath}`
    : `${origin}${base.replace(/\/$/, '')}${loginPath}`;
}

export { buildLoginUrl };
export type { BuildLoginUrlOptions };
