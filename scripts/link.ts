import path from 'path';
import consola from 'consola';
import execa from 'execa';
import fs from 'fs-extra';
import globby from 'globby';

async function main() {
  const unlink =
    process.argv.includes('--unlink') || process.argv.includes('-un');

  const linkType = unlink ? 'unlink' : 'link';
  const linkTypeCapitalized =
    linkType.charAt(0).toUpperCase() + linkType.slice(1);

  const packageDirs = await globby('packages/*', {
    onlyDirectories: true,
  });

  const packages = packageDirs.map((pkgDir) => ({
    dir: pkgDir,
    pkg: fs.readJSONSync(path.join(pkgDir, 'package.json')),
  }));

  const packageNames = packages.map((p) => p.pkg.name).join(' ');

  consola.info(`${linkTypeCapitalized}ing ${packages.length} packages...`);

  await Promise.all(
    packages.map((pkg) => execa('yarn', [linkType], { cwd: pkg.dir }))
  );

  const linkTypeCommand = `${linkTypeCapitalized}: \nyarn ${linkType} ${packageNames}\n`;

  consola.log(linkTypeCommand);
}

main().catch(consola.error);
