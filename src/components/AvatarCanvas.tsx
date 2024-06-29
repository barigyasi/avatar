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

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Recorded coordinates
      const coords = {
        topImageX: 0, // Update with your final value
        topImageY: -0, // Update with your final value
        headX: 0, // Update with your final value
        headY: 40, // Update with your final value
        eyeX: 0, // Update with your final value
        eyeY: 80, // Update with your final value
        mouthX: 0, // Update with your final value
        mouthY: 60 // Update with your final value
      };

      const headWidth = 200 * scaleFactor;
      const headHeight = 200 * scaleFactor;
      const headX = (canvasWidth - headWidth) / 2 + coords.headX;
      const headY = (canvasHeight - headHeight) / 2 + coords.headY;

      const topImageWidth = 200 * scaleFactor;
      const topImageHeight = 200 * scaleFactor;
      const topImageX = (canvasWidth - topImageWidth) / 2 + coords.topImageX;
      const topImageY = canvasHeight - topImageHeight + coords.topImageY;

      ctx.drawImage(images[0], 0, 0, canvas.width, canvas.height); // Background layer
      ctx.drawImage(images[1], topImageX, topImageY, topImageWidth, topImageHeight); // Top layer (clothes)
      ctx.drawImage(images[2], headX, headY, headWidth, headHeight); // Head layer

      // Eyes layer with increased size and adjusted position
      const eyeOriginalWidth = 90 * scaleFactor;
      const eyeOriginalHeight = 55 * scaleFactor;
      const eyeWidth = eyeOriginalWidth * eyeScaleFactor;
      const eyeHeight = eyeOriginalHeight * eyeScaleFactor;
      const eyeX = headX + (headWidth - eyeWidth) / 2 + coords.eyeX;
      const eyeY = headY + 40 + coords.eyeY; // Adjusted y position

      ctx.drawImage(images[3], eyeX, eyeY, eyeWidth, eyeHeight); 

      // Mouth layer with increased size and adjusted position
      const mouthOriginalWidth = 70 * scaleFactor;
      const mouthOriginalHeight = 45 * scaleFactor;
      const mouthWidth = mouthOriginalWidth * mouthScaleFactor;
      const mouthHeight = mouthOriginalHeight * mouthScaleFactor;
      const mouthX = headX + (headWidth - mouthWidth) / 2 + coords.mouthX;
      const mouthY = headY + 90 + coords.mouthY; // Adjusted y position

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
