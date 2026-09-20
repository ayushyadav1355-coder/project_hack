import React from 'react';
import { BudgetBreakdown, TripPreferences } from '../types/travel';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Bus, 
  Hotel, 
  Ticket, 
  Utensils, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface BudgetViewProps {
  budget: BudgetBreakdown;
  preferences: TripPreferences;
}

export const BudgetView: React.FC<BudgetViewProps> = ({ budget, preferences }) => {
  const isOverBudget = budget.isOverBudget;
  const currency = budget.currency;
  const total = budget.totalEstimatedCost;
  const userBudget = budget.userBudget;
  const remaining = budget.remainingBudget;

  // Percentage calculations for visual breakdown bar
  const localTrans = budget.localTransport || 0;
  const pctTransport = total > 0 ? (budget.transportation / total) * 100 : 0;
  const pctLocal = total > 0 ? (localTrans / total) * 100 : 0;
  const pctAccom = total > 0 ? (budget.accommodation / total) * 100 : 0;
  const pctActs = total > 0 ? (budget.activities / total) * 100 : 0;
  const pctFood = total > 0 ? (budget.food / total) * 100 : 0;
  const pctBuffer = total > 0 ? (budget.miscellaneous / total) * 100 : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Level Summary Card */}
      <div className={`p-6 rounded-2xl border ${
        isOverBudget 
          ? 'bg-rose-50/70 border-rose-200' 
          : 'bg-white border-slate-200'
      } shadow-2xs space-y-4`}>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Deterministic Budget Engine
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5">
              {currency} {total.toLocaleString()}{' '}
              <span className="text-sm font-semibold text-slate-500">
                total estimated / {currency} {userBudget.toLocaleString()} target
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isOverBudget ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Over Budget by {currency} {Math.abs(remaining).toLocaleString()}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Under Budget by {currency} {remaining.toLocaleString()} remaining
              </div>
            )}
          </div>
        </div>

        {/* Actionable Over-Budget Recommendations */}
        {isOverBudget && (
          <div className="p-4 rounded-xl bg-white border border-rose-200 text-xs text-rose-900 space-y-2 shadow-xs">
            <div className="font-bold flex items-center gap-1.5 text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Recommended Actions to Re-align Budget:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li>
                <strong>Swap Guided Excursions for Self-Guided Audio/City Passes:</strong> Reduces activities expense by up to 50% while visiting the exact same landmarks.
              </li>
              <li>
                <strong>Adjust Accommodation Standard:</strong> Switching from luxury/palace tier to heritage boutique haveli or standard hotel preserves comfort while regaining budget compliance.
              </li>
              <li>
                <strong>Use Regional Multi-Day Transit Passes:</strong> Utilizing high-speed rail passes and metro cards rather than private car hires lowers transportation overhead.
              </li>
            </ul>
          </div>
        )}

        {/* Visual Allocation Stack Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>Expense Distribution</span>
            <span>{preferences.travelersCount} traveler(s)</span>
          </div>
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${pctTransport}%` }} 
              className="bg-blue-500 hover:opacity-90 transition-all" 
              title={`Intercity Transport: ${currency} ${budget.transportation.toLocaleString()} (${pctTransport.toFixed(1)}%)`} 
            />
            {pctLocal > 0 && (
              <div 
                style={{ width: `${pctLocal}%` }} 
                className="bg-cyan-500 hover:opacity-90 transition-all" 
                title={`Local Transit: ${currency} ${localTrans.toLocaleString()} (${pctLocal.toFixed(1)}%)`} 
              />
            )}
            <div 
              style={{ width: `${pctAccom}%` }} 
              className="bg-indigo-500 hover:opacity-90 transition-all" 
              title={`Accommodation: ${currency} ${budget.accommodation.toLocaleString()} (${pctAccom.toFixed(1)}%)`} 
            />
            <div 
              style={{ width: `${pctActs}%` }} 
              className="bg-emerald-500 hover:opacity-90 transition-all" 
              title={`Activities: ${currency} ${budget.activities.toLocaleString()} (${pctActs.toFixed(1)}%)`} 
            />
            <div 
              style={{ width: `${pctFood}%` }} 
              className="bg-amber-500 hover:opacity-90 transition-all" 
              title={`Food & Dining: ${currency} ${budget.food.toLocaleString()} (${pctFood.toFixed(1)}%)`} 
            />
            <div 
              style={{ width: `${pctBuffer}%` }} 
              className="bg-slate-400 hover:opacity-90 transition-all" 
              title={`Buffer: ${currency} ${budget.miscellaneous.toLocaleString()} (${pctBuffer.toFixed(1)}%)`} 
            />
          </div>

          {/* Bar Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Intercity ({pctTransport.toFixed(0)}%)</span>
            </div>
            {pctLocal > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span>Local Transit ({pctLocal.toFixed(0)}%)</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Accommodation ({pctAccom.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Activities ({pctActs.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Food & Dining ({pctFood.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Buffer ({pctBuffer.toFixed(0)}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Breakdown Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Intercity Transport Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Bus className="w-4 h-4 text-blue-600" />
              Intercity Transport
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
              {preferences.preferredTransportation}
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {currency} {budget.transportation.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Mainline travel between origin and destination for {preferences.travelersCount} traveler(s).
          </p>
        </div>

        {/* Local Transit Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Bus className="w-4 h-4 text-cyan-600" />
              Local City Transit
            </div>
            <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded font-medium">
              Daily Pass
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {currency} {(budget.localTransport || 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Intra-city metro, light rail, auto-rickshaw, or cab transfers between stops.
          </p>
        </div>

        {/* Accommodation Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Hotel className="w-4 h-4 text-indigo-600" />
              Accommodation
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
              Est. Nightly
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {currency} {budget.accommodation.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed truncate" title={preferences.accommodationPreference}>
            {preferences.accommodationPreference || 'Standard hotel'}
          </p>
        </div>

        {/* Activities Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Ticket className="w-4 h-4 text-emerald-600" />
              Tours & Activities
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
              Line Items
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {currency} {budget.activities.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sum of tickets and fees across all scheduled activities.
          </p>
        </div>

        {/* Food & Dining Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Utensils className="w-4 h-4 text-amber-600" />
              Food & Dining
            </div>
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium">
              Per Diem
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {currency} {budget.food.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Breakfast, lunches, and evening dinners based on group size.
          </p>
        </div>

        {/* Buffer Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <ShieldAlert className="w-4 h-4 text-slate-600" />
              Contingency Buffer
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
              8% Safety
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {currency} {budget.miscellaneous.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Reserves for unexpected transit surges, city taxes, and tips.
          </p>
        </div>

        {/* Per-Traveler Average */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Per-Traveler Average
          </div>
          <div className="text-xl font-black text-slate-900">
            {currency} {Math.round(total / Math.max(1, preferences.travelersCount)).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500">
            Estimated all-inclusive cost per person for the entire trip duration.
          </p>
        </div>

      </div>

    </div>
  );
};
