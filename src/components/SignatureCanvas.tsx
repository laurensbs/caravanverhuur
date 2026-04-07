'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';

interface SignatureCanvasProps {
  onSignature: (dataUrl: string | null) => void;
  label?: string;
  clearLabel?: string;
  width?: number;
  height?: number;
}

export default function SignatureCanvas({ onSignature, label, clearLabel, width = 360, height = 160 }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return ctx;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Set canvas resolution to match CSS size for sharp rendering
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      // Fill white background so canvas is visible
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0F172A';
    }
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (!hasDrawn) setHasDrawn(true);
  };

  const stopDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isDrawing) {
      setIsDrawing(false);
      // Export signature
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        onSignature(canvas.toDataURL('image/png', 0.8));
      }
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
    onSignature(null);
  };

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-foreground mb-2">{label}</label>}
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-black/5" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${height}px`, cursor: 'crosshair' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-gray-300 font-medium">✍️</span>
          </div>
        )}
      </div>
      {hasDrawn && (
        <button
          type="button"
          onClick={clear}
          className="mt-2 flex items-center gap-1.5 text-xs text-red-500 font-medium cursor-pointer hover:text-red-700 transition"
        >
          <Trash2 size={12} /> {clearLabel || 'Wissen'}
        </button>
      )}
    </div>
  );
}
