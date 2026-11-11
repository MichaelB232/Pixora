"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { BeforeAfterSplit } from "@/components/studio/BeforeAfterSplit";
import { StepsBar } from "@/components/studio/StepsBar";
import { ReassuranceBanner } from "@/components/studio/ReassuranceBanner";
import { useStudio } from "@/lib/image-processing/context";
import {
  detectDocumentCorners,
  applyPerspectiveWarp,
  applyDocumentBinarization,
  applyDocumentEnhance,
} from "@/lib/image-processing/scanner";

export default function DocumentScannerPage() {
  const { currentImage, applyStep, setLivePreview, isPreviewOn, setIsPreviewOn, loadImageFromUrl } =
    useStudio();

  const [mode, setMode] = useState<"color" | "grayscale" | "bw">("color");
  const [straightenActive, setStraightenActive] = useState<boolean>(true);
  const [contrastBoost, setContrastBoost] = useState<number>(30);

  useEffect(() => {
    if (!currentImage) return;

    if (!isPreviewOn) {
      setLivePreview(null);
      return;
    }

    try {
      let result = currentImage;
      if (straightenActive) {
        const corners = detectDocumentCorners(currentImage);
        result = applyPerspectiveWarp(currentImage, corners);
      }
      result = applyDocumentEnhance(result, mode);
      setLivePreview(result);
    } catch (e) {
      console.error("Scanner preview error:", e);
    }
  }, [currentImage, mode, straightenActive, contrastBoost, isPreviewOn, setLivePreview]);

  const handleApply = () => {
    if (!currentImage) return;
    let result = currentImage;
    if (straightenActive) {
      const corners = detectDocumentCorners(currentImage);
      result = applyPerspectiveWarp(currentImage, corners);
    }
    result = applyDocumentEnhance(result, mode);

    const modeLabels = {
      color: "Enhanced Color Scan",
      grayscale: "Clean Grayscale Scan",
      bw: "Crisp Black & White Scan",
    };
    const label = `Document Scanner: ${modeLabels[mode]}`;
    applyStep(label, "scanner", "scan_enhance", { mode, straighten: straightenActive }, result);
  };

  const handleLoadDocSample = async () => {
    await loadImageFromUrl("/samples/document.jpg", "document.jpg");
  };

  return (
    <div className="flex flex-col min-h-full">
      <StudioHeader
        breadcrumb="Your studio / Document scanner"
      />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D2623] tracking-tight">
              Keep it clear.
            </h1>
            <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
              Straighten, remove paper cast, and enhance document contrast.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadDocSample}
              className="bg-white hover:bg-[#F5EFEB] border border-[#EAE2D6] text-[#2D2623] px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98]"
            >
              Try document sample
            </button>
            <Link
              href="/studio/export"
              className="bg-[#B8533C] hover:bg-[#A1422E] text-white px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98] inline-flex items-center gap-1.5"
            >
              <span>Export scan</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <BeforeAfterSplit />
            <StepsBar currentPendingLabel={`Document Scan (${mode.toUpperCase()})`} />
          </div>

          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAE2D6] p-5 sm:p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2623]">
                Scan Settings
              </h3>
              <p className="text-xs text-[#7A706A] mt-0.5">
                Optimize text clarity and paper background.
              </p>
            </div>

            {/* Scan Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8A8077]">
                Output Mode
              </label>
              <div className="grid grid-cols-3 bg-[#F5EFEB] p-1 rounded-xl gap-1 text-xs">
                {(
                  [
                    { id: "color", label: "Color" },
                    { id: "grayscale", label: "Gray" },
                    { id: "bw", label: "B&W" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`py-2 rounded-lg font-medium transition-all ${
                      mode === m.id
                        ? "bg-white text-[#2D2623] shadow-xs font-semibold"
                        : "text-[#7A706A] hover:text-[#2D2623]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Perspective Warp Toggle */}
            <div className="p-4 bg-[#FAF7F2] border border-[#EAE2D6] rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#2D2623]">
                  Perspective Correction
                </div>
                <div className="text-[11px] text-[#7A706A]">
                  Auto-detect corners and square up.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={straightenActive}
                aria-label="Toggle perspective correction"
                onClick={() => setStraightenActive(!straightenActive)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  straightenActive ? "bg-[#46654F]" : "bg-[#D9CEBF]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    straightenActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Descriptive Callout */}
            <div className="bg-[#FAF1EE] border border-[#F4D4CD] rounded-2xl p-4 space-y-1">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#863422]">
                {mode === "color"
                  ? "Enhanced Natural Color"
                  : mode === "grayscale"
                  ? "Clean Paper Grayscale"
                  : "Crisp Black & White Binary"}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#7A706A] leading-relaxed">
                {mode === "color"
                  ? "Lifts shadows and removes yellowish lighting cast while preserving colored stamps and logos."
                  : mode === "grayscale"
                  ? "Even high-key tonal representation ideal for monochrome printing."
                  : "Adaptive thresholding that converts faint pencil or ink strokes into sharp readable black text."}
              </p>
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-[#EAE2D6]/70">
              <div>
                <div className="text-xs font-medium text-[#2D2623]">
                  Preview is on
                </div>
                <div className="text-[11px] text-[#8A8077]">
                  Inspect scan before saving.
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

            {/* Apply Button */}
            <div className="pt-2">
              <button
                onClick={handleApply}
                className="w-full bg-[#B8533C] hover:bg-[#A1422E] text-white py-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99]"
              >
                Apply scan processing
              </button>
            </div>
          </div>
        </div>

        <ReassuranceBanner
          title="Designed for legible archives."
          description="Straightening and adaptive binarization ensure receipts, handwritten notes, and book pages stay crisp and readable."
        />
      </main>
    </div>
  );
}
