<script lang="ts" setup>
import { ref } from 'vue';

import { useShennongDrawer } from '@shennong/common-ui';

const data = ref();

const [Drawer, drawerApi] = useShennongDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm() {
    console.info('onConfirm');
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      data.value = drawerApi.getData<Record<string, any>>();
    }
  },
});
</script>
<template>
  <Drawer title="数据共享示例">
    <div class="flex-col-center">外部传递数据： {{ data }}</div>
  </Drawer>
</template>
