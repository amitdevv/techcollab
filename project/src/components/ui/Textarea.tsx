import React from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { 
      className, 
      label, 
      error, 
      fullWidth = true,
      ...props 
    }, 
    ref
  ) => {
    return (
      <div className={cn('space-y-2', fullWidth ? 'w-full' : '')}>
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-[#d1d5db] dark:border-[#404040] bg-white dark:bg-[#232323] px-3 py-2 text-sm text-gray-900 dark:text-dark-text placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;