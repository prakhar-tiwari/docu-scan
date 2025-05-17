import React from 'react';

interface SearchHighlighterProps {
  text: string;
  searchTerm: string;
}

const SearchHighlighter: React.FC<SearchHighlighterProps> = ({ text, searchTerm }) => {
  if (!searchTerm || !text) return <p>{text}</p>;

  // Escape special characters in the search term
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  try {
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    const parts = text.split(regex);

    return (
      <p className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          const isMatch = part.toLowerCase() === searchTerm.toLowerCase();
          return isMatch ? (
            <mark 
              key={i}
              className="bg-yellow-200 dark:bg-yellow-800/50 px-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          );
        })}
      </p>
    );
  } catch (error) {
    // Fallback in case of invalid regex
    return <p>{text}</p>;
  }
};

export default SearchHighlighter;