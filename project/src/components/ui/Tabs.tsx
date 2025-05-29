import React from "react";
import { cn } from "../../lib/utils";

interface TabsProps {
  children: React.ReactNode;
  className?: string;
}

const Tabs = ({ children, className, ...props }: TabsProps) => {
  return (
    <div className={cn("w-full", className)} {...props}>
      {children}
    </div>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

const TabsList = ({ children, className, ...props }: TabsListProps) => {
  return (
    <div
      className={cn(
        "flex space-x-1 rounded-md bg-gray-50 p-1 border border-gray-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  onClick?: () => void;
}

const TabsTrigger = ({
  children,
  className,
  active,
  onClick,
  ...props
}: TabsTriggerProps) => {
  return (
    <button
      className={cn(
        "px-3 py-1.5 text-sm font-medium transition-colors rounded-md",
        active
          ? "bg-white text-violet-700 shadow-sm"
          : "text-gray-600 hover:text-gray-900",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

const TabsContent = ({
  children,
  className,
  active = false,
  ...props
}: TabsContentProps) => {
  if (!active) return null;

  return (
    <div className={cn("mt-4", className)} {...props}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
