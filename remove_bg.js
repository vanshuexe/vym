const { Jimp } = require('jimp');

async function removeWhiteBackground() {
  const image = await Jimp.read('public/hero-logo-original.png');
  
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const hex = image.getPixelColor(x, y);
      const rgba = Jimp.intToRGBA(hex);
      
      // If the pixel is mostly white/light gray
      if (rgba.r > 240 && rgba.g > 240 && rgba.b > 240) {
        // Make transparent
        image.setPixelColor(Jimp.rgbaToInt(255, 255, 255, 0), x, y);
      } else {
        // Boost brightness slightly for dark metallic on dark background
        const boost = 30;
        const newR = Math.min(255, rgba.r + boost);
        const newG = Math.min(255, rgba.g + boost);
        const newB = Math.min(255, rgba.b + boost);
        image.setPixelColor(Jimp.rgbaToInt(newR, newG, newB, rgba.a), x, y);
      }
    }
  }
  
  await image.writeAsync('public/hero-logo-transparent.png');
  console.log('Background removed!');
}

removeWhiteBackground().catch(console.error);
