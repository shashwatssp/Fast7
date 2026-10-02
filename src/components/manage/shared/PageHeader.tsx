import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backTo?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  backTo = '/manage'
}) => {
  const navigate = useNavigate();
  const { restaurants, activeRestaurantId, setActiveRestaurantId } = useAuth();

  const handleBack = () => {
    navigate(backTo);
  };
  return (
    <div className="page-header">
      <div className="page-header-content">
        {showBackButton && (
          <button className="back-button" onClick={handleBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back
          </button>
        )}
        <div className="page-header-text">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {restaurants.length > 1 && (
          <label className="website-switcher page-header-switcher">
            <Store size={16} />
            <select
              value={activeRestaurantId || ""}
              onChange={(e) => setActiveRestaurantId(e.target.value)}
              aria-label="Switch website"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.restaurantInfo?.name || r.id}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
};

export default PageHeader;