import React from 'react';

interface Props {
  value: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
  color?: string;
  trackColor?: string;
  height?: string;
}

export const ProgressBar: React.FC<Props> = ({
  value,
  label,
  showPercentage = false,
  className = '',
  color = 'bg-emerald-500',
  trackColor = 'bg-slate-200',
  height = 'h-2'
}) => {
  // Ensure value is between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full ${trackColor} rounded-full overflow-hidden ${height}`}>
        <div 
          className={`h-full ${color} transition-all duration-500 ease-out`} 
          style={{ width: `${clampedValue}%` }}
        ></div>
      </div>
      {(label || showPercentage) && (
        <div className="flex justify-between mt-1 text-xs text-slate-500 font-medium">
          <span>{label}</span>
          {showPercentage && <span>{Math.round(clampedValue)}%</span>}
        </div>
      )}
    </div>
  );
};
