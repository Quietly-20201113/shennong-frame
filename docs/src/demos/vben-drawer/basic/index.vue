<script lang="ts" setup>
import { useShennongDrawer, ShennongButton } from '@shennong/common-ui';

const [Drawer, drawerApi] = useShennongDrawer();
</script>
<template>
  <div>
    <ShennongButton @click="() => drawerApi.open()">Open</ShennongButton>
    <Drawer class="w-150" title="基础示例"> drawer content </Drawer>
  </div>
</template>
