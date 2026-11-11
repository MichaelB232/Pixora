import React from "react";
import { cn } from "@/lib/utils";

interface ReassuranceBannerProps {
  title?: string;
  description?: string;
  variant?: "sage" | "peach";
  className?: string;
  children?: React.ReactNode;
}

export function ReassuranceBanner({
  title = "Room to try. Room to change your mind.",
  description = "Your original is kept for this session. Compare anytime, or undo to take a step back.",
  variant = "sage",
  className,
  children,
}: ReassuranceBannerProps) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl md:rounded-3xl p-5 border transition-all mt-6",
        variant === "sage"
          ? "bg-[#E8EFEA] border-[#D0E2D4] text-[#2F523A]"
          : "bg-[#F6EEE3] border-[#EAE2D6] text-[#3E3430]",
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="font-serif font-semibold text-sm md:text-base">
            {title}
          </h4>
          <p
            className={cn(
              "text-xs md:text-sm mt-0.5 leading-relaxed",
              variant === "sage" ? "text-[#46654F]" : "text-[#756C65]"
            )}
          >
            {description}
          </p>
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
    </div>
  );
}
