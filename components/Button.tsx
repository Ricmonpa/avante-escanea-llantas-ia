import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => {
  // Base classes for button layout, focus, etc.
  const baseClasses = 'px-6 py-3 font-bold rounded-lg shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant classes for background and borders. Text color will be handled separately.
  const backgroundClasses = {
    primary: 'bg-avante-blue hover:bg-opacity-90 focus:ring-avante-blue',
    secondary: 'bg-white border border-avante-blue hover:bg-avante-gray-50 focus:ring-avante-blue',
    danger: 'bg-risk-high hover:bg-opacity-90 focus:ring-risk-high',
  };

  // Explicit text color classes for the inner span to ensure visibility.
  const textClasses = {
      primary: 'text-white',
      secondary: 'text-avante-blue',
      danger: 'text-white'
  }

  // We extract className from props to combine it correctly.
  const { className, ...restProps } = props;

  // Combine all classes for the button element. Note we are NOT applying text color here.
  const buttonClassName = `${baseClasses} ${backgroundClasses[variant]} ${className || ''}`;

  return (
    <button className={buttonClassName} {...restProps}>
      {/* This span now controls the text color, isolating it from the button's default styles.
          It also ensures icons and text are aligned properly. */}
      <span className={`flex items-center justify-center gap-2 ${textClasses[variant]}`}>
          {children}
      </span>
    </button>
  );
};
