import React, { ReactNode } from 'react';
import { Button, ButtonProps } from './Button';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps['variant'];
    icon?: ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-neutral-300 bg-white/60 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-4 ring-8 ring-primary-50/50">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-charcoal-900 mb-1">{title}</h3>
      <p className="text-sm text-charcoal-500 max-w-sm mb-6">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'primary'}
          leftIcon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
