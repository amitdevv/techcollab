import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && optionsRef.current && highlightedIndex >= 0) {
      const optionElement = optionsRef.current.children[highlightedIndex] as HTMLElement;
      if (optionElement) {
        optionElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          onChange(options[highlightedIndex].value);
          setIsOpen(false);
          setHighlightedIndex(-1);
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div className={cn("relative min-w-[200px]", className)} ref={selectRef}>
      <button
        type="button"
        className={cn(
          "relative w-full rounded-lg border px-4 py-3 text-left transition-all duration-200",
          "focus:outline-none",
          disabled 
            ? "cursor-not-allowed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#232323] text-gray-400 dark:text-gray-500" 
            : isOpen 
              ? "border-[#4b5563] ring-2 ring-[#4b5563]/20 shadow-lg bg-white dark:bg-[#232323]" 
              : "border-[#4b5563] hover:border-[#4b5563]/80 hover:shadow-md bg-white dark:bg-[#232323]",
          "text-sm font-medium"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={cn(
          "block truncate pr-8",
          selectedOption ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              disabled ? "text-gray-400 dark:text-gray-500" : "text-[#4b5563] dark:text-gray-400",
              isOpen ? "rotate-180" : ""
            )} 
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-[9999] mt-2 w-full overflow-visible rounded-lg bg-white dark:bg-[#232323] shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-200 border border-[#4b5563]">
          <div 
            ref={optionsRef}
            className="max-h-64 overflow-auto py-2"
            role="listbox"
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "relative w-full cursor-pointer select-none py-3 px-4 text-left text-sm transition-colors duration-150",
                  "hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white",
                  highlightedIndex === index && "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-white",
                  option.value === value && "bg-[#4b5563] text-white font-semibold"
                )}
                onClick={() => handleOptionClick(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={option.value === value}
              >
                <span className="block truncate">
                  {option.label}
                </span>
                {option.value === value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect; 