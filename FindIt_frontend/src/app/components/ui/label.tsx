"use client" // This is a client component

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "./utils"

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
    return (
        <LabelPrimitive.Root
            data-slot = "label"
            className={cn("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
} // The Label component is a wrapper around the Radix UI Label component, with additional styling and support for disabled state

export { Label } // Exporting the Label component for use in other parts of the application