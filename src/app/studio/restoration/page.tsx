"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { BeforeAfterSplit } from "@/components/studio/BeforeAfterSplit";
import { StepsBar } from "@/components/studio/StepsBar";
import { ReassuranceBanner } from "@/components/studio/ReassuranceBanner";
import { useStudio } from "@/lib/image-processing/context";
import {
  applyGaussianBlur,
  applyMedianFilter,
  applyBilateralFilter,
  applySharpening,
  applyUnsharpMask,
  applyMotionDeblur,
  applyScratchReduction,
} from "@/lib/image-processing/restoration";

type RestorationCategory = "denoise" | "sharpen" | "repair";

interface RestorationTool {
  id: string;
  name: string;
  title: string;
  description: string;
  category: RestorationCategory;
  paramName: string;
  min: number;
  max: number;
  defaultVal: number;
  step?: number;
  formatValue?: (v: number) => string;
}

const restorationTools: RestorationTool[] = [
  // Denoise
  {
    id: "bilateral",
    name: "Bilateral filter",
    title: "Less noise. Softer distractions.",
    description: "Smooths grain while keeping edges. Start gently to preserve fine details.",
    category: "denoise",
    paramName: "Filter strength",
    min: 1,
    max: 100,
    defaultVal: 55,
    formatValue: (v) => `${v}`,
  },
  {
    id: "gaussian_noise",
    name: "Gaussian smoothing",
    title: "Even surface softening",
    description: "Blends neighboring pixels to soften electronic grain and camera sensor noise.",
    category: "denoise",
    paramName: "Smoothing radius",
    min: 3,
    max: 15,
    defaultVal: 5,
    step: 2,
    formatValue: (v) => `${v}×${v} px`,
  },
  {
    id: "median_noise",
    name: "Median filter (Salt & pepper)",
    title: "Speckle noise removal",
    description: "Replaces isolated bright or dark specks with surrounding median intensity.",
    category: "denoise",
    paramName: "Speckle radius",
    min: 1,
    max: 4,
    defaultVal: 2,
    step: 1,
    formatValue: (v) => `${v} px`,
  },
  // Sharpen
  {
    id: "sharpen",
    name: "Laplacian sharpening",
    title: "Crisp textural definition",
    description: "Emphasizes second-order boundaries to revive soft focus and fine details.",
    category: "sharpen",
    paramName: "Sharpen strength",
    min: 0.2,
    max: 3.0,
    defaultVal: 1.2,
    step: 0.1,
    formatValue: (v) => `${v.toFixed(1)}x`,
  },
  {
    id: "unsharp_mask",
    name: "Unsharp masking",
    title: "High-frequency local boost",
    description: "Subtracts a blurred negative mask to bring punch and definition to subjects.",
    category: "sharpen",
    paramName: "Mask amount",
    min: 0.5,
    max: 3.0,
    defaultVal: 1.5,
    step: 0.1,
    formatValue: (v) => `${v.toFixed(1)}x`,
  },
  {
    id: "motion_deblur",
    name: "Motion deblur",
    title: "Camera shake recovery",
    description: "Applies directional deconvolution along the travel vector to counteract shake.",
    category: "sharpen",
    paramName: "Motion distance",
    min: 3,
    max: 15,
    defaultVal: 7,
    formatValue: (v) => `${v} px`,
  },
  // Repair
  {
    id: "scratch_repair",
    name: "Scratch & crease inpainting",
    title: "Gentle surface repair",
    description: "Interpolates over thin hairline tears and scratches using surrounding colors.",
    category: "repair",
    paramName: "Scratch width",
    min: 1,
    max: 8,
    defaultVal: 3,
    formatValue: (v) => `${v} px`,
  },
];

