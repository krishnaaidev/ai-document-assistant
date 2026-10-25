import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { DocumentStatus } from '@/types';

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function parseDateSafe(dateInput: string | number | Date | undefined | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isValid(dateInput) ? dateInput : null;
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isValid(d) ? d : null;
  }
  try {
    const parsed = parseISO(dateInput);
    if (isValid(parsed)) return parsed;
  } catch {
    // fallback
  }
  const d = new Date(dateInput);
  return isValid(d) ? d : null;
}

export function formatDate(
  dateInput: string | number | Date | undefined | null,
  formatPattern: string = 'MMM d, yyyy h:mm a'
): string {
  const date = parseDateSafe(dateInput);
  if (!date) return 'N/A';
  return format(date, formatPattern);
}

export function formatRelativeDate(
  dateInput: string | number | Date | undefined | null
): string {
  const date = parseDateSafe(dateInput);
  if (!date) return 'Just now';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'U';
}

export function getDocumentStatusText(status: DocumentStatus): string {
  switch (status) {
    case 'uploaded':
      return 'Uploaded';
    case 'processing':
      return 'Processing...';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'deleting':
      return 'Deleting...';
    default:
      return status;
  }
}
