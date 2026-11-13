"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { ReassuranceBanner } from "@/components/studio/ReassuranceBanner";
import { useStudio } from "@/lib/image-processing/context";
import { Undo, Redo } from "lucide-react";

export default function SessionHistoryPage() {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const {
    history,
    historyIndex,
    jumpToStep,
    undo,
    redo,
    canUndo,
    canRedo,
    metadata,
    downloadImage,
  } = useStudio();

  const activeStep = history[historyIndex] || history[0];

  // Render Preview Canvas for the selected active step
  useEffect(() => {
    if (!activeStep?.imageData || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    canvas.width = activeStep.imageData.width;
    canvas.height = activeStep.imageData.height;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.putImageData(activeStep.imageData, 0, 0);
  }, [activeStep]);

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader breadcrumb="Your studio / Session history" />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6 pb-16">
        {/* Title Bar - Figma 6:277 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              Every step is part of the story.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              Go back, look again, or pick up right where you left off.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#EAE2D6] bg-white text-xs sm:text-sm font-medium text-[#2D2623] hover:bg-[#F5EFEB] disabled:opacity-40 transition-all shadow-xs"
            >
              <Undo size={14} />
              <span>↶ Undo</span>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#EAE2D6] bg-white text-xs sm:text-sm font-medium text-[#2D2623] hover:bg-[#F5EFEB] disabled:opacity-40 transition-all shadow-xs"
            >
              <Redo size={14} />
              <span>↷ Redo</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Session History vs Processing Pipeline) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F5EFEB] p-1.5 rounded-2xl border border-[#EAE2D6]">
          <div className="flex gap-1">
            <button className="py-2 px-5 rounded-xl text-xs sm:text-sm font-bold bg-white text-[#2D2623] shadow-card font-serif">
              Session history
            </button>
            <Link
              href="/studio/pipeline"
              className="py-2 px-5 rounded-xl text-xs sm:text-sm font-medium text-[#7A706A] hover:text-[#2D2623] transition-colors"
            >
              Processing pipeline
            </Link>
          </div>
          <span className="text-xs text-[#8A8077] px-3 font-medium">
            {metadata.name} · This session only
          </span>
        </div>

        {/* Dual Column Layout: Timeline (Left) + Selected Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Session Timeline (Figma 6:726) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                Your creative trail
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Current step:{" "}
                <span className="font-semibold text-[#B8533C]">
                  {activeStep?.label || "Original image"}
                </span>
              </p>
            </div>

            {/* List of Steps */}
            <div className="space-y-3">
              {history.map((step, idx) => {
                const isCurrent = idx === historyIndex;
                const isFuture = idx > historyIndex;
                const formattedNum = String(idx + 1).padStart(2, "0");

                return (
                  <div
                    key={step.id}
                    onClick={() => jumpToStep(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-center ${
                      isCurrent
                        ? "bg-[#FAF1EE] border-[#EEC7BC] shadow-xs ring-1 ring-[#EEC7BC]"
                        : isFuture
                        ? "bg-[#FAF7F2]/50 border-dashed border-[#EAE2D6] opacity-60 hover:opacity-100"
                        : "bg-[#FAF7F2] border-[#EAE2D6] hover:bg-[#F5EFEB]"
                    }`}
                  >
                    {/* Step Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#EAE2D6] shrink-0 flex items-center justify-center">
                      <div className="font-serif font-bold text-xs text-[#7A706A]">
                        {formattedNum}
                      </div>
                    </div>

                    {/* Step Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-[#8A8077]">
                          {formattedNum}
                        </span>
                        <span className="font-serif font-bold text-sm text-[#2D2623] truncate">
                          {step.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#7A706A] mt-0.5">
                        {idx === 0
                          ? `${metadata.name} · ${metadata.width} × ${metadata.height} px`
                          : `Applied in module: ${step.module}`}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        {isCurrent ? (
                          <span className="text-[10px] font-bold text-[#B8533C] bg-white px-2 py-0.5 rounded-full border border-[#EEC7BC]">
                            You are here
                          </span>
                        ) : isFuture ? (
                          <span className="text-[10px] text-[#8A8077] italic">
                            Undone · available with Redo
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#46654F] font-semibold">
                            Step saved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-xs text-[#8A8077] pt-2 border-t border-[#EAE2D6]/70 italic">
              Changing a past step starts a new trail from there.
            </div>
          </div>

          {/* Right Column: Current History Preview (Figma 6:749) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EAE2D6] flex items-center justify-center shadow-xs">
              <canvas ref={previewCanvasRef} className="max-w-full max-h-full object-contain" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                {activeStep?.label || "Original image"} · your current result
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                {historyIndex > 0
                  ? `${historyIndex} applied adjustments. Original is still safe.`
                  : "Original unedited photo. Ready for creativity."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/studio/editor"
                className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs text-center"
              >
                Continue editing →
              </Link>
              <button
                onClick={() => downloadImage("png", 92, "pixora-history-result")}
                className="bg-[#B8533C] hover:bg-[#A1422E] text-white py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] text-center"
              >
                Export this image ↓
              </button>
            </div>
          </div>
        </div>

        {/* Safety Reminder Banner (Figma 6:757) */}
        <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-3xl p-5 sm:p-6 space-y-2 shadow-xs">
          <h3 className="font-serif font-bold text-base text-[#2D2623]">
            Nothing lovely needs to be rushed.
          </h3>
          <p className="text-xs sm:text-sm text-[#7A706A] leading-relaxed">
            Undo and redo are here while you explore. Your session history isn’t a permanent backup.
            Download the result you want to keep before closing or refreshing the session.
          </p>
        </div>
      </main>
    </div>
  );
}
