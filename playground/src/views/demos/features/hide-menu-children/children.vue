<script lang="ts" setup>
import { Fallback, ShennongButton } from '@shennong/common-ui';
import { useTabs } from '@shennong/hooks';
import { X } from '@shennong/icons';

const { closeCurrentTab } = useTabs();
</script>

<template>
  <Fallback
    description="当前路由在菜单中不可见"
    status="coming-soon"
    title="被隐藏的子菜单"
    show-back
  >
    <template #action>
      <ShennongButton size="lg" @click="closeCurrentTab()">
        <X class="mr-2 size-4" />
        关闭当前标签页
      </ShennongButton>
    </template>
  </Fallback>
</template>
