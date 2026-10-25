import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  closeOnBackdropClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '4xl': 'max-w-7xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (closeOnBackdropClick) onClose();
        }}
      />

      {/* Modal Card */}
      <div
        className={clsx(
          'relative w-full rounded-xl bg-white shadow-elevation border border-neutral-200 transition-all z-10 my-8 overflow-hidden flex flex-col max-h-[90vh]',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="font-semibold text-charcoal-900 text-base">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-charcoal-400 hover:bg-neutral-100 hover:text-charcoal-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 py-3.5 flex justify-end items-center gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
