<script lang="ts" setup>
import { ShennongCountToAnimator } from '@shennong/common-ui';
</script>
<template>
  <ShennongCountToAnimator
    :duration="3000"
    :end-val="2000000"
    :start-val="1"
    prefix="$"
    separator="/"
  />
</template>
