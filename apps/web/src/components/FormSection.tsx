import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
};