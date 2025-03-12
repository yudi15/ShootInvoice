import React from 'react';

const LazyImage = ({ src, alt, width, height, className }) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ objectFit: 'contain' }}
      onLoad={(e) => {
        // Add loaded class for animation if needed
        e.target.classList.add('loaded');
      }}
    />
  );
};

export default LazyImage; 