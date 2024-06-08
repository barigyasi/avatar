import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface AvatarCanvasProps {
  hairStyle: string;
  skinColor: string;
  bodyShape: string;
  mouthShape: string;
  glassesShape: string;
}

const AvatarCanvas = forwardRef(({ hairStyle, skinColor, bodyShape, mouthShape, glassesShape }: AvatarCanvasProps, ref) => {
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

    // Draw body based on the selected shape
    if (bodyShape === 'slim') {
      ctx.fillStyle = skinColor;
      ctx.fillRect(100, 200, 100, 200);
    } else if (bodyShape === 'average') {
      ctx.fillStyle = skinColor;
      ctx.fillRect(75, 200, 150, 200);
    } else if (bodyShape === 'muscular') {
      ctx.fillStyle = skinColor;
      ctx.fillRect(50, 200, 200, 200);
    }

    // Draw face
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(150, 150, 100, 0, Math.PI * 2, true);
    ctx.fill();

    // Draw eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(110, 130, 10, 0, Math.PI * 2, true);
    ctx.arc(190, 130, 10, 0, Math.PI * 2, true);
    ctx.fill();

    // Draw mouth based on the selected shape
    ctx.fillStyle = '#FF0000';
    if (mouthShape === 'smile') {
      ctx.beginPath();
      ctx.arc(150, 180, 50, 0, Math.PI, false);
      ctx.fill();
    } else if (mouthShape === 'sad') {
      ctx.beginPath();
      ctx.arc(150, 220, 50, Math.PI, 0, false);
      ctx.fill();
    } else if (mouthShape === 'neutral') {
      ctx.fillRect(100, 180, 100, 20);
    }

    // Draw glasses based on the selected shape
    if (glassesShape === 'round') {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(110, 130, 20, 0, Math.PI * 2, true);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(190, 130, 20, 0, Math.PI * 2, true);
      ctx.stroke();
    } else if (glassesShape === 'square') {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.strokeRect(90, 110, 40, 40);
      ctx.strokeRect(170, 110, 40, 40);
    } else if (glassesShape === 'none') {
      // No glasses to draw
    }

    // Draw hair based on the selected style
    if (hairStyle === 'short') {
      ctx.fillStyle = '#000';
      ctx.fillRect(75, 50, 150, 60);
    } else if (hairStyle === 'long') {
      ctx.fillStyle = '#000';
      ctx.fillRect(50, 50, 200, 100);
    } else if (hairStyle === 'bald') {
      // No hair to draw
    } else if (hairStyle === 'curly') {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(150, 100, 80, 0, Math.PI * 2, true);
      ctx.fill();
    } else if (hairStyle === 'straight') {
      ctx.fillStyle = '#000';
      ctx.fillRect(60, 50, 180, 90);
    }
  }, [hairStyle, skinColor, bodyShape, mouthShape, glassesShape]);

  return <canvas ref={canvasRef} width={300} height={500} />;
});

AvatarCanvas.displayName = 'AvatarCanvas';

export default AvatarCanvas;
