import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS } from './constants';

export function validateFileType(file: File): { valid: boolean; error?: string } {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isValidExtension = (SUPPORTED_EXTENSIONS as readonly string[]).includes(extension);

  if (!isValidExtension) {
    return {
      valid: false,
      error: `Unsupported file type. Please upload a ${SUPPORTED_EXTENSIONS.join(', ')} file.`,
    };
  }
  return { valid: true };
}

export function validateFileSize(
  file: File,
  maxSize: number = MAX_FILE_SIZE
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds the limit of ${maxMb}MB.`,
    };
  }
  return { valid: true };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export interface PasswordStrength {
  valid: boolean;
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  errors: string[];
}

export function validatePassword(password: string): PasswordStrength {
  const errors: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else errors.push('At least 8 characters');

  if (/[A-Z]/.test(password)) score += 1;
  else errors.push('At least one uppercase letter');

  if (/[0-9]/.test(password)) score += 1;
  else errors.push('At least one number');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else errors.push('At least one special character');

  const labels: PasswordStrength['label'][] = [
    'Very Weak',
    'Weak',
    'Medium',
    'Strong',
    'Very Strong',
  ];

  return {
    valid: score >= 3 && password.length >= 8,
    score,
    label: labels[score] || 'Very Weak',
    errors,
  };
}
