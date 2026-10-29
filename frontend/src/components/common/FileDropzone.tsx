import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';
import { formatFileSize } from '@/utils/formatters';
import { validateFileSize, validateFileType } from '@/utils/validators';
import { SUPPORTED_EXTENSIONS } from '@/utils/constants';

export interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  onClear?: () => void;
  progress?: number | null;
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  selectedFile,
  onClear,
  progress,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    const typeValidation = validateFileType(file);
    if (!typeValidation.valid) {
      setErrorMessage(typeValidation.error || 'Invalid file type');
      return;
    }

    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      setErrorMessage(sizeValidation.error || 'File exceeds 20MB limit');
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
      e.dataTransfer.clearData();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleClickArea = () => {
    if (disabled || selectedFile) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_EXTENSIONS.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClickArea}
          className={clsx(
            'group relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center select-none',
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          <div
            className={clsx(
              'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200',
              isDragOver
                ? 'bg-indigo-600 text-white scale-110'
                : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm group-hover:scale-105'
            )}
          >
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
            <span className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            PDF, DOCX, or TXT (up to 20MB)
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>

            {onClear && (progress === null || progress === undefined || progress === 0) && (
              <button
                type="button"
                onClick={onClear}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {progress !== null && progress !== undefined && (
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-charcoal-600">
                <span>{progress === 100 ? 'Finalizing indexing...' : 'Uploading...'}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
