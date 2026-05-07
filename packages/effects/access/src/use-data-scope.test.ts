import { useAccessStore, useUserStore } from '@shennong/stores';

/**
 * @shennong/access · useDataScope Hook 单元测试
 * 覆盖五档 DataScope：SELF / OWN_DEPT / OWN_DEPT_AND_CHILDREN / ALL / CUSTOM
 */
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useDataScope } from './use-data-scope';

describe('useDataScope', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const userStore = useUserStore();
    userStore.setUserInfo({
      avatar: '',
      deptId: 'dept-A',
      realName: 'Alice',
      userId: 'user-1',
      username: 'alice',
    } as any);
  });

  it('全部（ALL）：放行所有数据', () => {
    const accessStore = useAccessStore();
    accessStore.setDataScope('ALL');
    const { hasDataAccess } = useDataScope();
    expect(hasDataAccess({ ownerId: 'user-2', deptId: 'dept-Z' })).toBe(true);
    expect(hasDataAccess({})).toBe(true);
  });

  it('仅自己（SELF）：放行 ownerId 等于当前用户', () => {
    const accessStore = useAccessStore();
    accessStore.setDataScope('SELF');
    const { hasDataAccess } = useDataScope();
    expect(hasDataAccess({ ownerId: 'user-1' })).toBe(true);
    expect(hasDataAccess({ ownerId: 'user-2' })).toBe(false);
    // ownerId 缺失 → 拒绝
    expect(hasDataAccess({ deptId: 'dept-A' })).toBe(false);
  });

  it('本部门（OWN_DEPT）：放行 deptId 等于当前用户部门', () => {
    const accessStore = useAccessStore();
    accessStore.setDataScope('OWN_DEPT');
    const { hasDataAccess } = useDataScope();
    expect(hasDataAccess({ deptId: 'dept-A' })).toBe(true);
    expect(hasDataAccess({ deptId: 'dept-B' })).toBe(false);
  });

  it('本部门含子（OWN_DEPT_AND_CHILDREN）：当前用户部门在祖先链中即放行', () => {
    const accessStore = useAccessStore();
    accessStore.setDataScope('OWN_DEPT_AND_CHILDREN');
    const { hasDataAccess } = useDataScope();
    // 数据是 dept-X，祖先链含 dept-A → 当前用户 dept-A 可见
    expect(
      hasDataAccess({
        deptAncestorIds: ['dept-X', 'dept-A', 'dept-root'],
        deptId: 'dept-X',
      }),
    ).toBe(true);
    // 祖先链不含 dept-A → 拒绝
    expect(
      hasDataAccess({
        deptAncestorIds: ['dept-Y', 'dept-root'],
        deptId: 'dept-Y',
      }),
    ).toBe(false);
    // 祖先链缺失 → 拒绝
    expect(hasDataAccess({ deptId: 'dept-X' })).toBe(false);
  });

  it('自定义部门（CUSTOM）：deptId 在自定义列表中才放行', () => {
    const accessStore = useAccessStore();
    accessStore.setDataScope('CUSTOM');
    accessStore.setCustomDeptIds(['dept-X', 'dept-Y']);
    const { hasDataAccess } = useDataScope();
    expect(hasDataAccess({ deptId: 'dept-X' })).toBe(true);
    expect(hasDataAccess({ deptId: 'dept-Z' })).toBe(false);
  });

  it('默认值：dataScope 初始为 SELF', () => {
    const { dataScope } = useDataScope();
    expect(dataScope.value).toBe('SELF');
  });
});
