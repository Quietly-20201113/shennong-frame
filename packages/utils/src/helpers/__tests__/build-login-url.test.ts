import { describe, expect, it } from 'vitest';

import { buildLoginUrl } from '../build-login-url';

const origin = 'https://host';
const loginPath = '/auth/login';

describe('buildLoginUrl', () => {
  it('history 模式 + /design/ 子路径 → 去尾斜杠拼路径', () => {
    expect(buildLoginUrl({ origin, base: '/design/', loginPath })).toBe(
      'https://host/design/auth/login',
    );
  });

  it('history 模式 + 根 base → 直接拼登录路径', () => {
    expect(buildLoginUrl({ origin, base: '/', loginPath })).toBe(
      'https://host/auth/login',
    );
  });

  it('base 缺省按 / 处理', () => {
    expect(buildLoginUrl({ origin, loginPath })).toBe(
      'https://host/auth/login',
    );
  });

  it('hash 模式 + /design/ → base 后接 #loginPath', () => {
    expect(
      buildLoginUrl({ origin, base: '/design/', loginPath, isHash: true }),
    ).toBe('https://host/design/#/auth/login');
  });

  it('hash 模式 + 根 base', () => {
    expect(buildLoginUrl({ origin, base: '/', loginPath, isHash: true })).toBe(
      'https://host/#/auth/login',
    );
  });
});
