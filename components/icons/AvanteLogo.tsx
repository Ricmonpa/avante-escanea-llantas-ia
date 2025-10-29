import React from 'react';

interface AvanteLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const AvanteLogo: React.FC<AvanteLogoProps> = ({ className, variant = 'light' }) => {
  const textColor = variant === 'light' ? '#0B3B60' : '#FFFFFF';

  return (
    <svg
      className={className}
      viewBox="0 0 190 50"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AVANTE Logo"
    >
      {/* Icon */}
      <g transform="scale(0.9)">
        <circle cx="25" cy="25" r="24" stroke="#D81E05" strokeWidth="3" fill="none" />
        <circle cx="25" cy="25" r="21" fill="#0B3B60" />

        {/* Checkered flag approximation */}
        <g fill="#FFFFFF">
          <rect x="12" y="18" width="4" height="4" />
          <rect x="16" y="22" width="4" height="4" />
          <rect x="12" y="26" width="4" height="4" />
        </g>
        
        {/* Stylized 'A' */}
        <path d="M 22 35 L 28 15 L 34 35 M 24.5 29 h 7" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </g>
      
      {/* Text "AVANTE" */}
      <text x="55" y="35" fontFamily="Inter, sans-serif" fontSize="28" fontWeight="800" fill={textColor} letterSpacing="1">
        AVANTE
      </text>
    </svg>
  );
};
