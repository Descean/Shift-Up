import { cn } from "@/lib/utils";

type BadgeVariant = "accent" | "secondary" | "primary" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  accent: "bg-accent/10 text-accent border-accent/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function Badge({
  children,
  variant = "accent",
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "accent" ? "bg-accent" :
            variant === "secondary" ? "bg-secondary" :
            variant === "success" ? "bg-green-500" :
            variant === "warning" ? "bg-amber-500" :
            variant === "danger" ? "bg-red-500" :
            "bg-gray-400"
          )}
        />
      )}
      {children}
    </span>
  );
}

export function StarBadge({ stars }: { stars: number }) {
  const levels = ["", "Bronze", "Argent", "Or", "Platine", "Diamant"];
  const colors = [
    "",
    "bg-amber-700/10 text-amber-700 border-amber-700/20",
    "bg-gray-400/10 text-gray-500 border-gray-400/20",
    "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    "bg-purple-500/10 text-purple-600 border-purple-500/20",
  ];
  const level = Math.min(Math.max(1, stars), 5);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
        colors[level]
      )}
    >
      {Array.from({ length: level }).map((_, i) => (
        <i key={i} className="fas fa-star text-[10px]" />
      ))}
      {levels[level]}
    </span>
  );
}

export function PrestationStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: BadgeVariant; dot: boolean }> = {
    EN_ATTENTE: { label: "En attente", variant: "warning", dot: true },
    EN_COURS: { label: "En cours", variant: "accent", dot: true },
    LIVRAISON: { label: "Livraison", variant: "secondary", dot: true },
    REVISION: { label: "Révision", variant: "warning", dot: true },
    TERMINEE: { label: "Terminée", variant: "success", dot: false },
    ANNULEE: { label: "Annulée", variant: "danger", dot: false },
  };

  const config = statusMap[status] || { label: status, variant: "neutral" as BadgeVariant, dot: false };
  return <Badge variant={config.variant} dot={config.dot}>{config.label}</Badge>;
}
