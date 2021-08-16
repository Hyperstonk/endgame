import consola from 'consola';

import Package from './package';

const main = async () => {
  // Read package at current directory
  const rootPackage = new Package();
  await rootPackage.init();

  const workspacePackages = await rootPackage.getWorkspacePackages();

  // Build packages
  for (const packageConfig of workspacePackages) {
    if (packageConfig.getOptions) {
      const packageOptions = packageConfig.getOptions();
      if (packageOptions.build) {
        await packageConfig.build();
      }
      if (packageOptions.giveExecutionRights) {
        await packageConfig.giveExecutionRights();
      }
    }
  }
};

main().catch((error) => {
  consola.error(error);
  process.exit(1);
});
