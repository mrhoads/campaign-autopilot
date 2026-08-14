import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return diffSec >= 0 ? "just now" : "in a moment";
  if (abs < 3600) {
    const m = Math.round(abs / 60);
    return diffSec >= 0 ? `${m} min ago` : `in ${m} min`;
  }
  if (abs < 86400) {
    const h = Math.round(abs / 3600);
    return diffSec >= 0 ? `${h}h ago` : `in ${h}h`;
  }
  const d = Math.round(abs / 86400);
  return diffSec >= 0 ? `${d}d ago` : `in ${d}d`;
}

export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-3)}`;
}
