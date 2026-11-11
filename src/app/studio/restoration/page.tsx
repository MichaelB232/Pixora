"use client";

import React, { useState, useEffect } from "react";
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

interface RestorationTool {
  id: string;
  name: string;
  title: string;
  description: string;
  paramName: string;
  min: number;
  max: number;
  defaultVal: number;
  step?: number;
  formatValue?: (v: number) => string;
}

const restorationTools: RestorationTool[] = [
  {
    id: "gaussian_noise",
    name: "Gaussian Smoothing",
    title: "Gentle surface softening",
    description: "Evenly blends neighboring pixel intensities to soften electronic grain.",
    paramName: "Kernel Size",
    min: 3,
    max: 15,
    defaultVal: 5,
    step: 2,
    formatValue: (v) => `${v}×${v} px`,
  },
  {
    id: "median_noise",
    name: "Salt & Pepper Removal",
    title: "Speckle and impulse noise cleanup",
    description: "Replaces isolated bright or dark pixel specks with the median of their surroundings.",
    paramName: "Filter Radius",
    min: 1,
    max: 4,
    defaultVal: 1,
    step: 1,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "bilateral",
    name: "Bilateral Edge-Preserving",
    title: "Smooth textures without losing contours",
    description: "Weights pixels by both spatial proximity and color similarity to preserve sharp borders.",
    paramName: "Smoothing Strength",
    min: 10,
    max: 50,
    defaultVal: 25,
    formatValue: (v) => `${v}`,
  },
  {
    id: "sharpen",
    name: "Laplacian Sharpening",
    title: "Accentuate fine lines and textures",
    description: "Calculates second-order spatial derivatives to boost edges and fine focus.",
    paramName: "Sharpening Factor",
    min: 0.2,
    max: 3.0,
    defaultVal: 1.0,
    step: 0.1,
    formatValue: (v) => `${v.toFixed(1)}x`,
  },
  {
    id: "unsharp_mask",
    name: "Unsharp Masking",
    title: "High-frequency local boost",
    description: "Subtracts a blurred negative mask to dramatically enhance micro-contrast.",
    paramName: "Mask Amount",
    min: 0.5,
    max: 3.0,
    defaultVal: 1.5,
    step: 0.1,
    formatValue: (v) => `${v.toFixed(1)}x`,
  },
  {
    id: "motion_deblur",
    name: "Motion Deblur",
    title: "Compensate camera motion blur",
    description: "Applies directional deconvolution along the travel vector to reconstruct lost sharpness.",
    paramName: "Blur Distance",
    min: 3,
    max: 12,
    defaultVal: 6,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "scratch_reduction",
    name: "Scratch Reduction & Inpaint",
    title: "Mend scratches and dust lines",
    description: "Locates sharp linear anomalies and diffuses surrounding texture into damaged areas.",
    paramName: "Sensitivity",
    min: 10,
    max: 60,
    defaultVal: 30,
    formatValue: (v) => `${v}`,
  },
];

