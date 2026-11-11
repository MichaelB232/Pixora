"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { BeforeAfterSplit } from "@/components/studio/BeforeAfterSplit";
import { StepsBar } from "@/components/studio/StepsBar";
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

type VisionCategory = "edges" | "morphology" | "segmentation";

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
  // Edges
  {
    id: "canny",
    name: "Canny Edge Detection",
    title: "Multi-stage optimal edge detection",
    description: "Applies Gaussian smoothing, gradient directional analysis, non-maximum suppression, and hysteresis thresholding.",
    category: "edges",
    paramName: "Upper Threshold",
    min: 30,
    max: 120,
    defaultVal: 70,
  },
  {
    id: "sobel",
    name: "Sobel Operator",
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
    name: "Prewitt Operator",
    title: "Discrete differentiation edge detector",
    description: "Computes discrete directional approximations of gradient vectors for contour extraction.",
    category: "edges",
    paramName: "Sensitivity",
    min: 1,
    max: 10,
    defaultVal: 5,
  },
  {
    id: "laplacian",
    name: "Laplacian Operator",
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
    name: "Morphological Erosion",
    title: "Erode foreground boundaries",
    description: "Replaces pixel values with the local minimum in a structuring element, thinning light regions.",
    category: "morphology",
    paramName: "Structuring Element Radius",
    min: 1,
    max: 4,
    defaultVal: 1,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "dilation",
    name: "Morphological Dilation",
    title: "Expand foreground boundaries",
    description: "Replaces pixel values with the local maximum in a structuring element, filling dark voids.",
    category: "morphology",
    paramName: "Structuring Element Radius",
    min: 1,
    max: 4,
    defaultVal: 1,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "opening",
    name: "Morphological Opening",
    title: "Erosion followed by Dilation",
    description: "Eliminates small bright noise specks and thin protrusions without altering overall object size.",
    category: "morphology",
    paramName: "Structuring Element Radius",
    min: 1,
    max: 4,
    defaultVal: 1,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "closing",
    name: "Morphological Closing",
    title: "Dilation followed by Erosion",
    description: "Fills narrow channels, small holes, and breaks in contours while preserving outer shapes.",
    category: "morphology",
    paramName: "Structuring Element Radius",
    min: 1,
    max: 4,
    defaultVal: 1,
    formatValue: (v) => `${v} px`,
  },
  // Segmentation
  {
    id: "contour",
    name: "Contour Highlighting",
    title: "Terracotta boundary extraction",
    description: "Detects connected boundary paths and highlights them in warm terracotta over the image.",
    category: "segmentation",
    paramName: "Contour Threshold",
    min: 20,
    max: 100,
    defaultVal: 50,
  },
  {
    id: "watershed",
    name: "Watershed Region Map",
    title: "Topological marker segmentation",
    description: "Treats image luminance as a topographic relief map to segment distinct watershed catchment basins.",
    category: "segmentation",
    paramName: "Basin Clusters",
    min: 3,
    max: 8,
    defaultVal: 5,
    formatValue: (v) => `${v} regions`,
  },
  {
    id: "hsv_seg",
    name: "HSV Color Segmentation",
    title: "Targeted chromatic mask",
    description: "Isolates specific color hues (such as pink floral tones) while desaturating the background.",
    category: "segmentation",
    paramName: "Hue Center Angle",
    min: 0,
    max: 360,
    defaultVal: 345,
    formatValue: (v) => `${v}°`,
  },
];

