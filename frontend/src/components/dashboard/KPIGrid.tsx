import React from "react";
import { cn } from "@/lib/utils";

interface KPIGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: number;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ children, className, cols }) => {
  const colsClass = cols === 3
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-4 lg:mb-6"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6";
  return (
    <div className={cn(colsClass, className)}>
      {children}
    </div>
  );
};
