<script lang="ts" setup>
import { useShennongDrawer, ShennongButton } from '@shennong/common-ui';

const [Drawer, drawerApi] = useShennongDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm() {
    console.info('onConfirm');
  },
  title: '动态修改配置示例',
});

function handleUpdateTitle() {
  drawerApi.setState({ title: '内部动态标题' });
}
</script>
<template>
  <Drawer>
    <div class="flex-col-center">
      <ShennongButton class="mb-3" type="primary" @click="handleUpdateTitle()">
        内部动态修改标题
      </ShennongButton>
    </div>
  </Drawer>
</template>
