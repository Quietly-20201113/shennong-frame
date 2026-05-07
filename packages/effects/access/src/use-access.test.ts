import { useAccessStore, useUserStore } from '@shennong/stores';

/**
 * @shennong/access · useAccess Hook 单元测试
 * 覆盖：AND/OR 复合权限（roles + codes 各 4 case）+ 边界情况
 */
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAccess } from './use-access';

describe('useAccess', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // ---------- hasAccessByRoles ----------
  describe('hasAccessByRoles', () => {
    beforeEach(() => {
      const userStore = useUserStore();
      userStore.setUserRoles(['admin', 'manager']);
    });

    it('默认 OR 模式：任一匹配即通过', () => {
      const { hasAccessByRoles } = useAccess();
      expect(hasAccessByRoles(['admin', 'editor'])).toBe(true);
      expect(hasAccessByRoles(['editor', 'viewer'])).toBe(false);
    });

    it('显式 any 时 OR 语义：任一匹配即通过', () => {
      const { hasAccessByRoles } = useAccess();
      expect(hasAccessByRoles(['admin', 'editor'], 'any')).toBe(true);
      expect(hasAccessByRoles(['editor', 'viewer'], 'any')).toBe(false);
    });

    it('指定 all 时 AND 语义：必须全部匹配', () => {
      const { hasAccessByRoles } = useAccess();
      expect(hasAccessByRoles(['admin', 'manager'], 'all')).toBe(true);
      expect(hasAccessByRoles(['admin', 'editor'], 'all')).toBe(false);
    });

    it('空数组：默认通过（无要求 = 不限制）', () => {
      const { hasAccessByRoles } = useAccess();
      expect(hasAccessByRoles([])).toBe(true);
      expect(hasAccessByRoles([], 'all')).toBe(true);
    });
  });

  // ---------- hasAccessByCodes ----------
  describe('hasAccessByCodes', () => {
    beforeEach(() => {
      const accessStore = useAccessStore();
      accessStore.setAccessCodes(['user.read', 'user.write']);
    });

    it('默认 OR 模式：任一匹配即通过', () => {
      const { hasAccessByCodes } = useAccess();
      expect(hasAccessByCodes(['user.read', 'user.delete'])).toBe(true);
      expect(hasAccessByCodes(['user.delete', 'user.export'])).toBe(false);
    });

    it('指定 all 时 AND 语义：必须全部匹配', () => {
      const { hasAccessByCodes } = useAccess();
      expect(hasAccessByCodes(['user.read', 'user.write'], 'all')).toBe(true);
      expect(hasAccessByCodes(['user.read', 'user.delete'], 'all')).toBe(false);
    });

    it('空数组：默认通过', () => {
      const { hasAccessByCodes } = useAccess();
      expect(hasAccessByCodes([])).toBe(true);
    });
  });
});
