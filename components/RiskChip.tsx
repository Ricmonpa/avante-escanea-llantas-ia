
import React from 'react';
import { RiskLevel } from '../types';

interface RiskChipProps {
  level: RiskLevel;
}

export const RiskChip: React.FC<RiskChipProps> = ({ level }) => {
  const levelStyles = {
    [RiskLevel.High]: 'bg-risk-high/10 text-risk-high',
    [RiskLevel.Medium]: 'bg-risk-medium/10 text-risk-medium',
    [RiskLevel.Low]: 'bg-risk-low/10 text-risk-low',
    [RiskLevel.None]: 'bg-gray-100 text-gray-600'
  };

  if (level === RiskLevel.None) return null;

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${levelStyles[level]}`}>
      Prioridad {level}
    </span>
  );
};
