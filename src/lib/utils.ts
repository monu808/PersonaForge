import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) {
    return text;
  }
  return text.slice(0, length) + "...";
}

export function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getRandomColor(): string {
  const colors = [
    "bg-primary-100 text-primary-800",
    "bg-secondary-100 text-secondary-800",
    "bg-accent-100 text-accent-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-blue-100 text-blue-800",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function validateVideoFile(
  file: File, 
  maxSizeMB: number = 50,
  supportedFormats: string[] = ['mp4', 'mov', 'webm']
): { isValid: boolean; errors: string[] } {
  const errors = [];
  
  // Check file type
  if (!file.type.startsWith('video/')) {
    errors.push('File must be a video format');
  }
  
  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    errors.push(`File size (${fileSizeMB.toFixed(1)}MB) exceeds the ${maxSizeMB}MB limit`);
  }
  
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && !supportedFormats.includes(extension)) {
    errors.push(`File format must be one of: ${supportedFormats.join(', ').toUpperCase()}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}