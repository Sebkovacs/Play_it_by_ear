import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text' | 'tonal';
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
  
  const baseStyles = "relative overflow-hidden h-10 px-6 rounded-full font-medium text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    filled: "bg-m3-primary text-m3-onPrimary hover:bg-opacity-90 shadow-sm hover:shadow-md",
    tonal: "bg-m3-secondaryContainer text-m3-onSecondaryContainer hover:bg-opacity-80",
    outlined: "border border-m3-outline text-m3-primary hover:bg-m3-primary/10",
    text: "text-m3-primary hover:bg-m3-primary/10 bg-transparent"
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