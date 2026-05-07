<script lang="ts" setup>
import { useShennongModal } from '@shennong/common-ui';

import { Button } from 'ant-design-vue';

import DragDemo from './drag-demo.vue';

const [Modal] = useShennongModal({
  destroyOnClose: true,
});
const [BaseModal, baseModalApi] = useShennongModal({
  connectedComponent: DragDemo,
});

function openNestedModal() {
  baseModalApi.open();
}
</script>
<template>
  <Modal title="嵌套弹窗示例">
    <Button @click="openNestedModal" type="primary">打开子弹窗</Button>
    <BaseModal />
  </Modal>
</template>
