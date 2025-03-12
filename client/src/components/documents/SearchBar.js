import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce the search to prevent excessive rendering
  const debouncedSearch = useCallback(
    debounce((term) => {
      onSearch(term);
    }, 300),
    [onSearch]
  );
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };
  
  // Clean up the debounce function when component unmounts
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);
  
  return (
    <input
      type="text"
      placeholder="Search documents..."
      value={searchTerm}
      onChange={handleSearch}
      className="search-input"
    />
  );
};

export default SearchBar; 