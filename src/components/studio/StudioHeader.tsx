"use client";

import React, { useRef } from "react";
import { Menu } from "lucide-react";
import { useStudio } from "@/lib/image-processing/context";
import { useStudioNav } from "./StudioNavContext";

interface StudioHeaderProps {
  breadcrumb?: string;
  onOpenMobileMenu?: () => void;
}

export function StudioHeader({
  breadcrumb = "Your studio",
  onOpenMobileMenu,
}: StudioHeaderProps) {
  const { loadImageFromFile } = useStudio();
  const nav = useStudioNav();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenMobile = onOpenMobileMenu || nav.openMobileMenu;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadImageFromFile(e.target.files[0]);
    }
  };

  return (
    <header className="w-full bg-[#FAF7F2] border-b border-[#EAE2D6]/80 px-4 md:px-8 py-3.5 flex items-center justify-between text-xs text-[#7A706A]">
      <div className="flex items-center gap-3">
        <button
          onClick={handleOpenMobile}
          className="md:hidden p-1.5 rounded-lg text-[#5D544F] hover:bg-[#F0EAE1]"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="font-sans font-medium text-[#7A706A]">
          {breadcrumb}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
        />

        <div className="hidden sm:block text-[#9E948D] italic font-serif text-[13px]">
          A space to explore, at your pace
        </div>
      </div>
    </header>
  );
}
