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
  devDependencies: Record<string, string>;
  dependencies: Record<string, string>;
}

type ImageDependencies = Record<string, string[]>;

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

const createEdges = (image: ImageDependencies): [string, string][] => {
  const result = [];
  Object.keys(image).forEach((key) => {
    image[key].forEach((dep) => {
      result.push([dep, key]);
    });
  });
  return result;
};

function topologicalSort(edges: [string, string][]) {
  const nodes = {};
  const sorted = [];
  const visited = {};

  const Node = function (id: string) {
    this.id = id;
    this.afters = [];
  };

  edges.forEach(([from, to]) => {
    if (!nodes[from]) nodes[from] = new Node(from);
    if (!nodes[to]) nodes[to] = new Node(to);
    nodes[from].afters.push(to);
  });

  Object.keys(nodes).forEach(function visit(
    idstr,
    ancestorsTemp: number | string[]
  ) {
    const node = nodes[idstr];
    const id = node.id;
    const ancestors = Array.isArray(ancestorsTemp) ? ancestorsTemp : [];

    // Early return if already visited
    if (visited[idstr]) {
      return;
    }

    ancestors.push(id);
    visited[idstr] = true;

    node.afters.forEach((afterID: string) => {
      if (ancestors.indexOf(afterID) >= 0) {
        throw new Error('closed chain : ' + afterID + ' is in ' + id);
      }

      visit(
        afterID.toString(),
        ancestors.map((v) => v)
      );
    });

    sorted.unshift(id);
  });

  return sorted;
}

export default class Package {
  private _options: PackageOptions;
  private _pkg: PackageConfig;
  private _logger: Consola;

  constructor(options: Record<string, unknown> = {}) {
    // Assign options
    this._options = Object.assign({}, DEFAULTS, options);

    // Basic logger
    this._logger = consola;

    // Try to read package.json
    this._pkg = fsExtra.readJSONSync(this._resolvePath(this._options.pkgPath));
  }

  private _resolvePath(...args: string[]) {
    return resolve(this._options.rootDir, ...args);
  }

  private _formatError(error: RollupError) {
    let loc = this._options.rootDir;
    if (error.loc) {
      const { file, column, line } = error.loc;
      loc = `${file}:${line}:${column}`;
    }
    error.message = `[${error.code || ''}] ${error.message}\nat ${loc}`;
    return error;
  }

  private async _loadConfig() {
    const configPath = this._resolvePath(this._options.configPath);

    if (fsExtra.existsSync(configPath)) {
      let config = await import(configPath);
      config = config.default || config;

      Object.assign(this._options, config);
    }
  }

  private exec(command, args, silent = false) {
    const r = spawn.sync(command, args.split(' '), {
      cwd: this._options.rootDir,
      env: process.env,
    });

    if (!silent) {
      const fullCommand = command + ' ' + args;
      if (r.error) {
        this._logger.error(fullCommand, r.error);
      } else {
        this._logger.success(fullCommand, r.output);
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
      ...Object.keys(this._pkg.dependencies || {}),
      // Builtin node modules
      ...builtins,
      // Custom externals
      ...(this._options.externals || []),
    ];

    // Prepare rollup config
    const config = {
      rootDir: this._options.rootDir,
      input: this._options.srcFile,
      outputFilename: this._options.distMain,
      alias: {},
      replace: {},
      externals,
    };

    try {
      // Create rollup config
      const rollupConfig = makeRollupConfig(config, this._pkg);

      this._logger.info('Building bundle');

      const bundle = await rollup(rollupConfig);
      const { dir } = <OutputOptions>rollupConfig.output;
      if (dir) {
        await fsExtra.remove(dir);
      }

      const result = await bundle.write(<OutputOptions>rollupConfig.output);

      this._logger.success('Bundle built:', this._pkg.name);

      // Analyze bundle imports against pkg
      this._analyseImports(externals, result);
    } catch (err) {
      this._formatError(err);
      throw err;
    }
  }

  private _analyseImports(externals: string[], result: RollupOutput) {
    const dependencies = Object.keys(this._pkg.dependencies || {});
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
        `Missing dependencies in ${this._pkg.name}: ` +
          missingDependencies.join(', ')
      );
    }

    const unusedDependencies = dependencies.filter(
      (d) =>
        !imports.find((i) => i.startsWith(d)) &&
        !this._options.ignoreUnused.includes(d)
    );
    if (unusedDependencies.length) {
      throw new Error(
        `Unused dependencies in ${this._pkg.name}: ` +
          unusedDependencies.join(', ')
      );
    }
  }

  private _giveExecutionRights() {
    const distFilePath = `${this._options.rootDir}/dist/${this._options.distMain}.js`;

    let fileData = fsExtra.readFileSync(distFilePath, {
      encoding: 'utf-8',
    });
    fileData = `#!/usr/bin/env node\n${fileData}`;
    fsExtra.writeFileSync(distFilePath, fileData, { encoding: 'utf-8' });

    this.exec('chmod', `+x ${distFilePath}`, true);
  }

  public async init(): Promise<void> {
    // Use tagged logger
    this._logger = consola.withTag(this._pkg.name);

    // Try to load config
    await this._loadConfig();
  }

  public async getWorkspacePackages(): Promise<any[]> {
    const imageDependencies = {};
    const packages: Record<string, Package> = {};

    for (const workspace of this._pkg.workspaces || []) {
      const dirs = await globby(workspace, {
        onlyDirectories: true,
      });
      for (const dir of dirs) {
        if (fsExtra.existsSync(this._resolvePath(dir, 'package.json'))) {
          const pkg = new Package({
            rootDir: this._resolvePath(dir),
          });
          await pkg.init();
          packages[pkg.getPackage().name] = pkg;
        } else {
          consola.warn('Invalid workspace package:', dir);
        }
      }
    }

    // Preparing a dependencies graph for topological order
    for (const [name, packageConfig] of Object.entries(packages)) {
      const { devDependencies, dependencies } = packageConfig.getPackage();

      const deps = [
        ...Object.keys(devDependencies || {}),
        ...Object.keys(dependencies || {}),
      ].filter((depName) => {
        // Keeping only @endgame packages for topological sorting
        return depName.indexOf('@endgame') !== -1;
      });

      imageDependencies[name] = deps;
    }

    // Creating edges for topological sorting
    // SEE: https://en.wikipedia.org/wiki/Topological_sorting
    const edges = createEdges(imageDependencies);
    const packagesNamesOrdered = topologicalSort(edges);

    const areNotDeps = Object.keys(imageDependencies)
      .filter((pkgName) => !packagesNamesOrdered.includes(pkgName))
      .map((notDepPkgName) => {
        return packages[notDepPkgName];
      });

    // The packages ordered based on their internal dependencies.
    const orderedPackages = packagesNamesOrdered.map(
      (pkgName) => packages[pkgName]
    );

    // Returning the packages ordered based on their internal dependencies (first the ones not used as dependencies by other packages).
    return [...areNotDeps, ...orderedPackages];
  }

  public getOptions(): PackageOptions {
    return this._options;
  }

  public getPackage(): PackageConfig {
    return this._pkg;
  }

  public async build(): Promise<void> {
    await this._build();
  }

  public giveExecutionRights(): void {
    this._giveExecutionRights();
  }
}
