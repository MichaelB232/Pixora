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
    id: "duotone",
    name: "Duotone",
    title: "Two colors. A new mood.",
    description: "Duotone maps shadows and highlights to a pair of colors you choose.",
    paramName: "Color Balance",
    min: 0,
    max: 100,
    defaultVal: 50,
    formatValue: (v) => `${v}%`,
  },
  {
    id: "sketch",
    name: "Pencil Sketch",
    title: "Soft, hand-drawn charm",
    description: "Inverts blurred tones and blends using color-dodge arithmetic for authentic pencil strokes.",
    paramName: "Stroke Softness",
    min: 3,
    max: 15,
    defaultVal: 7,
    step: 2,
    formatValue: (v) => `${v} px`,
  },
  {
    id: "posterize",
    name: "Posterization",
    title: "Bold blocks of color",
    description: "Quantizes continuous color gradients into distinct graphic tonal plateaus.",
    paramName: "Color Levels",
    min: 2,
    max: 8,
    defaultVal: 4,
    formatValue: (v) => `${v} tones`,
  },
  {
    id: "cartoon",
    name: "Cartoon Effect",
    title: "Ink contour lines with flat color fills",
    description: "Combines bilateral edge-preserving smoothing with clean illustrative outlines.",
    paramName: "Outline Threshold",
    min: 40,
    max: 140,
    defaultVal: 80,
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
];

interface PalettePair {
  id: string;
  name: string;
  shadow: string;
  highlight: string;
}

