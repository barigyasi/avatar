import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface AvatarCanvasProps {
  eyeImage: string;
  mouthImage: string;
  headImage: string;
  topImage: string;
  backgroundImage: string;
  chainImage: string;
  glassesImage: string;
  setLoading: (loading: boolean) => void;
}

const AvatarCanvas = forwardRef(({ eyeImage, mouthImage, headImage, topImage, backgroundImage, chainImage, glassesImage, setLoading }: AvatarCanvasProps, ref) => {
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

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      });
    };

    const drawImages = async () => {
      setLoading(true);  // Notify the parent component that loading has started
      const scaleFactor = 2.5;
      const eyeScaleFactor = 1.5; // Adjusted scale factor for the eyes
      const mouthScaleFactor = 2.5; // Adjusted scale factor for the mouth
      const glassesScaleFactor = 2.0; // Adjusted scale factor for the glasses

      const images = await Promise.all([
        loadImage(backgroundImage),
        loadImage(topImage),
        loadImage(chainImage),
        loadImage(headImage),
        loadImage(eyeImage),
        loadImage(mouthImage),
        loadImage(glassesImage)
      ]);

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const coords = {
        topImageX: 0, 
        topImageY: 155, 
        headX: 0, 
        headY: 20, 
        eyeX: 0, 
        eyeY: 80, 
        mouthX: 0, 
        mouthY: 100, 
        chainX: 0, 
        chainY: 150, 
        glassesX: 0, 
        glassesY: 90 
      };

      const headWidth = 200 * scaleFactor;
      const headHeight = 200 * scaleFactor;
      let headX = (canvasWidth - headWidth) / 2 + coords.headX;
      let headY = (canvasHeight - headHeight) / 2 + coords.headY;

      if (headImage.includes('rabbit')) {
        headY -= 30;
      }

      const topImageWidth = 200 * scaleFactor;
      const topImageHeight = 200 * scaleFactor;
      const topImageX = (canvasWidth - topImageWidth) / 2 + coords.topImageX;
      const topImageY = canvasHeight - topImageHeight + coords.topImageY;

      ctx.drawImage(images[0], 0, 0, canvas.width, canvas.height);
      ctx.drawImage(images[1], topImageX, topImageY, topImageWidth, topImageHeight);

      const chainWidth = 200 * scaleFactor;
      const chainHeight = 200 * scaleFactor;
      const chainX = (canvasWidth - chainWidth) / 2 + coords.chainX;
      const chainY = canvasHeight - chainHeight + coords.chainY;
      ctx.drawImage(images[2], chainX, chainY, chainWidth, chainHeight);

      ctx.drawImage(images[3], headX, headY, headWidth, headHeight);

      const eyeOriginalWidth = 90 * scaleFactor;
      const eyeOriginalHeight = 55 * scaleFactor;
      const eyeWidth = eyeOriginalWidth * eyeScaleFactor;
      const eyeHeight = eyeOriginalHeight * eyeScaleFactor;
      const eyeX = headX + (headWidth - eyeWidth) / 2 + coords.eyeX;
      let eyeY = headY + 40 + coords.eyeY;

      if (headImage.includes('rabbit')) {
        eyeY += 10;
      }

      ctx.drawImage(images[4], eyeX, eyeY, eyeWidth, eyeHeight);

      const mouthOriginalWidth = 70 * scaleFactor;
      const mouthOriginalHeight = 45 * scaleFactor;
      const mouthWidth = mouthOriginalWidth * mouthScaleFactor;
      const mouthHeight = mouthOriginalHeight * mouthScaleFactor;
      const mouthX = headX + (headWidth - mouthWidth) / 2 + coords.mouthX;
      let mouthY = headY + 90 + coords.mouthY;

      if (headImage.includes('rabbit')) {
        mouthY += 30;
      }

      ctx.drawImage(images[5], mouthX, mouthY, mouthWidth, mouthHeight);

      const glassesOriginalWidth = 70 * scaleFactor;
      const glassesOriginalHeight = 45 * scaleFactor;
      const glassesWidth = glassesOriginalWidth * glassesScaleFactor;
      const glassesHeight = glassesOriginalHeight * glassesScaleFactor;
      const glassesX = headX + (headWidth - glassesWidth) / 2 + coords.glassesX;
      let glassesY = headY + 30 + coords.glassesY;

      if (headImage.includes('rabbit')) {
        glassesY += 10;
      }

      ctx.drawImage(images[6], glassesX, glassesY, glassesWidth, glassesHeight);
      setLoading(false);  // Notify the parent component that loading has ended
    };

    drawImages();
  }, [eyeImage, mouthImage, headImage, topImage, backgroundImage, chainImage, glassesImage]);

  return (
    <div className="avatar-canvas-wrapper w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl relative">
      <canvas ref={canvasRef} className="w-full h-auto" width={530} height={500} />
    </div>
  );
});

AvatarCanvas.displayName = 'AvatarCanvas';

export default AvatarCanvas;
