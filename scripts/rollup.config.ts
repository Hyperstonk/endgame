import path from 'path';
import fsExtra from 'fs-extra';
import { RollupOptions } from 'rollup';

import typescriptPlugin from '@rollup/plugin-typescript';
import commonjsPlugin from '@rollup/plugin-commonjs';
import replacePlugin from '@rollup/plugin-replace';
import aliasPlugin from '@rollup/plugin-alias';
import licensePlugin from 'rollup-plugin-license';

import { PackageConfig } from './package';

interface Config {
  rootDir: string;
  input?: string;
  outputFilename: string;
  replace: Record<string, unknown>;
  alias: Record<string, unknown>;
  externals: string[];
}

export default function rollupConfig(
  config: Config,
  pkg: PackageConfig
): RollupOptions {
  const {
    rootDir = process.cwd(),
    input = 'src/index.ts',
    outputFilename = 'index',
    replace = {},
    alias = {},
    externals = [],
  } = config;

  if (!pkg) {
    pkg = fsExtra.readJSONSync(path.resolve(rootDir, 'package.json'));
  }

  const name = path.basename(pkg.name);

  return {
    input: path.resolve(rootDir, input),
    output: {
      dir: path.resolve(rootDir, 'dist'),
      entryFileNames: `${outputFilename}.js`,
      chunkFileNames: `${outputFilename}-[name].js`,
      format: 'cjs',
      preferConst: true,
      sourcemap: true,
    },
    external: externals,
    plugins: [
      typescriptPlugin({
        tsconfig: `packages/${name}/tsconfig.json`,
      }),
      aliasPlugin(alias),
      replacePlugin({
        exclude: 'node_modules/**',
        delimiters: ['', ''],
        preventAssignment: true,
        values: {
          __NODE_ENV__: <string>process.env.NODE_ENV,
          ...replace,
        },
      }),
      commonjsPlugin({ include: /node_modules/ }),

      licensePlugin({
        banner: [
          '/*!',
          ` * ${pkg.name} v${pkg.version} © 2021-${new Date().getFullYear()}`,
          ' * Endgame.',
          ' * All Rights Reserved.',
          ' * Repository: https://github.com/MBDW-Studio/endgame',
          ' * Website: https://mentalbreakdown.studio',
          '*/',
        ].join('\n'),
      }),
    ],
  };
}
