<script lang="ts" setup>
import { ref } from 'vue';

import { useShennongModal } from '@shennong/common-ui';

const data = ref();

const [Modal, modalApi] = useShennongModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    console.info('onConfirm');
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      data.value = modalApi.getData<Record<string, any>>();
    }
  },
});
</script>
<template>
  <Modal title="数据共享示例">
    <div class="flex-col-center">外部传递数据： {{ data }}</div>
  </Modal>
</template>
