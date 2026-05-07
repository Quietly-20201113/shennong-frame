import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

/**
 * 神农信息系统 · ERP 骨架路由
 *
 * 当前仅放一个空白欢迎页占位。
 * P0-6 起会陆续接入业务模块（用户/部门/角色/审计 等）。
 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'Welcome',
        path: '/welcome',
        component: () => import('#/views/dashboard/welcome/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:home',
          title: $t('page.dashboard.welcome'),
        },
      },
    ],
  },
];

export default routes;