export default function ComputerVisionPage() {
  const { currentImage, applyStep, setLivePreview, isPreviewOn, setIsPreviewOn } = useStudio();
  const [activeCategory, setActiveCategory] = useState<VisionCategory>("edges");
  const [selectedMethodId, setSelectedMethodId] = useState<string>("canny");
  const [paramValue, setParamValue] = useState<number>(70);

  const currentMethod =
    visionMethods.find((m) => m.id === selectedMethodId) || visionMethods[0];

  const handleCategoryChange = (cat: VisionCategory) => {
    setActiveCategory(cat);
    const firstInCat = visionMethods.find((m) => m.category === cat);
    if (firstInCat) {
      setSelectedMethodId(firstInCat.id);
      setParamValue(firstInCat.defaultVal);
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
      switch (selectedMethodId) {
        case "canny":
          result = applyCanny(currentImage, paramValue * 0.4, paramValue);
          break;
        case "sobel":
          result = applySobel(currentImage);
          break;
        case "prewitt":
          result = applyPrewitt(currentImage);
          break;
        case "laplacian":
          result = applyLaplacian(currentImage);
          break;
        case "erosion":
          result = applyErosion(currentImage, paramValue);
          break;
        case "dilation":
          result = applyDilation(currentImage, paramValue);
          break;
        case "opening":
          result = applyOpening(currentImage, paramValue);
          break;
        case "closing":
          result = applyClosing(currentImage, paramValue);
          break;
        case "contour":
          result = applyContourDetection(currentImage, paramValue);
          break;
        case "watershed":
          result = applyWatershed(currentImage, paramValue);
          break;
        case "hsv_seg":
          result = applyHsvColorSegmentation(
            currentImage,
            (paramValue - 25 + 360) % 360,
            (paramValue + 25) % 360,
            15,
            100
          );
          break;
      }
      setLivePreview(result);
    } catch (e) {
      console.error("Vision preview error:", e);
    }
  }, [currentImage, selectedMethodId, paramValue, isPreviewOn, setLivePreview]);

  const handleApply = () => {
    if (!currentImage) return;
    let result = currentImage;
    const formattedVal = currentMethod.formatValue
      ? currentMethod.formatValue(paramValue)
      : `${paramValue}`;
    const label = `${currentMethod.name} (${formattedVal})`;

    switch (selectedMethodId) {
      case "canny":
        result = applyCanny(currentImage, paramValue * 0.4, paramValue);
        break;
      case "sobel":
        result = applySobel(currentImage);
        break;
      case "prewitt":
        result = applyPrewitt(currentImage);
        break;
      case "laplacian":
        result = applyLaplacian(currentImage);
        break;
      case "erosion":
        result = applyErosion(currentImage, paramValue);
        break;
      case "dilation":
        result = applyDilation(currentImage, paramValue);
        break;
      case "opening":
        result = applyOpening(currentImage, paramValue);
        break;
      case "closing":
        result = applyClosing(currentImage, paramValue);
        break;
      case "contour":
        result = applyContourDetection(currentImage, paramValue);
        break;
      case "watershed":
        result = applyWatershed(currentImage, paramValue);
        break;
      case "hsv_seg":
        result = applyHsvColorSegmentation(
          currentImage,
          (paramValue - 25 + 360) % 360,
          (paramValue + 25) % 360,
          15,
          100
        );
        break;
    }

    applyStep(label, "vision", selectedMethodId, { value: paramValue }, result);
  };

  const handleReset = () => {
    setParamValue(currentMethod.defaultVal);
    setLivePreview(null);
  };

  const currentPendingLabel = `${currentMethod.name} ${
    currentMethod.formatValue ? currentMethod.formatValue(paramValue) : paramValue
  }`;

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader
        breadcrumb="Your studio / Computer vision"
      />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              Look a little closer.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              Extract edges, examine morphology, and segment visual structures.
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
                Computer Vision Analysis
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Understand geometric and boundary structures.
              </p>
            </div>

            {/* Category tabs */}
            <div className="grid grid-cols-3 bg-[#F5EFEB] p-1 rounded-xl gap-1 text-xs">
              {(["edges", "morphology", "segmentation"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`py-1.5 rounded-lg font-medium capitalize transition-all ${
                    activeCategory === cat
                      ? "bg-white text-[#2D2623] shadow-xs"
                      : "text-[#7A706A] hover:text-[#2D2623]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Method Select */}
            <div className="space-y-1.5">
              <label
                htmlFor="vision-method-select"
                className="text-xs font-semibold text-[#8A8077]"
              >
                Algorithm
              </label>
              <div className="relative">
                <select
                  id="vision-method-select"
                  value={selectedMethodId}
                  onChange={(e) => {
                    setSelectedMethodId(e.target.value);
                    const found = visionMethods.find((m) => m.id === e.target.value);
                    if (found) setParamValue(found.defaultVal);
                  }}
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

            {/* Descriptive Callout */}
            <div className="bg-[#FAF1EE] border border-[#F4D4CD] rounded-2xl p-4 space-y-1">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#863422]">
                {currentMethod.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#7A706A] leading-relaxed">
                {currentMethod.description}
              </p>
            </div>

            {/* Slider */}
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

            {/* Preview Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-[#EAE2D6]/70">
              <div>
                <div className="text-xs font-medium text-[#2D2623]">
                  Preview is on
                </div>
                <div className="text-[11px] text-[#8A8077]">
                  View edge map and segmentation instantly.
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
                Apply {currentMethod.name.toLowerCase()}
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
          title="Analytical vision made approachable."
          description="Edge maps and morphological operations highlight internal boundaries without destroying your session history."
        />
      </main>
    </div>
  );
}
