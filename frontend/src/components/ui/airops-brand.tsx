import React from "react";

interface AirOpsBrandProps {
  size?: "sm" | "md" | "lg";
  withSubtitle?: boolean;
  className?: string;
}

export function AirOpsBrand({
  size = "md",
  withSubtitle = true,
  className = "",
}: AirOpsBrandProps) {
  const textClasses = {
    sm: "text-[16px]",
    md: "text-[20px]",
    lg: "text-[26px]",
  }[size];

  const subClasses = {
    sm: "text-[8.5px]",
    md: "text-[9.5px]",
    lg: "text-[11px]",
  }[size];

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={`${textClasses} font-black tracking-tight leading-none select-none flex items-baseline`}>
        <span className="text-[#0B0F19] dark:text-white font-extrabold">Air</span>
        <span className="text-[#5B42F3] dark:text-[#8B7CF6] font-extrabold">Ops</span>
      </span>
      {withSubtitle && (
        <span className={`${subClasses} font-semibold tracking-wider text-muted-foreground uppercase mt-1`}>
          Air Operations
        </span>
      )}
    </div>
  );
}
