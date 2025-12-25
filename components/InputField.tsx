import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="relative">
        <input
          className={`
            peer w-full h-14 px-4 pt-5 pb-2 rounded-t-lg border-b-2 bg-m3-surfaceVariant/50 
            text-m3-onSurface focus:outline-none focus:bg-m3-surfaceVariant 
            placeholder-shown:pt-2
            ${error ? 'border-m3-error' : 'border-m3-outline focus:border-m3-primary'}
          `}
          placeholder=" "
          {...props}
        />
        <label 
          className={`
            absolute left-4 top-4 text-m3-onSurfaceVariant/80 text-base duration-200 transform -translate-y-3 scale-75 origin-[0] 
            peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 
            peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none
            ${error ? 'text-m3-error' : ''}
          `}
        >
          {label}
        </label>
      </div>
      {error && <span className="text-xs text-m3-error px-4">{error}</span>}
    </div>
  );
};