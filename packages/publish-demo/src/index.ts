/**
 * 神农信息系统 · 发布链路验证示例
 *
 * 此包不承载业务，仅用于：
 * 1. 验证 Verdaccio 私服 publish/install 链路是否通畅
 * 2. 演示 hybrid exports 模式（dev 走 src，publish 走 dist）
 * 3. 验证消费方装包时只能拿到 dist + d.ts，无法看到 src
 *
 * P0-3 阶段会把此模式应用到所有业务包。
 */

export const HELLO = 'hello shennong';

export interface PingResult {
  ok: boolean;
  registry: string;
  ts: number;
}

export function ping(registry: string): PingResult {
  return {
    ok: true,
    registry,
    ts: Date.now(),
  };
}
