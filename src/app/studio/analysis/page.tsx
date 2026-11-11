"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { HistogramCanvas } from "@/components/studio/HistogramCanvas";
import { ReassuranceBanner } from "@/components/studio/ReassuranceBanner";
import { useStudio } from "@/lib/image-processing/context";
import { calculateStatistics } from "@/lib/image-processing/analysis";

export default function ImageAnalysisPage() {
  const { currentImage, originalImage, metadata } = useStudio();

  const activeImage = currentImage || originalImage;

  const stats = useMemo(() => {
    if (!activeImage) return null;
    return calculateStatistics(activeImage);
  }, [activeImage]);

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader
        breadcrumb="Your studio / Image analysis"
      />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              Understanding your image.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              Inspect tonal distributions, channel dynamics, and mathematical metrics.
            </p>
          </div>

          <Link
            href="/studio/editor"
            className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs self-start"
          >
            ← Back to editing
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Real-time Histogram */}
          <div className="lg:col-span-7 space-y-6">
            <HistogramCanvas />

            {/* Technical Metadata Card */}
            <div className="bg-white rounded-3xl border border-[#EAE2D6] p-6 shadow-soft space-y-4">
              <h3 className="font-serif font-bold text-base text-[#2D2623]">
                Image Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE2D6]/70">
                  <div className="text-[#8A8077]">Dimensions</div>
                  <div className="font-semibold text-[#2D2623] mt-1">
                    {metadata.width} × {metadata.height} px
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE2D6]/70">
                  <div className="text-[#8A8077]">Aspect Ratio</div>
                  <div className="font-semibold text-[#2D2623] mt-1">
                    {metadata.aspectRatio}
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE2D6]/70">
                  <div className="text-[#8A8077]">Resolution</div>
                  <div className="font-semibold text-[#2D2623] mt-1">
                    {metadata.megapixels}
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE2D6]/70">
                  <div className="text-[#8A8077]">Color Depth</div>
                  <div className="font-semibold text-[#2D2623] mt-1">
                    24-bit RGB
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Statistical Breakdown */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#EAE2D6] p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                Pixel Intensity Statistics
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Evaluated across standard 8-bit range [0 – 255].
              </p>
            </div>

            {stats ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#EAE2D6] text-[#8A8077]">
                        <th className="py-2 font-medium">Channel</th>
                        <th className="py-2 font-medium">Mean</th>
                        <th className="py-2 font-medium">Std Dev</th>
                        <th className="py-2 font-medium">Median</th>
                        <th className="py-2 font-medium">Min/Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE2D6]/60 text-[#2D2623]">
                      <tr>
                        <td className="py-2.5 font-semibold text-[#B8533C]">Red</td>
                        <td className="py-2.5">{stats.mean.r}</td>
                        <td className="py-2.5">{stats.stdDev.r}</td>
                        <td className="py-2.5">{stats.median.r}</td>
                        <td className="py-2.5 text-[#7A706A]">
                          {stats.min.r} – {stats.max.r}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-semibold text-[#46654F]">Green</td>
                        <td className="py-2.5">{stats.mean.g}</td>
                        <td className="py-2.5">{stats.stdDev.g}</td>
                        <td className="py-2.5">{stats.median.g}</td>
                        <td className="py-2.5 text-[#7A706A]">
                          {stats.min.g} – {stats.max.g}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-semibold text-[#3B72A8]">Blue</td>
                        <td className="py-2.5">{stats.mean.b}</td>
                        <td className="py-2.5">{stats.stdDev.b}</td>
                        <td className="py-2.5">{stats.median.b}</td>
                        <td className="py-2.5 text-[#7A706A]">
                          {stats.min.b} – {stats.max.b}
                        </td>
                      </tr>
                      <tr className="bg-[#FAF7F2]/60 font-medium">
                        <td className="py-2.5 font-semibold text-[#2D2623]">Luminance</td>
                        <td className="py-2.5">{stats.mean.l}</td>
                        <td className="py-2.5">{stats.stdDev.l}</td>
                        <td className="py-2.5">{stats.median.l}</td>
                        <td className="py-2.5 text-[#7A706A]">
                          {stats.min.l} – {stats.max.l}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#FAF1EE] border border-[#F4D4CD] rounded-2xl p-4 text-xs space-y-1">
                  <span className="font-semibold text-[#863422]">
                    Analytical Interpretation
                  </span>
                  <p className="text-[#7A706A] leading-relaxed text-[11px]">
                    {stats.mean.l > 150
                      ? "High-key exposure: Image is predominantly bright with light paper or floral tones."
                      : stats.mean.l < 100
                      ? "Low-key exposure: Image features rich deep shadows and dramatic contrast."
                      : "Balanced midtone exposure: Broad tonal range well-suited for contrast and color enhancement."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#8A8077]">
                Calculating statistics...
              </div>
            )}
          </div>
        </div>

        <ReassuranceBanner
          title="Numbers that clarify, not confuse."
          description="Histogram and channel metrics help you decide whether your image needs gamma lifting, contrast enhancement, or noise reduction."
        />
      </main>
    </div>
  );
}
