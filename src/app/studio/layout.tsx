"use client";

import React from "react";
import { StudioSidebar } from "@/components/studio/StudioSidebar";
import { StudioNavProvider } from "@/components/studio/StudioNavContext";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudioNavProvider>
      <div className="flex h-screen w-full bg-[#FAF7F2] overflow-hidden">
        <StudioSidebar />
        <div className="flex-1 flex flex-col h-full overflow-y-auto min-w-0">
          {children}
        </div>
      </div>
    </StudioNavProvider>
  );
}
