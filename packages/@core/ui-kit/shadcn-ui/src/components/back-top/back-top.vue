<script lang="ts" setup>
import type { BacktopProps } from './backtop';

import { computed } from 'vue';

import { ArrowUpToLine } from '@shennong-core/icons';

import { ShennongButton } from '../button';
import { useBackTop } from './use-backtop';

interface Props extends BacktopProps {}

defineOptions({ name: 'BackTop' });

const props = withDefaults(defineProps<Props>(), {
  bottom: 20,
  isGroup: false,
  right: 24,
  target: '',
  visibilityHeight: 200,
});

const backTopStyle = computed(() => ({
  bottom: `${props.bottom}px`,
  right: `${props.right}px`,
}));

const { handleClick, visible } = useBackTop(props);
</script>
<template>
  <transition name="fade-down">
    <ShennongButton
      v-if="visible"
      :style="backTopStyle"
      class="data z-popup bg-background shadow-float hover:bg-heavy dark:bg-accent dark:hover:bg-heavy fixed bottom-10 size-10 rounded-full duration-500"
      size="icon"
      variant="icon"
      @click="handleClick"
    >
      <ArrowUpToLine class="size-4" />
    </ShennongButton>
  </transition>
</template>
