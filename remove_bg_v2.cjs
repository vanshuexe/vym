const { Jimp } = require('jimp');

async function processImage() {
  console.log('Loading image...');
  const image = await Jimp.read('public/hero-logo-original.png');
  
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const hex = image.getPixelColor(x, y);
      const rgba = require('jimp').intToRGBA(hex);
      
      // If the pixel is close to white (background)
      if (rgba.r > 240 && rgba.g > 240 && rgba.b > 240) {
        // Make it fully transparent
        image.setPixelColor(require('jimp').rgbaToInt(255, 255, 255, 0), x, y);
      } else {
        // Boost brightness significantly so the dark logo becomes visible on a dark background
        const boost = 100;
        const newR = Math.min(255, rgba.r + boost);
        const newG = Math.min(255, rgba.g + boost);
        const newB = Math.min(255, rgba.b + boost);
        image.setPixelColor(require('jimp').rgbaToInt(newR, newG, newB, rgba.a), x, y);
      }
    }
  }
  
  console.log('Writing transparent image...');
  await image.write('public/hero-logo-transparent.png');
  console.log('Done processing image!');
}

processImage().catch(console.error);
