import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none placeholder:text-[#84748f] focus-visible:ring-ring/70 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex field-sizing-content min-h-20 w-full rounded-[10px] border-2 border-[#2a2334] bg-[#f7efcf] px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
