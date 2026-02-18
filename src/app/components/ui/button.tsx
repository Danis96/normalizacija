import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none border-2 border-[#2a2334] shadow-[0_2px_0_#2a2334] active:translate-y-px active:shadow-none focus-visible:ring-2 focus-visible:ring-ring/60",
  {
    variants: {
      variant: {
        default: "bg-[#b8df69] text-[#2a2334] hover:bg-[#c9ef7a]",
        destructive:
          "bg-[#f487a8] text-[#2a2334] hover:bg-[#ff99b7]",
        outline:
          "bg-[#f5ebcb] text-[#2a2334] hover:bg-[#fff5d8]",
        secondary:
          "bg-[#b9a7de] text-[#2a2334] hover:bg-[#ccbaee]",
        ghost:
          "bg-[#f3d2e5] text-[#2a2334] hover:bg-[#ffdff0]",
        link: "bg-transparent border-0 shadow-none text-[#4b37ef] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-[8px] gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-[10px] px-6 has-[>svg]:px-4",
        icon: "size-10 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
