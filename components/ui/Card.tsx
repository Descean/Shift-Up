"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  animate?: boolean;
  delay?: number;
  onClick?: () => void;
}

export default function Card({
  children,
  className,
  hover = true,
  glass = false,
  animate = false,
  delay = 0,
  onClick,
}: CardProps) {
  const classes = cn(
    "rounded-2xl p-6",
    glass
      ? "bg-white/5 backdrop-blur-sm border border-white/10"
      : "bg-white border border-gray-100 shadow-card",
    hover && "transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
    onClick && "cursor-pointer",
    className
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className={classes}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  color = "accent",
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "accent" | "secondary" | "primary";
}) {
  const colorMap = {
    accent: "text-accent bg-accent/10",
    secondary: "text-secondary bg-secondary/10",
    primary: "text-primary bg-primary/10",
  };

  return (
    <Card animate>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold font-syne text-primary">{value}</p>
          {trendValue && (
            <p
              className={cn(
                "text-xs mt-1 font-medium",
                trend === "up" ? "text-secondary" : trend === "down" ? "text-red-500" : "text-gray-400"
              )}
            >
              {trend === "up" ? "+" : trend === "down" ? "-" : ""}
              {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl", colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
