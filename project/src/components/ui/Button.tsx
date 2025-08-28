import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "destructive"
    | "success"
    | "primary"
    | "secondary"
    | "danger";
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant = "default",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    // Primary (very important): solid #219653, same in light/dark
    default: "bg-[#219653] text-white hover:bg-[#1c7f46] focus:ring-[#219653] shadow-sm",
    primary: "bg-[#219653] text-white hover:bg-[#1c7f46] focus:ring-[#219653] shadow-sm",
    // Secondary (medium importance): outline with #219653
    outline: "border border-[#219653] bg-white dark:bg-[#232323] text-[#219653] hover:bg-[#219653]/10 focus:ring-[#219653]",
    secondary: "border border-[#219653] bg-white dark:bg-[#232323] text-[#219653] hover:bg-[#219653]/10 focus:ring-[#219653]",
    // Ghost
    ghost: "text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-buttonBg/20 focus:ring-[#219653]",
    // Danger (logout / destructive)
    destructive: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm",
    // Success retained for backward compat
    success: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 shadow-sm",
  } as const;

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2 text-base",
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        loading && "opacity-70 cursor-not-allowed",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;
