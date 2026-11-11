"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { BeforeAfterSplit } from "@/components/studio/BeforeAfterSplit";
import { StepsBar } from "@/components/studio/StepsBar";
import { ReassuranceBanner } from "@/components/studio/ReassuranceBanner";
import { useStudio } from "@/lib/image-processing/context";
import {
  applyBrightness,
  applyContrast,
  applyGamma,
  applyGrayscale,
  applyNegative,
  applySepia,
  applyGlobalThreshold,
  applyAdaptiveThreshold,
  applyHistogramEqualization,
  applyCLAHE,
  applyRgbChannelSeparation,
  applyHsvAdjustment,
} from "@/lib/image-processing/editor";

type TabType = "basic" | "enhance" | "color";

interface AdjustmentConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  tab: TabType;
  paramName: string;
  min: number;
  max: number;
  defaultVal: number;
  step?: number;
  formatValue?: (v: number) => string;
}

const adjustments: AdjustmentConfig[] = [
  // Basic
  {
    id: "brightness",
    name: "Brightness",
    title: "A little sunshine for your image",
    description:
      "Lifts or lowers the light in every pixel. Try a small change to keep it natural.",
    tab: "basic",
    paramName: "Brightness",
    min: -100,
    max: 100,
    defaultVal: 20,
    formatValue: (v) => (v > 0 ? `+${v}` : `${v}`),
  },
  {
    id: "contrast",
    name: "Contrast",
    title: "Deepen shadows and highlight shapes",
    description:
      "Expands the difference between light and dark tones for punch and clarity.",
    tab: "basic",
    paramName: "Contrast",
    min: -100,
    max: 100,
    defaultVal: 25,
    formatValue: (v) => (v > 0 ? `+${v}` : `${v}`),
  },
  {
    id: "gamma",
    name: "Gamma Correction",
    title: "Gentle midtone exposure balance",
    description:
      "Applies a power-law curve to gently lift dark midtones without blowing out highlights.",
    tab: "basic",
    paramName: "Gamma",
    min: 0.2,
    max: 2.5,
    defaultVal: 1.2,
    step: 0.1,
    formatValue: (v) => `${v.toFixed(1)}x`,
  },
  {
    id: "threshold",
    name: "Global Thresholding",
    title: "Graphic black & white division",
    description: "Splits pixels sharply into pure black or pure white based on a cutoff level.",
    tab: "basic",
    paramName: "Threshold",
    min: 0,
    max: 255,
    defaultVal: 128,
  },
  {
    id: "adaptive_threshold",
    name: "Adaptive Thresholding",
    title: "Local neighborhood contrast binarization",
    description: "Evaluates surrounding pixels to cleanly segment text or lines under uneven lighting.",
    tab: "basic",
    paramName: "Block Size",
    min: 5,
    max: 45,
    defaultVal: 15,
    step: 2,
  },
  // Enhance
  {
    id: "clahe",
    name: "CLAHE (Adaptive Equalization)",
    title: "Balanced local contrast boost",
    description: "Enhances localized detail across tiles while preventing harsh noise amplification.",
    tab: "enhance",
    paramName: "Clip Limit",
    min: 1,
    max: 5,
    defaultVal: 2.0,
    step: 0.2,
    formatValue: (v) => `${v.toFixed(1)}`,
  },
  {
    id: "hist_eq",
    name: "Histogram Equalization",
    title: "Global dynamic range expansion",
    description: "Distributes tone frequencies evenly across all luminance levels.",
    tab: "enhance",
    paramName: "Intensity",
    min: 0,
    max: 100,
    defaultVal: 100,
    formatValue: (v) => `${v}%`,
  },
  // Color
  {
    id: "hsv_sat",
    name: "Color Saturation",
    title: "Vibrancy and color depth",
    description: "Increases or softens the intensity and purity of all colors.",
    tab: "color",
    paramName: "Saturation",
    min: 0,
    max: 200,
    defaultVal: 120,
    formatValue: (v) => `${v}%`,
  },
  {
    id: "hsv_hue",
    name: "Hue Shift",
    title: "Color spectrum rotation",
    description: "Rotates colors gently around the 360° color wheel.",
    tab: "color",
    paramName: "Hue",
    min: -180,
    max: 180,
    defaultVal: 15,
    formatValue: (v) => `${v > 0 ? "+" : ""}${v}°`,
  },
  {
    id: "sepia",
    name: "Sepia Warmth",
    title: "Warm vintage photographic tint",
    description: "Bathes the photograph in timeless, comforting golden brown tones.",
    tab: "color",
    paramName: "Warmth",
    min: 0,
    max: 100,
    defaultVal: 100,
    formatValue: (v) => `${v}%`,
  },
  {
    id: "grayscale",
    name: "Luminance Grayscale",
    title: "Timeless monochrome",
    description: "Converts color into pure tonal values using standard perceptual weighting.",
    tab: "color",
    paramName: "Monochrome",
    min: 0,
    max: 100,
    defaultVal: 100,
    formatValue: (v) => `${v}%`,
  },
  {
    id: "negative",
    name: "Negative (Invert)",
    title: "Photo film inversion",
    description: "Reverses every light and color value to its chromatic opposite.",
    tab: "color",
    paramName: "Invert",
    min: 0,
    max: 100,
    defaultVal: 100,
    formatValue: (v) => `${v}%`,
  },
];

