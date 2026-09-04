import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border-[1.5px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:border-zinc-700 dark:hover:bg-zinc-100",
        destructive: "bg-[#E85D4A] text-white hover:bg-[#D14A38] border-black",
        outline: "border-black bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 dark:text-white dark:border-zinc-600 dark:hover:bg-zinc-700",
        secondary: "bg-[#F7F36A] dark:bg-[#4A4000] dark:text-[#F7F36A] text-black dark:border-zinc-600 text-black hover:bg-[#EDE84A] border-black dark:bg-[#3A3300] dark:text-[#F7F36A] dark:border-[#5A5000]",
        ghost: "border-transparent shadow-none hover:bg-black/5 dark:hover:bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/10 dark:text-white",
        link: "text-primary underline-offset-4 hover:underline border-transparent shadow-none",
      },
      size: {
        default: "h-9 px-5 py-2",
        sm: "h-8 rounded-full px-4 text-xs",
        lg: "h-10 rounded-full px-7",
        icon: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = "Button"

export { Button, buttonVariants }
