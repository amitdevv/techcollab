import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, checked, onChange, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (onChange) {
        const syntheticEvent = {
          target: { checked: !checked, type: 'checkbox' }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              ref={ref}
              checked={checked}
              onChange={onChange}
              {...props}
            />
            <div
              onClick={handleClick}
              className={cn(
                "h-4 w-4 border-2 rounded transition-all duration-200 cursor-pointer flex items-center justify-center",
                "peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-[#00aa45]/20",
                checked 
                  ? "border-[#00aa45] bg-[#00aa45]" 
                  : "border-[#4b5563] bg-white dark:bg-[#232323]",
                "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                "peer-disabled:border-gray-300 dark:peer-disabled:border-gray-600",
                "peer-disabled:bg-gray-100 dark:peer-disabled:bg-gray-800",
                error && "border-red-500 peer-focus:ring-red-500",
                "hover:border-[#00aa45]/80 hover:shadow-sm",
                className
              )}
            >
              {checked && (
                <Check className="h-3 w-3 text-white transition-all duration-200" />
              )}
            </div>
          </div>
          {label && (
            <label 
              onClick={handleClick}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
