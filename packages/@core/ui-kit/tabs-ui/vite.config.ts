// eslint-disable-next-line no-restricted-imports
import { defineConfig } from '@shennong/vite-config';

export default defineConfig(async () => {
  return {
    library: { dts: true },
  };
});
