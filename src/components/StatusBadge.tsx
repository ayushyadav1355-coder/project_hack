import React from 'react';
import { DataStatus } from '../types/travel';
import { CheckCircle2, Clock, HelpCircle, Sparkles, UserCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: DataStatus;
  className?: string;
  showTooltip?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'verified':
      return (
        <span
          id={`status-badge-${status}`}
          title="Verified: Confirmed landmark, established opening schedule or ticketed venue."
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          Verified
        </span>
      );
    case 'estimated':
      return (
        <span
          id={`status-badge-${status}`}
          title="Estimated: Realistic pricing and travel duration calculated from regional transit norms."
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
          Estimated
        </span>
      );
    case 'ai-suggestion':
      return (
        <span
          id={`status-badge-${status}`}
          title="AI Suggestion: Curated by planning agent based on traveler interests and geographic proximity."
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />
          AI Suggestion
        </span>
      );
    case 'needs-verification':
      return (
        <span
          id={`status-badge-${status}`}
          title="Needs Verification: Subject to seasonal schedule changes or advance ticket booking requirements."
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 ${className}`}
        >
          <HelpCircle className="w-3 h-3 text-amber-600 shrink-0" />
          Needs Verification
        </span>
      );
    case 'user-provided':
      return (
        <span
          id={`status-badge-${status}`}
          title="User-provided: Custom activity added directly by the traveler."
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}
        >
          <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
          User-Provided
        </span>
      );
    default:
      return null;
  }
};
