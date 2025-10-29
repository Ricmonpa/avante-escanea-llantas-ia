
import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  const getColor = (val: number) => {
    if (val < 50) return 'bg-risk-high';
    if (val < 75) return 'bg-risk-medium';
    return 'bg-risk-low';
  };

  return (
    <div className="w-full bg-avante-gray-100 rounded-full h-2.5">
      <div
        className={`${getColor(value)} h-2.5 rounded-full transition-all duration-500`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
};
