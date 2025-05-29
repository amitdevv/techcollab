import React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
}

const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-full font-medium transition-colors";

  const variants = {
    default: "bg-gray-100 dark:bg-dark-buttonBg text-gray-900 dark:text-dark-text",
    outline: "border border-gray-300 dark:border-dark-buttonBg bg-transparent text-gray-700 dark:text-dark-text",
    success: "bg-green-100 dark:bg-dark-button/20 text-green-800 dark:text-dark-button",
    warning: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400",
    error: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
    info: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
