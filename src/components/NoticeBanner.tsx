import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface NoticeBannerProps {
  level?: 'info' | 'warning' | 'error';
  title?: string;
  message?: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({
  level = 'warning',
  title = 'Preview Notice',
  message = 'Credits are demo credits, not money. GenLayer Studionet uses fictional fixtures for testing.',
}) => {
  const bgClass =
    level === 'info'
      ? 'bg-sand border-sand-border text-ink'
      : level === 'error'
      ? 'bg-brick-bg border-brick/40 text-brick'
      : 'bg-clay-bg border-clay/40 text-clay';

  const iconClass =
    level === 'info' ? 'text-primary' : level === 'error' ? 'text-brick' : 'text-clay';

  return (
    <div className={`${bgClass} border py-3 px-4 rounded text-sm md:text-base flex items-start gap-3`}>
      {level === 'info' ? (
        <Info size={20} className={`${iconClass} shrink-0 mt-0.5`} aria-hidden="true" />
      ) : level === 'error' ? (
        <AlertTriangle size={20} className={`${iconClass} shrink-0 mt-0.5`} aria-hidden="true" />
      ) : (
        <AlertCircle size={20} className={`${iconClass} shrink-0 mt-0.5`} aria-hidden="true" />
      )}
      <div>
        <strong>{title}:</strong> {message}
      </div>
    </div>
  );
};