export default function PhotoRestorationPage() {
  const { currentImage, applyStep, setLivePreview, isPreviewOn, setIsPreviewOn } = useStudio();
  const [selectedToolId, setSelectedToolId] = useState<string>("median_noise");
  const [paramValue, setParamValue] = useState<number>(1);

  const currentTool =
    restorationTools.find((t) => t.id === selectedToolId) || restorationTools[0];

  useEffect(() => {
    if (!currentImage) return;

    if (!isPreviewOn) {
      setLivePreview(null);
      return;
    }

    try {
      let result: ImageData | null = null;
      switch (selectedToolId) {
        case "gaussian_noise":
          result = applyGaussianBlur(currentImage, paramValue, paramValue / 3);
          break;
        case "median_noise":
          result = applyMedianFilter(currentImage, paramValue);
          break;
        case "bilateral":
          result = applyBilateralFilter(currentImage, 2, paramValue, paramValue * 1.5);
          break;
        case "sharpen":
          result = applySharpening(currentImage, paramValue);
          break;
        case "unsharp_mask":
          result = applyUnsharpMask(currentImage, paramValue, 2);
          break;
        case "motion_deblur":
          result = applyMotionDeblur(currentImage, paramValue, 0);
          break;
        case "scratch_reduction":
          result = applyScratchReduction(currentImage, paramValue, 2);
          break;
      }
      setLivePreview(result);
    } catch (e) {
      console.error("Restoration preview error:", e);
    }
  }, [currentImage, selectedToolId, paramValue, isPreviewOn, setLivePreview]);

  const handleApply = () => {
    if (!currentImage) return;
    let result = currentImage;
    const formattedVal = currentTool.formatValue
      ? currentTool.formatValue(paramValue)
      : `${paramValue}`;
    const label = `${currentTool.name} (${formattedVal})`;

    switch (selectedToolId) {
      case "gaussian_noise":
        result = applyGaussianBlur(currentImage, paramValue, paramValue / 3);
        break;
      case "median_noise":
        result = applyMedianFilter(currentImage, paramValue);
        break;
      case "bilateral":
        result = applyBilateralFilter(currentImage, 2, paramValue, paramValue * 1.5);
        break;
      case "sharpen":
        result = applySharpening(currentImage, paramValue);
        break;
      case "unsharp_mask":
        result = applyUnsharpMask(currentImage, paramValue, 2);
        break;
      case "motion_deblur":
        result = applyMotionDeblur(currentImage, paramValue, 0);
        break;
      case "scratch_reduction":
        result = applyScratchReduction(currentImage, paramValue, 2);
        break;
    }

    applyStep(label, "restoration", selectedToolId, { value: paramValue }, result);
  };

  const handleReset = () => {
    setParamValue(currentTool.defaultVal);
    setLivePreview(null);
  };

  const currentPendingLabel = `${currentTool.name} ${
    currentTool.formatValue ? currentTool.formatValue(paramValue) : paramValue
  }`;

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader
        breadcrumb="Your studio / Photo restoration"
      />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              Bring memories back to life.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              Soften digital noise, recover blurred edges, and restore lost textures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/studio/export"
              className="bg-[#B8533C] hover:bg-[#A1422E] text-white px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98] inline-flex items-center gap-1.5"
            >
              <span>Export image</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <BeforeAfterSplit />
            <StepsBar currentPendingLabel={currentPendingLabel} />
          </div>

          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                Restoration Method
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Target specific types of noise or blurring.
              </p>
            </div>

            {/* Tool Selection */}
            <div className="space-y-1.5">
              <label
                htmlFor="restoration-tool-select"
                className="text-xs font-semibold text-[#8A8077]"
              >
                Algorithm
              </label>
              <div className="relative">
                <select
                  id="restoration-tool-select"
                  value={selectedToolId}
                  onChange={(e) => {
                    setSelectedToolId(e.target.value);
                    const found = restorationTools.find((t) => t.id === e.target.value);
                    if (found) setParamValue(found.defaultVal);
                  }}
                  className="w-full appearance-none bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#2D2623] focus:outline-none focus:border-[#B8533C] cursor-pointer"
                >
                  {restorationTools.map((t) => (
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

            {/* Descriptive Callout Box */}
            <div className="bg-[#FAF1EE] border border-[#F4D4CD] rounded-2xl p-4 space-y-1">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#863422]">
                {currentTool.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#7A706A] leading-relaxed">
                {currentTool.description}
              </p>
            </div>

            {/* Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#2D2623]">
                  {currentTool.paramName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF1EE] text-[#B8533C] border border-[#EEC7BC]">
                  {currentTool.formatValue
                    ? currentTool.formatValue(paramValue)
                    : paramValue}
                </span>
              </div>

              <input
                type="range"
                min={currentTool.min}
                max={currentTool.max}
                step={currentTool.step || 1}
                value={paramValue}
                onChange={(e) => setParamValue(parseFloat(e.target.value))}
                aria-label={currentTool.paramName}
                className="w-full accent-[#B8533C]"
              />

              <div className="flex justify-between text-[10px] text-[#A69D95]">
                <span>{currentTool.min}</span>
                <span>{currentTool.max}</span>
              </div>
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-[#EAE2D6]/70">
              <div>
                <div className="text-xs font-medium text-[#2D2623]">
                  Preview is on
                </div>
                <div className="text-[11px] text-[#8A8077]">
                  See restoration result in real time.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPreviewOn}
                aria-label="Toggle preview on or off"
                onClick={() => setIsPreviewOn(!isPreviewOn)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  isPreviewOn ? "bg-[#46654F]" : "bg-[#D9CEBF]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    isPreviewOn ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleApply}
                className="w-full bg-[#B8533C] hover:bg-[#A1422E] text-white py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99]"
              >
                Apply {currentTool.name.toLowerCase()}
              </button>

              <button
                onClick={handleReset}
                className="w-full py-2 text-xs font-semibold text-[#B8533C] hover:text-[#933B2B] transition-colors text-center"
              >
                Reset parameters
              </button>
            </div>
          </div>
        </div>

        <ReassuranceBanner
          title="Safe restoration with live comparison."
          description="Every restoration method maintains your original photograph intact. Use the split handle to check whether details stay crisp."
        />
      </main>
    </div>
  );
}
