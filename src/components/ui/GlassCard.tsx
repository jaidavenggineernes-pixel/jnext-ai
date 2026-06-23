import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function GlassCard({ className, hoverEffect = false, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-panel p-6 relative overflow-hidden group",
        hoverEffect && "transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] hover:border-primary/40",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
