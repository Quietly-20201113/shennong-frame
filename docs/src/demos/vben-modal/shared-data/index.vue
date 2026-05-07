<script lang="ts" setup>
import { useShennongModal, ShennongButton } from '@shennong/common-ui';

import ExtraModal from './modal.vue';

const [Modal, modalApi] = useShennongModal({
  // 连接抽离的组件
  connectedComponent: ExtraModal,
});

function openModal() {
  modalApi
    .setData({
      content: '外部传递的数据 content',
      payload: '外部传递的数据 payload',
    })
    .open();
}
</script>

<template>
  <div>
    <Modal />

    <ShennongButton @click="openModal">Open</ShennongButton>
  </div>
</template>
