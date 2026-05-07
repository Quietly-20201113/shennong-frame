import { oxlintConfig } from '@shennong/oxlint-config';

import { defineConfig } from 'oxlint';

export default defineConfig({
  ...oxlintConfig,
  rules: {
    ...oxlintConfig.rules,
    // 关掉对中英混排测试名的误判：'OR 模式...' 会被错改为 'oR 模式...'
    // 详见 P0-3 commit 7d63ccb06 修复实录
    'vitest/prefer-lowercase-title': 'off',
  },
});
