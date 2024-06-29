import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface AvatarCanvasProps {
  eyeImage: string;
  mouthImage: string;
  headImage: string;
  topImage: string;
  backgroundImage: string;
}

const AvatarCanvas = forwardRef(({ eyeImage, mouthImage, headImage, topImage, backgroundImage }: AvatarCanvasProps, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    takeScreenshot: async () => {
      if (canvasRef.current) {
        const canvasElement = canvasRef.current;
        const dataUrl = canvasElement.toDataURL("image/png");
        return dataUrl;
      }
      return null;
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load and draw images in sequence to ensure correct layering
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      });
    };

    const drawImages = async () => {
      const scaleFactor = 2.5;
      const images = await Promise.all([
        loadImage(backgroundImage),
        loadImage(topImage),
        loadImage(headImage),
        loadImage(eyeImage),
        loadImage(mouthImage)
      ]);

      ctx.drawImage(images[0], 0, 0, canvas.width, canvas.height); // Background layer
      ctx.drawImage(images[1], 75 * scaleFactor, 50 * scaleFactor, 150 * scaleFactor, 150 * scaleFactor); // Top layer (clothes)
      ctx.drawImage(images[2], 75 * scaleFactor, 50 * scaleFactor, 150 * scaleFactor, 150 * scaleFactor); // Head layer
      ctx.drawImage(images[3], 115 * scaleFactor, 100 * scaleFactor, 70 * scaleFactor, 35 * scaleFactor); // Eyes layer
      ctx.drawImage(images[4], 125 * scaleFactor, 125 * scaleFactor, 50 * scaleFactor, 25 * scaleFactor); // Mouth layer
    };

    drawImages();
  }, [eyeImage, mouthImage, headImage, topImage, backgroundImage]);

  return (
    <div className="avatar-canvas-wrapper w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
      <canvas ref={canvasRef} className="w-full h-auto" width={530} height={500} />
    </div>
  );
});

AvatarCanvas.displayName = 'AvatarCanvas';

export default AvatarCanvas;
