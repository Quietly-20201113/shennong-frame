<script setup lang="ts">
import { useAppConfig } from '@shennong/hooks';
import {
  SvgGithubIcon,
  SvgGoogleIcon,
  SvgQQChatIcon,
  SvgWeChatIcon,
} from '@shennong/icons';
import { $t } from '@shennong/locales';

import { ShennongIconButton } from '@shennong-core/shadcn-ui';

import DingdingLogin from './dingding-login.vue';

defineOptions({
  name: 'ThirdPartyLogin',
});

const {
  auth: { dingding: dingdingAuthConfig },
} = useAppConfig(import.meta.env, import.meta.env.PROD);
</script>

<template>
  <div class="w-full sm:mx-auto md:max-w-md">
    <div class="mt-4 flex items-center justify-between">
      <span class="w-[35%] border-b border-input dark:border-gray-600"></span>
      <span class="text-center text-xs text-muted-foreground uppercase">
        {{ $t('authentication.thirdPartyLogin') }}
      </span>
      <span class="w-[35%] border-b border-input dark:border-gray-600"></span>
    </div>

    <div class="mt-4 flex flex-wrap justify-center">
      <ShennongIconButton
        :tooltip="$t('authentication.wechatLogin')"
        tooltip-side="top"
        class="mb-3"
      >
        <SvgWeChatIcon />
      </ShennongIconButton>
      <ShennongIconButton
        :tooltip="$t('authentication.qqLogin')"
        tooltip-side="top"
        class="mb-3"
      >
        <SvgQQChatIcon />
      </ShennongIconButton>
      <ShennongIconButton
        :tooltip="$t('authentication.githubLogin')"
        tooltip-side="top"
        class="mb-3"
      >
        <SvgGithubIcon />
      </ShennongIconButton>
      <ShennongIconButton
        :tooltip="$t('authentication.googleLogin')"
        tooltip-side="top"
        class="mb-3"
      >
        <SvgGoogleIcon />
      </ShennongIconButton>
      <DingdingLogin
        v-if="dingdingAuthConfig"
        :corp-id="dingdingAuthConfig.corpId"
        :client-id="dingdingAuthConfig.clientId"
        class="mb-3"
      />
    </div>
  </div>
</template>
