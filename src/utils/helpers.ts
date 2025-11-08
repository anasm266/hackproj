// ============================================
// SHARED HELPER UTILITIES
// ============================================

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Check if a deadline is upcoming (within 7 days)
 */
export function isUpcoming(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

/**
 * Check if a deadline is overdue
 */
export function isOverdue(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < new Date().getTime();
}

/**
 * Sort deadlines by date
 */
export function sortByDate<T extends { dueDate: Date | string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = typeof a.dueDate === 'string' ? new Date(a.dueDate) : a.dueDate;
    const dateB = typeof b.dueDate === 'string' ? new Date(b.dueDate) : b.dueDate;
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Truncate text to a specific length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get YouTube video thumbnail URL
 */
export function getYouTubeThumbnail(url: string): string | null {
  const videoIdMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/
  );
  if (!videoIdMatch) return null;
  return `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Class name helper (simple alternative to clsx)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