const suggestedPalettes: PalettePair[] = [
  { id: "plum-peach", name: "Plum & Peach", shadow: "#4C2A4A", highlight: "#F9C8A1" },
  { id: "forest-ochre", name: "Forest & Ochre", shadow: "#264653", highlight: "#E9C46A" },
  { id: "terracotta-linen", name: "Terracotta & Linen", shadow: "#863422", highlight: "#F4ECE1" },
  { id: "midnight-coral", name: "Midnight & Coral", shadow: "#1D3557", highlight: "#F4A261" },
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [76, 42, 74];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export default function CreativeLabPage() {
  const { currentImage, applyStep, setLivePreview, isPreviewOn } = useStudio();
  const [selectedEffectId, setSelectedEffectId] = useState<string>("duotone");
  const [paramValue, setParamValue] = useState<number>(50);

  // Duotone custom palette states
  const [shadowColor, setShadowColor] = useState<string>("#4C2A4A");
  const [highlightColor, setHighlightColor] = useState<string>("#F9C8A1");

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
        case "duotone":
          result = applyDuotone(
            currentImage,
            hexToRgb(shadowColor),
            hexToRgb(highlightColor)
          );
          break;
        case "sketch":
          result = applyPencilSketch(currentImage, paramValue);
          break;
        case "cartoon":
          result = applyCartoonEffect(currentImage, paramValue);
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
  }, [
    currentImage,
    selectedEffectId,
    paramValue,
    shadowColor,
    highlightColor,
    isPreviewOn,
    setLivePreview,
  ]);

  const handleApply = () => {
    if (!currentImage) return;
    let result = currentImage;
    let label = "";

    if (selectedEffectId === "duotone") {
      result = applyDuotone(currentImage, hexToRgb(shadowColor), hexToRgb(highlightColor));
      label = `Duotone (${shadowColor} / ${highlightColor})`;
    } else {
      const formattedVal = currentEffect.formatValue
        ? currentEffect.formatValue(paramValue)
        : `${paramValue}`;
      label = `${currentEffect.name} (${formattedVal})`;

      switch (selectedEffectId) {
        case "sketch":
          result = applyPencilSketch(currentImage, paramValue);
          break;
        case "cartoon":
          result = applyCartoonEffect(currentImage, paramValue);
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
    }

    applyStep(label, "creative", selectedEffectId, { shadowColor, highlightColor, paramValue }, result);
  };

  const handleReset = () => {
    if (selectedEffectId === "duotone") {
      setShadowColor("#4C2A4A");
      setHighlightColor("#F9C8A1");
    } else {
      setParamValue(currentEffect.defaultVal);
    }
    setLivePreview(null);
  };

  const selectInspiration = (effectId: string) => {
    setSelectedEffectId(effectId);
    const found = creativeEffects.find((ef) => ef.id === effectId);
    if (found) setParamValue(found.defaultVal);
  };

  const currentPendingLabel =
    selectedEffectId === "duotone"
      ? `Duotone (${shadowColor} · ${highlightColor})`
      : `${currentEffect.name} ${
          currentEffect.formatValue ? currentEffect.formatValue(paramValue) : paramValue
        }`;

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader breadcrumb="Your studio / Creative lab" />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8 pb-16">
        {/* Title Bar - Matching Figma 6:57 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              Follow your playful side.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              One photo. So many ways to see it.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/studio/editor"
              className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98]"
            >
              Replace image
            </Link>
            <Link
              href="/studio/export"
              className="bg-[#B8533C] hover:bg-[#A1422E] text-white px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98] inline-flex items-center gap-1.5"
            >
              <span>Export image</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Main 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Split Preview + Steps */}
          <div className="lg:col-span-8 space-y-4">
            <BeforeAfterSplit />
            <StepsBar currentPendingLabel={currentPendingLabel} />
          </div>

          {/* Right Column: Creative Controls Panel */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                {selectedEffectId === "duotone" ? "Two colors. A new mood." : currentEffect.name}
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5 leading-relaxed">
                {currentEffect.description}
              </p>
            </div>

            {/* Effect Dropdown Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="creative-effect-select"
                className="text-xs font-semibold text-[#8A8077]"
              >
                Style Mode
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

            {/* DUOTONE SPECIFIC CONTROLS (Figma 6:459) */}
            {selectedEffectId === "duotone" ? (
              <div className="space-y-4 pt-1">
                <div className="text-xs font-semibold text-[#2D2623]">Your palette</div>

                {/* Shadow & Highlight Swatch Pickers */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl flex items-center gap-3">
                    <input
                      type="color"
                      value={shadowColor}
                      onChange={(e) => setShadowColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-[#EAE2D6] p-0.5 bg-white"
                      title="Pick shadow color"
                    />
                    <div>
                      <div className="text-[11px] font-medium text-[#7A706A]">Shadow</div>
                      <div className="text-xs font-bold font-mono text-[#2D2623] uppercase">
                        {shadowColor}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl flex items-center gap-3">
                    <input
                      type="color"
                      value={highlightColor}
                      onChange={(e) => setHighlightColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-[#EAE2D6] p-0.5 bg-white"
                      title="Pick highlight color"
                    />
                    <div>
                      <div className="text-[11px] font-medium text-[#7A706A]">Highlight</div>
                      <div className="text-xs font-bold font-mono text-[#2D2623] uppercase">
                        {highlightColor}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suggested Pairings (Figma 6:471) */}
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold text-[#8A8077]">Try another pairing</div>
                  <div className="grid grid-cols-4 gap-2">
                    {suggestedPalettes.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setShadowColor(p.shadow);
                          setHighlightColor(p.highlight);
                        }}
                        title={p.name}
                        className={`h-11 rounded-xl border overflow-hidden flex transition-all hover:scale-105 ${
                          shadowColor === p.shadow && highlightColor === p.highlight
                            ? "ring-2 ring-[#B8533C] border-transparent"
                            : "border-[#EAE2D6]"
                        }`}
                      >
                        <div className="w-1/2 h-full" style={{ backgroundColor: p.shadow }} />
                        <div className="w-1/2 h-full" style={{ backgroundColor: p.highlight }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duotone Guidance Box */}
                <div className="bg-[#FAF1EE] border border-[#F4D4CD] rounded-2xl p-4 space-y-1">
                  <div className="font-serif font-bold text-xs text-[#863422]">
                    Make it yours, one pair at a time.
                  </div>
                  <div className="text-[11px] text-[#7A706A] leading-relaxed">
                    Your original colors are always a step back.
                  </div>
                </div>
              </div>
            ) : (
              /* SLIDER CONTROLS FOR OTHER CREATIVE EFFECTS */
              <div className="space-y-4 pt-1">
                <div className="bg-[#FAF1EE] border border-[#F4D4CD] rounded-2xl p-4 space-y-1">
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-[#863422]">
                    {currentEffect.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#7A706A] leading-relaxed">
                    {currentEffect.description}
                  </p>
                </div>

                <div className="space-y-2">
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
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#EAE2D6]/70">
              <button
                onClick={handleApply}
                className="w-full bg-[#B8533C] hover:bg-[#A1422E] text-white py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99]"
              >
                Apply {selectedEffectId === "duotone" ? "duotone" : currentEffect.name.toLowerCase()}
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

        {/* BOTTOM SECTION: "A little inspiration" Cards (Figma 6:486) */}
        <section className="space-y-4 pt-4">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2D2623]">
              A little inspiration
            </h3>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-0.5">
              Pick a look. You can always change your mind.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Original */}
            <div
              onClick={() => handleReset()}
              className="bg-white rounded-2xl border border-[#EAE2D6] p-4 flex gap-3.5 items-center cursor-pointer transition-all hover:border-[#B8533C] hover:shadow-card group"
            >
              <div className="w-16 h-20 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#EAE2D6] shrink-0 flex items-center justify-center">
                <img
                  src="/samples/cosmos.jpg"
                  alt="Original natural look"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#8A8077]">Original</div>
                <div className="font-serif font-bold text-sm text-[#2D2623] truncate">
                  Keep it natural
                </div>
                <div className="text-xs text-[#B8533C] font-semibold mt-1 group-hover:underline">
                  Try this →
                </div>
              </div>
            </div>

            {/* Card 2: Pencil Sketch */}
            <div
              onClick={() => selectInspiration("sketch")}
              className={`bg-white rounded-2xl border p-4 flex gap-3.5 items-center cursor-pointer transition-all hover:border-[#B8533C] hover:shadow-card group ${
                selectedEffectId === "sketch" ? "border-[#B8533C] ring-1 ring-[#B8533C]" : "border-[#EAE2D6]"
              }`}
            >
              <div className="w-16 h-20 rounded-xl overflow-hidden bg-[#F5EFEB] border border-[#EAE2D6] shrink-0 flex items-center justify-center p-1 text-center font-serif text-xs text-[#7A706A]">
                Sketch
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#8A8077]">Pencil sketch</div>
                <div className="font-serif font-bold text-sm text-[#2D2623] truncate">
                  Soft, hand-drawn charm
                </div>
                <div className="text-xs text-[#B8533C] font-semibold mt-1 group-hover:underline">
                  {selectedEffectId === "sketch" ? "Selected ✓" : "Try this →"}
                </div>
              </div>
            </div>

            {/* Card 3: Duotone */}
            <div
              onClick={() => selectInspiration("duotone")}
              className={`bg-white rounded-2xl border p-4 flex gap-3.5 items-center cursor-pointer transition-all hover:border-[#B8533C] hover:shadow-card group ${
                selectedEffectId === "duotone" ? "border-[#B8533C] ring-2 ring-[#B8533C]" : "border-[#EAE2D6]"
              }`}
            >
              <div className="w-16 h-20 rounded-xl overflow-hidden border border-[#EAE2D6] shrink-0 flex">
                <div className="w-1/2 h-full bg-[#4C2A4A]" />
                <div className="w-1/2 h-full bg-[#F9C8A1]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#8A8077]">Duotone</div>
                <div className="font-serif font-bold text-sm text-[#2D2623] truncate">
                  A lovely pair of colors
                </div>
                <div className="text-xs text-[#B8533C] font-semibold mt-1">
                  {selectedEffectId === "duotone" ? "Selected ✓" : "Try this →"}
                </div>
              </div>
            </div>

            {/* Card 4: Posterization */}
            <div
              onClick={() => selectInspiration("posterize")}
              className={`bg-white rounded-2xl border p-4 flex gap-3.5 items-center cursor-pointer transition-all hover:border-[#B8533C] hover:shadow-card group ${
                selectedEffectId === "posterize" ? "border-[#B8533C] ring-1 ring-[#B8533C]" : "border-[#EAE2D6]"
              }`}
            >
              <div className="w-16 h-20 rounded-xl overflow-hidden bg-[#FAF1EE] border border-[#EAE2D6] shrink-0 flex items-center justify-center p-1 text-center font-serif text-xs text-[#863422]">
                Tones
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#8A8077]">Posterization</div>
                <div className="font-serif font-bold text-sm text-[#2D2623] truncate">
                  Bold blocks of color
                </div>
                <div className="text-xs text-[#B8533C] font-semibold mt-1 group-hover:underline">
                  {selectedEffectId === "posterize" ? "Selected ✓" : "Try this →"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reassurance Banner */}
        <ReassuranceBanner
          title="Designed for curiosity."
          description="Try combining multiple creative effects in sequence! Your original is kept for this session, so explore without worry."
        />
      </main>
    </div>
  );
}
