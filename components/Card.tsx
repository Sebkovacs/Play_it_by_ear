import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined';
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'elevated',
  className = '' 
}) => {
  
  const baseStyles = "rounded-3xl p-6 transition-shadow duration-200";
  
  const variants = {
    elevated: "bg-m3-surface text-m3-onSurface shadow-md hover:shadow-lg",
    filled: "bg-m3-surfaceVariant text-m3-onSurfaceVariant",
    outlined: "bg-m3-surface border border-m3-outline text-m3-onSurface"
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};