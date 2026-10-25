import React from 'react';
import clsx from 'clsx';
import { DocumentStatus } from '@/types';
import { getDocumentStatusText } from '@/utils/formatters';

export interface BadgeProps {
  status?: DocumentStatus;
  variant?: 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'indigo' | 'teal';
  children?: React.ReactNode;
  pulse?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  children,
  pulse = false,
  className,
  size = 'md',
}) => {
  // If status is provided, map to corresponding variant & pulse
  let effectiveVariant = variant || 'gray';
  let shouldPulse = pulse;
  let text = children;

  if (status) {
    text = text || getDocumentStatusText(status);
    switch (status) {
      case 'uploaded':
        effectiveVariant = 'gray';
        break;
      case 'processing':
        effectiveVariant = 'blue';
        shouldPulse = true;
        break;
      case 'completed':
        effectiveVariant = 'green';
        break;
      case 'failed':
        effectiveVariant = 'red';
        break;
      case 'deleting':
        effectiveVariant = 'orange';
        break;
    }
  }

  const variantStyles = {
    gray: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    orange: 'bg-amber-50 text-amber-700 border-amber-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  const dotStyles = {
    gray: 'bg-neutral-400',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    red: 'bg-rose-500',
    orange: 'bg-amber-500',
    indigo: 'bg-indigo-500',
    teal: 'bg-teal-500',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5',
        variantStyles[effectiveVariant],
        className
      )}
    >
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full shrink-0',
          dotStyles[effectiveVariant],
          shouldPulse && 'animate-ping'
        )}
      />
      <span>{text}</span>
    </span>
  );
};
