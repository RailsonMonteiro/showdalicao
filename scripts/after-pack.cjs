const path = require('node:path');
const rcedit = require('rcedit');

module.exports = async (context) => {
  if (context.electronPlatformName !== 'win32') {
    return;
  }

  const exeName = `${context.packager.appInfo.productFilename}.exe`;
  const exePath = path.join(context.appOutDir, exeName);
  const iconPath = path.join(context.packager.projectDir, 'img', 'ico.ico');

  await rcedit(exePath, { icon: iconPath });
  console.log(`Windows executable icon updated: ${exePath}`);
};
