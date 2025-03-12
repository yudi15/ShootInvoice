import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ type, count = 1 }) => {
  const renderSkeleton = () => {
    let skeletons = [];
    
    for (let i = 0; i < count; i++) {
      skeletons.push(
        <div key={i} className={`skeleton ${type}`}></div>
      );
    }
    
    return skeletons;
  };
  
  return <>{renderSkeleton()}</>;
};

export default Skeleton; 