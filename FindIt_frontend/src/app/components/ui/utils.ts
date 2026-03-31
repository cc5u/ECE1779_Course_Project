import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} // Utility function to combine and merge class names using clsx and tailwind-merge for better handling of Tailwind CSS classes