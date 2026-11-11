"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { BeforeAfterSplit } from "@/components/studio/BeforeAfterSplit";
import { ReassuranceBanner } from "@/components/studio/ReassuranceBanner";
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
import { applySobel, applyCanny, applyLaplacian } from "@/lib/image-processing/vision";
import { applyVignette, applyEmboss } from "@/lib/image-processing/creative";
import { Plus, Trash2, ArrowDown, Play, Check } from "lucide-react";

interface PipelineStepConfig {
  id: string;
  name: string;
  funcId: string;
  param?: number;
}

const availableAlgorithms = [
  { id: "grayscale", name: "Grayscale", module: "Editor" },
  { id: "sepia", name: "Sepia Warmth", module: "Editor" },
  { id: "brightness", name: "Brightness (+20)", module: "Editor" },
  { id: "contrast", name: "Contrast (+25)", module: "Editor" },
  { id: "gaussian", name: "Gaussian Blur (5px)", module: "Restoration" },
  { id: "median", name: "Median Filter (Noise Removal)", module: "Restoration" },
  { id: "sharpen", name: "Sharpen (Laplacian)", module: "Restoration" },
  { id: "canny", name: "Canny Edge Detection", module: "Vision" },
  { id: "sobel", name: "Sobel Operator", module: "Vision" },
  { id: "vignette", name: "Vignette Framing", module: "Creative" },
  { id: "emboss", name: "Emboss Relief", module: "Creative" },
];

export default function ProcessingPipelinePage() {
  const { originalImage, currentImage, applyStep } = useStudio();
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepConfig[]>([
    { id: "p1", name: "Grayscale", funcId: "grayscale" },
    { id: "p2", name: "Gaussian Blur", funcId: "gaussian" },
    { id: "p3", name: "Canny Edge Detection", funcId: "canny" },
  ]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string>("contrast");

  const handleAddStep = () => {
    const algo = availableAlgorithms.find((a) => a.id === selectedToAdd);
    if (!algo) return;
    const newStep: PipelineStepConfig = {
      id: `p-${Date.now()}`,
      name: algo.name,
      funcId: algo.id,
    };
    setPipelineSteps([...pipelineSteps, newStep]);
  };

  const handleRemoveStep = (id: string) => {
    setPipelineSteps(pipelineSteps.filter((s) => s.id !== id));
  };

  const executePipeline = () => {
    const base = originalImage || currentImage;
    if (!base) return;

    setIsRunning(true);
    let result = base;

    for (const step of pipelineSteps) {
      switch (step.funcId) {
        case "grayscale":
          result = applyGrayscale(result);
          break;
        case "sepia":
          result = applySepia(result);
          break;
        case "brightness":
          result = applyBrightness(result, 20);
          break;
        case "contrast":
          result = applyContrast(result, 25);
          break;
        case "gaussian":
          result = applyGaussianBlur(result, 5, 1.5);
          break;
        case "median":
          result = applyMedianFilter(result, 2);
          break;
        case "sharpen":
          result = applySharpening(result, 1.2);
          break;
        case "canny":
          result = applyCanny(result, 30, 70);
          break;
        case "sobel":
          result = applySobel(result);
          break;
        case "vignette":
          result = applyVignette(result, 0.5);
          break;
        case "emboss":
          result = applyEmboss(result, 1.0);
          break;
      }
    }

    const summaryLabel = `Pipeline: ${pipelineSteps.map((s) => s.name).join(" → ")}`;
    applyStep(
      summaryLabel,
      "pipeline",
      "multi_pipeline",
      { steps: pipelineSteps.map((s) => s.funcId) },
      result
    );

    setTimeout(() => {
      setIsRunning(false);
    }, 400);
  };

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader
        breadcrumb="Your studio / Processing pipeline"
      />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              Sequential Processing Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              Chain multiple algorithms into a reproducible workflow.
            </p>
          </div>

          <Link
            href="/studio/export"
            className="bg-[#B8533C] hover:bg-[#A1422E] text-white px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs self-start"
          >
            Export result →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <BeforeAfterSplit />
          </div>

          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE2D6] p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                Pipeline Sequence
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Algorithms execute top-to-bottom on the original image.
              </p>
            </div>

            {/* Steps List */}
            <div className="space-y-2">
              {pipelineSteps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE2D6]">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#FAF1EE] text-[#B8533C] font-semibold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-[#2D2623]">
                        {step.name}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveStep(step.id)}
                      className="text-[#9E948D] hover:text-[#B8533C] p-1 transition-colors"
                      title="Remove stage"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {idx < pipelineSteps.length - 1 && (
                    <div className="flex justify-center -my-1 text-[#C6BEB6]">
                      <ArrowDown size={14} />
                    </div>
                  )}
                </React.Fragment>
              ))}

              {pipelineSteps.length === 0 && (
                <div className="text-center py-6 text-xs text-[#8A8077] bg-[#FAF7F2] rounded-2xl border border-dashed border-[#EAE2D6]">
                  No stages added yet. Add an algorithm below.
                </div>
              )}
            </div>

            {/* Add Step Control */}
            <div className="pt-2 border-t border-[#EAE2D6]/80 space-y-2">
              <label
                htmlFor="pipeline-add-select"
                className="text-xs font-semibold text-[#8A8077]"
              >
                Add Algorithm Stage
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="pipeline-add-select"
                  value={selectedToAdd}
                  onChange={(e) => setSelectedToAdd(e.target.value)}
                  className="flex-1 bg-[#FAF7F2] border border-[#EAE2D6] rounded-xl px-3 py-2 text-xs font-medium text-[#2D2623] focus:outline-none"
                >
                  {availableAlgorithms.map((algo) => (
                    <option key={algo.id} value={algo.id}>
                      [{algo.module}] {algo.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddStep}
                  className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] p-2 rounded-xl text-xs font-medium transition-colors shadow-xs"
                  title="Add step"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Run Pipeline Button */}
            <div className="pt-2">
              <button
                onClick={executePipeline}
                disabled={pipelineSteps.length === 0 || isRunning}
                className="w-full bg-[#B8533C] hover:bg-[#A1422E] disabled:opacity-50 text-white py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Play size={15} />
                <span>{isRunning ? "Running pipeline..." : "Execute Full Pipeline"}</span>
              </button>
            </div>
          </div>
        </div>

        <ReassuranceBanner
          title="Reproducible image pipelines."
          description="Processing pipelines allow you to apply complex chains like Grayscale → Gaussian Blur → Canny Edge Detection deterministically."
        />
      </main>
    </div>
  );
}
