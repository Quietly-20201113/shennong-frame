<script lang="ts" setup>
import { useShennongDrawer, ShennongButton } from '@shennong/common-ui';

import ExtraDrawer from './drawer.vue';

const [Drawer, drawerApi] = useShennongDrawer({
  // 连接抽离的组件
  connectedComponent: ExtraDrawer,
});

function open() {
  drawerApi
    .setData({
      content: '外部传递的数据 content',
      payload: '外部传递的数据 payload',
    })
    .open();
}
</script>

<template>
  <div>
    <Drawer />

    <ShennongButton @click="open">Open</ShennongButton>
  </div>
</template>
