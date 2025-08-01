import React from 'react';
import { Tooltip } from './Tooltip';

interface FormFieldProps {
  label: string;
  tooltip: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  tooltip, 
  required = false, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <Tooltip content={tooltip} />
      </div>
      {children}
    </div>
  );
};