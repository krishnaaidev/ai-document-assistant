import React from 'react';
import clsx from 'clsx';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={clsx(
        'animate-pulse rounded bg-neutral-200/80',
        className
      )}
    />
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}> = ({ lines = 3, className, lastLineWidth = '60%' }) => {
  return (
    <div className={clsx('space-y-2.5', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-3.5 bg-neutral-200/80 rounded animate-pulse"
          style={{
            width: index === lines - 1 ? lastLineWidth : '100%',
          }}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={clsx(
        'p-5 rounded-xl border border-neutral-200 bg-white shadow-subtle space-y-4 animate-pulse',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-lg bg-neutral-200" />
        <div className="w-16 h-5 rounded-full bg-neutral-200" />
      </div>
      <div className="space-y-2">
        <div className="w-2/3 h-5 rounded bg-neutral-200" />
        <div className="w-full h-3.5 rounded bg-neutral-200" />
        <div className="w-4/5 h-3.5 rounded bg-neutral-200" />
      </div>
      <div className="pt-2 flex items-center justify-between">
        <div className="w-20 h-3 rounded bg-neutral-200" />
        <div className="w-12 h-3 rounded bg-neutral-200" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 5, className }) => {
  return (
    <div className={clsx('w-full border border-neutral-200 rounded-xl bg-white overflow-hidden', className)}>
      <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-3.5 flex gap-4">
        {Array.from({ length: columns }).map((_, c) => (
          <div key={c} className="h-4 bg-neutral-200 rounded flex-1 animate-pulse" />
        ))}
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex items-center gap-4 animate-pulse">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 bg-neutral-200 rounded flex-1"
                style={{ width: `${Math.floor(60 + Math.random() * 30)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
