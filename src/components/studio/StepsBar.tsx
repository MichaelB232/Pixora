"use client";

import React from "react";
import Link from "next/link";
import { useStudio } from "@/lib/image-processing/context";
import { cn } from "@/lib/utils";

interface StepsBarProps {
  currentPendingLabel?: string;
}

export function StepsBar({ currentPendingLabel }: StepsBarProps) {
  const { history, historyIndex, jumpToStep, previewImage } = useStudio();

  return (
    <div className="w-full mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif font-semibold text-base text-[#2D2623]">
          Your steps
        </h3>
        <Link
          href="/studio/history"
          className="text-xs font-medium text-[#B8533C] hover:text-[#933B2B] hover:underline"
        >
          View history →
        </Link>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {history.map((step, idx) => {
          const isCurrent = idx === historyIndex && !previewImage;
          const isPast = idx <= historyIndex;
          const numStr = String(idx + 1).padStart(2, "0");

          return (
            <button
              key={step.id}
              onClick={() => jumpToStep(idx)}
              className={cn(
                "flex-shrink-0 flex items-start gap-3 px-4 py-2.5 rounded-2xl border text-left transition-all min-w-[190px]",
                isCurrent
                  ? "bg-[#FAF1EE] border-[#EEC7BC] shadow-xs"
                  : isPast
                  ? "bg-white border-[#EAE2D6] hover:bg-[#F5EFEB]"
                  : "bg-white/50 border-[#EAE2D6]/50 opacity-60 hover:opacity-100"
              )}
            >
              <span
                className={cn(
                  "text-xs font-semibold px-1.5 py-0.5 rounded-md",
                  isCurrent
                    ? "bg-[#B8533C] text-white"
                    : "bg-[#F0EAE1] text-[#7A706A]"
                )}
              >
                {numStr}
              </span>
              <div>
                <div
                  className={cn(
                    "text-xs font-semibold",
                    isCurrent ? "text-[#B8533C]" : "text-[#2D2623]"
                  )}
                >
                  {step.label}
                </div>
                <div className="text-[11px] text-[#8A8077] mt-0.5">
                  {idx === 0 ? "Ready when you are" : step.timestamp}
                </div>
              </div>
            </button>
          );
        })}

        {/* If live preview is active and not yet committed */}
        {previewImage && currentPendingLabel && (
          <div className="flex-shrink-0 flex items-start gap-3 px-4 py-2.5 rounded-2xl border border-dashed border-[#EEC7BC] bg-[#FDF5F2] min-w-[190px] animate-pulse">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-[#EEC7BC] text-[#863422]">
              {String(historyIndex + 2).padStart(2, "0")}
            </span>
            <div>
              <div className="text-xs font-semibold text-[#B8533C]">
                {currentPendingLabel}
              </div>
              <div className="text-[11px] text-[#A69D95] mt-0.5">
                Preview — not applied
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
