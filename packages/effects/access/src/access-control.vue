<!--
 神农信息系统 · 细粒度权限控制组件
 支持 AND/OR 复合权限：mode='any'（默认，OR）/ mode='all'（AND）
 支持 role 与 code 两种判断维度：type='role' / type='code'
-->
<script lang="ts" setup>
import type { AccessMode } from './use-access';

import { computed } from 'vue';

import { useAccess } from './use-access';

interface Props {
  /**
   * 权限码列表（type='code'）或角色列表（type='role'）
   * @default []
   */
  codes?: string[];

  /**
   * 复合权限判断模式
   * - any: 任一匹配即可（OR 语义，默认）
   * - all: 必须全部匹配（AND 语义）
   * @default 'any'
   */
  mode?: AccessMode;

  /**
   * 判断维度
   * - role: 按用户角色判断
   * - code: 按权限码判断
   * @default 'role'
   */
  type?: 'code' | 'role';
}

defineOptions({
  name: 'AccessControl',
});

const props = withDefaults(defineProps<Props>(), {
  codes: () => [],
  mode: 'any',
  type: 'role',
});

const { hasAccessByCodes, hasAccessByRoles } = useAccess();

const hasAuth = computed(() => {
  const { codes, mode, type } = props;
  return type === 'role'
    ? hasAccessByRoles(codes, mode)
    : hasAccessByCodes(codes, mode);
});
</script>

<template>
  <slot v-if="!codes || codes.length === 0"></slot>
  <slot v-else-if="hasAuth"></slot>
</template>
