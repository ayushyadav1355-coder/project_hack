import React, { useState } from 'react';
import { DisruptionRevision, Trip } from '../types/travel';
import { 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  Info,
  Layers,
  Sparkles,
  AlertOctagon,
  Calendar,
  Check
} from 'lucide-react';

interface RevisionComparisonViewProps {
  trip: Trip;
  onAcceptRevision?: (revisionId: string) => void;
  onRevertRevision?: (revision: DisruptionRevision) => void;
}

export const RevisionComparisonView: React.FC<RevisionComparisonViewProps> = ({
  trip,
  onAcceptRevision,
  onRevertRevision
}) => {
  const revisions = trip.revisions || [];
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>(
    revisions.length > 0 ? revisions[revisions.length - 1].id : ''
  );
  const [activeTab, setActiveTab] = useState<'audit' | 'side_by_side'>('side_by_side');

  const activeRevision = revisions.find(r => r.id === selectedRevisionId) || revisions[revisions.length - 1];

  if (!activeRevision) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Disruption Revisions Recorded</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Whenever you report a delay, attraction closure, or weather change, TravelPilot’s disruption engine generates an isolated Mode A (Local Repair) or Mode B (Full Replan) revision with full side-by-side comparisons here.
        </p>
      </div>
    );
  }

  const disruption = activeRevision.disruption;
  const costDiff = activeRevision.costDifference;
  const isModeB = activeRevision.replanMode === 'full_replan';
  const isAccepted = activeRevision.status === 'accepted';
  const isRejected = activeRevision.status === 'rejected';

  // Compile unified list of changes from the revision structures
  const changes = [
    ...activeRevision.removedActivities.map(a => ({
      id: a.id,
      changeType: 'removed' as const,
      activityName: a.name,
      originalTime: `${a.startTime} - ${a.endTime}`,
      newTime: null,
      reason: `Removed due to disruption constraints (${disruption.title})`
    })),
    ...activeRevision.addedActivities.map(a => ({
      id: a.id,
      changeType: 'added' as const,
      activityName: a.name,
      originalTime: null,
      newTime: `${a.startTime} - ${a.endTime}`,
      reason: a.notes || a.selectionReason
    })),
    ...activeRevision.movedActivities.map(m => ({
      id: m.activity.id,
      changeType: 'moved' as const,
      activityName: m.activity.name,
      originalTime: `Day ${m.oldDay} (${m.oldTime})`,
      newTime: `Day ${m.newDay} (${m.newTime})`,
      reason: 'Rescheduled to another day to keep overall trip goals intact'
    })),
    ...activeRevision.changedTimeActivities.map(c => ({
      id: c.activity.id,
      changeType: 'modified' as const,
      activityName: c.activity.name,
      originalTime: c.oldTime,
      newTime: c.newTime,
      reason: 'Shifted schedule to absorb delays without cascading overlaps'
    }))
  ];

  return (
    <div className="space-y-6">
      
      {/* Revision Switcher if multiple disruptions exist */}
      {revisions.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 shrink-0">Revision History:</span>
          {revisions.map((rev, index) => (
            <button
              key={rev.id}
              onClick={() => setSelectedRevisionId(rev.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                rev.id === activeRevision.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              #{index + 1} {rev.disruption.title} ({rev.replanMode === 'full_replan' ? 'Mode B' : 'Mode A'})
            </button>
          ))}
        </div>
      )}

      {/* Disruption Mode & Human Control Banner */}
      <div className={`p-5 rounded-2xl border ${
        isModeB ? 'bg-purple-50/70 border-purple-200' : 'bg-blue-50/70 border-blue-200'
      } flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
              isModeB ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {isModeB ? 'Mode B — Full Replan' : 'Mode A — Local Repair'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              isAccepted 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : isRejected 
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {isAccepted ? 'Confirmed & Active' : isRejected ? 'Reverted' : 'Pending Traveler Review'}
            </span>
            <span className="text-xs text-slate-500">
              Affected Day {disruption.affectedDay}
            </span>
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed max-w-3xl">
            {activeRevision.replanReason || (isModeB
              ? 'Full replan executed to re-balance the remaining days due to multi-hour delay or transit cancellation.'
              : 'Local repair executed: strictly preserved unaffected activities while adjusting affected time slots.')}
          </p>
        </div>

        {/* Human in the loop action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onRevertRevision && !isRejected && (
            <button
              onClick={() => onRevertRevision(activeRevision)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Revert to Original
            </button>
          )}

          {onAcceptRevision && !isAccepted && !isRejected && (
            <button
              onClick={() => onAcceptRevision(activeRevision.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept Revision
            </button>
          )}
        </div>
      </div>

      {/* Disruption Consequences & Alternatives */}
      {activeRevision.consequencesSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4 text-amber-500" />
              Consequence Analysis
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeRevision.consequencesSummary}
            </p>
          </div>

          {activeRevision.alternativeOptions && activeRevision.alternativeOptions.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Evaluated Alternative Options
              </div>
              <div className="space-y-1.5">
                {activeRevision.alternativeOptions.map((opt, i) => (
                  <div key={i} className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800 block">{opt.title}</span>
                    <span className="text-slate-600 text-[11px] block">{opt.description}</span>
                    <span className="text-blue-600 text-[10px] font-semibold mt-0.5 block">Impact: {opt.impact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metric Badges */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Preservation Ratio</span>
            <span className="text-2xl font-black text-emerald-600 mt-0.5 block">
              {activeRevision.preservedRatioPercent}%
            </span>
            <span className="text-[10px] text-slate-400">Minimizes itinerary churn</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Budget Impact</span>
            <div className="flex items-center gap-1 mt-0.5">
              {costDiff > 0 ? (
                <span className="text-2xl font-black text-rose-600 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-0.5" />+{costDiff.toLocaleString()}
                </span>
              ) : costDiff < 0 ? (
                <span className="text-2xl font-black text-emerald-600 flex items-center">
                  <TrendingDown className="w-5 h-5 mr-0.5" />{costDiff.toLocaleString()}
                </span>
              ) : (
                <span className="text-2xl font-black text-slate-700">±0</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">{trip.budget.currency} Net difference</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Activities Replaced</span>
            <span className="text-2xl font-black text-slate-800 mt-0.5 block">
              {activeRevision.addedActivities.length}
            </span>
            <span className="text-[10px] text-slate-400">Contextual alternatives</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Schedule Adjustments</span>
            <span className="text-2xl font-black text-slate-800 mt-0.5 block">
              {activeRevision.changedTimeActivities.length + activeRevision.movedActivities.length}
            </span>
            <span className="text-[10px] text-slate-400">Time & day shifts</span>
          </div>
        </div>
      </div>

      {/* View Switcher: Side-by-Side vs Audit Log */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('side_by_side')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'side_by_side'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Side-by-Side Comparison
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Audit Log ({changes.length} Changes)
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Logged at {new Date(activeRevision.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Side-by-Side Plan View */}
      {activeTab === 'side_by_side' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Pre-Disruption Plan Column */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Original Planned Schedule (Pre-Disruption)
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">Day {disruption.affectedDay}</span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {activeRevision.originalActivities
                .filter(a => a.dayNumber === disruption.affectedDay)
                .map(act => (
                  <div key={act.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-500 font-semibold">{act.startTime} - {act.endTime}</span>
                      <span className="text-[11px] font-bold text-slate-700">{act.currency} {act.estimatedCost}</span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm">{act.name}</div>
                    <div className="text-slate-500 text-[11px]">{act.location}</div>
                  </div>
                ))}
            </div>
          </div>

          {/* Repaired / Revised Plan Column */}
          <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-blue-200 bg-blue-50/70">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Repaired Schedule ({isModeB ? 'Mode B' : 'Mode A'})
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {activeRevision.preservedRatioPercent}% Intact
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {activeRevision.revisedActivities
                .filter(a => a.dayNumber === disruption.affectedDay)
                .map(act => {
                  const tag = act.revisionChangeTag || 'Preserved';
                  return (
                    <div
                      key={act.id}
                      className={`p-3 rounded-xl border space-y-1 text-xs ${
                        tag === 'Added'
                          ? 'border-emerald-300 bg-emerald-50/50'
                          : tag === 'Moved'
                          ? 'border-amber-300 bg-amber-50/50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-700 font-bold">{act.startTime} - {act.endTime}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          tag === 'Added'
                            ? 'bg-emerald-200 text-emerald-900'
                            : tag === 'Moved'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {tag}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{act.name}</div>
                      <div className="text-slate-600 text-[11px]">{act.location}</div>
                      {act.selectionReason && (
                        <p className="text-[11px] text-blue-800 bg-blue-50/80 p-1.5 rounded-md mt-1">
                          {act.selectionReason}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

        </div>
      )}

      {/* Explanations Section: Why activities were selected/changed */}
      {activeRevision.whyChangedExplanations && activeRevision.whyChangedExplanations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Autonomous Repair Rationale
            </h3>
          </div>
          <div className="space-y-2">
            {activeRevision.whyChangedExplanations.map((item, idx) => (
              <div key={idx} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                <div className="font-bold text-blue-900">{item.title}</div>
                <div className="text-slate-600 mt-0.5">{item.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Changes Audit Log View */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Detailed Activity Modifications Audit ({changes.length})
            </h3>
            <span className="text-xs text-slate-500">Day {disruption.affectedDay}</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {changes.map(change => {
              const isRemoved = change.changeType === 'removed';
              const isAdded = change.changeType === 'added';
              const isModified = change.changeType === 'modified';
              const isMoved = change.changeType === 'moved';

              return (
                <div key={change.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        isRemoved
                          ? 'bg-rose-100 text-rose-800'
                          : isAdded
                          ? 'bg-emerald-100 text-emerald-800'
                          : isMoved
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {change.changeType}
                      </span>

                      <span className="font-bold text-sm text-slate-900">
                        {change.activityName}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs">
                      <strong>Reason:</strong> {change.reason}
                    </p>
                  </div>

                  {/* Timing Comparison */}
                  <div className="text-right shrink-0">
                    {change.originalTime && change.newTime ? (
                      <div className="space-y-0.5 font-mono text-xs">
                        <div className="text-slate-400 line-through">
                          {change.originalTime}
                        </div>
                        <div className="font-bold text-blue-600 flex items-center gap-1 justify-end">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          {change.newTime}
                        </div>
                      </div>
                    ) : change.originalTime ? (
                      <div className="font-mono text-xs text-rose-500 line-through">
                        {change.originalTime}
                      </div>
                    ) : change.newTime ? (
                      <div className="font-mono text-xs text-emerald-600 font-bold">
                        {change.newTime} (New)
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
