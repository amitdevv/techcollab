import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { aiSearchApi } from '../../services/aiSearchApi';
import { toast } from 'react-hot-toast';

interface AISearchBoxProps {
  onSearch: (filters: any) => void;
  onQueryChange: (query: string) => void;
  value: string;
}

const AISearchBox: React.FC<AISearchBoxProps> = ({ onSearch, onQueryChange, value }) => {
  const [isAILoading, setIsAILoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Get AI suggestions as user types
  useEffect(() => {
    if (value && value.length > 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const suggestions = await aiSearchApi.getSearchSuggestions(value);
          setSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to get suggestions:', error);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setShowSuggestions(false);
    }
  }, [value]);

  const handleAISearch = async (query: string) => {
    if (!query.trim()) return;

    setIsAILoading(true);
    try {
      const result = await aiSearchApi.searchWithAI({
        query,
        context: 'gigs'
      });

      setAiResult(result);
      
      // Apply AI suggestions to filters
      const filters: any = {};
      if (result.suggestedFilters.category) {
        filters.category = result.suggestedFilters.category;
      }
      if (result.suggestedFilters.priceRange) {
        filters.priceRange = result.suggestedFilters.priceRange;
      }
      if (result.suggestedFilters.sortBy) {
        filters.sortBy = result.suggestedFilters.sortBy;
      }
      
      // Use the cleaned search query
      onQueryChange(result.searchQuery);
      onSearch(filters);

      toast.success(`🤖 ${result.explanation}`);
      setShowSuggestions(false);

    } catch (error) {
      console.error('AI search failed:', error);
      toast.error('AI search failed, using regular search');
      onSearch({});
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onQueryChange(suggestion);
    handleAISearch(suggestion);
  };

  return (
    <div className="relative">
      {/* Main Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAISearch(value);
            }
          }}
          placeholder="enter what you need"
          className="w-full pl-12 pr-24 py-4 bg-white/90 dark:bg-[#171717]/90 border border-emerald-200 dark:border-dark-buttonBg rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-dark-button focus:border-transparent text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400 text-lg backdrop-blur-sm"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          <button
            onClick={() => handleAISearch(value)}
            disabled={isAILoading || !value.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 dark:from-dark-button dark:to-dark-button text-white rounded-lg hover:from-emerald-600 hover:to-green-700 dark:hover:from-dark-button/90 dark:hover:to-dark-button/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
          >
            {isAILoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI Search
          </button>
        </div>
      </div>

      {/* AI Result Display */}
      {aiResult && (
        <div className="mt-3 p-3 bg-emerald-50 dark:bg-dark-buttonBg/20 border border-emerald-200 dark:border-dark-buttonBg rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-dark-button mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-emerald-800 dark:text-dark-button font-medium">
                {aiResult.interpretedQuery}
              </p>
              <p className="text-emerald-600 dark:text-gray-300 mt-1">
                {aiResult.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-[#171717] border border-gray-200 dark:border-dark-buttonBg rounded-lg shadow-lg backdrop-blur-sm">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Suggestions
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-dark-buttonBg/30 rounded-md transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AISearchBox; 