import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export interface SearchBarProps {
  value?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value: controlledValue,
  onSearch,
  placeholder = 'Search documents, topics, or collections...',
  debounceMs = 300,
  className = '',
}) => {
  const [query, setQuery] = useState(controlledValue || '');
  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== query) {
      setQuery(controlledValue);
    }
  }, [controlledValue]);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-9 py-2 text-sm text-charcoal placeholder-charcoal-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 shadow-subtle"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-400 hover:text-charcoal-600"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
