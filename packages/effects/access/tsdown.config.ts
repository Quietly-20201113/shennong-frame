import { defineConfig } from 'tsdown';
import Vue from 'unplugin-vue/rolldown';

export default defineConfig({
  clean: true,
  deps: {
    skipNodeModulesBundle: true,
  },
  dts: { vue: true, resolver: 'tsc' },
  entry: ['src/index.ts'],
  format: ['esm'],
  outExtensions: () => ({
    js: '.mjs',
    dts: '.d.ts',
  }),
  platform: 'neutral',
  plugins: [Vue({ isProduction: true })],
  unbundle: true,
});
