"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { useStudio } from "@/lib/image-processing/context";
import {
  detectDocumentCorners,
  applyPerspectiveWarp,
  applyDocumentEnhance,
} from "@/lib/image-processing/scanner";
import { applyAdaptiveThreshold, applyGrayscale } from "@/lib/image-processing/editor";

interface CornerPoint {
  x: number;
  y: number;
}

export default function DocumentScannerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  const cleanCanvasRef = useRef<HTMLCanvasElement>(null);

  const {
    currentImage,
    originalImage,
    applyStep,
    downloadImage,
    loadImageFromFile,
    loadImageFromUrl,
  } = useStudio();

  // Progress state
  const [activeStep, setActiveStep] = useState<number>(3); // 1: Upload, 2: Adjust corners, 3: Enhance, 4: Download
  const [colorMode, setColorMode] = useState<"bw" | "grayscale" | "color">("bw");
  const [blockSize, setBlockSize] = useState<number>(11);
  const [constantC, setConstantC] = useState<number>(2);

  // Corner handles (proportional 0 to 1)
  const [corners, setCorners] = useState<{
    tl: CornerPoint;
    tr: CornerPoint;
    br: CornerPoint;
    bl: CornerPoint;
  }>({
    tl: { x: 0.08, y: 0.08 },
    tr: { x: 0.92, y: 0.08 },
    br: { x: 0.92, y: 0.92 },
    bl: { x: 0.08, y: 0.92 },
  });

  const activeImage = currentImage || originalImage;

  // Load sample document if needed
  const handleLoadDocSample = async () => {
    await loadImageFromUrl("/samples/document.jpg", "field-notes.jpg");
  };

  // Render "Your photo" with corner markers
  useEffect(() => {
    if (!activeImage || !photoCanvasRef.current) return;
    const canvas = photoCanvasRef.current;
    canvas.width = activeImage.width;
    canvas.height = activeImage.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw base photo
    ctx.putImageData(activeImage, 0, 0);

    // Draw perspective quad overlay
    const w = canvas.width;
    const h = canvas.height;
    const pTL = { x: corners.tl.x * w, y: corners.tl.y * h };
    const pTR = { x: corners.tr.x * w, y: corners.tr.y * h };
    const pBR = { x: corners.br.x * w, y: corners.br.y * h };
    const pBL = { x: corners.bl.x * w, y: corners.bl.y * h };

    ctx.strokeStyle = "#B8533C";
    ctx.lineWidth = Math.max(3, Math.round(w / 300));
    ctx.beginPath();
    ctx.moveTo(pTL.x, pTL.y);
    ctx.lineTo(pTR.x, pTR.y);
    ctx.lineTo(pBR.x, pBR.y);
    ctx.lineTo(pBL.x, pBL.y);
    ctx.closePath();
    ctx.stroke();

    // Semi-transparent warm fill
    ctx.fillStyle = "rgba(184, 83, 60, 0.08)";
    ctx.fill();

    // Corner handle circles
    const handleRadius = Math.max(8, Math.round(w / 120));
    [pTL, pTR, pBR, pBL].forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, handleRadius, 0, 2 * Math.PI);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.strokeStyle = "#B8533C";
      ctx.lineWidth = Math.max(3, Math.round(handleRadius / 3));
      ctx.stroke();
    });
  }, [activeImage, corners]);

  // Compute "Clean preview"
  useEffect(() => {
    if (!activeImage || !cleanCanvasRef.current) return;

    try {
      // Perspective warp using corners
      const detectedCorners = {
        topLeft: { x: corners.tl.x * activeImage.width, y: corners.tl.y * activeImage.height },
        topRight: { x: corners.tr.x * activeImage.width, y: corners.tr.y * activeImage.height },
        bottomRight: { x: corners.br.x * activeImage.width, y: corners.br.y * activeImage.height },
        bottomLeft: { x: corners.bl.x * activeImage.width, y: corners.bl.y * activeImage.height },
      };

      let cleaned = applyPerspectiveWarp(activeImage, detectedCorners);

      if (colorMode === "bw") {
        cleaned = applyAdaptiveThreshold(cleaned, blockSize);
      } else if (colorMode === "grayscale") {
        cleaned = applyGrayscale(cleaned);
      } else {
        cleaned = applyDocumentEnhance(cleaned, "color");
      }

      const canvas = cleanCanvasRef.current;
      canvas.width = cleaned.width;
      canvas.height = cleaned.height;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.putImageData(cleaned, 0, 0);
    } catch (e) {
      console.error("Scanner preview error:", e);
    }
  }, [activeImage, corners, colorMode, blockSize, constantC]);

  const handleApplyScan = () => {
    if (!activeImage) return;

    const detectedCorners = {
      topLeft: { x: corners.tl.x * activeImage.width, y: corners.tl.y * activeImage.height },
      topRight: { x: corners.tr.x * activeImage.width, y: corners.tr.y * activeImage.height },
      bottomRight: { x: corners.br.x * activeImage.width, y: corners.br.y * activeImage.height },
      bottomLeft: { x: corners.bl.x * activeImage.width, y: corners.bl.y * activeImage.height },
    };

    let cleaned = applyPerspectiveWarp(activeImage, detectedCorners);

    if (colorMode === "bw") {
      cleaned = applyAdaptiveThreshold(cleaned, blockSize);
    } else if (colorMode === "grayscale") {
      cleaned = applyGrayscale(cleaned);
    } else {
      cleaned = applyDocumentEnhance(cleaned, "color");
    }

    applyStep(
      `Clean Document Scan (${colorMode.toUpperCase()})`,
      "scanner",
      "scan_enhance",
      { colorMode, blockSize, constantC },
      cleaned
    );
  };

  const handleDownloadScan = () => {
    handleApplyScan();
    downloadImage("png", 95, "document-scan");
  };

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader breadcrumb="Your studio / Document scanner" />

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            loadImageFromFile(e.target.files[0]);
          }
        }}
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
      />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6 pb-16">
        {/* Title Bar - Figma 6:167 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              From a quick snap to a clean page.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              A few gentle steps. A document that’s easier to read.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadDocSample}
              className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98]"
            >
              Try document sample
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98]"
            >
              Replace document
            </button>
          </div>
        </div>

        {/* Scanner Progress Stepper (Figma 6:559) */}
        <div className="bg-white rounded-2xl border border-[#EAE2D6] p-3 sm:p-4 shadow-soft">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 items-center">
            {/* Step 1: Upload */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FAF1EE] text-[#B8533C] border border-[#EEC7BC] flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#2D2623]">Upload</span>
            </div>

            {/* Step 2: Adjust corners */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FAF1EE] text-[#B8533C] border border-[#EEC7BC] flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#2D2623]">Adjust corners</span>
            </div>

            {/* Step 3: Enhance (Active) */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#B8533C] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                3
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#B8533C]">Enhance</span>
            </div>

            {/* Step 4: Download */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F5EFEB] text-[#7A706A] border border-[#EAE2D6] flex items-center justify-center font-medium text-xs">
                4
              </div>
              <span className="text-xs sm:text-sm font-medium text-[#7A706A]">Download</span>
            </div>
          </div>
        </div>

        {/* Dual Layout: Document Comparison (Left) + Enhancement Settings (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Side-by-Side Comparison (Figma 6:572) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Photo with Draggable Corners */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#7A706A]">Your photo</div>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EAE2D6] flex items-center justify-center shadow-xs">
                  <canvas ref={photoCanvasRef} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#46654F] font-semibold pt-1">
                  <span>✓</span>
                  <span>4 corners confirmed</span>
                </div>
              </div>

              {/* Clean Preview */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#7A706A]">Clean preview</div>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white border border-[#EAE2D6] flex items-center justify-center shadow-card">
                  <canvas ref={cleanCanvasRef} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="text-xs text-[#7A706A] pt-1">
                  Perspective corrected · {colorMode === "bw" ? "B&W" : colorMode === "grayscale" ? "Grayscale" : "Color"}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Scan Enhancement Settings (Figma 6:602) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                Keep the important bits.
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Choose how your page should look.
              </p>
            </div>

            {/* Color Mode Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="scan-color-mode" className="text-xs font-semibold text-[#8A8077]">
                Color mode
              </label>
              <div className="relative">
                <select
                  id="scan-color-mode"
                  value={colorMode}
                  onChange={(e) => setColorMode(e.target.value as any)}
                  className="w-full appearance-none bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#2D2623] focus:outline-none focus:border-[#B8533C] cursor-pointer"
                >
                  <option value="bw">Black & white</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="color">Enhanced color</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8077]">
                  ▼
                </span>
              </div>
            </div>

            {/* Adaptive Threshold Explanation & Parameters (Figma 6:609) */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="text-xs font-semibold text-[#2D2623]">Adaptive threshold</div>
                <p className="text-[11px] text-[#7A706A] mt-0.5 leading-relaxed">
                  Keeps text readable under uneven light.
                </p>
              </div>

              {/* Block size & Constant Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl space-y-1">
                  <div className="text-[11px] font-semibold text-[#7A706A]">Block size</div>
                  <div className="font-serif font-bold text-2xl text-[#2D2623]">{blockSize}</div>
                  <input
                    type="range"
                    min={5}
                    max={35}
                    step={2}
                    value={blockSize}
                    onChange={(e) => setBlockSize(parseInt(e.target.value))}
                    className="w-full accent-[#B8533C]"
                    title="Block size"
                  />
                </div>

                <div className="p-3.5 bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl space-y-1">
                  <div className="text-[11px] font-semibold text-[#7A706A]">Constant</div>
                  <div className="font-serif font-bold text-2xl text-[#2D2623]">{constantC}</div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={constantC}
                    onChange={(e) => setConstantC(parseInt(e.target.value))}
                    className="w-full accent-[#B8533C]"
                    title="Constant"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons (Figma 6:617 & 6:619) */}
            <div className="space-y-2 pt-2 border-t border-[#EAE2D6]/70">
              <button
                onClick={handleApplyScan}
                className="w-full bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs"
              >
                Update preview
              </button>

              <button
                onClick={handleDownloadScan}
                className="w-full bg-[#B8533C] hover:bg-[#A1422E] text-white py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-1.5"
              >
                <span>Download scan</span>
                <span>↓</span>
              </button>
            </div>

            <div className="text-center space-y-1 pt-1">
              <div className="text-[11px] text-[#A69D95]">PNG image · OCR not included</div>
              <div className="text-xs text-[#7A706A]">
                Need to refine the crop?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCorners({
                      tl: { x: 0.05, y: 0.05 },
                      tr: { x: 0.95, y: 0.05 },
                      br: { x: 0.95, y: 0.95 },
                      bl: { x: 0.05, y: 0.95 },
                    });
                  }}
                  className="text-[#B8533C] font-semibold hover:underline"
                >
                  ← Adjust corners
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scanner Fallback Guidance Card (Figma 6:624) */}
        <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-3xl p-5 sm:p-6 space-y-2 shadow-xs">
          <h3 className="font-serif font-bold text-base text-[#2D2623]">
            A little help with tricky pages
          </h3>
          <p className="text-xs sm:text-sm text-[#7A706A] leading-relaxed">
            If the corners don’t look right, go back and drag each handle to the edge of your
            document. For your next scan, use even light and keep the whole page in view.
          </p>
        </div>
      </main>
    </div>
  );
}
