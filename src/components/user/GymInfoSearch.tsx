import React, { useState, useEffect } from 'react';
import { gymInfoService } from '../../services/gymInfoService';
import type { GymService } from '../../services/gymInfoService';

interface SearchResult {
  services: GymService[];
  facilities: string[];
  feePackages: any[];
  contact: any;
  totalResults: number;
}

interface GymInfoSearchProps {
  onSearchResults?: (results: SearchResult) => void;
}

export const GymInfoSearch: React.FC<GymInfoSearchProps> = ({ onSearchResults }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'service', label: 'Services' },
    { value: 'class', label: 'Classes' },
    { value: 'facility', label: 'Facilities' },
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'category', label: 'Category' },
    { value: 'availability', label: 'Availability' },
  ];

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      onSearchResults?.(null as any);
      return;
    }

    setIsSearching(true);
    try {
      const results = await gymInfoService.searchGymInfo(searchTerm);
      setSearchResults(results);
      onSearchResults?.(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const sortResults = (results: SearchResult): SearchResult => {
    const sortedServices = [...results.services].sort((a, b) => {
      let aValue: string | boolean;
      let bValue: string | boolean;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'availability':
          aValue = a.isAvailable;
          bValue = b.isAvailable;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortBy === 'availability') {
        // For boolean values, sort available items first when ascending
        if (sortOrder === 'asc') {
          return bValue === aValue ? 0 : bValue ? 1 : -1;
        } else {
          return bValue === aValue ? 0 : aValue ? 1 : -1;
        }
      } else {
        // For string values
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
    });

    const sortedFacilities = [...results.facilities].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      } else {
        return b.toLowerCase().localeCompare(a.toLowerCase());
      }
    });

    return {
      ...results,
      services: sortedServices,
      facilities: sortedFacilities
    };
  };

  const handleCategoryFilter = async () => {
    if (selectedCategory === 'all' && !searchTerm.trim()) {
      setSearchResults(null);
      onSearchResults?.(null as any);
      return;
    }

    setIsSearching(true);
    try {
      let results: SearchResult;
      
      if (searchTerm.trim()) {
        // If there's a search term, use full search
        results = await gymInfoService.searchGymInfo(searchTerm);
      } else {
        // If no search term, just filter by category
        const services = await gymInfoService.getGymServices(
          selectedCategory === 'all' ? undefined : selectedCategory
        );
        results = {
          services,
          facilities: selectedCategory === 'facility' ? await gymInfoService.getGymFacilities() : [],
          feePackages: [],
          contact: null,
          totalResults: services.length
        };
      }
      
      // Apply sorting
      const sortedResults = sortResults(results);
      setSearchResults(sortedResults);
      onSearchResults?.(sortedResults);
    } catch (error) {
      console.error('Filter error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('name');
    setSortOrder('asc');
    setSearchResults(null);
    onSearchResults?.(null as any);
  };

  useEffect(() => {
    handleCategoryFilter();
  }, [selectedCategory, sortBy, sortOrder]);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Search Gym Information</h2>
      
      {/* Search Input and Category Filter */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for gym services, equipment, or information..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </>
            )}
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700">Categories:</span>
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedCategory === category.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Sorting Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
          >
            <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {(searchTerm || selectedCategory !== 'all' || sortBy !== 'name' || sortOrder !== 'asc') && (
            <button
              onClick={clearSearch}
              className="px-3 py-1 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              Reset All
            </button>
          )}
        </div>
      </div>

      {/* Search Results Summary */}
      {searchResults && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Found {searchResults.totalResults} result{searchResults.totalResults !== 1 ? 's' : ''}
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory !== 'all' && ` in ${categories.find(c => c.value === selectedCategory)?.label}`}
          </p>
        </div>
      )}
    </div>
  );
};