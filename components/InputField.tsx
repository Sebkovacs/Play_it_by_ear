import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <label className="text-xs font-black uppercase tracking-widest text-brand-darkBlue ml-1">
        {label}
      </label>
      
      <input
        className={`
          w-full h-14 px-4 rounded-lg bg-white
          border-2 text-brand-darkBlue font-bold text-lg
          placeholder:text-brand-navy/30
          focus:outline-none focus:shadow-hard focus:-translate-y-1 transition-all duration-200
          ${error ? 'border-brand-red' : 'border-brand-darkBlue focus:border-brand-teal'}
        `}
        placeholder=" "
        {...props}
      />
      
      {error && (
        <span className="text-xs font-bold text-brand-red px-1 bg-brand-red/10 py-1 rounded w-fit">
          ! {error}
        </span>
      )}
    </div>
  );
};