"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Upload,
  ArrowUpRight,
  ArrowRight,
  Sliders,
  RotateCcw,
  Sparkles,
  Eye,
  FileText,
} from "lucide-react";
import { StudioSidebar } from "@/components/studio/StudioSidebar";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { useStudio } from "@/lib/image-processing/context";

const moduleCards = [
  {
    num: "01",
    title: "Make it shine",
    category: "Image editor",
    desc: "Light, color, and little touch-ups.",
    href: "/studio/editor",
    icon: Sliders,
  },
  {
    num: "02",
    title: "Bring it back",
    category: "Photo restoration",
    desc: "Soften noise. Rediscover details.",
    href: "/studio/restoration",
    icon: RotateCcw,
  },
  {
    num: "03",
    title: "Play a little",
    category: "Creative lab",
    desc: "Turn a photo into something new.",
    href: "/studio/creative",
    icon: Sparkles,
  },
  {
    num: "04",
    title: "Look a little closer",
    category: "Computer vision",
    desc: "Explore edges, shapes, and colors.",
    href: "/studio/vision",
    icon: Eye,
  },
  {
    num: "05",
    title: "Keep it clear",
    category: "Document scanner",
    desc: "Straighten, clean, and save a scan.",
    href: "/studio/scanner",
    icon: FileText,
  },
];

export function HomeDashboard() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loadImageFromFile, loadImageFromUrl } = useStudio();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await loadImageFromFile(e.target.files[0]);
      router.push("/studio/editor");
    }
  };

  const handleSampleClick = async () => {
    await loadImageFromUrl("/samples/cosmos.jpg", "cosmos.jpg");
    router.push("/studio/editor");
  };

  return (
    <div className="flex h-screen w-full bg-[#FAF7F2] overflow-hidden">
      {/* Responsive Sidebar */}
      <StudioSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <StudioHeader
          breadcrumb="Your creative space"
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto space-y-8 pb-16">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp,image/jpg"
            className="hidden"
          />

          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-[#F6EEE3] border border-[#EAE2D6] p-6 md:p-10 shadow-soft">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Hero Content */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[11px] font-bold tracking-widest text-[#B8533C] uppercase font-sans">
                  Make yourself at home
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2D2623] leading-[1.15] font-bold">
                  A little curiosity. <br />
                  A whole new possibility.
                </h1>
                <p className="text-sm md:text-base text-[#5D544F] font-sans max-w-lg leading-relaxed pt-1">
                  Bring a photo. Try something new. Make it yours.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <button
                    onClick={handleUploadClick}
                    className="inline-flex items-center gap-2 bg-[#B8533C] hover:bg-[#A1422E] text-white px-6 py-3 rounded-2xl font-medium text-sm transition-all shadow-xs active:scale-[0.98]"
                  >
                    <Upload size={16} />
                    <span>Upload an image</span>
                    <span className="text-xs">↑</span>
                  </button>

                  <button
                    onClick={handleSampleClick}
                    className="inline-flex items-center gap-2 bg-white hover:bg-[#F5EFEB] text-[#2D2623] border border-[#EAE2D6] px-5 py-3 rounded-2xl font-medium text-sm transition-all shadow-xs active:scale-[0.98]"
                  >
                    <span>Explore a sample</span>
                  </button>
                </div>
              </div>

              {/* Right Hero Image Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative group max-w-sm w-full rounded-2xl overflow-hidden shadow-card border border-white/60 bg-white p-2">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#EFE8DF]">
                    <img
                      src="/samples/cosmos.jpg"
                      alt="Cosmos flowers in ceramic vase"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Floating badge */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xs text-[#2D2623] text-[11px] font-medium py-1.5 px-4 rounded-full shadow-md border border-[#EAE2D6]/80 whitespace-nowrap">
                      A small edit, a fresh feeling.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Module Selection Grid */}
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2D2623]">
                  Your next lovely thing starts here
                </h2>
                <p className="text-xs sm:text-sm text-[#7A706A] mt-1">
                  Pick what you&apos;d like to do. We&apos;ll guide you from there.
                </p>
              </div>
              <Link
                href="/studio/editor"
                className="text-xs sm:text-sm font-medium text-[#B8533C] hover:underline flex items-center gap-1"
              >
                <span>Explore all tools</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {moduleCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.num}
                    href={card.href}
                    className="group bg-white hover:bg-[#FAF7F2] rounded-2xl p-4 border border-[#EAE2D6] shadow-card hover:shadow-elevated transition-all flex flex-col justify-between h-48 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#FAF1EE] text-[#B8533C]">
                        {card.num}
                      </span>
                      <ArrowUpRight
                        size={16}
                        className="text-[#9E948D] group-hover:text-[#B8533C] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5 mt-auto">
                      <h3 className="font-serif font-bold text-base text-[#2D2623] group-hover:text-[#B8533C] transition-colors leading-snug">
                        {card.title}
                      </h3>
                      <div className="text-[11px] font-semibold text-[#B8533C]">
                        {card.category}
                      </div>
                      <p className="text-xs text-[#7A706A] leading-relaxed line-clamp-2">
                        {card.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 3-Step Process Banner */}
          <div className="rounded-3xl bg-[#F5EFEB]/90 border border-[#EAE2D6] p-6 md:p-8">
            <h3 className="font-serif text-lg font-bold text-[#2D2623] mb-6">
              A safe place to experiment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-full bg-white border border-[#EAE2D6] text-xs font-bold flex items-center justify-center text-[#B8533C] shadow-xs flex-shrink-0">
                  1
                </span>
                <div>
                  <h4 className="font-semibold text-sm text-[#2D2623]">
                    Bring your image
                  </h4>
                  <p className="text-xs text-[#7A706A] mt-1">
                    JPG, PNG, or WebP. Your choice.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-full bg-white border border-[#EAE2D6] text-xs font-bold flex items-center justify-center text-[#B8533C] shadow-xs flex-shrink-0">
                  2
                </span>
                <div>
                  <h4 className="font-semibold text-sm text-[#2D2623]">
                    Find your happy result
                  </h4>
                  <p className="text-xs text-[#7A706A] mt-1">
                    Adjust, compare, and undo freely.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-full bg-white border border-[#EAE2D6] text-xs font-bold flex items-center justify-center text-[#B8533C] shadow-xs flex-shrink-0">
                  3
                </span>
                <div>
                  <h4 className="font-semibold text-sm text-[#2D2623]">
                    Take it with you
                  </h4>
                  <p className="text-xs text-[#7A706A] mt-1">
                    Download when it feels just right.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* "Not sure where to start?" Card */}
          <div className="bg-white rounded-3xl border border-[#EAE2D6] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#EFE8DF] flex-shrink-0 border border-[#EAE2D6]">
                <img
                  src="/samples/cosmos.jpg"
                  alt="Cosmos flower sample thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#2D2623]">
                  Not sure where to start?
                </h4>
                <p className="text-xs sm:text-sm text-[#7A706A] mt-0.5">
                  Try our flower photo. No upload needed, just a little curiosity.
                </p>
              </div>
            </div>

            <button
              onClick={handleSampleClick}
              className="inline-flex items-center justify-center gap-2 border border-[#EAE2D6] hover:bg-[#F5EFEB] text-[#2D2623] px-5 py-2.5 rounded-2xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap shadow-xs active:scale-[0.98]"
            >
              <span>Try this sample</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
