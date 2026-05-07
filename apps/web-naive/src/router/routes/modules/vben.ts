import type { RouteRecordRaw } from 'vue-router';

import {
  SHENNONG_ANT_PREVIEW_URL,
  SHENNONG_ANTDV_NEXT_PREVIEW_URL,
  SHENNONG_DOC_URL,
  SHENNONG_ELE_PREVIEW_URL,
  SHENNONG_GITHUB_URL,
  SHENNONG_LOGO_URL,
  SHENNONG_TD_PREVIEW_URL,
} from '@shennong/constants';
import {
  SvgAntdvLogoIcon,
  SvgAntdvNextLogoIcon,
  SvgTDesignIcon,
} from '@shennong/icons';

import { IFrameView } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      badgeType: 'dot',
      icon: SHENNONG_LOGO_URL,
      order: 9998,
      title: $t('demos.vben.title'),
    },
    name: 'ShennongProject',
    path: '/vben-admin',
    children: [
      {
        name: 'ShennongDocument',
        path: '/vben-admin/document',
        component: IFrameView,
        meta: {
          icon: 'lucide:book-open-text',
          link: SHENNONG_DOC_URL,
          title: $t('demos.vben.document'),
        },
      },
      {
        name: 'ShennongGithub',
        path: '/vben-admin/github',
        component: IFrameView,
        meta: {
          icon: 'mdi:github',
          link: SHENNONG_GITHUB_URL,
          title: 'Github',
        },
      },
      {
        name: 'ShennongAntd',
        path: '/vben-admin/antd',
        component: IFrameView,
        meta: {
          badgeType: 'dot',
          icon: SvgAntdvLogoIcon,
          link: SHENNONG_ANT_PREVIEW_URL,
          title: $t('demos.vben.antdv'),
        },
      },
      {
        name: 'ShennongAntdVNext',
        path: '/vben-admin/antdv-next',
        component: IFrameView,
        meta: {
          badgeType: 'dot',
          icon: SvgAntdvNextLogoIcon,
          link: SHENNONG_ANTDV_NEXT_PREVIEW_URL,
          title: $t('demos.vben.antdv-next'),
        },
      },
      {
        name: 'ShennongTDesign',
        path: '/vben-admin/tdesign',
        component: IFrameView,
        meta: {
          badgeType: 'dot',
          icon: SvgTDesignIcon,
          link: SHENNONG_TD_PREVIEW_URL,
          title: $t('demos.vben.tdesign'),
        },
      },
      {
        name: 'ShennongElementPlus',
        path: '/vben-admin/ele',
        component: IFrameView,
        meta: {
          badgeType: 'dot',
          icon: 'logos:element',
          link: SHENNONG_ELE_PREVIEW_URL,
          title: $t('demos.vben.element-plus'),
        },
      },
    ],
  },
  {
    name: 'ShennongAbout',
    path: '/vben-admin/about',
    component: () => import('#/views/_core/about/index.vue'),
    meta: {
      icon: 'lucide:copyright',
      title: $t('demos.vben.about'),
      order: 9999,
    },
  },
  {
    name: 'Profile',
    path: '/profile',
    component: () => import('#/views/_core/profile/index.vue'),
    meta: {
      icon: 'lucide:user',
      hideInMenu: true,
      title: $t('page.auth.profile'),
    },
  },
];

export default routes;
