<script lang="ts" setup>
import { ShennongSpinner } from '@shennong-core/shadcn-ui';

import { useContentSpinner } from './use-content-spinner';

defineOptions({ name: 'LayoutContentSpinner' });

const { spinning } = useContentSpinner();
</script>
<template>
  <ShennongSpinner :spinning="spinning" />
</template>
