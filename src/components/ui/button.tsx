"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = {
  default: "bg-[#81bb26] text-white hover:bg-[#74a822]",
  outline: "border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
  ghost: "text-gray-700 hover:bg-gray-100",
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "button"
    return (
      <Comp
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-md font-medium transition-all",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",

          // Size variations
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-4 py-2 text-sm",
          size === "lg" && "px-6 py-3 text-base",

          // Variant styles
          buttonVariants[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }