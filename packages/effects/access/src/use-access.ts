import { computed } from 'vue';

import { preferences, updatePreferences } from '@shennong/preferences';
import { useAccessStore, useUserStore } from '@shennong/stores';

/**
 * 权限组合判断模式
 * - any: 任一权限点匹配即通过（OR 语义，默认）
 * - all: 必须全部权限点都匹配（AND 语义）
 */
export type AccessMode = 'all' | 'any';

function useAccess() {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const accessMode = computed(() => {
    return preferences.app.accessMode;
  });

  /**
   * 基于角色判断是否有权限
   * @param roles 待判断的角色列表
   * @param mode  'any'（默认，任一即可） | 'all'（必须全部）
   */
  function hasAccessByRoles(roles: string[], mode: AccessMode = 'any') {
    if (!roles || roles.length === 0) return true;
    const userRoleSet = new Set(userStore.userRoles);
    return mode === 'all'
      ? roles.every((item) => userRoleSet.has(item))
      : roles.some((item) => userRoleSet.has(item));
  }

  /**
   * 基于权限码判断是否有权限
   * @param codes 待判断的权限码列表
   * @param mode  'any'（默认，任一即可） | 'all'（必须全部）
   */
  function hasAccessByCodes(codes: string[], mode: AccessMode = 'any') {
    if (!codes || codes.length === 0) return true;
    const userCodesSet = new Set(accessStore.accessCodes);
    return mode === 'all'
      ? codes.every((item) => userCodesSet.has(item))
      : codes.some((item) => userCodesSet.has(item));
  }

  async function toggleAccessMode() {
    updatePreferences({
      app: {
        accessMode:
          preferences.app.accessMode === 'frontend' ? 'backend' : 'frontend',
      },
    });
  }

  return {
    accessMode,
    hasAccessByCodes,
    hasAccessByRoles,
    toggleAccessMode,
  };
}

export { useAccess };
