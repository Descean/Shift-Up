import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt = "dd MMMM yyyy"): string {
  return format(new Date(date), fmt, { locale: fr });
}

export function formatCurrency(amount: number, currency: "XOF" | "EUR" | "USD" = "XOF"): string {
  if (currency === "XOF") {
    return `${amount.toLocaleString("fr-FR")} FCFA`;
  }
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount);
}

export function generateAffiliationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const year = new Date().getFullYear();
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SU-${year}-${code}`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function calculateProgress(phases: Array<{ progress: number }>): number {
  if (!phases.length) return 0;
  return Math.round(phases.reduce((sum, p) => sum + p.progress, 0) / phases.length);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isValidIFU(ifu: string): boolean {
  return /^\d{13}$/.test(ifu.replace(/\s/g, ""));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
