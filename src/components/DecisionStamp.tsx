import React from 'react';
import { CheckCircle2, XCircle, Clock, CheckCheck, Ban, HelpCircle } from 'lucide-react';

interface DecisionStampProps {
  decision: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DecisionStamp: React.FC<DecisionStampProps> = ({ decision, size = 'md' }) => {
  const norm = (decision || '').toUpperCase();

  const sizeClasses = {
    sm: 'text-sm px-2 py-1 gap-1',
    md: 'text-base px-3 py-1.5 gap-2',
    lg: 'text-lg px-4 py-2 gap-2 font-bold',
  }[size];

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];

  if (norm === 'APPROVED') {
    return (
      <span className={`inline-flex items-center rounded bg-sage text-sage-text font-semibold border border-sage-text/30 ${sizeClasses}`}>
        <CheckCircle2 size={iconSizes} aria-hidden="true" />
        <span>APPROVED</span>
      </span>
    );
  }

  if (norm === 'OWNER_APPROVED') {
    return (
      <span className={`inline-flex items-center rounded bg-sage text-sage-text font-semibold border border-sage-text/30 ${sizeClasses}`}>
        <CheckCheck size={iconSizes} aria-hidden="true" />
        <span>OWNER APPROVED</span>
      </span>
    );
  }

  if (norm === 'DENIED') {
    return (
      <span className={`inline-flex items-center rounded bg-brick-bg text-brick font-semibold border border-brick/30 ${sizeClasses}`}>
        <XCircle size={iconSizes} aria-hidden="true" />
        <span>DENIED</span>
      </span>
    );
  }

  if (norm === 'OWNER_REJECTED') {
    return (
      <span className={`inline-flex items-center rounded bg-brick-bg text-brick font-semibold border border-brick/30 ${sizeClasses}`}>
        <Ban size={iconSizes} aria-hidden="true" />
        <span>OWNER REJECTED</span>
      </span>
    );
  }

  if (norm === 'PENDING' || norm === 'ASK_OWNER') {
    return (
      <span className={`inline-flex items-center rounded bg-clay-bg text-clay font-semibold border border-clay/30 ${sizeClasses}`}>
        <Clock size={iconSizes} aria-hidden="true" />
        <span>PENDING OWNER REVIEW</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded bg-sand text-ink-muted border border-sand-border ${sizeClasses}`}>
      <HelpCircle size={iconSizes} aria-hidden="true" />
      <span>{decision || 'UNKNOWN'}</span>
    </span>
  );
};
