import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Download, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Slider } from './components/ui/slider';
import { processImage } from './lib/utils';

function App() {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [enhancedFrame, setEnhancedFrame] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState({
    brightness: 0,
    contrast: 0,
    sharpness: 0,
    saturation: 0,
    gamma: 1,
    blur: 0,
    exposure: 0,
  });

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const enhancedCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setMediaType('video');
        setMediaFile(file);
      } else if (file.type.startsWith('image/')) {
        setMediaType('image');
        setMediaFile(file);
        loadImage(file);
      }
    }
  };

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (originalCanvasRef.current) {
          const canvas = originalCanvasRef.current;
          const context = canvas.getContext('2d');
          if (context) {
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            setCurrentFrame(canvas.toDataURL('image/jpeg'));
            enhanceFrame();
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const captureFrame = () => {
    if (videoRef.current && originalCanvasRef.current) {
      const canvas = originalCanvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        setCurrentFrame(canvas.toDataURL('image/jpeg'));
        enhanceFrame();
      }
    }
  };

  const enhanceFrame = () => {
    setIsProcessing(true);
    if (originalCanvasRef.current && enhancedCanvasRef.current) {
      const originalCanvas = originalCanvasRef.current;
      const enhancedCanvas = enhancedCanvasRef.current;
      const enhancedContext = enhancedCanvas.getContext('2d');
      
      if (enhancedContext) {
        enhancedCanvas.width = originalCanvas.width;
        enhancedCanvas.height = originalCanvas.height;
        enhancedContext.drawImage(originalCanvas, 0, 0);
        
        processImage(enhancedContext, enhancedCanvas.width, enhancedCanvas.height, settings);
        setEnhancedFrame(enhancedCanvas.toDataURL('image/jpeg'));
      }
    }
    setIsProcessing(false);
  };

  useEffect(() => {
    if (currentFrame) {
      enhanceFrame();
    }
  }, [settings]);

  const downloadEnhanced = () => {
    if (enhancedFrame && mediaFile) {
      const link = document.createElement('a');
      link.href = enhancedFrame;
      const extension = mediaFile.name.split('.').pop();
      link.download = `enhanced-${mediaFile.name}`;
      link.click();
    }
  };

  const resetSettings = () => {
    setSettings({
      brightness: 0,
      contrast: 0,
      sharpness: 0,
      saturation: 0,
      gamma: 1,
      blur: 0,
      exposure: 0,
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Medical Imaging Enhancement Tool
        </h1>

        <div className="glassmorphism p-8 mb-8">
          <div className="flex items-center gap-4 justify-center flex-wrap">
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 cursor-pointer transition-colors">
              <Upload size={20} />
              Upload File
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {mediaType === 'video' && (
              <button
                onClick={captureFrame}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition-colors"
              >
                <Play size={20} />
                Capture Frame
              </button>
            )}
            {enhancedFrame && (
              <>
                <button
                  onClick={downloadEnhanced}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition-colors"
                >
                  <Download size={20} />
                  Download Enhanced
                </button>
                <button
                  onClick={resetSettings}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 transition-colors"
                >
                  <RefreshCw size={20} />
                  Reset Settings
                </button>
              </>
            )}
          </div>

          {mediaFile && (
            <div className="mt-4 text-center text-sm text-gray-300">
              File: {mediaFile.name}
            </div>
          )}

          {mediaType === 'video' && mediaFile && (
            <video
              ref={videoRef}
              src={URL.createObjectURL(mediaFile)}
              controls
              className="mt-8 max-h-[400px] mx-auto"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glassmorphism p-6">
            <h2 className="text-xl font-semibold mb-4">Original Image</h2>
            <canvas
              ref={originalCanvasRef}
              className="w-full max-h-[400px] object-contain bg-black/30 rounded-lg"
            />
          </div>

          <div className="glassmorphism p-6">
            <h2 className="text-xl font-semibold mb-4">Enhanced Image</h2>
            <div className="relative">
              <canvas
                ref={enhancedCanvasRef}
                className="w-full max-h-[400px] object-contain bg-black/30 rounded-lg"
              />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glassmorphism p-6 mt-8">
          <h2 className="text-xl font-semibold mb-6">Enhancement Controls</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Brightness</label>
              <Slider
                value={[settings.brightness]}
                min={-100}
                max={100}
                step={1}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, brightness: value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contrast</label>
              <Slider
                value={[settings.contrast]}
                min={-100}
                max={100}
                step={1}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, contrast: value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sharpness</label>
              <Slider
                value={[settings.sharpness]}
                min={0}
                max={100}
                step={1}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, sharpness: value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Saturation</label>
              <Slider
                value={[settings.saturation]}
                min={-100}
                max={100}
                step={1}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, saturation: value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gamma</label>
              <Slider
                value={[settings.gamma]}
                min={0.1}
                max={2.5}
                step={0.1}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, gamma: value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Blur</label>
              <Slider
                value={[settings.blur]}
                min={0}
                max={20}
                step={0.5}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, blur: value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Exposure</label>
              <Slider
                value={[settings.exposure]}
                min={-100}
                max={100}
                step={1}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, exposure: value }))
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;