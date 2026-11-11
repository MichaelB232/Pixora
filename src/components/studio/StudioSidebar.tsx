"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sliders,
  RotateCcw,
  Sparkles,
  Eye,
  FileText,
  BarChart2,
  Clock,
  Download,
  HelpCircle,
  X,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudioNav } from "./StudioNavContext";

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
}

const studioNavItems: NavItem[] = [
  { id: "home", name: "Home", href: "/", icon: Home },
  { id: "editor", name: "Image editor", href: "/studio/editor", icon: Sliders },
  { id: "restoration", name: "Photo restoration", href: "/studio/restoration", icon: RotateCcw },
  { id: "creative", name: "Creative lab", href: "/studio/creative", icon: Sparkles },
  { id: "vision", name: "Computer vision", href: "/studio/vision", icon: Eye },
  { id: "scanner", name: "Document scanner", href: "/studio/scanner", icon: FileText },
];

const secondaryNavItems: NavItem[] = [
  { id: "analysis", name: "Image analysis", href: "/studio/analysis", icon: BarChart2 },
  { id: "history", name: "Session history", href: "/studio/history", icon: Clock },
  { id: "pipeline", name: "Processing pipeline", href: "/studio/pipeline", icon: Layers },
  { id: "export", name: "Export center", href: "/studio/export", icon: Download },
];

export function StudioSidebar({
  mobileOpen: propMobileOpen,
  setMobileOpen: propSetMobileOpen,
}: {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
} = {}) {
  const pathname = usePathname();
  const [showTipsModal, setShowTipsModal] = useState(false);
  const nav = useStudioNav();

  const isMobileOpen = propMobileOpen !== undefined ? propMobileOpen : nav.mobileOpen;
  const closeMenu = () => {
    if (propSetMobileOpen) propSetMobileOpen(false);
    nav.closeMobileMenu();
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#F5EFEB] border-r border-[#EAE2D6] w-64 p-5 select-none overflow-y-auto">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#EAE2D6]/70">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#B8533C] text-white flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
            p
          </div>
          <div>
            <div className="font-serif font-bold text-xl tracking-tight text-[#2D2623]">
              pixora
            </div>
            <div className="text-[11px] text-[#7A706A] tracking-normal font-sans">
              A little room for possibility.
            </div>
          </div>
        </Link>
        <button
          onClick={closeMenu}
          className="md:hidden text-[#7A706A] hover:text-[#2D2623] p-1"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Primary Studio Nav */}
      <div className="mt-6">
        <div className="text-[11px] font-semibold text-[#9E948D] tracking-wider uppercase mb-2 px-2">
          Your Studio
        </div>
        <nav className="space-y-1">
          {studioNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-[#FAF1EE] text-[#B8533C] font-semibold shadow-xs"
                    : "text-[#5D544F] hover:bg-[#EFE8DF]/60 hover:text-[#2D2623]"
                )}
              >
                <Icon
                  size={18}
                  className={cn(active ? "text-[#B8533C]" : "text-[#7A706A]")}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Secondary Destinations */}
      <div className="mt-6 pt-5 border-t border-[#EAE2D6]/70">
        <nav className="space-y-1">
          {secondaryNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-[#FAF1EE] text-[#B8533C] font-semibold shadow-xs"
                    : "text-[#5D544F] hover:bg-[#EFE8DF]/60 hover:text-[#2D2623]"
                )}
              >
                <Icon
                  size={18}
                  className={cn(active ? "text-[#B8533C]" : "text-[#7A706A]")}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Gentle Tips Box */}
      <div className="mt-auto pt-6">
        <div className="bg-[#E8EFEA] border border-[#D0E0D4] rounded-2xl p-4 text-xs">
          <p className="font-semibold text-[#2D4533] mb-1">
            New to image editing?
          </p>
          <p className="text-[#4E6654] leading-relaxed mb-3">
            Small steps. Lovely results. We&apos;ll help you get started.
          </p>
          <button
            onClick={() => setShowTipsModal(true)}
            className="text-[#36533E] font-medium hover:underline inline-flex items-center gap-1"
          >
            Take a quick tour →
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-[#EAE2D6]/70 flex flex-col gap-1 text-[11px] text-[#8A8077]">
          <button
            onClick={() => setShowTipsModal(true)}
            className="flex items-center gap-1.5 hover:text-[#2D2623] transition-colors text-left"
          >
            <HelpCircle size={14} />
            <span>Help & little tips</span>
          </button>
          <span className="text-[10px] text-[#A69D95]">Made for curious minds</span>
        </div>
      </div>

      {/* Tour / Tips Modal */}
      {showTipsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#EAE2D6] rounded-3xl p-6 max-w-md w-full shadow-elevated animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-serif text-xl font-bold text-[#2D2623] mb-2">
              Welcome to PIXORA Studio
            </h3>
            <p className="text-sm text-[#5D544F] leading-relaxed mb-4">
              A browser-based workspace designed for gentle exploration of digital image processing.
            </p>
            <div className="space-y-3 text-xs text-[#5D544F] mb-6">
              <div className="p-3 bg-white rounded-xl border border-[#EAE2D6]">
                <strong className="text-[#2D2623]">1. Safe & Session-Local:</strong> Your images are processed entirely within your browser. Nothing leaves your device.
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#EAE2D6]">
                <strong className="text-[#2D2623]">2. Compare Anytime:</strong> Drag the before/after slider to inspect changes with no fear of losing your original.
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#EAE2D6]">
                <strong className="text-[#2D2623]">3. Undo Freely:</strong> Jump backwards or forwards through your steps anytime.
              </div>
            </div>
            <button
              onClick={() => setShowTipsModal(false)}
              className="w-full bg-[#B8533C] hover:bg-[#A1422E] text-white py-2.5 rounded-xl font-medium text-sm transition-colors"
            >
              Start exploring
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={closeMenu}
          />
          <div className="relative z-50 w-72 max-w-[85vw] h-full shadow-xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
