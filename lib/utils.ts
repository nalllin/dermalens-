import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateLabel(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  return format(new Date(value), "MMM d, yyyy");
}

export function formatDateTimeLabel(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function formatRelativeLabel(value?: string | null) {
  if (!value) {
    return "No activity yet";
  }

  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
}

export function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function truncate(value: string, length = 80) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 1)}…`;
}

export function percentage(value: number) {
  return `${Math.round(value * 100)}%`;
}

