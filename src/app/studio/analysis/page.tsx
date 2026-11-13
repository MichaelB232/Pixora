"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { ReassuranceBanner } from "@/components/studio/ReassuranceBanner";
import { useStudio } from "@/lib/image-processing/context";
import { calculateStatistics, calculateHistogram } from "@/lib/image-processing/analysis";

export default function ImageAnalysisPage() {
  const { currentImage, originalImage, metadata } = useStudio();
  const activeImage = currentImage || originalImage;

  const stats = useMemo(() => {
    if (!activeImage) return null;
    return calculateStatistics(activeImage);
  }, [activeImage]);

  // Compute 32-bin grayscale histogram (Figma 6:636)
  const bins32 = useMemo(() => {
    if (!activeImage) return Array(32).fill(0);
    const hist = calculateHistogram(activeImage);
    const bins = Array(32).fill(0);
    for (let i = 0; i < 256; i++) {
      const binIdx = Math.min(31, Math.floor(i / 8));
      bins[binIdx] += hist.luminance[i];
    }
    const maxVal = Math.max(...bins, 1);
    return bins.map((v) => ({ count: v, heightPct: (v / maxVal) * 100 }));
  }, [activeImage]);

  const meanBrightness = stats
    ? ((stats.mean.r * 0.299 + stats.mean.g * 0.587 + stats.mean.b * 0.114)).toFixed(1)
    : "183.6";

  const stdDevVal = stats
    ? ((stats.stdDev.r * 0.299 + stats.stdDev.g * 0.587 + stats.stdDev.b * 0.114)).toFixed(1)
    : "47.3";

  const darkestPixel = stats ? Math.min(stats.min.r, stats.min.g, stats.min.b) : 3;
  const brightestPixel = stats ? Math.max(stats.max.r, stats.max.g, stats.max.b) : 255;
  const totalPixelsFormatted = (metadata.width * metadata.height).toLocaleString();

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader breadcrumb="Your studio / Image analysis" />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8 pb-16">
        {/* Title Bar - Figma 6:222 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              Get to know your image.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              A friendly look at the light, color, and details behind your photo.
            </p>
          </div>

          <Link
            href="/studio/editor"
            className="bg-[#B8533C] hover:bg-[#A1422E] text-white px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98] inline-flex items-center gap-1.5 self-start"
          >
            <span>Open image editor</span>
            <span>→</span>
          </Link>
        </div>

        {/* Top Row: Thumbnail Card (Left) + 32-Bin Histogram (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Analysis image thumbnail (Figma 6:632) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card flex flex-col justify-between space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EAE2D6]">
              <img
                src="/samples/cosmos.jpg"
                alt="Analyzed sample"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-serif font-bold text-lg text-[#2D2623]">
                {metadata.name}
              </div>
              <div className="text-xs text-[#7A706A] mt-0.5">
                Analyzing original sample
              </div>
            </div>
          </div>

          {/* Brightness distribution histogram (Figma 6:636) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#EAE2D6] p-6 shadow-card flex flex-col justify-between space-y-6">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                How the light is spread
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Grayscale histogram · 32 intensity bins
              </p>
            </div>

            {/* Visual Histogram Chart */}
            <div className="space-y-2">
              <div className="relative h-44 w-full flex items-end gap-1.5 pt-6 pb-2 border-b border-[#EAE2D6]">
                {bins32.map((bin, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#D37B67] hover:bg-[#B8533C] rounded-t-sm transition-all group relative"
                    style={{ height: `${Math.max(4, bin.heightPct)}%` }}
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2D2623] text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10 transition-opacity">
                      Bin {i}: {bin.count.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* X-Axis Labels (Figma 6:675 to 6:681) */}
              <div className="flex justify-between text-[11px] text-[#8A8077] px-1 font-mono">
                <span>0</span>
                <span>64</span>
                <span>128</span>
                <span>192</span>
                <span>255</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#7A706A] px-1 pt-1">
                <span>Shadows</span>
                <span>Midtones</span>
                <span>Highlights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row: 4 Metric Cards (Figma 6:682 to 6:694) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Mean brightness */}
          <div className="bg-white rounded-3xl border border-[#EAE2D6] p-5 shadow-soft space-y-1">
            <div className="text-xs font-semibold text-[#8A8077]">Mean brightness</div>
            <div className="font-serif font-bold text-3xl sm:text-4xl text-[#2D2623]">
              {meanBrightness}
            </div>
            <div className="text-xs text-[#7A706A] pt-1">Average light level · 0–255</div>
          </div>

          {/* Card 2: Standard deviation */}
          <div className="bg-white rounded-3xl border border-[#EAE2D6] p-5 shadow-soft space-y-1">
            <div className="text-xs font-semibold text-[#8A8077]">Standard deviation</div>
            <div className="font-serif font-bold text-3xl sm:text-4xl text-[#2D2623]">
              {stdDevVal}
            </div>
            <div className="text-xs text-[#7A706A] pt-1">Spread of brightness values</div>
          </div>

          {/* Card 3: Darkest pixel */}
          <div className="bg-white rounded-3xl border border-[#EAE2D6] p-5 shadow-soft space-y-1">
            <div className="text-xs font-semibold text-[#8A8077]">Darkest pixel</div>
            <div className="font-serif font-bold text-3xl sm:text-4xl text-[#2D2623]">
              {darkestPixel}
            </div>
            <div className="text-xs text-[#7A706A] pt-1">Minimum grayscale intensity</div>
          </div>

          {/* Card 4: Brightest pixel */}
          <div className="bg-white rounded-3xl border border-[#EAE2D6] p-5 shadow-soft space-y-1">
            <div className="text-xs font-semibold text-[#8A8077]">Brightest pixel</div>
            <div className="font-serif font-bold text-3xl sm:text-4xl text-[#2D2623]">
              {brightestPixel}
            </div>
            <div className="text-xs text-[#7A706A] pt-1">Maximum grayscale intensity</div>
          </div>
        </div>

        {/* Bottom Row: The little details (Left) + What does this tell me? (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* The little details (Figma 6:698) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#EAE2D6] p-6 shadow-soft space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#2D2623]">
              The little details
            </h3>

            <div className="divide-y divide-[#EAE2D6]/60 text-xs sm:text-sm">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#7A706A]">Dimensions</span>
                <span className="font-semibold text-[#2D2623]">
                  {metadata.width} × {metadata.height} pixels
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#7A706A]">Color model</span>
                <span className="font-semibold text-[#2D2623]">RGB · 8-bit channels</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#7A706A]">Source format</span>
                <span className="font-semibold text-[#2D2623]">{metadata.format}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#7A706A]">Total pixels</span>
                <span className="font-semibold text-[#2D2623]">{totalPixelsFormatted}</span>
              </div>
            </div>
          </div>

          {/* What does this tell me? (Figma 6:708) */}
          <div className="lg:col-span-6 bg-[#FAF7F2] rounded-3xl border border-[#EAE2D6] p-6 shadow-soft flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                What does this tell me?
              </h3>
              <p className="text-xs sm:text-sm text-[#7A706A] leading-relaxed">
                Most pixels sit toward the brighter end of the chart. That fits the natural light,
                petals, and gentle surfaces in this sample.
              </p>
              <p className="text-xs sm:text-sm text-[#7A706A] leading-relaxed">
                There’s no perfect histogram. Your image’s mood and emotional feeling matter just as
                much as the math.
              </p>
            </div>

            <div className="pt-2 text-xs font-semibold text-[#B8533C]">
              Tip: If you want to increase contrast, head to the Image editor and try a gentle contrast or S-curve adjustment.
            </div>
          </div>
        </div>

        {/* Reassurance Banner (Figma 6:712) */}
        <ReassuranceBanner
          title="Numbers are a guide, not a grade."
          description="Use them alongside your eyes. Compare an edit with the original to understand what changed."
        />
      </main>
    </div>
  );
}
