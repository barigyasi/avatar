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

    const drawImage = (src: string, x: number, y: number, width: number, height: number) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        ctx.drawImage(img, x, y, width, height);
      };
    };

    // Scale factor
    const scaleFactor = 2.5;

    // Draw images with adjusted positions and sizes in the correct order
    drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // Background layer
    drawImage(topImage, 75 * scaleFactor, 50 * scaleFactor, 150 * scaleFactor, 150 * scaleFactor); // Top layer (clothes)
    drawImage(headImage, 75 * scaleFactor, 50 * scaleFactor, 150 * scaleFactor, 150 * scaleFactor); // Head layer
    drawImage(eyeImage, 115 * scaleFactor, 100 * scaleFactor, 70 * scaleFactor, 35 * scaleFactor); // Eyes layer
    drawImage(mouthImage, 125 * scaleFactor, 125 * scaleFactor, 50 * scaleFactor, 25 * scaleFactor); // Mouth layer

  }, [eyeImage, mouthImage, headImage, topImage, backgroundImage]);

  return <canvas ref={canvasRef} width={530} height={500} />;
});

AvatarCanvas.displayName = 'AvatarCanvas';

export default AvatarCanvas;
