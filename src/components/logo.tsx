import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, showText = true, size = "md" }: LogoProps) => {
  const dims = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const iconSize = size === "sm" ? 16 : size === "lg" ? 22 : 18;
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl brand-gradient-bg shadow-soft",
          dims,
        )}
      >
        <Boxes size={iconSize} className="text-[hsl(var(--on-brand))]" strokeWidth={2.25} />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-semibold tracking-tight", text)}>
            Cybix <span className="brand-gradient-text">Deployer</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
            CI / CD Platform
          </span>
        </div>
      )}
    </div>
  );
};
