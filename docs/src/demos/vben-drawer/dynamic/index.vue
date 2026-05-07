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

function handleUpdateTitle() {
  drawerApi.setState({ title: '外部动态标题' }).open();
}
</script>

<template>
  <div>
    <Drawer />

    <ShennongButton @click="open">Open</ShennongButton>
    <ShennongButton class="ml-2" type="primary" @click="handleUpdateTitle">
      从外部修改标题并打开
    </ShennongButton>
  </div>
</template>
