import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-brand-500/10 text-brand-200 ring-brand-400/30",
        secondary:
          "bg-white/5 text-slate-200 ring-white/10",
        success:
          "bg-emerald-500/10 text-emerald-300 ring-emerald-400/30",
        warning:
          "bg-amber-500/10 text-amber-300 ring-amber-400/30",
        danger:
          "bg-red-500/10 text-red-300 ring-red-400/30",
        info: "bg-sky-500/10 text-sky-200 ring-sky-400/30",
        outline:
          "bg-transparent text-slate-200 ring-white/10",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
