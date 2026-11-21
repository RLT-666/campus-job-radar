"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

const glassLinkStyles = cva(
  "glass-control inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full px-6 text-sm font-medium tracking-[-0.01em] sm:min-h-[52px] sm:w-auto sm:px-7",
  {
    variants: {
      intent: {
        primary: "glass-control-primary",
        secondary: "glass-control-secondary",
      },
    },
    defaultVariants: {
      intent: "primary",
    },
  },
);

type GlassLinkProps = ComponentProps<typeof Link> &
  VariantProps<typeof glassLinkStyles>;

export function GlassLink({
  children,
  className,
  intent,
  ...props
}: GlassLinkProps) {
  const [isPressed, setIsPressed] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const release = () => setIsPressed(false);
    window.addEventListener("blur", release);
    return () => window.removeEventListener("blur", release);
  }, []);

  const pressed = Boolean(isPressed && !shouldReduceMotion);

  return (
    <motion.div
      className="flex w-full rounded-full sm:w-auto"
      initial={false}
      animate={{ transform: pressed ? "scale(0.95)" : "scale(1)" }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : isPressed
            ? { duration: 0.12, ease: [0.23, 1, 0.32, 1] }
            : { type: "spring", duration: 0.5, bounce: 0.2 }
      }
    >
      <Link
        {...props}
        className={cn(glassLinkStyles({ intent }), className)}
        onPointerDown={(event) => {
          if (event.button === 0) setIsPressed(true);
        }}
        onPointerUp={() => setIsPressed(false)}
        onPointerCancel={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
      >
        <span>{children}</span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 opacity-80"
          strokeWidth={1.5}
        />
      </Link>
    </motion.div>
  );
}
