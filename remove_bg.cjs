const Jimp = require('jimp');

async function processImage(inputPath, outputPath) {
  try {
    const image = await Jimp.read(inputPath);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      // Get RGB values
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // Calculate luminosity (perceived brightness)
      // Standard weights for perceived brightness
      const luminosity = (0.299 * red + 0.587 * green + 0.114 * blue);
      
      // If the pixel is very dark, make it transparent
      // We scale the alpha so that darker pixels are more transparent, 
      // which keeps the neon glow smooth instead of a harsh cut-off.
      
      // Threshold: if luminosity is below 15, it's basically background.
      // If it's between 15 and 80, it's partially transparent glow.
      // Above 80, it's mostly solid.
      
      let alpha = 255;
      
      if (luminosity < 15) {
        alpha = 0;
      } else if (luminosity < 100) {
        // Map 15-100 to 0-255
        alpha = Math.floor(((luminosity - 15) / 85) * 255);
      }
      
      this.bitmap.data[idx + 3] = alpha;
    });

    await image.writeAsync(outputPath);
    console.log(`Successfully processed ${inputPath} to ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error);
  }
}

async function main() {
  await processImage('public/hero-robot.png', 'public/hero-robot-transparent.png');
  await processImage('public/hero-cube.png', 'public/hero-cube-transparent.png');
}

main();
