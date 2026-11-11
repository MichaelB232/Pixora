"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { BeforeAfterSplit } from "@/components/studio/BeforeAfterSplit";
import { StepsBar } from "@/components/studio/StepsBar";
import { ReassuranceBanner } from "@/components/studio/ReassuranceBanner";
import { useStudio } from "@/lib/image-processing/context";
import {
  applyPencilSketch,
  applyCartoonEffect,
  applyEmboss,
  applyPixelArt,
  applyHalftone,
  applyDuotone,
  applyVignette,
  applyMotionBlur,
  applyGlitch,
  applyPosterization,
} from "@/lib/image-processing/creative";

interface CreativeEffect {
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

const creativeEffects: CreativeEffect[] = [
  {
    id: "sketch",
    name: "Pencil Sketch",
    title: "Hand-drawn graphite illustration",
    description: "Inverts blurred grayscale tones and blends using color-dodge arithmetic for authentic pencil strokes.",
    paramName: "Stroke Softness",
    min: 3,
    max: 15,
    defaultVal: 7,
    step: 2,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "cartoon",
    name: "Cartoon Effect",
    title: "Ink contour lines with flat color fills",
    description: "Combines bilateral edge-preserving smoothing with second-order Laplacian outlines.",
    paramName: "Outline Threshold",
    min: 40,
    max: 140,
    defaultVal: 80,
  },
  {
    id: "duotone",
    name: "Terracotta Duotone",
    title: "Editorial warm terracotta & cream print",
    description: "Maps perceptual luminance into a gradient of warm terracotta clay and handmade paper.",
    paramName: "Color Balance",
    min: 0,
    max: 100,
    defaultVal: 50,
    formatValue: (v) => `${v}%`,
  },
  {
    id: "pixel_art",
    name: "Pixel Art",
    title: "Retro 8-bit downsampled mosaic",
    description: "Downsamples grid blocks and quantizes color palettes to evoke classic digital nostalgia.",
    paramName: "Pixel Block Size",
    min: 4,
    max: 24,
    defaultVal: 8,
    step: 2,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "halftone",
    name: "Halftone Screening",
    title: "Vintage newspaper print dots",
    description: "Simulates continuous tone imagery through variable-size dot matrices on warm paper.",
    paramName: "Dot Matrix Size",
    min: 4,
    max: 16,
    defaultVal: 6,
    step: 1,
    formatValue: (v) => `${v} pt`,
  },
  {
    id: "vignette",
    name: "Warm Vignette",
    title: "Gentle radial lens falloff",
    description: "Applies a quadratic decay from center outwards to naturally draw attention to the subject.",
    paramName: "Edge Darkness",
    min: 10,
    max: 90,
    defaultVal: 50,
    formatValue: (v) => `${v}%`,
  },
  {
    id: "emboss",
    name: "Emboss Relief",
    title: "Sculpted paper bas-relief",
    description: "Convolves directional lighting gradients to simulate raised surface topography.",
    paramName: "Depth Relief",
    min: 0.5,
    max: 3.0,
    defaultVal: 1.0,
    step: 0.1,
    formatValue: (v) => `${v.toFixed(1)}x`,
  },
  {
    id: "motion_blur",
    name: "Motion Streak",
    title: "Linear velocity blur",
    description: "Convolves a horizontal directional line filter to impart visual speed and energy.",
    paramName: "Streak Length",
    min: 3,
    max: 25,
    defaultVal: 9,
    step: 2,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "glitch",
    name: "Chromatic Glitch",
    title: "RGB channel misalignment",
    description: "Shifts red and blue color planes horizontally with subtle scanline modulation.",
    paramName: "Displacement",
    min: 4,
    max: 30,
    defaultVal: 12,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "posterize",
    name: "Posterization",
    title: "Screen-printed tonal steps",
    description: "Quantizes continuous color gradients into distinct graphic tonal plateaus.",
    paramName: "Color Levels",
    min: 2,
    max: 8,
    defaultVal: 4,
    formatValue: (v) => `${v} tones`,
  },
];

export default function CreativeLabPage() {
  const { currentImage, applyStep, setLivePreview, isPreviewOn, setIsPreviewOn } = useStudio();
  const [selectedEffectId, setSelectedEffectId] = useState<string>("sketch");
  const [paramValue, setParamValue] = useState<number>(7);

  const currentEffect =
    creativeEffects.find((e) => e.id === selectedEffectId) || creativeEffects[0];

  useEffect(() => {
    if (!currentImage) return;

    if (!isPreviewOn) {
      setLivePreview(null);
      return;
    }

    try {
      let result: ImageData | null = null;
      switch (selectedEffectId) {
        case "sketch":
          result = applyPencilSketch(currentImage, paramValue);
          break;
        case "cartoon":
          result = applyCartoonEffect(currentImage, paramValue);
          break;
        case "duotone":
          result = applyDuotone(currentImage);
          break;
        case "pixel_art":
          result = applyPixelArt(currentImage, paramValue, 8);
          break;
        case "halftone":
          result = applyHalftone(currentImage, paramValue);
          break;
        case "vignette":
          result = applyVignette(currentImage, paramValue / 100);
          break;
        case "emboss":
          result = applyEmboss(currentImage, paramValue);
          break;
        case "motion_blur":
          result = applyMotionBlur(currentImage, paramValue);
          break;
        case "glitch":
          result = applyGlitch(currentImage, paramValue);
          break;
        case "posterize":
          result = applyPosterization(currentImage, paramValue);
          break;
      }
      setLivePreview(result);
    } catch (e) {
      console.error("Creative effect preview error:", e);
    }
  }, [currentImage, selectedEffectId, paramValue, isPreviewOn, setLivePreview]);

  const handleApply = () => {
    if (!currentImage) return;
    let result = currentImage;
    const formattedVal = currentEffect.formatValue
      ? currentEffect.formatValue(paramValue)
      : `${paramValue}`;
    const label = `${currentEffect.name} (${formattedVal})`;

    switch (selectedEffectId) {
      case "sketch":
        result = applyPencilSketch(currentImage, paramValue);
        break;
      case "cartoon":
        result = applyCartoonEffect(currentImage, paramValue);
        break;
      case "duotone":
        result = applyDuotone(currentImage);
        break;
      case "pixel_art":
        result = applyPixelArt(currentImage, paramValue, 8);
        break;
      case "halftone":
        result = applyHalftone(currentImage, paramValue);
        break;
      case "vignette":
        result = applyVignette(currentImage, paramValue / 100);
        break;
      case "emboss":
        result = applyEmboss(currentImage, paramValue);
        break;
      case "motion_blur":
        result = applyMotionBlur(currentImage, paramValue);
        break;
      case "glitch":
        result = applyGlitch(currentImage, paramValue);
        break;
      case "posterize":
        result = applyPosterization(currentImage, paramValue);
        break;
    }

    applyStep(label, "creative", selectedEffectId, { value: paramValue }, result);
  };

  const handleReset = () => {
    setParamValue(currentEffect.defaultVal);
    setLivePreview(null);
  };

  const currentPendingLabel = `${currentEffect.name} ${
    currentEffect.formatValue ? currentEffect.formatValue(paramValue) : paramValue
  }`;

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader
        breadcrumb="Your studio / Creative lab"
      />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              Play with expression.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              Explore sketches, duotones, halftones, and artistic stylizations.
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
                Artistic Style
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Pick a creative transformation.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="creative-effect-select"
                className="text-xs font-semibold text-[#8A8077]"
              >
                Effect
              </label>
              <div className="relative">
                <select
                  id="creative-effect-select"
                  value={selectedEffectId}
                  onChange={(e) => {
                    setSelectedEffectId(e.target.value);
                    const found = creativeEffects.find((ef) => ef.id === e.target.value);
                    if (found) setParamValue(found.defaultVal);
                  }}
                  className="w-full appearance-none bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#2D2623] focus:outline-none focus:border-[#B8533C] cursor-pointer"
                >
                  {creativeEffects.map((ef) => (
                    <option key={ef.id} value={ef.id}>
                      {ef.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8077]">
                  ▼
                </span>
              </div>
            </div>

            <div className="bg-[#FAF1EE] border border-[#F4D4CD] rounded-2xl p-4 space-y-1">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#863422]">
                {currentEffect.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#7A706A] leading-relaxed">
                {currentEffect.description}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#2D2623]">
                  {currentEffect.paramName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF1EE] text-[#B8533C] border border-[#EEC7BC]">
                  {currentEffect.formatValue
                    ? currentEffect.formatValue(paramValue)
                    : paramValue}
                </span>
              </div>

              <input
                type="range"
                min={currentEffect.min}
                max={currentEffect.max}
                step={currentEffect.step || 1}
                value={paramValue}
                onChange={(e) => setParamValue(parseFloat(e.target.value))}
                aria-label={currentEffect.paramName}
                className="w-full accent-[#B8533C]"
              />

              <div className="flex justify-between text-[10px] text-[#A69D95]">
                <span>{currentEffect.min}</span>
                <span>{currentEffect.max}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#EAE2D6]/70">
              <div>
                <div className="text-xs font-medium text-[#2D2623]">
                  Preview is on
                </div>
                <div className="text-[11px] text-[#8A8077]">
                  Render visual effects in real time.
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

            <div className="space-y-2 pt-2">
              <button
                onClick={handleApply}
                className="w-full bg-[#B8533C] hover:bg-[#A1422E] text-white py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99]"
              >
                Apply {currentEffect.name.toLowerCase()}
              </button>

              <button
                onClick={handleReset}
                className="w-full py-2 text-xs font-semibold text-[#B8533C] hover:text-[#933B2B] transition-colors text-center"
              >
                Reset effect
              </button>
            </div>
          </div>
        </div>

        <ReassuranceBanner
          title="Designed for curiosity."
          description="Try combining multiple creative effects in sequence! For example, apply a gentle vignette after a pencil sketch."
        />
      </main>
    </div>
  );
}
