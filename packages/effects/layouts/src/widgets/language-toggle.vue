<script setup lang="ts">
import type { SupportedLanguagesType } from '@shennong/locales';

import { SUPPORT_LANGUAGES } from '@shennong/constants';
import { Languages } from '@shennong/icons';
import { loadLocaleMessages } from '@shennong/locales';
import { preferences, updatePreferences } from '@shennong/preferences';

import { ShennongDropdownRadioMenu, ShennongIconButton } from '@shennong-core/shadcn-ui';

defineOptions({
  name: 'LanguageToggle',
});

async function handleUpdate(value: string | undefined) {
  if (!value) return;
  const locale = value as SupportedLanguagesType;
  updatePreferences({
    app: {
      locale,
    },
  });
  await loadLocaleMessages(locale);
}
</script>

<template>
  <div>
    <ShennongDropdownRadioMenu
      :menus="SUPPORT_LANGUAGES"
      :model-value="preferences.app.locale"
      @update:model-value="handleUpdate"
    >
      <ShennongIconButton class="hover:animate-[shrink_0.3s_ease-in-out]">
        <Languages class="size-4 text-foreground" />
      </ShennongIconButton>
    </ShennongDropdownRadioMenu>
  </div>
</template>
