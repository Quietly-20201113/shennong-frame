/**
 * 神农信息系统 · 数据权限范围 Hook
 *
 * 配合 useAccessStore.dataScope 使用，对单条数据记录做可见性判断。
 * 业务侧可基于此 Hook 在表格筛选 / API 拦截器层注入 SQL WHERE 条件。
 *
 * @example
 * const { dataScope, hasDataAccess } = useDataScope();
 *
 * // 判断当前用户能否看见某条记录
 * const visible = hasDataAccess({
 *   ownerId: row.creatorId,
 *   deptId: row.deptId,
 *   deptAncestorIds: row.deptAncestorIds,
 * });
 */
import type { DataScope, DataScopeContext } from '@shennong-core/typings';

import { computed } from 'vue';

import { useAccessStore, useUserStore } from '@shennong/stores';

function useDataScope() {
  const accessStore = useAccessStore();
  const userStore = useUserStore();

  /** 当前用户的数据权限范围 */
  const dataScope = computed<DataScope>(() => accessStore.dataScope);

  /** dataScope === 'CUSTOM' 时生效的部门 ID 列表 */
  const customDeptIds = computed<Array<number | string>>(
    () => accessStore.customDeptIds,
  );

  /** 当前用户 ID（用于 SELF 判断） */
  const currentUserId = computed<number | string | undefined>(
    () => userStore.userInfo?.userId,
  );

  /** 当前用户所属部门 ID（用于 OWN_DEPT 系列判断） */
  const currentDeptId = computed<number | string | undefined>(
    () => userStore.userInfo?.deptId,
  );

  /**
   * 判断当前用户对一条数据记录是否有访问权
   *
   * 五档判断逻辑：
   * - ALL：直接通过
   * - SELF：仅当 ownerId === currentUserId
   * - OWN_DEPT：仅当 deptId === currentDeptId
   * - OWN_DEPT_AND_CHILDREN：deptAncestorIds 包含 currentDeptId（数据侧上送）
   * - CUSTOM：deptId ∈ customDeptIds
   */
  function hasDataAccess(ctx: DataScopeContext): boolean {
    const scope = dataScope.value;

    if (scope === 'ALL') return true;

    if (scope === 'SELF') {
      return (
        ctx.ownerId !== undefined &&
        currentUserId.value !== undefined &&
        String(ctx.ownerId) === String(currentUserId.value)
      );
    }

    if (scope === 'OWN_DEPT') {
      return (
        ctx.deptId !== undefined &&
        currentDeptId.value !== undefined &&
        String(ctx.deptId) === String(currentDeptId.value)
      );
    }

    if (scope === 'OWN_DEPT_AND_CHILDREN') {
      // 需要数据侧上送 deptAncestorIds（含数据所属部门自身及全部上级）
      // 当前用户的部门 ID 出现在祖先链中即视为可见
      if (!ctx.deptAncestorIds || currentDeptId.value === undefined) {
        return false;
      }
      const userDeptStr = String(currentDeptId.value);
      return ctx.deptAncestorIds.some((id) => String(id) === userDeptStr);
    }

    if (scope === 'CUSTOM') {
      if (ctx.deptId === undefined) return false;
      const target = String(ctx.deptId);
      return customDeptIds.value.some((id) => String(id) === target);
    }

    return false;
  }

  return {
    currentDeptId,
    currentUserId,
    customDeptIds,
    dataScope,
    hasDataAccess,
  };
}

export { useDataScope };
