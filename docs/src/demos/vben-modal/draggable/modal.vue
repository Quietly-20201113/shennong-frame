<script lang="ts" setup>
import { useShennongModal } from '@shennong/common-ui';

const [Modal] = useShennongModal({
  draggable: true,
});
</script>
<template>
  <Modal title="拖拽示例"> modal content </Modal>
</template>
