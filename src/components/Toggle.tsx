import React from 'react';

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ id, checked, onChange, label, disabled = false }) => {
  return (
    <div className="flex items-center space-x-3">
      <button
        type="button"
        id={id}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
          checked 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
            : 'bg-gray-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <label 
        htmlFor={id} 
        className={`text-sm text-gray-300 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        {label}
      </label>
    </div>
  );
};