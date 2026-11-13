"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { useStudio } from "@/lib/image-processing/context";

export default function ExportCenterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const {
    currentImage,
    originalImage,
    metadata,
    history,
    downloadImage,
    loadImageFromFile,
  } = useStudio();

  const [fileName, setFileName] = useState<string>("cosmos-edited");
  const [selectedFormat, setSelectedFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const activeImage = currentImage || originalImage;

  // Render preview canvas
  useEffect(() => {
    if (!activeImage || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    canvas.width = activeImage.width;
    canvas.height = activeImage.height;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.putImageData(activeImage, 0, 0);
  }, [activeImage]);

  const lastStep = history.length > 1 ? history[history.length - 1] : null;

  const handleDownload = () => {
    setIsDownloading(true);
    downloadImage(selectedFormat, 92, fileName);
    setTimeout(() => {
      setIsDownloading(false);
    }, 600);
  };

  const formatExt = selectedFormat === "jpeg" ? ".jpg" : `.${selectedFormat}`;

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader breadcrumb="Your studio / Export center" />

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            loadImageFromFile(e.target.files[0]);
            router.push("/studio/editor");
          }
        }}
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
      />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8 pb-16">
        {/* Title Bar - Figma 3:8 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              A little brighter. All yours.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              Give your image a home outside the studio.
            </p>
          </div>

          <Link
            href="/studio/editor"
            className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs self-start"
          >
            ← Back to editing
          </Link>
        </div>

        {/* Dual Layout: Preview (Left) + Export Settings (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Final Image Preview (Figma 3:313) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EAE2D6] flex items-center justify-center shadow-xs">
              <canvas ref={previewCanvasRef} className="max-w-full max-h-full object-contain" />
            </div>

            <div className="space-y-1.5 pt-1">
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                {fileName} · a little more sunshine
              </h3>
              <p className="text-xs text-[#7A706A]">
                {metadata.width} × {metadata.height} px · Original dimensions
              </p>

              {lastStep && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E8EFEA] text-[#36533E] border border-[#D0E2D4] mt-2">
                  <span>✓</span>
                  <span>{lastStep.label} applied</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Export Settings (Figma 3:319) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                Make it ready to keep
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Choose the format that works for you.
              </p>
            </div>

            {/* File Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="export-file-name" className="text-xs font-semibold text-[#8A8077]">
                File name
              </label>
              <div className="flex items-center bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl px-3.5 py-2.5 focus-within:border-[#B8533C]">
                <input
                  id="export-file-name"
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="bg-transparent flex-1 text-xs sm:text-sm font-medium text-[#2D2623] focus:outline-none"
                />
                <span className="text-xs font-mono text-[#8A8077] pl-2">{formatExt}</span>
              </div>
            </div>

            {/* Format Selection Cards (Figma 3:327) */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#8A8077]">File format</div>
              <div className="grid grid-cols-3 gap-2.5">
                {/* PNG Card */}
                <button
                  type="button"
                  onClick={() => setSelectedFormat("png")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedFormat === "png"
                      ? "bg-[#FAF1EE] border-[#B8533C] ring-1 ring-[#B8533C] shadow-xs"
                      : "bg-[#FAF7F2] border-[#EAE2D6] hover:bg-[#F5EFEB]"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-serif font-bold text-sm text-[#2D2623]">PNG</span>
                    {selectedFormat === "png" && <span className="text-xs text-[#B8533C]">✓</span>}
                  </div>
                  <div className="text-[11px] text-[#7A706A] mt-1">Best quality</div>
                </button>

                {/* JPG Card */}
                <button
                  type="button"
                  onClick={() => setSelectedFormat("jpeg")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedFormat === "jpeg"
                      ? "bg-[#FAF1EE] border-[#B8533C] ring-1 ring-[#B8533C] shadow-xs"
                      : "bg-[#FAF7F2] border-[#EAE2D6] hover:bg-[#F5EFEB]"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-serif font-bold text-sm text-[#2D2623]">JPG</span>
                    {selectedFormat === "jpeg" && <span className="text-xs text-[#B8533C]">✓</span>}
                  </div>
                  <div className="text-[11px] text-[#7A706A] mt-1">Smaller file</div>
                </button>

                {/* WebP Card */}
                <button
                  type="button"
                  onClick={() => setSelectedFormat("webp")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedFormat === "webp"
                      ? "bg-[#FAF1EE] border-[#B8533C] ring-1 ring-[#B8533C] shadow-xs"
                      : "bg-[#FAF7F2] border-[#EAE2D6] hover:bg-[#F5EFEB]"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-serif font-bold text-sm text-[#2D2623]">WebP</span>
                    {selectedFormat === "webp" && <span className="text-xs text-[#B8533C]">✓</span>}
                  </div>
                  <div className="text-[11px] text-[#7A706A] mt-1">For the web</div>
                </button>
              </div>
            </div>

            {/* Format Guidance Box (Figma 3:337) */}
            <div className="bg-[#E8EFEA] border border-[#D0E2D4] rounded-2xl p-4 space-y-1">
              <div className="font-serif font-bold text-xs text-[#36533E]">
                {selectedFormat === "png"
                  ? "Every detail, kept intact."
                  : selectedFormat === "jpeg"
                  ? "Compressed for easy sharing."
                  : "Modern, lightweight, fast loading."}
              </div>
              <div className="text-[11px] text-[#556F5C] leading-relaxed">
                {selectedFormat === "png"
                  ? "PNG keeps full quality, with a larger file size."
                  : selectedFormat === "jpeg"
                  ? "JPG uses standard compression to save storage while looking great."
                  : "WebP provides rich colors at ultra-compact file sizes."}
              </div>
            </div>

            {/* Image Dimensions Info */}
            <div className="flex justify-between items-center text-xs py-1 border-t border-[#EAE2D6]/70">
              <span className="text-[#7A706A]">Image dimensions</span>
              <span className="font-semibold text-[#2D2623]">
                {metadata.width} × {metadata.height} px
              </span>
            </div>

            {/* Download Button */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full bg-[#B8533C] hover:bg-[#A1422E] text-white py-3.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Download {selectedFormat.toUpperCase()}</span>
                <span>↓</span>
              </button>

              <div className="text-center text-[11px] text-[#8A8077] pt-1">
                Your original image won’t be replaced.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Keep your curiosity going (Figma 3:345) */}
        <div className="bg-[#FAF7F2] rounded-3xl border border-[#EAE2D6] p-6 sm:p-8 shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-4">
              <div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#2D2623]">
                  Something lovely, made by you.
                </h3>
                <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
                  Keep exploring with this image, or start fresh with another.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/studio/creative"
                  className="bg-[#B8533C] hover:bg-[#A1422E] text-white px-5 py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>Try a creative effect</span>
                  <span>→</span>
                </Link>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] px-5 py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs"
                >
                  Start with a new image
                </button>
              </div>
            </div>

            {/* Right Tip Box */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EAE2D6] p-4 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-[#B8533C] uppercase tracking-wider">
                One Small Tip
              </span>
              <div className="font-serif font-bold text-sm text-[#2D2623]">
                Download before you leave.
              </div>
              <div className="text-xs text-[#7A706A]">
                Your edits live in this session.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
