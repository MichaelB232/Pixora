"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { useStudio } from "@/lib/image-processing/context";
import { Check, Download, FileText } from "lucide-react";

export default function ExportCenterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentImage, originalImage, metadata, history, downloadImage, loadImageFromFile } =
    useStudio();

  const [fileName, setFileName] = useState<string>("cosmos-edited");
  const [selectedFormat, setSelectedFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [jpegQuality, setJpegQuality] = useState<number>(92);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeImage = currentImage || originalImage;

  // Render preview canvas
  useEffect(() => {
    if (!activeImage || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    canvas.width = activeImage.width;
    canvas.height = activeImage.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.putImageData(activeImage, 0, 0);
    }
  }, [activeImage]);

  const lastStep = history.length > 1 ? history[history.length - 1] : null;

  const handleDownload = () => {
    setIsDownloading(true);
    downloadImage(selectedFormat, jpegQuality, fileName);
    setTimeout(() => {
      setIsDownloading(false);
    }, 600);
  };

  const handleDownloadReport = async () => {
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: fileName,
          imageName: metadata.name,
          dimensions: `${metadata.width} × ${metadata.height} px`,
          format: selectedFormat.toUpperCase(),
          history: history.map((s) => ({
            stepIndex: s.stepIndex,
            module: s.module,
            algorithm: s.algorithm,
            label: s.label,
            parameters: s.parameters,
            appliedAt: s.timestamp,
          })),
        }),
      });

      const data = await res.json();
      const reportBlob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(reportBlob);
      link.download = `${fileName}-processing-report.json`;
      link.click();
    } catch (e) {
      console.error("Report download error:", e);
    }
  };

  const formatExt = selectedFormat === "jpeg" ? ".jpg" : `.${selectedFormat}`;

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader
        breadcrumb="Your studio / Export center"
      />

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

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Title Bar */}
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
            className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs self-start"
          >
            ← Back to editing
          </Link>
        </div>

        {/* 2-Column Grid matching Screenshot 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Preview Card */}
          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-3xl overflow-hidden border border-[#EAE2D6] bg-white p-3 shadow-card">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#FAF7F2] flex items-center justify-center">
                <canvas
                  ref={previewCanvasRef}
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              </div>
            </div>

            <div className="px-2 space-y-1">
              <h3 className="font-serif font-bold text-base text-[#2D2623]">
                {fileName}
              </h3>
              <p className="text-xs text-[#8A8077]">
                {metadata.width} × {metadata.height} px · Original dimensions
              </p>
              {lastStep && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E8EFEA] text-[#36533E] border border-[#D0E0D4] mt-1">
                  <span>✓</span>
                  <span>{lastStep.label} applied</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Export Settings Card */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#EAE2D6] p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                Make it ready to keep
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Choose the format that works for you.
              </p>
            </div>

            {/* File Name Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="export-filename-input"
                className="text-xs font-semibold text-[#8A8077]"
              >
                File name
              </label>
              <div className="relative flex items-center">
                <input
                  id="export-filename-input"
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl px-3.5 py-2.5 pr-14 text-xs sm:text-sm font-medium text-[#2D2623] focus:outline-none focus:border-[#B8533C]"
                />
                <span className="absolute right-3.5 text-xs text-[#9E948D] font-mono pointer-events-none">
                  {formatExt}
                </span>
              </div>
            </div>

            {/* Format Selection Cards */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8A8077]">
                File format
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* PNG */}
                <button
                  type="button"
                  onClick={() => setSelectedFormat("png")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedFormat === "png"
                      ? "bg-[#FAF1EE] border-[#EEC7BC] shadow-xs"
                      : "bg-[#FAF7F2] border-[#EAE2D6] hover:bg-[#F5EFEB]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-[#2D2623]">
                      PNG
                    </span>
                    {selectedFormat === "png" && (
                      <Check size={14} className="text-[#B8533C]" />
                    )}
                  </div>
                  <div className="text-[11px] text-[#7A706A] mt-1">
                    Best quality
                  </div>
                </button>

                {/* JPG */}
                <button
                  type="button"
                  onClick={() => setSelectedFormat("jpeg")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedFormat === "jpeg"
                      ? "bg-[#FAF1EE] border-[#EEC7BC] shadow-xs"
                      : "bg-[#FAF7F2] border-[#EAE2D6] hover:bg-[#F5EFEB]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-[#2D2623]">
                      JPG
                    </span>
                    {selectedFormat === "jpeg" && (
                      <Check size={14} className="text-[#B8533C]" />
                    )}
                  </div>
                  <div className="text-[11px] text-[#7A706A] mt-1">
                    Smaller file
                  </div>
                </button>

                {/* WebP */}
                <button
                  type="button"
                  onClick={() => setSelectedFormat("webp")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedFormat === "webp"
                      ? "bg-[#FAF1EE] border-[#EEC7BC] shadow-xs"
                      : "bg-[#FAF7F2] border-[#EAE2D6] hover:bg-[#F5EFEB]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-[#2D2623]">
                      WebP
                    </span>
                    {selectedFormat === "webp" && (
                      <Check size={14} className="text-[#B8533C]" />
                    )}
                  </div>
                  <div className="text-[11px] text-[#7A706A] mt-1">
                    For the web
                  </div>
                </button>
              </div>
            </div>

            {/* Quality Slider (for JPG) */}
            {selectedFormat === "jpeg" && (
              <div className="p-3 bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[#2D2623]">
                    JPEG Compression Quality
                  </span>
                  <span className="font-bold text-[#B8533C]">{jpegQuality}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={jpegQuality}
                  onChange={(e) => setJpegQuality(parseInt(e.target.value))}
                  className="w-full accent-[#B8533C]"
                />
              </div>
            )}

            {/* Quality Advice Callout */}
            <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl p-4 space-y-1">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#2D2623]">
                {selectedFormat === "png"
                  ? "Every detail, kept intact."
                  : selectedFormat === "jpeg"
                  ? "Compact size with great balance."
                  : "Modern web compression."}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#7A706A] leading-relaxed">
                {selectedFormat === "png"
                  ? "PNG keeps full uncompressed quality, with lossless preservation of gradients and edges."
                  : selectedFormat === "jpeg"
                  ? "Standard photographic compression suitable for sharing, email, and social media."
                  : "Efficient web image format offering reduced byte size with high visual fidelity."}
              </p>
            </div>

            {/* Dimensions Metric */}
            <div className="flex items-center justify-between py-2 border-t border-[#EAE2D6]/80 text-xs">
              <span className="text-[#7A706A]">Image dimensions</span>
              <span className="font-semibold text-[#2D2623]">
                {metadata.width} × {metadata.height} px
              </span>
            </div>

            {/* Primary Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full bg-[#B8533C] hover:bg-[#A1422E] text-white py-3.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Download {selectedFormat.toUpperCase()}</span>
              <span>↓</span>
            </button>

            {/* Processing Audit Report Option */}
            <button
              onClick={handleDownloadReport}
              className="w-full py-2.5 px-3 rounded-xl border border-[#EAE2D6] bg-white text-xs font-semibold text-[#4A403A] hover:bg-[#FAF7F2] transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText size={14} className="text-[#B8533C]" />
              <span>Download Academic Processing Audit (.json)</span>
            </button>

            <div className="text-center text-[11px] text-[#A69D95]">
              Your original image won&apos;t be replaced.
            </div>
          </div>
        </div>

        {/* Bottom Banner (Exact match to Screenshot 3) */}
        <div className="rounded-3xl bg-[#F6EEE3] border border-[#EAE2D6] p-6 md:p-8 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left section */}
            <div className="md:col-span-8 space-y-3">
              <h3 className="font-serif font-bold text-lg sm:text-xl text-[#2D2623]">
                Something lovely, made by you.
              </h3>
              <p className="text-xs sm:text-sm text-[#7A706A]">
                Keep exploring with this image, or start fresh with another.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/studio/creative"
                  className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs"
                >
                  Try a creative effect →
                </Link>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs"
                >
                  Start with a new image
                </button>
              </div>
            </div>

            {/* Right section: Tip */}
            <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-[#EAE2D6] pt-4 md:pt-0 md:pl-6 space-y-1">
              <div className="text-[10px] font-bold tracking-widest text-[#B8533C] uppercase">
                One Small Tip
              </div>
              <div className="font-serif font-bold text-sm text-[#2D2623]">
                Download before you leave.
              </div>
              <p className="text-xs text-[#7A706A]">
                Your edits live safely in this browser session.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
