
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text' | 'tonal' | 'success';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'filled', 
  fullWidth = false, 
  className = '', 
  disabled,
  ...props 
}) => {
  
  // Base: Rounded, bold, bouncy interaction
  const baseStyles = "relative h-14 px-6 rounded-2xl font-display font-bold text-lg tracking-wide transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100";
  
  const variants = {
    // Primary: Vivid Purple with soft shadow
    filled: "bg-brand-purple text-white shadow-pop hover:shadow-pop-lg hover:-translate-y-0.5 border-2 border-brand-text",
    
    // Success: Green (Accept/Proceed/Ready)
    success: "bg-green-500 text-white shadow-pop hover:shadow-pop-lg hover:-translate-y-0.5 border-2 border-green-700",
    
    // Secondary: Teal
    tonal: "bg-brand-teal text-brand-text shadow-pop hover:shadow-pop-lg hover:-translate-y-0.5 border-2 border-brand-text",
    
    // Outlined: Border only
    outlined: "bg-white text-brand-text border-2 border-brand-text shadow-pop hover:shadow-pop-lg hover:-translate-y-0.5",
    
    // Text: Simple
    text: "bg-transparent text-brand-text hover:bg-brand-text/5 shadow-none border-transparent active:scale-100 hover:text-brand-purple"
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
