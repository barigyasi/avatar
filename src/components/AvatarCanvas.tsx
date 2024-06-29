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
      const eyeScaleFactor = 1.5; // Adjusted scale factor for the eyes
      const mouthScaleFactor = 2.5; // Adjusted scale factor for the mouth

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

      // Eyes layer with increased size and adjusted position
      const eyeOriginalX = 115 * scaleFactor;
      const eyeOriginalY = 100 * scaleFactor;
      const eyeOriginalWidth = 70 * scaleFactor;
      const eyeOriginalHeight = 35 * scaleFactor;
      const eyeX = eyeOriginalX - (eyeScaleFactor - 1) * eyeOriginalWidth / 2;
      const eyeY = eyeOriginalY - (eyeScaleFactor - 1) * eyeOriginalHeight / 2;
      const eyeWidth = eyeOriginalWidth * eyeScaleFactor;
      const eyeHeight = eyeOriginalHeight * eyeScaleFactor;
      ctx.drawImage(images[3], eyeX, eyeY, eyeWidth, eyeHeight); 

      // Mouth layer with increased size and adjusted position
      const mouthOriginalX = 125 * scaleFactor;
      const mouthOriginalY = 125 * scaleFactor;
      const mouthOriginalWidth = 50 * scaleFactor;
      const mouthOriginalHeight = 25 * scaleFactor;
      const mouthX = mouthOriginalX - (mouthScaleFactor - 1) * mouthOriginalWidth / 2;
      const mouthY = mouthOriginalY - (mouthScaleFactor - 1) * mouthOriginalHeight / 2;
      const mouthWidth = mouthOriginalWidth * mouthScaleFactor;
      const mouthHeight = mouthOriginalHeight * mouthScaleFactor;
      ctx.drawImage(images[4], mouthX, mouthY, mouthWidth, mouthHeight); 
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
