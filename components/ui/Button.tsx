"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-grotesk",
  {
    variants: {
      variant: {
        primary:
          "bg-su-bleu text-white hover:bg-su-cadet focus:ring-su-bleu",
        secondary:
          "bg-su-lavande text-su-nuit hover:bg-su-clair focus:ring-su-bleu",
        outline:
          "border border-su-clair bg-white text-su-bleu hover:border-su-bleu focus:ring-su-bleu",
        ghost: "text-su-bleu hover:bg-su-brume focus:ring-su-bleu",
        dark: "bg-su-nuit text-white hover:bg-su-cadet focus:ring-su-nuit",
        white: "bg-white text-su-nuit hover:bg-su-lavande focus:ring-su-lavande",
        danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
        gradient:
          "bg-su-bleu text-white hover:bg-su-cadet focus:ring-su-bleu",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
        xl: "px-10 py-5 text-xl",
        icon: "p-2 w-10 h-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string;
  external?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  animate?: boolean;
}

export default function Button({
  children,
  variant,
  size,
  href,
  external,
  loading,
  icon,
  iconRight,
  animate = true,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  const content = (
    <>
      {loading ? (
        <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        icon
      )}
      {children}
      {iconRight && !loading && iconRight}
    </>
  );

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  if (animate) {
    return (
      <motion.button
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        className={classes}
        disabled={disabled || loading}
        {...(props as any)}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}

export { buttonVariants };