export default function ImageEditorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    currentImage,
    applyStep,
    setLivePreview,
    isPreviewOn,
    setIsPreviewOn,
    loadImageFromFile,
  } = useStudio();

  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [selectedAdjId, setSelectedAdjId] = useState<string>("brightness");
  const [sliderValue, setSliderValue] = useState<number>(20);

  const currentAdj =
    adjustments.find((a) => a.id === selectedAdjId) || adjustments[0];

  // When tab changes, pick first adjustment of that tab
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const firstInTab = adjustments.find((a) => a.tab === tab);
    if (firstInTab) {
      setSelectedAdjId(firstInTab.id);
      setSliderValue(firstInTab.defaultVal);
    }
  };

  // Run live algorithm preview when slider moves
  useEffect(() => {
    if (!currentImage) return;

    if (!isPreviewOn) {
      setLivePreview(null);
      return;
    }

    try {
      let result: ImageData | null = null;
      switch (selectedAdjId) {
        case "brightness":
          result = applyBrightness(currentImage, sliderValue);
          break;
        case "contrast":
          result = applyContrast(currentImage, sliderValue);
          break;
        case "gamma":
          result = applyGamma(currentImage, sliderValue);
          break;
        case "threshold":
          result = applyGlobalThreshold(currentImage, sliderValue);
          break;
        case "adaptive_threshold":
          result = applyAdaptiveThreshold(currentImage, sliderValue);
          break;
        case "hist_eq":
          result = applyHistogramEqualization(currentImage);
          break;
        case "clahe":
          result = applyCLAHE(currentImage, sliderValue);
          break;
        case "sepia":
          result = applySepia(currentImage);
          break;
        case "grayscale":
          result = applyGrayscale(currentImage);
          break;
        case "negative":
          result = applyNegative(currentImage);
          break;
        case "hsv_sat":
          result = applyHsvAdjustment(currentImage, 0, sliderValue / 100, 1.0);
          break;
        case "hsv_hue":
          result = applyHsvAdjustment(currentImage, sliderValue, 1.0, 1.0);
          break;
      }
      setLivePreview(result);
    } catch (e) {
      console.error("Adjustment preview error:", e);
    }
  }, [currentImage, selectedAdjId, sliderValue, isPreviewOn, setLivePreview]);

  // Apply button committed
  const handleApply = () => {
    if (!currentImage) return;
    let result: ImageData = currentImage;
    const formattedVal = currentAdj.formatValue
      ? currentAdj.formatValue(sliderValue)
      : `${sliderValue}`;
    const label = `${currentAdj.name} ${formattedVal}`;

    switch (selectedAdjId) {
      case "brightness":
        result = applyBrightness(currentImage, sliderValue);
        break;
      case "contrast":
        result = applyContrast(currentImage, sliderValue);
        break;
      case "gamma":
        result = applyGamma(currentImage, sliderValue);
        break;
      case "threshold":
        result = applyGlobalThreshold(currentImage, sliderValue);
        break;
      case "adaptive_threshold":
        result = applyAdaptiveThreshold(currentImage, sliderValue);
        break;
      case "hist_eq":
        result = applyHistogramEqualization(currentImage);
        break;
      case "clahe":
        result = applyCLAHE(currentImage, sliderValue);
        break;
      case "sepia":
        result = applySepia(currentImage);
        break;
      case "grayscale":
        result = applyGrayscale(currentImage);
        break;
      case "negative":
        result = applyNegative(currentImage);
        break;
      case "hsv_sat":
        result = applyHsvAdjustment(currentImage, 0, sliderValue / 100, 1.0);
        break;
      case "hsv_hue":
        result = applyHsvAdjustment(currentImage, sliderValue, 1.0, 1.0);
        break;
    }

    applyStep(label, "editor", selectedAdjId, { value: sliderValue }, result);
  };

  const handleReset = () => {
    setSliderValue(currentAdj.defaultVal);
    setLivePreview(null);
  };

  const handleReplaceImage = () => {
    fileInputRef.current?.click();
  };

  const currentPendingLabel = `${currentAdj.name} ${
    currentAdj.formatValue
      ? currentAdj.formatValue(sliderValue)
      : sliderValue
  }`;

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader
        breadcrumb="Your studio / Image editor"
      />

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

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              Let your photo bloom.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              A little more light, a little more you.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReplaceImage}
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

        {/* Main Workspace: 2-column layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Split Preview + Steps Bar */}
          <div className="lg:col-span-8 space-y-4">
            <BeforeAfterSplit />
            <StepsBar currentPendingLabel={currentPendingLabel} />
          </div>

          {/* Right Column: Adjustment Panel */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                Make it feel right
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Small adjustments can go a long way.
              </p>
            </div>

            {/* Segmented Control Tabs */}
            <div className="grid grid-cols-3 bg-[#F5EFEB] p-1 rounded-xl gap-1 text-xs">
              {(["basic", "enhance", "color"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`py-1.5 rounded-lg font-medium capitalize transition-all ${
                    activeTab === tab
                      ? "bg-white text-[#2D2623] shadow-xs"
                      : "text-[#7A706A] hover:text-[#2D2623]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Adjustment Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="adjustment-select"
                className="text-xs font-semibold text-[#8A8077]"
              >
                Adjustment
              </label>
              <div className="relative">
                <select
                  id="adjustment-select"
                  value={selectedAdjId}
                  onChange={(e) => {
                    setSelectedAdjId(e.target.value);
                    const found = adjustments.find((a) => a.id === e.target.value);
                    if (found) setSliderValue(found.defaultVal);
                  }}
                  className="w-full appearance-none bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#2D2623] focus:outline-none focus:border-[#B8533C] cursor-pointer"
                >
                  {adjustments
                    .filter((a) => a.tab === activeTab)
                    .map((adj) => (
                      <option key={adj.id} value={adj.id}>
                        {adj.name}
                      </option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8077]">
                  ▼
                </span>
              </div>
            </div>

            {/* Descriptive Callout Box (Exact match to Screenshot 2) */}
            <div className="bg-[#FAF1EE] border border-[#F4D4CD] rounded-2xl p-4 space-y-1">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#863422]">
                {currentAdj.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#7A706A] leading-relaxed">
                {currentAdj.description}
              </p>
            </div>

            {/* Slider Control */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#2D2623]">
                  {currentAdj.paramName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF1EE] text-[#B8533C] border border-[#EEC7BC]">
                  {currentAdj.formatValue
                    ? currentAdj.formatValue(sliderValue)
                    : sliderValue}
                </span>
              </div>

              <input
                type="range"
                min={currentAdj.min}
                max={currentAdj.max}
                step={currentAdj.step || 1}
                value={sliderValue}
                onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                aria-label={currentAdj.paramName}
                className="w-full accent-[#B8533C]"
              />

              <div className="flex justify-between text-[10px] text-[#A69D95]">
                <span>{currentAdj.min}</span>
                <span>
                  {currentAdj.min < 0 && currentAdj.max > 0 ? "0" : ""}
                </span>
                <span>{currentAdj.max}</span>
              </div>
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-[#EAE2D6]/70">
              <div>
                <div className="text-xs font-medium text-[#2D2623]">
                  Preview is on
                </div>
                <div className="text-[11px] text-[#8A8077]">
                  See changes before you commit.
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

            {/* Actions: Apply & Reset */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleApply}
                className="w-full bg-[#B8533C] hover:bg-[#A1422E] text-white py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99]"
              >
                Apply {currentAdj.name.toLowerCase()}
              </button>

              <button
                onClick={handleReset}
                className="w-full py-2 text-xs font-semibold text-[#B8533C] hover:text-[#933B2B] transition-colors text-center"
              >
                Reset adjustment
              </button>
            </div>

            <div className="text-center text-[11px] text-[#A69D95] pt-1 border-t border-[#EAE2D6]/60">
              You can always undo a change.
            </div>
          </div>
        </div>

        {/* Reassurance Banner */}
        <ReassuranceBanner />
      </main>
    </div>
  );
}
