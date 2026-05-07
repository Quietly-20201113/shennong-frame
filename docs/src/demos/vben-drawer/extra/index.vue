<script lang="ts" setup>
import { useShennongDrawer, ShennongButton } from '@shennong/common-ui';

import ExtraDrawer from './drawer.vue';

const [Drawer, drawerApi] = useShennongDrawer({
  // 连接抽离的组件
  connectedComponent: ExtraDrawer,
});

function open() {
  drawerApi.open();
}
</script>

<template>
  <div>
    <Drawer />
    <ShennongButton @click="open">Open</ShennongButton>
  </div>
</template>
