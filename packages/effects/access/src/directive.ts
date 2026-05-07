/**
 * 全局权限指令
 * 用于组件级细粒度权限控制
 *
 * @example v-access:role="['ADMIN']"           OR：任一角色匹配（默认）
 * @example v-access:role.any="['ADMIN','MGR']" OR：显式
 * @example v-access:role.all="['ADMIN','MGR']" AND：必须全部
 * @example v-access:code="['user.read']"       权限码模式（角色/权限码任选其一）
 * @example v-access:code.all="['a','b']"       权限码 AND 模式
 */
import type { App, Directive, DirectiveBinding } from 'vue';

import type { AccessMode } from './use-access';

import { useAccess } from './use-access';

function isAccessible(
  el: Element,
  binding: DirectiveBinding<string | string[]>,
) {
  const { accessMode, hasAccessByCodes, hasAccessByRoles } = useAccess();

  const value = binding.value;

  if (!value) return;

  const authMethod =
    accessMode.value === 'frontend' && binding.arg === 'role'
      ? hasAccessByRoles
      : hasAccessByCodes;

  // 解析 modifier：.all 表示 AND；.any 或缺省表示 OR（默认）
  const mode: AccessMode = binding.modifiers.all ? 'all' : 'any';

  const values = Array.isArray(value) ? value : [value];

  if (!authMethod(values, mode)) {
    el?.remove();
  }
}

const mounted = (el: Element, binding: DirectiveBinding<string | string[]>) => {
  isAccessible(el, binding);
};

const authDirective: Directive = {
  mounted,
};

export function registerAccessDirective(app: App) {
  app.directive('access', authDirective);
}
