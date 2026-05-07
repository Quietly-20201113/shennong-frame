import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: {
    resolver: 'tsc',
  },
  outExtensions: () => ({
    js: '.mjs',
    dts: '.d.ts',
  }),
});
