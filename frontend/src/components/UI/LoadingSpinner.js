import React from 'react';
import clsx from 'clsx';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className={clsx('spinner', sizeClasses[size], className)} />
  );
};

export default LoadingSpinner;