import React from 'react';
import { Zap } from 'lucide-react';
import './LoadingScreen.css';

export interface LoadingScreenProps {
  /** Friendly contextual line shown under the brand mark */
  message?: string;
}

/**
 * Branded full-screen loading state used across the app (auth gate,
 * landing page, storefront, dashboard pages, tracking). Centered Fast7
 * mark with a pulsing logo and an indeterminate progress bar.
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading…' }) => {
  return (
    <div className="fast7-loading" role="status" aria-live="polite">
      <div className="fast7-loading-logo" aria-hidden="true">
        <Zap size={24} strokeWidth={2.5} />
      </div>
      <div className="fast7-loading-track" aria-hidden="true">
        <div className="fast7-loading-bar" />
      </div>
      <p className="fast7-loading-message">{message}</p>
    </div>
  );
};

export default LoadingScreen;
