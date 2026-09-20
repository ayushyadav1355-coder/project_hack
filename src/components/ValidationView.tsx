import React, { useState } from 'react';
import { ValidationResult, ValidationWarning } from '../types/travel';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Clock, 
  CheckCircle2, 
  Filter,
  DollarSign,
  Compass
} from 'lucide-react';

interface ValidationViewProps {
  validation: ValidationResult;
  onFixTimeOverlap?: () => void;
}

export const ValidationView: React.FC<ValidationViewProps> = ({ validation }) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const warnings: ValidationWarning[] = validation.warnings || [];
  const errors = warnings.filter((w: ValidationWarning) => w.severity === 'error');
  const nonErrors = warnings.filter((w: ValidationWarning) => w.severity === 'warning');
  const infos = warnings.filter((w: ValidationWarning) => w.severity === 'info');

  const filteredWarnings = warnings.filter((w: ValidationWarning) => {
    if (filterSeverity === 'all') return true;
    return w.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner Status */}
      <div className={`p-6 rounded-2xl border ${
        validation.isValid && errors.length === 0
          ? 'bg-emerald-50/70 border-emerald-200'
          : 'bg-amber-50/70 border-amber-200'
      } shadow-2xs space-y-3`}>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              validation.isValid && errors.length === 0
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 text-white'
            }`}>
              {validation.isValid && errors.length === 0 ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Itinerary Feasibility Audit
              </span>
              <h2 className="text-xl font-black text-slate-900">
                {validation.isValid && errors.length === 0
                  ? 'All Scheduling & Feasibility Checks Passed'
                  : `${errors.length} Critical Issue(s) & ${nonErrors.length} Advisory Note(s)`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs">
              {warnings.length} Total Audit Items
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
          TravelPilot executes deterministic algorithms (not statistical approximations) across all timestamps, transit windows, opening boundaries, and financial totals.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Time Overlaps</span>
          <span className={`text-2xl font-black ${errors.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {errors.length}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {errors.length === 0 ? 'Zero conflicts' : 'Requires adjustment'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Travel Time Feasible</span>
          <span className="text-2xl font-black text-slate-800">
            {warnings.filter((w: ValidationWarning) => w.category === 'travel_time').length === 0 ? '100%' : 'Check Gaps'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Transit buffers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Operating Hours</span>
          <span className="text-2xl font-black text-slate-800">
            {warnings.filter((w: ValidationWarning) => w.category === 'time_limit').length === 0 ? 'Optimal' : 'Flagged'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Within day bounds</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Budget Alignment</span>
          <span className={`text-2xl font-black ${
            warnings.filter((w: ValidationWarning) => w.category === 'budget').length > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {warnings.filter((w: ValidationWarning) => w.category === 'budget').length > 0 ? 'Exceeded' : 'On Target'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Deterministic sum</span>
        </div>

      </div>

      {/* Warnings List & Filter */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Filter Validation Logs</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterSeverity === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({warnings.length})
            </button>
            <button
              onClick={() => setFilterSeverity('error')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterSeverity === 'error'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Errors ({errors.length})
            </button>
            <button
              onClick={() => setFilterSeverity('warning')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterSeverity === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Warnings ({nonErrors.length})
            </button>
          </div>
        </div>

        {filteredWarnings.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No issues matching filter criteria.</p>
            <p className="text-xs text-slate-500">Every scheduled stop complies with logical timing rules.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredWarnings.map((item: ValidationWarning, index: number) => {
              const isError = item.severity === 'error';
              const isWarn = item.severity === 'warning';

              return (
                <div key={index} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
                    {isWarn && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                    {!isError && !isWarn && <Info className="w-5 h-5 text-blue-600" />}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        isError
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isWarn
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {item.category.replace('_', ' ')}
                      </span>

                      {item.dayNumber && (
                        <span className="text-xs font-semibold text-slate-700">
                          Day {item.dayNumber}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-slate-800">
                      {item.message}
                    </p>

                    {item.suggestedFix && (
                      <p className="text-xs text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100">
                        <strong>Correction:</strong> {item.suggestedFix}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
