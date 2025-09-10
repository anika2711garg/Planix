import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility to merge Tailwind CSS classes (using clsx and tailwind-merge)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to a readable string (e.g., for sprint dates)
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate a random ID for temporary use (e.g., before DB save)
export function generateTempId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Calculate time difference in milliseconds
export function getTimeDifference(start: Date | string, end: Date | string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) throw new Error("Invalid date");
  return endDate.getTime() - startDate.getTime();
}

// Convert milliseconds to a human-readable duration
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// API response helper
export function createApiResponse(data: unknown, status: number = 200, error?: string) {
  if (error) {
    return { error, status };
  }
  return { data, status };
}

// Delay function for testing or async operations
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Export types for TypeScript safety
export type ApiResponse<T> = { data: T; status: number } | { error: string; status: number };