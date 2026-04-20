const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = typeof pngToIcoModule === 'function' ? pngToIcoModule : pngToIcoModule.default;

async function generate() {
  const rootDir = path.resolve(__dirname, '..');
  const sourcePng = path.join(rootDir, 'img', 'icone.png');
  const outputIco = path.join(rootDir, 'img', 'ico.ico');
  const publicOutputIco = path.join(rootDir, 'public', 'img', 'ico.ico');

  const image = sharp(sourcePng, { failOnError: true });
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    throw new Error('Não foi possível ler dimensões válidas de img/icone.png');
  }

  const squareSize = Math.max(width, height);
  const squaredPngBuffer = await image
    .resize(squareSize, squareSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  const icoBuffer = await pngToIco(squaredPngBuffer);
  await fs.writeFile(outputIco, icoBuffer);
  await fs.writeFile(publicOutputIco, icoBuffer);
  console.log(`Windows icon generated: ${outputIco} (source: ${path.basename(sourcePng)})`);
}

generate().catch((error) => {
  console.error('Failed to generate Windows icon from img/icone.png');
  console.error(error);
  process.exit(1);
});
