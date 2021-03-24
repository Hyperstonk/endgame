import consola from 'consola';

import Package from './package';

const main = async () => {
  // Read package at current directory
  const rootPackage = new Package();
  await rootPackage.init();

  const workspacePackages = await rootPackage.getWorkspacePackages();

  // Build packages
  for (const pkg of workspacePackages) {
    if (pkg.options.build) {
      await pkg.build();
    }
    if (pkg.options.giveExecutionRights) {
      await pkg.giveExecutionRights();
    }
  }
};

main().catch((error) => {
  consola.error(error);
  process.exit(1);
});