export default function PhotoRestorationPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentImage, applyStep, setLivePreview, isPreviewOn, loadImageFromFile } = useStudio();

  const [activeCategory, setActiveCategory] = useState<RestorationCategory>("denoise");
  const [selectedToolId, setSelectedToolId] = useState<string>("bilateral");
  const [filterStrength, setFilterStrength] = useState<number>(55);
  const [neighborhoodSize, setNeighborhoodSize] = useState<string>("9 pixels");

  const currentTool =
    restorationTools.find((t) => t.id === selectedToolId) || restorationTools[0];

  const handleCategorySelect = (category: RestorationCategory) => {
    setActiveCategory(category);
    const firstInCat = restorationTools.find((t) => t.category === category);
    if (firstInCat) {
      setSelectedToolId(firstInCat.id);
      setFilterStrength(firstInCat.defaultVal);
    }
  };

  useEffect(() => {
    if (!currentImage) return;

    if (!isPreviewOn) {
      setLivePreview(null);
      return;
    }

    try {
      let result: ImageData | null = null;
      switch (selectedToolId) {
        case "bilateral":
          result = applyBilateralFilter(currentImage, filterStrength / 2, 25);
          break;
        case "gaussian_noise":
          result = applyGaussianBlur(currentImage, filterStrength, 1.5);
          break;
        case "median_noise":
          result = applyMedianFilter(currentImage, Math.max(1, Math.round(filterStrength / 25)));
          break;
        case "sharpen":
          result = applySharpening(currentImage, filterStrength);
          break;
        case "unsharp_mask":
          result = applyUnsharpMask(currentImage, filterStrength, 5);
          break;
        case "motion_deblur":
          result = applyMotionDeblur(currentImage, filterStrength);
          break;
        case "scratch_repair":
          result = applyScratchReduction(currentImage, Math.max(1, Math.round(filterStrength / 15)));
          break;
      }
      setLivePreview(result);
    } catch (e) {
      console.error("Restoration preview error:", e);
    }
  }, [currentImage, selectedToolId, filterStrength, neighborhoodSize, isPreviewOn, setLivePreview]);

  const handleApply = () => {
    if (!currentImage) return;
    let result = currentImage;
    const formattedVal = currentTool.formatValue
      ? currentTool.formatValue(filterStrength)
      : `${filterStrength}`;
    const label = `${currentTool.name} (${formattedVal})`;

    switch (selectedToolId) {
      case "bilateral":
        result = applyBilateralFilter(currentImage, filterStrength / 2, 25);
        break;
      case "gaussian_noise":
        result = applyGaussianBlur(currentImage, filterStrength, 1.5);
        break;
      case "median_noise":
        result = applyMedianFilter(currentImage, Math.max(1, Math.round(filterStrength / 25)));
        break;
      case "sharpen":
        result = applySharpening(currentImage, filterStrength);
        break;
      case "unsharp_mask":
        result = applyUnsharpMask(currentImage, filterStrength, 5);
        break;
      case "motion_deblur":
        result = applyMotionDeblur(currentImage, filterStrength);
        break;
      case "scratch_repair":
        result = applyScratchReduction(currentImage, Math.max(1, Math.round(filterStrength / 15)));
        break;
    }

    applyStep(label, "restoration", selectedToolId, { filterStrength, neighborhoodSize }, result);
  };

  const handleReset = () => {
    setFilterStrength(currentTool.defaultVal);
    setLivePreview(null);
  };

  const currentPendingLabel = `${currentTool.name} ${
    currentTool.formatValue ? currentTool.formatValue(filterStrength) : filterStrength
  }`;

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader breadcrumb="Your studio / Photo restoration" />

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

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8 pb-16">
        {/* Title Bar - Figma 6:2 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              A little care goes a long way.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              Bring back the details, without losing the feeling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98]"
            >
              Replace image
            </button>
            <Link
              href="/studio/export"
              className="bg-[#B8533C] hover:bg-[#A1422E] text-white px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98] inline-flex items-center gap-1.5"
            >
              <span>Export image</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Dual Layout: Split Preview (Left) + Restoration Controls (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Split Preview with Steps Bar */}
          <div className="lg:col-span-8 space-y-4">
            <BeforeAfterSplit />
            <StepsBar currentPendingLabel={currentPendingLabel} />

            {/* A little help choosing - Guidance Cards (Figma 6:436) */}
            <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-3xl p-5 sm:p-6 space-y-3 shadow-xs">
              <h3 className="font-serif font-bold text-base text-[#2D2623]">
                A little help choosing
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div
                  onClick={() => handleCategorySelect("denoise")}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeCategory === "denoise"
                      ? "bg-white border-[#B8533C] shadow-xs"
                      : "bg-white/60 border-[#EAE2D6] hover:bg-white"
                  }`}
                >
                  <div className="font-serif font-bold text-sm text-[#2D2623]">Denoise</div>
                  <div className="text-xs text-[#7A706A] mt-0.5">For grainy photos</div>
                </div>

                <div
                  onClick={() => handleCategorySelect("sharpen")}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeCategory === "sharpen"
                      ? "bg-white border-[#B8533C] shadow-xs"
                      : "bg-white/60 border-[#EAE2D6] hover:bg-white"
                  }`}
                >
                  <div className="font-serif font-bold text-sm text-[#2D2623]">Sharpen</div>
                  <div className="text-xs text-[#7A706A] mt-0.5">For soft details</div>
                </div>

                <div
                  onClick={() => handleCategorySelect("repair")}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeCategory === "repair"
                      ? "bg-white border-[#B8533C] shadow-xs"
                      : "bg-white/60 border-[#EAE2D6] hover:bg-white"
                  }`}
                >
                  <div className="font-serif font-bold text-sm text-[#2D2623]">Repair</div>
                  <div className="text-xs text-[#7A706A] mt-0.5">For small scratches</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Restoration Controls (Figma 6:407) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                A gentle fresh start
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Choose the kind of care your photo needs.
              </p>
            </div>

            {/* Category Segmented Control (Denoise | Sharpen | Repair) */}
            <div className="grid grid-cols-3 bg-[#F5EFEB] p-1 rounded-xl gap-1 text-xs">
              {(
                [
                  { id: "denoise", label: "Denoise" },
                  { id: "sharpen", label: "Sharpen" },
                  { id: "repair", label: "Repair" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`py-2 rounded-lg font-medium transition-all ${
                    activeCategory === cat.id
                      ? "bg-white text-[#2D2623] shadow-xs font-semibold"
                      : "text-[#7A706A] hover:text-[#2D2623]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Method Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="restoration-tool-select" className="text-xs font-semibold text-[#8A8077]">
                Method
              </label>
              <div className="relative">
                <select
                  id="restoration-tool-select"
                  value={selectedToolId}
                  onChange={(e) => {
                    setSelectedToolId(e.target.value);
                    const found = restorationTools.find((t) => t.id === e.target.value);
                    if (found) setFilterStrength(found.defaultVal);
                  }}
                  className="w-full appearance-none bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#2D2623] focus:outline-none focus:border-[#B8533C] cursor-pointer"
                >
                  {restorationTools
                    .filter((t) => t.category === activeCategory)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8077]">
                  ▼
                </span>
              </div>
            </div>

            {/* Method Explanation Box (Figma 6:419) */}
            <div className="bg-[#FAF1EE] border border-[#F4D4CD] rounded-2xl p-4 space-y-1">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#863422]">
                {currentTool.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#7A706A] leading-relaxed">
                {currentTool.description}
              </p>
            </div>

            {/* Filter Strength Slider (Figma 6:422) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#2D2623]">
                  {currentTool.paramName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF1EE] text-[#B8533C] border border-[#EEC7BC]">
                  {currentTool.formatValue
                    ? currentTool.formatValue(filterStrength)
                    : filterStrength}
                </span>
              </div>

              <input
                type="range"
                min={currentTool.min}
                max={currentTool.max}
                step={currentTool.step || 1}
                value={filterStrength}
                onChange={(e) => setFilterStrength(parseFloat(e.target.value))}
                aria-label={currentTool.paramName}
                className="w-full accent-[#B8533C]"
              />

              <div className="flex justify-between text-[10px] text-[#A69D95]">
                <span>{currentTool.min}</span>
                <span>{currentTool.max}</span>
              </div>
            </div>

            {/* Neighborhood Size Selector (Figma 6:429) */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-[#8A8077]">
                Neighborhood size
              </label>
              <select
                value={neighborhoodSize}
                onChange={(e) => setNeighborhoodSize(e.target.value)}
                className="w-full appearance-none bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-[#2D2623] focus:outline-none"
              >
                <option value="5 pixels">5 pixels (light)</option>
                <option value="9 pixels">9 pixels (recommended)</option>
                <option value="15 pixels">15 pixels (strong)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#EAE2D6]/70">
              <button
                onClick={handleApply}
                className="w-full bg-[#B8533C] hover:bg-[#A1422E] text-white py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99]"
              >
                Apply restoration
              </button>

              <button
                onClick={handleReset}
                className="w-full py-2 text-xs font-semibold text-[#B8533C] hover:text-[#933B2B] transition-colors text-center"
              >
                Reset settings
              </button>
            </div>
          </div>
        </div>

        {/* Restoration Expectation Reassurance Banner (Figma 6:444) */}
        <ReassuranceBanner
          title="Care, not magic."
          description="Results depend on the image. Your original stays safe, so you can always try a different approach."
        />
      </main>
    </div>
  );
}
