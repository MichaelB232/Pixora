"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { ReassuranceBanner } from "@/components/studio/ReassuranceBanner";
import { useStudio } from "@/lib/image-processing/context";
import {
  applySobel,
  applyPrewitt,
  applyLaplacian,
  applyCanny,
  applyErosion,
  applyDilation,
  applyOpening,
  applyClosing,
  applyContourDetection,
  applyWatershed,
  applyHsvColorSegmentation,
} from "@/lib/image-processing/vision";

type VisionCategory = "edges" | "morphology" | "contours" | "segmentation";

interface VisionMethod {
  id: string;
  name: string;
  title: string;
  description: string;
  category: VisionCategory;
  paramName: string;
  min: number;
  max: number;
  defaultVal: number;
  step?: number;
  formatValue?: (v: number) => string;
}

const visionMethods: VisionMethod[] = [
  // Edge Detection
  {
    id: "canny",
    name: "Canny edge detection",
    title: "Find where light changes sharply.",
    description: "White lines show detected edges. Black areas have no detected edge.",
    category: "edges",
    paramName: "Upper threshold",
    min: 30,
    max: 200,
    defaultVal: 150,
  },
  {
    id: "sobel",
    name: "Sobel operator",
    title: "First-order spatial gradient magnitude",
    description: "Convolves 3×3 horizontal and vertical differential masks to highlight boundary rate of change.",
    category: "edges",
    paramName: "Gradient Sensitivity",
    min: 1,
    max: 10,
    defaultVal: 5,
  },
  {
    id: "prewitt",
    name: "Prewitt operator",
    title: "Discrete differentiation edge detector",
    description: "Computes directional approximations of gradient vectors for contour extraction.",
    category: "edges",
    paramName: "Sensitivity",
    min: 1,
    max: 10,
    defaultVal: 5,
  },
  {
    id: "laplacian",
    name: "Laplacian operator",
    title: "Second-order isotropic derivative",
    description: "Detects rapid intensity transitions and zero-crossings across all spatial orientations.",
    category: "edges",
    paramName: "Edge Gain",
    min: 1,
    max: 10,
    defaultVal: 5,
  },
  // Morphology
  {
    id: "erosion",
    name: "Morphological erosion",
    title: "Erode foreground boundaries",
    description: "Replaces pixel values with the local minimum in a structuring element, thinning light regions.",
    category: "morphology",
    paramName: "Kernel Radius",
    min: 1,
    max: 4,
    defaultVal: 1,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "dilation",
    name: "Morphological dilation",
    title: "Expand foreground boundaries",
    description: "Replaces pixel values with the local maximum in a structuring element, filling dark voids.",
    category: "morphology",
    paramName: "Kernel Radius",
    min: 1,
    max: 4,
    defaultVal: 1,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "opening",
    name: "Morphological opening",
    title: "Erosion followed by Dilation",
    description: "Eliminates small bright noise specks and thin protrusions without altering overall object size.",
    category: "morphology",
    paramName: "Kernel Radius",
    min: 1,
    max: 4,
    defaultVal: 1,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "closing",
    name: "Morphological closing",
    title: "Dilation followed by Erosion",
    description: "Fills small dark holes, gaps, and cracks within foreground features.",
    category: "morphology",
    paramName: "Kernel Radius",
    min: 1,
    max: 4,
    defaultVal: 1,
    formatValue: (v) => `${v} px`,
  },
  // Contours
  {
    id: "contour",
    name: "Contour boundary tracing",
    title: "Closed perimeter detection",
    description: "Extracts continuous boundaries of connected components and draws outline traces.",
    category: "contours",
    paramName: "Threshold",
    min: 30,
    max: 200,
    defaultVal: 100,
  },
  // Segmentation
  {
    id: "watershed",
    name: "Watershed segmentation",
    title: "Topological gradient basin division",
    description: "Treats image luminance as topographic elevation to divide pixels into catchment basins.",
    category: "segmentation",
    paramName: "Basin Sensitivity",
    min: 10,
    max: 60,
    defaultVal: 30,
  },
  {
    id: "hsv_seg",
    name: "HSV color segmentation",
    title: "Selective chromatic extraction",
    description: "Isolates and highlights specific color bands while masking away distracting background hues.",
    category: "segmentation",
    paramName: "Target Hue",
    min: 0,
    max: 360,
    defaultVal: 340,
    formatValue: (v) => `${v}°`,
  },
];

