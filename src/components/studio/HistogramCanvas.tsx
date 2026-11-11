"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStudio } from "@/lib/image-processing/context";
import { calculateHistogram } from "@/lib/image-processing/analysis";
import { HistogramData } from "@/lib/image-processing/types";

export function HistogramCanvas() {
  const { currentImage, previewImage } = useStudio();
  const [activeChannel, setActiveChannel] = useState<"all" | "r" | "g" | "b" | "l">("all");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [histData, setHistData] = useState<HistogramData | null>(null);

  const activeImage = previewImage || currentImage;

  useEffect(() => {
    if (!activeImage) return;
    const data = calculateHistogram(activeImage);
    setHistData(data);
  }, [activeImage]);

  useEffect(() => {
    if (!histData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Warm background
    ctx.fillStyle = "#FAF7F2";
    ctx.fillRect(0, 0, width, height);

    const maxCount = histData.maxCount || 1;
    const barWidth = width / 256;

    const drawChannel = (data: number[], color: string, alpha: number = 0.6) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < 256; i++) {
        const x = i * barWidth;
        const normalized = data[i] / maxCount;
        const y = height - normalized * (height - 10);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;
    };

    if (activeChannel === "all") {
      drawChannel(histData.r, "#E28B82", 0.4);
      drawChannel(histData.g, "#82C192", 0.4);
      drawChannel(histData.b, "#7EAFE6", 0.4);
    } else if (activeChannel === "r") {
      drawChannel(histData.r, "#C94A3C", 0.7);
    } else if (activeChannel === "g") {
      drawChannel(histData.g, "#4C8A59", 0.7);
    } else if (activeChannel === "b") {
      drawChannel(histData.b, "#3B72A8", 0.7);
    } else if (activeChannel === "l") {
      drawChannel(histData.luminance, "#6E635C", 0.7);
    }
  }, [histData, activeChannel]);

  return (
    <div className="bg-white border border-[#EAE2D6] rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-[#2D2623]">
          Color & Intensity Distribution
        </h4>
        <div className="flex items-center gap-1 bg-[#F5EFEB] p-0.5 rounded-lg text-[11px]">
          {(["all", "r", "g", "b", "l"] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`px-2 py-0.5 rounded-md font-medium uppercase transition-colors ${
                activeChannel === ch
                  ? "bg-white text-[#B8533C] shadow-xs"
                  : "text-[#7A706A] hover:text-[#2D2623]"
              }`}
            >
              {ch === "all" ? "RGB" : ch}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-36 rounded-xl overflow-hidden border border-[#EAE2D6]/70">
        <canvas
          ref={canvasRef}
          width={512}
          height={180}
          className="w-full h-full object-fill"
        />
      </div>

      <div className="flex justify-between items-center text-[10px] text-[#9E948D] mt-1.5 px-1">
        <span>0 (Shadows)</span>
        <span>128 (Midtones)</span>
        <span>255 (Highlights)</span>
      </div>
    </div>
  );
}
