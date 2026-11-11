"use client";

import React from "react";
import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { ReassuranceBanner } from "@/components/studio/ReassuranceBanner";
import { useStudio } from "@/lib/image-processing/context";
import { Clock, Undo, Redo, RotateCcw, CheckCircle, ArrowRight } from "lucide-react";

export default function SessionHistoryPage() {
  const {
    history,
    historyIndex,
    jumpToStep,
    undo,
    redo,
    canUndo,
    canRedo,
    revertToOriginal,
  } = useStudio();

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader
        breadcrumb="Your studio / Session history"
      />

      <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              Every step, remembered.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              Trace your creative decisions, jump backwards, or redo adjustments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EAE2D6] bg-white text-xs font-medium text-[#4A403A] hover:bg-[#F5EFEB] disabled:opacity-40 transition-all"
            >
              <Undo size={14} />
              <span>Undo</span>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EAE2D6] bg-white text-xs font-medium text-[#4A403A] hover:bg-[#F5EFEB] disabled:opacity-40 transition-all"
            >
              <Redo size={14} />
              <span>Redo</span>
            </button>
            <button
              onClick={revertToOriginal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EAE2D6] bg-[#FAF1EE] text-[#B8533C] text-xs font-medium hover:bg-[#F6E4DE] transition-all"
            >
              <RotateCcw size={14} />
              <span>Revert to original</span>
            </button>
          </div>
        </div>

        {/* Timeline list */}
        <div className="bg-white rounded-3xl border border-[#EAE2D6] p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAE2D6]/80 text-xs">
            <span className="font-semibold text-[#2D2623]">
              Active Session Sequence ({history.length} {history.length === 1 ? "step" : "steps"})
            </span>
            <span className="text-[#8A8077]">
              Current active state: Step {historyIndex + 1}
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#EAE2D6]">
            {history.map((step, idx) => {
              const isCurrent = idx === historyIndex;
              const isPast = idx <= historyIndex;

              return (
                <div
                  key={step.id}
                  className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? "bg-[#FAF1EE] border-[#EEC7BC] shadow-xs"
                      : "bg-[#FAF7F2] border-[#EAE2D6]/80 hover:bg-[#F5EFEB]"
                  }`}
                >
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-[31px] top-5 w-4 h-4 rounded-full border-2 transition-colors ${
                      isCurrent
                        ? "bg-[#B8533C] border-white ring-4 ring-[#EEC7BC]"
                        : isPast
                        ? "bg-[#46654F] border-white"
                        : "bg-white border-[#D0C7BD]"
                    }`}
                  />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#EAE2D6] text-[#7A706A]">
                        #{String(idx + 1).padStart(2, "0")}
                      </span>
                      <h4 className="font-serif font-bold text-sm text-[#2D2623]">
                        {step.label}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#B8533C] text-white">
                          Current view
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#7A706A] flex items-center gap-3">
                      <span>Module: {step.module}</span>
                      <span>•</span>
                      <span>Algorithm: {step.algorithm}</span>
                      <span>•</span>
                      <span>Time: {step.timestamp}</span>
                    </div>
                    {step.parameters && Object.keys(step.parameters).length > 0 && (
                      <div className="text-[11px] text-[#8A8077] font-mono bg-white/70 px-2.5 py-1 rounded-lg border border-[#EAE2D6] inline-block mt-1">
                        params: {JSON.stringify(step.parameters)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => jumpToStep(idx)}
                      disabled={isCurrent}
                      className="px-3 py-1.5 rounded-xl border border-[#EAE2D6] bg-white text-xs font-medium text-[#2D2623] hover:bg-[#F5EFEB] disabled:opacity-40 transition-all shadow-xs"
                    >
                      {isCurrent ? "Active" : "Jump to this step"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <ReassuranceBanner
          title="Branch, jump, or restore without worry."
          description="Your edits form a non-destructive session timeline. Jumping backward lets you inspect how the image looked at any stage."
        />
      </main>
    </div>
  );
}
