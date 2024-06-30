import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface AvatarCanvasProps {
  eyeImage: string;
  mouthImage: string;
  headImage: string;
  topImage: string;
  backgroundImage: string;
  chainImage: string;
  glassesImage: string;
}

const AvatarCanvas = forwardRef(({ eyeImage, mouthImage, headImage, topImage, backgroundImage, chainImage, glassesImage }: AvatarCanvasProps, ref) => {
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

      // Recorded coordinates
      const coords = {
        topImageX: 0, // Update with your final value
        topImageY: 155, // Update with your final value
        headX: 0, // Update with your final value
        headY: 20, // Update with your final value
        eyeX: 0, // Update with your final value
        eyeY: 80, // Update with your final value
        mouthX: 0, // Update with your final value
        mouthY: 100, // Update with your final value
        chainX: 0, // Update with your final value
        chainY: 150, // Update with your final value
        glassesX: 0, // Update with your final value
        glassesY: 90 // Update with your final value
      };

      const headWidth = 200 * scaleFactor;
      const headHeight = 200 * scaleFactor;
      let headX = (canvasWidth - headWidth) / 2 + coords.headX;
      let headY = (canvasHeight - headHeight) / 2 + coords.headY;

      // Adjust headY for rabbit heads
      if (headImage.includes('rabbit')) {
        headY -= 30; // Adjust this value as needed
      }

      const topImageWidth = 200 * scaleFactor;
      const topImageHeight = 200 * scaleFactor;
      const topImageX = (canvasWidth - topImageWidth) / 2 + coords.topImageX;
      const topImageY = canvasHeight - topImageHeight + coords.topImageY;

      ctx.drawImage(images[0], 0, 0, canvas.width, canvas.height); // Background layer
      ctx.drawImage(images[1], topImageX, topImageY, topImageWidth, topImageHeight); // Top layer (clothes)

      // Chains layer with adjusted position
      const chainWidth = 200 * scaleFactor;
      const chainHeight = 200 * scaleFactor;
      const chainX = (canvasWidth - chainWidth) / 2 + coords.chainX;
      const chainY = canvasHeight - chainHeight + coords.chainY;
      ctx.drawImage(images[2], chainX, chainY, chainWidth, chainHeight);

      ctx.drawImage(images[3], headX, headY, headWidth, headHeight); // Head layer

      // Eyes layer with increased size and adjusted position
      const eyeOriginalWidth = 90 * scaleFactor;
      const eyeOriginalHeight = 55 * scaleFactor;
      const eyeWidth = eyeOriginalWidth * eyeScaleFactor;
      const eyeHeight = eyeOriginalHeight * eyeScaleFactor;
      const eyeX = headX + (headWidth - eyeWidth) / 2 + coords.eyeX;
      let eyeY = headY + 40 + coords.eyeY; // Adjusted y position

      // Adjust eyeY for rabbit heads
      if (headImage.includes('rabbit')) {
        eyeY += 10; // Adjust this value as needed
      }

      ctx.drawImage(images[4], eyeX, eyeY, eyeWidth, eyeHeight);

      // Mouth layer with increased size and adjusted position
      const mouthOriginalWidth = 70 * scaleFactor;
      const mouthOriginalHeight = 45 * scaleFactor;
      const mouthWidth = mouthOriginalWidth * mouthScaleFactor;
      const mouthHeight = mouthOriginalHeight * mouthScaleFactor;
      const mouthX = headX + (headWidth - mouthWidth) / 2 + coords.mouthX;
      let mouthY = headY + 90 + coords.mouthY; // Adjusted y position

      // Adjust mouthY for rabbit heads
      if (headImage.includes('rabbit')) {
        mouthY += 30; // Adjust this value as needed
      }

      ctx.drawImage(images[5], mouthX, mouthY, mouthWidth, mouthHeight);

      // Glasses layer with adjusted position and scale
      const glassesOriginalWidth = 70 * scaleFactor;
      const glassesOriginalHeight = 45 * scaleFactor;
      const glassesWidth = glassesOriginalWidth * glassesScaleFactor;
      const glassesHeight = glassesOriginalHeight * glassesScaleFactor;
      const glassesX = headX + (headWidth - glassesWidth) / 2 + coords.glassesX;
      let glassesY = headY + 30 + coords.glassesY; // Adjusted y position

      // Adjust glassesY for rabbit heads
      if (headImage.includes('rabbit')) {
        glassesY += 10; // Adjust this value as needed
      }

      ctx.drawImage(images[6], glassesX, glassesY, glassesWidth, glassesHeight);
    };

    drawImages();
  }, [eyeImage, mouthImage, headImage, topImage, backgroundImage, chainImage, glassesImage]);

  return (
    <div className="avatar-canvas-wrapper w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
      <canvas ref={canvasRef} className="w-full h-auto" width={530} height={500} />
    </div>
  );
});

AvatarCanvas.displayName = 'AvatarCanvas';

export default AvatarCanvas;
