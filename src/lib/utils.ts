import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function processImage(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: {
    brightness: number;
    contrast: number;
    sharpness: number;
    saturation: number;
    gamma: number;
    blur: number;
    exposure: number;
  }
) {
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply brightness
  const brightnessFactor = 1 + settings.brightness / 100;
  // Apply contrast
  const contrastFactor = 1 + settings.contrast / 100;
  // Apply exposure
  const exposureFactor = 1 + settings.exposure / 100;
  // Apply gamma
  const gammaCorrection = 1 / settings.gamma;
  
  for (let i = 0; i < data.length; i += 4) {
    // Apply all adjustments
    for (let j = 0; j < 3; j++) {
      let value = data[i + j];
      
      // Brightness
      value *= brightnessFactor;
      
      // Contrast
      value = ((value / 255 - 0.5) * contrastFactor + 0.5) * 255;
      
      // Exposure
      value *= exposureFactor;
      
      // Gamma
      value = 255 * Math.pow(value / 255, gammaCorrection);
      
      // Saturation
      if (j < 3) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        value = value + (settings.saturation / 100) * (value - gray);
      }
      
      // Ensure values stay within bounds
      data[i + j] = Math.min(255, Math.max(0, value));
    }
  }

  // Apply blur if needed
  if (settings.blur > 0) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempContext = tempCanvas.getContext('2d');
    if (tempContext) {
      tempContext.putImageData(imageData, 0, 0);
      context.filter = `blur(${settings.blur}px)`;
      context.drawImage(tempCanvas, 0, 0);
      context.filter = 'none';
      return;
    }
  }

  // Apply sharpness using a simple convolution kernel
  if (settings.sharpness > 0) {
    const tempData = new Uint8ClampedArray(data);
    const sharpenFactor = settings.sharpness / 100;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        for (let c = 0; c < 3; c++) {
          const current = tempData[idx + c];
          const neighbors = [
            tempData[idx - width * 4 + c],
            tempData[idx + width * 4 + c],
            tempData[idx - 4 + c],
            tempData[idx + 4 + c]
          ];
          const diff = current - neighbors.reduce((a, b) => a + b, 0) / 4;
          data[idx + c] = Math.min(255, Math.max(0, current + diff * sharpenFactor));
        }
      }
    }
  }

  context.putImageData(imageData, 0, 0);
}