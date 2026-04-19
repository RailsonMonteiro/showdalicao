const fs = require('node:fs/promises');
const path = require('node:path');
const pngToIcoModule = require('png-to-ico');
const pngToIco = typeof pngToIcoModule === 'function' ? pngToIcoModule : pngToIcoModule.default;

async function generate() {
  const rootDir = path.resolve(__dirname, '..');
  const sourcePng = path.join(rootDir, 'img', 'ico.png');
  const outputIco = path.join(rootDir, 'img', 'ico.ico');

  const icoBuffer = await pngToIco(sourcePng);
  await fs.writeFile(outputIco, icoBuffer);
  console.log(`Windows icon generated: ${outputIco}`);
}

generate().catch((error) => {
  console.error('Failed to generate Windows icon from img/ico.png');
  console.error(error);
  process.exit(1);
});
