import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const pixelButton = cva(
  "inline-flex select-none items-center justify-center gap-1.5 font-pixel text-ink transition-transform pixel-border active:translate-x-[2px] active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      tone: {
        cy: "bg-cy hover:brightness-105",
        pink: "bg-pink hover:bg-pink-deep",
        mint: "bg-mint hover:bg-mint-deep",
        butter: "bg-butter hover:bg-butter-deep",
        sky: "bg-sky hover:bg-sky-deep",
        paper: "bg-paper hover:bg-muted",
        ink: "bg-ink text-paper hover:bg-ink-soft",
      },
      size: {
        sm: "h-7 px-2.5 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-8 w-8 text-sm",
      },
    },
    defaultVariants: { tone: "paper", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof pixelButton>;

export const PixelButton = forwardRef<HTMLButtonElement, Props>(
  ({ className, tone, size, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(pixelButton({ tone, size }), className)} {...props} />
  ),
);
PixelButton.displayName = "PixelButton";