export default function ComputerVisionPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  const {
    currentImage,
    originalImage,
    metadata,
    applyStep,
    setLivePreview,
    isPreviewOn,
    loadImageFromFile,
  } = useStudio();

  const [activeCategory, setActiveCategory] = useState<VisionCategory>("edges");
  const [selectedMethodId, setSelectedMethodId] = useState<string>("canny");

  // Dual Threshold parameters for Canny (Figma 6:535 & 6:538)
  const [lowerThreshold, setLowerThreshold] = useState<number>(50);
  const [upperThreshold, setUpperThreshold] = useState<number>(150);
  const [paramValue, setParamValue] = useState<number>(5);
  const [smoothingMode, setSmoothingMode] = useState<string>("5x5");

  const currentMethod =
    visionMethods.find((m) => m.id === selectedMethodId) || visionMethods[0];

  const activeImage = currentImage || originalImage;

  // Render Source Canvas
  useEffect(() => {
    if (!activeImage || !sourceCanvasRef.current) return;
    const canvas = sourceCanvasRef.current;
    canvas.width = activeImage.width;
    canvas.height = activeImage.height;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.putImageData(activeImage, 0, 0);
  }, [activeImage]);

  // Compute live Vision Result
  useEffect(() => {
    if (!activeImage || !resultCanvasRef.current) return;

    try {
      let result: ImageData | null = null;
      switch (selectedMethodId) {
        case "canny":
          result = applyCanny(activeImage, lowerThreshold, upperThreshold);
          break;
        case "sobel":
          result = applySobel(activeImage);
          break;
        case "prewitt":
          result = applyPrewitt(activeImage);
          break;
        case "laplacian":
          result = applyLaplacian(activeImage);
          break;
        case "erosion":
          result = applyErosion(activeImage, paramValue);
          break;
        case "dilation":
          result = applyDilation(activeImage, paramValue);
          break;
        case "opening":
          result = applyOpening(activeImage, paramValue);
          break;
        case "closing":
          result = applyClosing(activeImage, paramValue);
          break;
        case "contour":
          result = applyContourDetection(activeImage, lowerThreshold);
          break;
        case "watershed":
          result = applyWatershed(activeImage, paramValue * 5);
          break;
        case "hsv_seg":
          result = applyHsvColorSegmentation(
            activeImage,
            (paramValue - 25 + 360) % 360,
            (paramValue + 25) % 360,
            15,
            100
          );
          break;
      }

      if (result) {
        const canvas = resultCanvasRef.current;
        canvas.width = result.width;
        canvas.height = result.height;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.putImageData(result, 0, 0);
      }
    } catch (e) {
      console.error("Vision calculation error:", e);
    }
  }, [
    activeImage,
    selectedMethodId,
    lowerThreshold,
    upperThreshold,
    paramValue,
    smoothingMode,
  ]);

  const handleCategorySelect = (category: VisionCategory) => {
    setActiveCategory(category);
    const firstInCat = visionMethods.find((m) => m.category === category);
    if (firstInCat) {
      setSelectedMethodId(firstInCat.id);
    }
  };

  const handleApply = () => {
    if (!activeImage) return;
    let result: ImageData = activeImage;
    let label = currentMethod.name;

    switch (selectedMethodId) {
      case "canny":
        result = applyCanny(activeImage, lowerThreshold, upperThreshold);
        label = `Canny Edge (L:${lowerThreshold} / U:${upperThreshold})`;
        break;
      case "sobel":
        result = applySobel(activeImage);
        break;
      case "prewitt":
        result = applyPrewitt(activeImage);
        break;
      case "laplacian":
        result = applyLaplacian(activeImage);
        break;
      case "erosion":
        result = applyErosion(activeImage, paramValue);
        break;
      case "dilation":
        result = applyDilation(activeImage, paramValue);
        break;
      case "opening":
        result = applyOpening(activeImage, paramValue);
        break;
      case "closing":
        result = applyClosing(activeImage, paramValue);
        break;
      case "contour":
        result = applyContourDetection(activeImage, lowerThreshold);
        break;
      case "watershed":
        result = applyWatershed(activeImage, paramValue * 5);
        break;
      case "hsv_seg":
        result = applyHsvColorSegmentation(
          activeImage,
          (paramValue - 25 + 360) % 360,
          (paramValue + 25) % 360,
          15,
          100
        );
        break;
    }

    applyStep(label, "vision", selectedMethodId, { lowerThreshold, upperThreshold, paramValue }, result);
  };

  const handleReset = () => {
    setLowerThreshold(50);
    setUpperThreshold(150);
    setParamValue(currentMethod.defaultVal);
  };

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader breadcrumb="Your studio / Computer vision" />

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
        {/* Header Title Bar - Figma 6:112 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              See what’s beneath the surface.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              Explore the shapes and patterns hiding in your image.
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
              <span>Export edge map</span>
              <span>↓</span>
            </Link>
          </div>
        </div>

        {/* Vision Category Segmented Tabs (Figma 6:514) */}
        <div className="bg-[#F5EFEB] p-1.5 rounded-2xl border border-[#EAE2D6] flex flex-wrap gap-1">
          {(
            [
              { id: "edges", label: "Edge detection" },
              { id: "morphology", label: "Morphology" },
              { id: "contours", label: "Contours" },
              { id: "segmentation", label: "Segmentation" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-white text-[#2D2623] shadow-card font-serif font-bold"
                  : "text-[#7A706A] hover:text-[#2D2623]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Dual Layout: Side-by-Side Images (Left) + Controls (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Side-by-Side Source vs Edge Map (Figma 6:520) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl border border-[#EAE2D6] p-4 sm:p-6 shadow-card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source Column */}
                <div className="space-y-2">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EAE2D6] flex items-center justify-center">
                    <canvas ref={sourceCanvasRef} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="text-xs text-[#7A706A] px-1 font-medium">
                    Original · {metadata.name}
                  </div>
                </div>

                {/* Edge Map / Vision Output Column */}
                <div className="space-y-2">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#1E1917] border border-[#EAE2D6] flex items-center justify-center">
                    <canvas ref={resultCanvasRef} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="text-xs text-[#2D2623] px-1 font-bold">
                    {currentMethod.name} output
                  </div>
                </div>
              </div>
            </div>

            {/* Understanding the result Card (Figma 6:549) */}
            <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-3xl p-5 sm:p-6 space-y-1.5 shadow-xs">
              <h3 className="font-serif font-bold text-base text-[#2D2623]">
                What am I looking at?
              </h3>
              <p className="text-xs sm:text-sm text-[#7A706A] leading-relaxed">
                Edges reveal boundaries, not named objects. Try changing the thresholds to see how
                fine details appear or disappear.
              </p>
            </div>
          </div>

          {/* Right Column: Controls Panel (Figma 6:525) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                Get to know your edges
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Adjust parameters to isolate shape boundaries.
              </p>
            </div>

            {/* Algorithm Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="vision-algo-select"
                className="text-xs font-semibold text-[#8A8077]"
              >
                Algorithm
              </label>
              <div className="relative">
                <select
                  id="vision-algo-select"
                  value={selectedMethodId}
                  onChange={(e) => setSelectedMethodId(e.target.value)}
                  className="w-full appearance-none bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#2D2623] focus:outline-none focus:border-[#B8533C] cursor-pointer"
                >
                  {visionMethods
                    .filter((m) => m.category === activeCategory)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8077]">
                  ▼
                </span>
              </div>
            </div>

            {/* Algorithm Explanation Callout (Figma 6:531) */}
            <div className="bg-[#FAF1EE] border border-[#F4D4CD] rounded-2xl p-4 space-y-1">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#863422]">
                {currentMethod.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#7A706A] leading-relaxed">
                {currentMethod.description}
              </p>
            </div>

            {/* Threshold Cards for Canny (Figma 6:535 & 6:538) */}
            {selectedMethodId === "canny" ? (
              <div className="space-y-3 pt-1">
                <div className="text-xs font-semibold text-[#2D2623]">Thresholds</div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Lower Threshold Card */}
                  <div className="p-3.5 bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#7A706A]">Lower</div>
                    <div className="font-serif font-bold text-2xl text-[#2D2623]">
                      {lowerThreshold}
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      value={lowerThreshold}
                      onChange={(e) => setLowerThreshold(parseInt(e.target.value))}
                      className="w-full accent-[#B8533C]"
                      title="Adjust lower threshold"
                    />
                  </div>

                  {/* Upper Threshold Card */}
                  <div className="p-3.5 bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#7A706A]">Upper</div>
                    <div className="font-serif font-bold text-2xl text-[#2D2623]">
                      {upperThreshold}
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={250}
                      value={upperThreshold}
                      onChange={(e) => setUpperThreshold(parseInt(e.target.value))}
                      className="w-full accent-[#B8533C]"
                      title="Adjust upper threshold"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-[#8A8077] italic">
                  Higher values keep only stronger edges.
                </p>

                {/* Gaussian smoothing selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-[#8A8077]">
                    Gaussian smoothing
                  </label>
                  <select
                    value={smoothingMode}
                    onChange={(e) => setSmoothingMode(e.target.value)}
                    className="w-full appearance-none bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-[#2D2623] focus:outline-none"
                  >
                    <option value="5x5">5 × 5 kernel · sigma 1.4</option>
                    <option value="3x3">3 × 3 kernel · sigma 1.0</option>
                    <option value="7x7">7 × 7 kernel · sigma 2.0</option>
                  </select>
                </div>
              </div>
            ) : (
              /* Non-Canny Parameter Slider */
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#2D2623]">
                    {currentMethod.paramName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF1EE] text-[#B8533C] border border-[#EEC7BC]">
                    {currentMethod.formatValue
                      ? currentMethod.formatValue(paramValue)
                      : paramValue}
                  </span>
                </div>

                <input
                  type="range"
                  min={currentMethod.min}
                  max={currentMethod.max}
                  step={currentMethod.step || 1}
                  value={paramValue}
                  onChange={(e) => setParamValue(parseFloat(e.target.value))}
                  aria-label={currentMethod.paramName}
                  className="w-full accent-[#B8533C]"
                />

                <div className="flex justify-between text-[10px] text-[#A69D95]">
                  <span>{currentMethod.min}</span>
                  <span>{currentMethod.max}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#EAE2D6]/70">
              <button
                onClick={handleApply}
                className="w-full bg-[#B8533C] hover:bg-[#A1422E] text-white py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99]"
              >
                Apply {currentMethod.name.toLowerCase()}
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

        {/* Experiment Encouragement Banner (Figma 6:552) */}
        <ReassuranceBanner
          title="A little experiment is a good way to learn."
          description="Compare with your original, change one setting at a time, and follow your curiosity."
        />
      </main>
    </div>
  );
}
