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
  
  // Base: Bold border, hard shadow transition, uppercase text
  const baseStyles = "relative h-14 px-6 rounded-lg font-black text-sm tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-2 border-2 border-brand-darkBlue active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none";
  
  const variants = {
    // Primary action: Black or Pop Color with Hard Shadow
    filled: "bg-brand-darkBlue text-white shadow-hard hover:bg-brand-navy hover:shadow-hard-lg",
    
    // Secondary: Light background, Hard Shadow
    tonal: "bg-brand-teal text-brand-darkBlue shadow-hard hover:bg-brand-teal/80 hover:shadow-hard-lg",
    
    // Outlined: Transparent, border, hard shadow
    outlined: "bg-transparent text-brand-darkBlue shadow-hard hover:bg-brand-darkBlue/5",
    
    // Text: No shadow, just bold text
    text: "border-transparent bg-transparent text-brand-darkBlue hover:bg-brand-darkBlue/5 shadow-none active:translate-x-0 active:translate-y-0"
  };

  const widthStyle = fullWidth ? "w-full" : "";

  // Override specific variants if classname passes bg colors to maintain the hard shadow style
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