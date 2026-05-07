<script lang="ts" setup>
import { useShennongModal, ShennongButton } from '@shennong/common-ui';

const [Modal, modalApi] = useShennongModal();
</script>
<template>
  <div>
    <ShennongButton @click="() => modalApi.open()">Open</ShennongButton>
    <Modal class="w-150" title="基础示例"> modal content </Modal>
  </div>
</template>
