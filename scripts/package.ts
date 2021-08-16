import { resolve } from 'path';
import consola, { Consola } from 'consola';
import spawn from 'cross-spawn';
import fsExtra from 'fs-extra';
import {
  rollup,
  OutputOptions,
  RollupError,
  OutputChunk,
  RollupOutput,
} from 'rollup';
import globby from 'globby';

import makeRollupConfig from './rollup.config';
import { builtins } from './builtins';

export interface PackageOptions {
  rootDir: string;
  pkgPath: string;
  configPath: string;
  srcFile: string;
  distDir: string;
  distMain: string;
  build: boolean;
  giveExecutionRights: boolean;
  externals: string[];
  ignoreUnused: string[];
}

export interface PackageConfig {
  name: string;
  version: string;
  workspaces: string[];
  dependencies: Record<string, string>;
}

const DEFAULTS = {
  rootDir: process.cwd(),
  pkgPath: 'package.json',
  configPath: 'package.ts',
  distDir: 'dist',
  distMain: 'index',
  srcFile: 'src/index.ts',
  build: false,
  giveExecutionRights: false,
  externals: [],
  ignoreUnused: [],
};

export default class Package {
  private options: PackageOptions;
  private pkg: PackageConfig;
  private logger: Consola;

  constructor(options: Record<string, unknown> = {}) {
    // Assign options
    this.options = Object.assign({}, DEFAULTS, options);

    // Basic logger
    this.logger = consola;

    // Try to read package.json
    this.pkg = fsExtra.readJSONSync(this._resolvePath(this.options.pkgPath));
  }

  private _resolvePath(...args: string[]) {
    return resolve(this.options.rootDir, ...args);
  }

  private _formatError(error: RollupError) {
    let loc = this.options.rootDir;
    if (error.loc) {
      const { file, column, line } = error.loc;
      loc = `${file}:${line}:${column}`;
    }
    error.message = `[${error.code || ''}] ${error.message}\nat ${loc}`;
    return error;
  }

  private async _loadConfig() {
    const configPath = this._resolvePath(this.options.configPath);

    if (fsExtra.existsSync(configPath)) {
      let config = await import(configPath);
      config = config.default || config;

      Object.assign(this.options, config);
    }
  }

  private exec(command, args, silent = false) {
    const r = spawn.sync(command, args.split(' '), {
      cwd: this.options.rootDir,
      env: process.env,
    });

    if (!silent) {
      const fullCommand = command + ' ' + args;
      if (r.error) {
        this.logger.error(fullCommand, r.error);
      } else {
        this.logger.success(fullCommand, r.output);
      }
    }

    return {
      error: r.error,
      pid: r.pid,
      status: r.status,
      signal: r.signal,
      stdout: String(r.stdout).trim(),
      stderr: String(r.stderr).trim(),
      output: (r.output || [])
        .map((l) => String(l).trim())
        .filter((l) => l.length)
        .join('\n'),
    };
  }

  private async _build(): Promise<void> {
    // Externals
    const externals = [
      // Dependencies that will be installed alongise with the spacefold package
      ...Object.keys(this.pkg.dependencies || {}),
      // Builtin node modules
      ...builtins,
      // Custom externals
      ...(this.options.externals || []),
    ];

    // Prepare rollup config
    const config = {
      rootDir: this.options.rootDir,
      input: this.options.srcFile,
      outputFilename: this.options.distMain,
      alias: {},
      replace: {},
      externals,
    };

    try {
      // Create rollup config
      const rollupConfig = makeRollupConfig(config, this.pkg);

      this.logger.info('Building bundle');

      const bundle = await rollup(rollupConfig);
      const { dir } = <OutputOptions>rollupConfig.output;
      if (dir) {
        await fsExtra.remove(dir);
      }

      const result = await bundle.write(<OutputOptions>rollupConfig.output);

      this.logger.success('Bundle built:', this.pkg.name);

      // Analyze bundle imports against pkg
      this._analyseImports(externals, result);
    } catch (err) {
      this._formatError(err);
      throw err;
    }
  }

  private _analyseImports(externals: string[], result: RollupOutput) {
    const dependencies = Object.keys(this.pkg.dependencies || {});
    const chunks = <OutputChunk[]>result.output;

    const imports = [].concat(...chunks.map((o) => o.imports)).filter(Boolean);

    const missingDependencies = imports
      .filter((i) => !i.endsWith('.js') && !i.endsWith('.ts')) // dynamic imports
      .filter(
        (i) =>
          !dependencies.includes(i) && !externals.find((e) => i.startsWith(e))
      );
    if (missingDependencies.length) {
      throw new Error(
        `Missing dependencies in ${this.pkg.name}: ` +
          missingDependencies.join(', ')
      );
    }

    const unusedDependencies = dependencies.filter(
      (d) =>
        !imports.find((i) => i.startsWith(d)) &&
        !this.options.ignoreUnused.includes(d)
    );
    if (unusedDependencies.length) {
      throw new Error(
        `Unused dependencies in ${this.pkg.name}: ` +
          unusedDependencies.join(', ')
      );
    }
  }

  private _giveExecutionRights() {
    const distFilePath = `${this.options.rootDir}/dist/${this.options.distMain}.js`;

    let fileData = fsExtra.readFileSync(distFilePath, {
      encoding: 'utf-8',
    });
    fileData = `#!/usr/bin/env node\n${fileData}`;
    fsExtra.writeFileSync(distFilePath, fileData, { encoding: 'utf-8' });

    this.exec('chmod', `+x ${distFilePath}`, true);
  }

  public async init(): Promise<void> {
    // Use tagged logger
    this.logger = consola.withTag(this.pkg.name);

    // Try to load config
    await this._loadConfig();
  }

  public async getWorkspacePackages(): Promise<any[]> {
    const packages = [];

    for (const workspace of this.pkg.workspaces || []) {
      const dirs = await globby(workspace, {
        onlyDirectories: true,
      });
      for (const dir of dirs) {
        if (fsExtra.existsSync(this._resolvePath(dir, 'package.json'))) {
          const pkg = new Package({
            rootDir: this._resolvePath(dir),
          });
          await pkg.init();
          packages.push(pkg);
        } else {
          consola.warn('Invalid workspace package:', dir);
        }
      }
    }

    return packages;
  }

  public async build(): Promise<void> {
    await this._build();
  }

  public giveExecutionRights(): void {
    this._giveExecutionRights();
  }
}
