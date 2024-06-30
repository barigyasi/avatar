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

      const scaleToFit = (imgWidth: number, imgHeight: number) => {
        const aspectRatio = imgWidth / imgHeight;
        if (canvasWidth / aspectRatio < canvasHeight) {
          return { width: canvasWidth, height: canvasWidth / aspectRatio };
        } else {
          return { width: canvasHeight * aspectRatio, height: canvasHeight };
        }
      };

      const backgroundSize = scaleToFit(images[0].width, images[0].height);
      const topImageSize = scaleToFit(images[1].width, images[1].height);
      const chainSize = scaleToFit(images[2].width, images[2].height);
      const headSize = scaleToFit(images[3].width, images[3].height);
      const eyeSize = scaleToFit(images[4].width, images[4].height);
      const mouthSize = scaleToFit(images[5].width, images[5].height);
      const glassesSize = scaleToFit(images[6].width, images[6].height);

      // Coordinates zeroed out
      const coords = {
        topImageX: 0, 
        topImageY: 0, 
        headX: 0, 
        headY: 0, 
        eyeX: 0, 
        eyeY: 0, 
        mouthX: 0, 
        mouthY: 0, 
        chainX: 0, 
        chainY: 0, 
        glassesX: 0, 
        glassesY: 0 
      };

      // Drawing images with scaling to fit the canvas
      ctx.drawImage(images[0], coords.topImageX, coords.topImageY, backgroundSize.width, backgroundSize.height); // Background layer
      ctx.drawImage(images[1], coords.topImageX, coords.topImageY, topImageSize.width, topImageSize.height); // Top layer (clothes)
      ctx.drawImage(images[2], coords.chainX, coords.chainY, chainSize.width, chainSize.height); // Chains layer
      ctx.drawImage(images[3], coords.headX, coords.headY, headSize.width, headSize.height); // Head layer
      ctx.drawImage(images[4], coords.eyeX, coords.eyeY, eyeSize.width, eyeSize.height); // Eyes layer
      ctx.drawImage(images[5], coords.mouthX, coords.mouthY, mouthSize.width, mouthSize.height); // Mouth layer
      ctx.drawImage(images[6], coords.glassesX, coords.glassesY, glassesSize.width, glassesSize.height); // Glasses layer

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
