import React from 'react';
import { cn } from '../../lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  onChange?: (value: string) => void;
  fullWidth?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { 
      className, 
      options, 
      label, 
      error, 
      onChange, 
      fullWidth = true,
      ...props 
    }, 
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <div className={cn('space-y-2', fullWidth ? 'w-full' : '')}>
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <select
          className={cn(
            'h-10 w-full rounded-md border border-gray-300 dark:border-[#404040] bg-white dark:bg-[#232323] px-3 py-2 text-sm text-gray-900 dark:text-dark-text focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error-500 focus:ring-error-500',
            className
          )}
          onChange={handleChange}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-error-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;