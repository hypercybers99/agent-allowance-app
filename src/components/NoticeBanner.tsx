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
      ? 'bg-parchment-200 border-parchment-400 text-slate-800'
      : level === 'error'
      ? 'bg-clay-100 border-clay-400 text-clay-950'
      : 'bg-sand border-sand-border text-ink';

  const iconClass =
    level === 'info' ? 'text-indigo-700' : level === 'error' ? 'text-clay-800' : 'text-clay';

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
