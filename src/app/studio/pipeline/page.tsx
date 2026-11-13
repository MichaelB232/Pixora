"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { useStudio } from "@/lib/image-processing/context";
import {
  applyGrayscale,
  applyBrightness,
  applyContrast,
  applySepia,
} from "@/lib/image-processing/editor";
import {
  applyGaussianBlur,
  applySharpening,
  applyMedianFilter,
} from "@/lib/image-processing/restoration";
import { applySobel, applyCanny } from "@/lib/image-processing/vision";
import { applyDuotone, applyVignette } from "@/lib/image-processing/creative";

interface PipelineStepItem {
  id: string;
  name: string;
  subtitle: string;
  funcId: string;
  param?: any;
}

export default function ProcessingPipelinePage() {
  const stageCanvasRef = useRef<HTMLCanvasElement>(null);
  const { originalImage, currentImage, metadata, applyStep, downloadImage } = useStudio();

  const [steps, setSteps] = useState<PipelineStepItem[]>([
    {
      id: "s1",
      name: "Grayscale",
      subtitle: "RGB → grayscale",
      funcId: "grayscale",
    },
    {
      id: "s2",
      name: "Gaussian blur",
      subtitle: "Kernel 5 × 5 · Sigma 1.4",
      funcId: "gaussian",
    },
    {
      id: "s3",
      name: "Canny edge detection",
      subtitle: "Lower 50 · Upper 150",
      funcId: "canny",
    },
  ]);

  // Stage previews: mapping stage index (-1: original, 0: after step 1, 1: after step 2, etc.)
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(2); // defaults to final step
  const [stageImages, setStageImages] = useState<ImageData[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const baseImage = originalImage || currentImage;

  // Run pipeline and compute intermediate stage images
  const runPipeline = () => {
    if (!baseImage) return;

    const stages: ImageData[] = [];
    let current = baseImage;

    for (const step of steps) {
      switch (step.funcId) {
        case "grayscale":
          current = applyGrayscale(current);
          break;
        case "gaussian":
          current = applyGaussianBlur(current, 5, 1.4);
          break;
        case "canny":
          current = applyCanny(current, 50, 150);
          break;
        case "contrast":
          current = applyContrast(current, 25);
          break;
        case "brightness":
          current = applyBrightness(current, 20);
          break;
        case "sharpen":
          current = applySharpening(current, 1.2);
          break;
        case "sobel":
          current = applySobel(current);
          break;
        case "sepia":
          current = applySepia(current);
          break;
        case "duotone":
          current = applyDuotone(current);
          break;
      }
      stages.push(current);
    }

    setStageImages(stages);
  };

  useEffect(() => {
    runPipeline();
  }, [baseImage, steps]);

  // Render selected stage on canvas
  useEffect(() => {
    if (!stageCanvasRef.current) return;
    const canvas = stageCanvasRef.current;
    const imgToRender =
      selectedStageIdx === -1
        ? baseImage
        : stageImages[selectedStageIdx] || stageImages[stageImages.length - 1] || baseImage;

    if (!imgToRender) return;

    canvas.width = imgToRender.width;
    canvas.height = imgToRender.height;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.putImageData(imgToRender, 0, 0);
  }, [selectedStageIdx, stageImages, baseImage]);

  // Move step up/down
  const moveStep = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const newSteps = [...steps];
    const temp = newSteps[idx];
    newSteps[idx] = newSteps[targetIdx];
    newSteps[targetIdx] = temp;
    setSteps(newSteps);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
  };

  const handleAddStep = () => {
    const available = [
      { name: "Contrast boost", subtitle: "Expanded dynamic range (+25)", funcId: "contrast" },
      { name: "Sharpening", subtitle: "Laplacian micro-contrast (1.2x)", funcId: "sharpen" },
      { name: "Sobel operator", subtitle: "First-order gradient magnitude", funcId: "sobel" },
      { name: "Warm sepia", subtitle: "Timeless golden tint", funcId: "sepia" },
    ];
    const nextAlgo = available[steps.length % available.length];
    setSteps([
      ...steps,
      {
        id: `s-${Date.now()}`,
        name: nextAlgo.name,
        subtitle: nextAlgo.subtitle,
        funcId: nextAlgo.funcId,
      },
    ]);
  };

  const handleSaveConfig = () => {
    setSaveStatus("Configuration saved ✓");
    setTimeout(() => setSaveStatus(""), 2500);
  };

  const handleCommitPipeline = () => {
    const finalImg = stageImages[stageImages.length - 1];
    if (finalImg) {
      applyStep(
        `Pipeline: ${steps.map((s) => s.name).join(" → ")}`,
        "pipeline",
        "custom_pipeline",
        { steps: steps.map((s) => s.funcId) },
        finalImg
      );
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader breadcrumb="Your studio / Processing pipeline" />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6 pb-16">
        {/* Title Bar - Figma 6:332 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              Small steps. One lovely flow.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              Build a sequence, see each step, and learn as you go.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className="text-xs font-semibold text-[#46654F] bg-[#E8EFEA] px-3 py-1.5 rounded-lg">
                {saveStatus}
              </span>
            )}
            <button
              onClick={handleSaveConfig}
              className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98]"
            >
              Save configuration
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Session History vs Processing Pipeline) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F5EFEB] p-1.5 rounded-2xl border border-[#EAE2D6]">
          <div className="flex gap-1">
            <Link
              href="/studio/history"
              className="py-2 px-5 rounded-xl text-xs sm:text-sm font-medium text-[#7A706A] hover:text-[#2D2623] transition-colors"
            >
              Session history
            </Link>
            <button className="py-2 px-5 rounded-xl text-xs sm:text-sm font-bold bg-white text-[#2D2623] shadow-card font-serif">
              Processing pipeline
            </button>
          </div>
          <span className="text-xs text-[#8A8077] px-3 font-medium">
            {metadata.name} · This session only
          </span>
        </div>

        {/* Dual Layout: Recipe (Left) + Stage Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Processing Recipe (Figma 6:770) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                Your processing recipe
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Runs from top to bottom on a copy of your image.
              </p>
            </div>

            {/* Pipeline Source Card */}
            <div className="p-3.5 bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl flex items-center gap-3">
              <div className="w-12 h-10 rounded-lg overflow-hidden bg-white border border-[#EAE2D6] shrink-0">
                <img
                  src="/samples/cosmos.jpg"
                  alt="Original input"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#2D2623]">{metadata.name}</div>
                <div className="text-[11px] text-[#7A706A]">
                  Original input · RGB · {metadata.width} × {metadata.height} px
                </div>
              </div>
            </div>

            {/* Sequence Steps */}
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE2D6] flex items-center justify-between gap-3 hover:border-[#B8533C]/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-[#EAE2D6] text-[#2D2623] font-bold text-xs flex items-center justify-center font-serif">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-serif font-bold text-sm text-[#2D2623]">
                        {step.name}
                      </div>
                      <div className="text-[11px] text-[#7A706A]">{step.subtitle}</div>
                      <div className="text-[10px] text-[#46654F] font-semibold flex items-center gap-1 mt-0.5">
                        <span>✓</span>
                        <span>Complete</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Reorder, Edit, Remove */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col text-xs text-[#7A706A]">
                      <button
                        onClick={() => moveStep(idx, -1)}
                        disabled={idx === 0}
                        className="hover:text-[#B8533C] disabled:opacity-20 px-1"
                        title="Move step up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveStep(idx, 1)}
                        disabled={idx === steps.length - 1}
                        className="hover:text-[#B8533C] disabled:opacity-20 px-1"
                        title="Move step down"
                      >
                        ↓
                      </button>
                    </div>

                    <button
                      onClick={() => removeStep(step.id)}
                      className="text-xs text-[#B8533C] hover:underline px-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Buttons: Add step + Run again */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddStep}
                className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs"
              >
                + Add a step
              </button>
              <button
                onClick={runPipeline}
                className="bg-[#B8533C] hover:bg-[#A1422E] text-white py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99]"
              >
                Run again →
              </button>
            </div>

            <div className="text-xs text-[#46654F] font-medium pt-1">
              {steps.length} steps completed · Output is ready to explore
            </div>
          </div>

          {/* Right Column: Stage Output Preview (Figma 6:809) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                See what each step does
              </h3>
            </div>

            {/* Stage Selector Tabs */}
            <div className="flex bg-[#F5EFEB] p-1 rounded-xl gap-1 text-xs overflow-x-auto">
              <button
                onClick={() => setSelectedStageIdx(-1)}
                className={`py-1.5 px-3 rounded-lg font-medium transition-all ${
                  selectedStageIdx === -1
                    ? "bg-white text-[#2D2623] shadow-xs font-semibold"
                    : "text-[#7A706A] hover:text-[#2D2623]"
                }`}
              >
                Original
              </button>
              {steps.map((st, i) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStageIdx(i)}
                  className={`py-1.5 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedStageIdx === i
                      ? "bg-white text-[#2D2623] shadow-xs font-semibold"
                      : "text-[#7A706A] hover:text-[#2D2623]"
                  }`}
                >
                  {st.name}
                </button>
              ))}
            </div>

            {/* Stage Canvas */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#1E1917] border border-[#EAE2D6] flex items-center justify-center shadow-xs">
              <canvas ref={stageCanvasRef} className="max-w-full max-h-full object-contain" />
            </div>

            <div>
              <div className="font-serif font-bold text-base text-[#2D2623]">
                {selectedStageIdx === -1 ? "Original" : steps[selectedStageIdx]?.name || "Output"} · stage preview
              </div>
              <div className="text-xs text-[#7A706A] mt-0.5">
                Inspect intermediate representations as image transforms cascade.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCommitPipeline}
                className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs"
              >
                Apply to studio
              </button>
              <button
                onClick={() => downloadImage("png", 95, "pixora-pipeline-output")}
                className="bg-[#B8533C] hover:bg-[#A1422E] text-white py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-1.5"
              >
                <span>Export output</span>
                <span>↓</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline Learning Guidance Card (Figma 6:822) */}
        <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-3xl p-5 sm:p-6 space-y-2 shadow-xs">
          <h3 className="font-serif font-bold text-base text-[#2D2623]">
            One change at a time makes it easier to learn.
          </h3>
          <p className="text-xs sm:text-sm text-[#7A706A] leading-relaxed">
            Reorder or edit a step, then run the sequence again. Saving a configuration keeps the
            recipe, not the image.
          </p>
        </div>
      </main>
    </div>
  );
}
