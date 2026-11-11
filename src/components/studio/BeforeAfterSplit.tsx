"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Undo, Redo, ZoomIn, Maximize2 } from "lucide-react";
import { useStudio } from "@/lib/image-processing/context";

interface BeforeAfterSplitProps {
  className?: string;
  showToolbar?: boolean;
}

export function BeforeAfterSplit({ className, showToolbar = true }: BeforeAfterSplitProps) {
  const {
    originalImage,
    currentImage,
    previewImage,
    metadata,
    undo,
    redo,
    canUndo,
    canRedo,
    isLoading,
  } = useStudio();

  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoomMode, setZoomMode] = useState<"fit" | "fill" | "100%">("fit");

  const containerRef = useRef<HTMLDivElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const modifiedCanvasRef = useRef<HTMLCanvasElement>(null);

  // Active modified image (preview takes precedence if active)
  const activeModified = previewImage || currentImage;

  // Render ImageData into canvases
  useEffect(() => {
    if (!originalImage || !originalCanvasRef.current) return;
    const canvas = originalCanvasRef.current;
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.putImageData(originalImage, 0, 0);
    }
  }, [originalImage]);

  useEffect(() => {
    if (!activeModified || !modifiedCanvasRef.current) return;
    const canvas = modifiedCanvasRef.current;
    canvas.width = activeModified.width;
    canvas.height = activeModified.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.putImageData(activeModified, 0, 0);
    }
  }, [activeModified]);

  // Handle Dragging
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className={`flex flex-col w-full ${className || ""}`}>
      {/* Top Toolbar */}
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          {/* File details */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[#2D2623]">
              {metadata.name}
            </span>
            <span className="text-xs text-[#8A8077]">
              {metadata.width} × {metadata.height} px · {metadata.format}
            </span>
          </div>

          {/* Controls: Undo, Redo, Zoom */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EAE2D6] bg-white text-xs font-medium text-[#4A403A] hover:bg-[#F5EFEB] disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xs"
              title="Undo last step"
            >
              <Undo size={13} />
              <span>Undo</span>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EAE2D6] bg-white text-xs font-medium text-[#4A403A] hover:bg-[#F5EFEB] disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xs"
              title="Redo step"
            >
              <Redo size={13} />
              <span>Redo</span>
            </button>
            <div className="relative">
              <select
                value={zoomMode}
                onChange={(e) => setZoomMode(e.target.value as any)}
                aria-label="Image display scale"
                className="appearance-none bg-white border border-[#EAE2D6] rounded-xl px-3 py-1.5 pr-6 text-xs font-medium text-[#4A403A] hover:bg-[#F5EFEB] cursor-pointer shadow-xs focus:outline-none"
              >
                <option value="fit">Fit</option>
                <option value="fill">Fill</option>
                <option value="100%">100%</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#8A8077]">
                ▼
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Split Viewer Container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-[#EFE8DF]/70 border border-[#EAE2D6] shadow-card aspect-[4/3] max-h-[560px] select-none cursor-ew-resize"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FAF7F2]/80 z-30">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#B8533C] border-t-transparent animate-spin" />
              <span className="text-xs text-[#7A706A]">Loading image...</span>
            </div>
          </div>
        )}

        {/* Right layer: Modified / Edit Canvas (Full width underlying layer) */}
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <canvas
            ref={modifiedCanvasRef}
            className={`max-w-full max-h-full rounded-xl transition-transform ${
              zoomMode === "fill"
                ? "w-full h-full object-cover"
                : zoomMode === "100%"
                ? "object-none"
                : "object-contain"
            }`}
          />
        </div>

        {/* Left layer: Original Canvas (Clipped by slider position) */}
        <div
          className="absolute inset-0 overflow-hidden flex items-center justify-center p-2 pointer-events-none"
          style={{ width: `${sliderPos}%` }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center p-2"
            style={{ width: containerRef.current?.clientWidth || "100%" }}
          >
            <canvas
              ref={originalCanvasRef}
              className={`max-w-full max-h-full rounded-xl transition-transform ${
                zoomMode === "fill"
                  ? "w-full h-full object-cover"
                  : zoomMode === "100%"
                  ? "object-none"
                  : "object-contain"
              }`}
            />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/90 text-[#4A403A] backdrop-blur-xs shadow-xs border border-white/40">
            Original
          </span>
        </div>
        <div className="absolute top-4 right-4 z-20 pointer-events-none">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/90 text-[#4A403A] backdrop-blur-xs shadow-xs border border-white/40">
            Your edit
          </span>
        </div>

        {/* Vertical Divider Line */}
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="w-[2px] h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.25)] -ml-[1px]" />
          {/* Circular Handle */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 rounded-full bg-white border border-[#EAE2D6] shadow-elevated flex items-center justify-center text-[#B8533C] text-xs font-bold pointer-events-auto cursor-ew-resize hover:scale-105 active:scale-95 transition-transform">
            ⟷
          </div>
        </div>
      </div>

      {/* Reassuring caption below preview */}
      <div className="mt-2 text-center text-xs text-[#8A8077]">
        Drag to compare. Your original stays untouched.
      </div>
    </div>
  );
}
