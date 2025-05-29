import React from "react";
import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white dark:bg-[#232323] border-b border-gray-200 dark:border-dark-buttonBg shadow-sm lg:hidden">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-buttonBg/20 hover:text-gray-900 dark:hover:text-dark-text transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
            TechCollab
          </h1>
          <div className="w-10" />
        </div>
      </div>
    </header>
  );
};

export default Header; 