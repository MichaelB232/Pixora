"use client";

import React, { createContext, useContext, useState } from "react";

interface StudioNavContextType {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const StudioNavContext = createContext<StudioNavContextType>({
  mobileOpen: false,
  setMobileOpen: () => {},
  openMobileMenu: () => {},
  closeMobileMenu: () => {},
});

export function StudioNavProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <StudioNavContext.Provider
      value={{
        mobileOpen,
        setMobileOpen,
        openMobileMenu: () => setMobileOpen(true),
        closeMobileMenu: () => setMobileOpen(false),
      }}
    >
      {children}
    </StudioNavContext.Provider>
  );
}

export function useStudioNav() {
  return useContext(StudioNavContext);
}
