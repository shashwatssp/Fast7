import React from 'react';
import './StatsCard.css';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  onClick
}) => {
  const getCardClass = () => {
    const baseClass = 'stats-card';
    const colorClass = `stats-card-${color}`;
    const clickableClass = onClick ? 'stats-card-clickable' : '';
    return `${baseClass} ${colorClass} ${clickableClass}`;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend.isPositive ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
        <polyline points="17 18 23 18 23 12"></polyline>
      </svg>
    );
  };

  return (
    <div className={getCardClass()} onClick={onClick}>
      <div className="stats-card-content">
        <div className="stats-card-header">
          <div className="stats-card-icon">
            {icon}
          </div>
          {trend && (
            <div className={`stats-card-trend ${trend.isPositive ? 'trend-positive' : 'trend-negative'}`}>
              {getTrendIcon()}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className="stats-card-body">
          <h3 className="stats-card-title">{title}</h3>
          <p className="stats-card-value">{value}</p>
          {subtitle && <p className="stats-card-subtitle">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;