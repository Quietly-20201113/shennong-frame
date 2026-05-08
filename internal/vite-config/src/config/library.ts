import type { ConfigEnv, Plugin, UserConfig } from 'vite';

import type { DefineLibraryOptions } from '../typing';

import { readPackageJSON } from '@shennong/node-utils';

import { defineConfig, mergeConfig } from 'vite';

import { loadLibraryPlugins } from '../plugins';
import { getCommonConfig } from './common';

/**
 * 让 entry chunk 顶部自动注入 `import './xxx.css'`
 * 解决：消费方装包后必须显式 `import 'pkg/style.css'` 才能加载样式的痛点
 */
function libInjectCssPlugin(): Plugin {
  return {
    name: 'shennong:lib-inject-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const cssFile = Object.keys(bundle).find((f) => f.endsWith('.css'));
      if (!cssFile) return;
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          // eslint-disable-next-line no-param-reassign
          chunk.code = `import './${cssFile}';\n${chunk.code}`;
        }
      }
    },
  };
}

function defineLibraryConfig(userConfigPromise?: DefineLibraryOptions) {
  return defineConfig(async (config: ConfigEnv) => {
    const options = await userConfigPromise?.(config);
    const { command, mode } = config;
    const { library = {}, vite = {} } = options || {};
    const root = process.cwd();
    const isBuild = command === 'build';

    const plugins = await loadLibraryPlugins({
      dts: false,
      injectMetadata: true,
      isBuild,
      mode,
      ...library,
    });

    const { dependencies = {}, peerDependencies = {} } =
      await readPackageJSON(root);

    const externalPackages = [
      ...Object.keys(dependencies),
      ...Object.keys(peerDependencies),
    ];

    const packageConfig: UserConfig = {
      build: {
        lib: {
          entry: 'src/index.ts',
          fileName: () => 'index.mjs',
          formats: ['es'],
        },
        rolldownOptions: {
          external: (id) => {
            return externalPackages.some(
              (pkg) => id === pkg || id.startsWith(`${pkg}/`),
            );
          },
        },
      },
      plugins: [...plugins, libInjectCssPlugin()],
    };
    const commonConfig = await getCommonConfig();
    const mergedConmonConfig = mergeConfig(commonConfig, packageConfig);
    return mergeConfig(mergedConmonConfig, vite);
  });
}

export { defineLibraryConfig };
