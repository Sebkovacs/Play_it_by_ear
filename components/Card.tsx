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
  
  // Base: White bg, thick border, rounded
  const baseStyles = "rounded-xl p-6 border-2 border-brand-darkBlue transition-all duration-200";
  
  const variants = {
    // Default card: Hard shadow
    elevated: "bg-white shadow-hard",
    
    // Filled: darker bg, usually no shadow or small shadow
    filled: "bg-gray-100",
    
    // Outlined: Just border, no shadow
    outlined: "bg-transparent border-dashed"
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};