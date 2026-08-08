/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4",
  {
    variants: {
      variant: {
        default: "bg-violet-600 text-white shadow-sm hover:bg-violet-700 active:bg-violet-800",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300",
        outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        destructive: "bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-11 px-3 text-xs",
        lg: "h-13 px-6 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
)
Button.displayName = "Button"

export { Button, buttonVariants }
