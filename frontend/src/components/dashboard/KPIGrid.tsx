import React from "react";
import { cn } from "@/lib/utils";

interface KPIGridProps {
  children: React.ReactNode;
  className?: string;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ children, className }) => {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6", className)}>
      {children}
    </div>
  );
};
