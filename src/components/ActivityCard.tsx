import React, { useState } from 'react';
import { Activity } from '../types/travel';
import { StatusBadge } from './StatusBadge';
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  Info, 
  Trash2, 
  Edit3, 
  ChevronUp, 
  ChevronDown, 
  AlertCircle,
  Ticket,
  Navigation
} from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  index: number;
  totalActivities: number;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  index,
  totalActivities,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  const [showReason, setShowReason] = useState(false);

  return (
    <div 
      id={`activity-card-${activity.id}`}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition-colors space-y-3"
    >
      {/* Top Header: Time, Name, Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-xs font-semibold flex items-center gap-1.5 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {activity.startTime} – {activity.endTime}
            <span className="text-slate-400 font-normal">({activity.durationMinutes}m)</span>
          </div>

          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {activity.category}
          </span>

          <StatusBadge status={activity.dataStatus} />

          {activity.bookingRequired && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              <Ticket className="w-3 h-3 text-purple-600" />
              Booking Required
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          {index > 0 && (
            <button
              onClick={() => onMoveUp(index)}
              title="Move activity earlier"
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}

          {index < totalActivities - 1 && (
            <button
              onClick={() => onMoveDown(index)}
              title="Move activity later"
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onEdit(activity)}
            title="Edit activity details"
            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(activity.id)}
            title="Remove activity from day"
            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Title & Cost */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-snug">
            {activity.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{activity.location}</span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-sm font-bold text-slate-800">
            {activity.currency} {activity.estimatedCost.toLocaleString()}
          </span>
          <span className="block text-[10px] text-slate-400">estimated</span>
        </div>
      </div>

      {/* Extra info: Opening hours, Disruption notes */}
      {(activity.openingHours || activity.disruptionNote || activity.notes) && (
        <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
          {activity.openingHours && (
            <p className="text-slate-500">
              <strong className="text-slate-700 font-medium">Opening Hours:</strong> {activity.openingHours}
            </p>
          )}
          {activity.notes && (
            <p className="text-slate-500 italic">
              {activity.notes}
            </p>
          )}
          {activity.disruptionNote && (
            <p className="text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 text-xs">
              ⚠️ {activity.disruptionNote}
            </p>
          )}
        </div>
      )}

      {/* Why was this activity selected? (Explainability Requirement 4) */}
      <div className="pt-1">
        <button
          onClick={() => setShowReason(!showReason)}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
        >
          <Info className="w-3.5 h-3.5 text-blue-500" />
          {showReason ? 'Hide selection rationale' : 'Why was this selected?'}
        </button>

        {showReason && (
          <div className="mt-2 p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-slate-700 space-y-1 animate-in fade-in duration-150">
            <p className="font-semibold text-blue-900">Agent Rationale:</p>
            <p>{activity.selectionReason || 'Selected to optimize regional landmark immersion and proximity.'}</p>
          </div>
        )}
      </div>

    </div>
  );
};
