
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  // Check if className includes a background color, if not use default white
  const hasBgColor = className.includes('bg-');
  const baseClasses = hasBgColor ? 'rounded-2xl shadow-soft transition-all duration-300' : 'bg-white rounded-2xl shadow-soft transition-all duration-300';
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : '';

  return (
    <div className={`${baseClasses} ${interactiveClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
