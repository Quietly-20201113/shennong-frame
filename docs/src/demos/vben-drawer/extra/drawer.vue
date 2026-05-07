<script lang="ts" setup>
import { useShennongDrawer } from '@shennong/common-ui';

const [Drawer] = useShennongDrawer();
</script>
<template>
  <Drawer title="组件抽离示例"> extra drawer content </Drawer>
</template>
