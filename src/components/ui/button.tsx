import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink font-black uppercase tracking-tight transition-all duration-150 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-ink text-white shadow-brut-md hover:bg-acid hover:text-ink hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brut-sm",
        acid: "bg-acid text-ink shadow-brut-md hover:bg-acid-light hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brut-sm",
        pink: "bg-bubblegum text-ink shadow-brut-md hover:bg-lilac hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brut-sm",
        outline: "bg-white text-ink shadow-brut-sm hover:bg-cream",
        ghost: "border-transparent bg-transparent shadow-none hover:bg-ink/5",
        danger: "bg-danger text-white shadow-brut-md hover:bg-coral",
      },
      size: {
        xs: "px-3 py-1.5 text-[10px]",
        sm: "px-4 py-2 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
        xl: "px-8 py-4 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
