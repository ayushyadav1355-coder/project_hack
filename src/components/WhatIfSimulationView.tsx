import React, { useState } from 'react';
import { Trip, WhatIfScenario } from '../types/travel';
import { 
  FlaskConical, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Train,
  DollarSign,
  Coffee,
  Building,
  PlusCircle,
  Compass
} from 'lucide-react';

interface WhatIfSimulationViewProps {
  trip: Trip;
  onRunSimulation: (scenarioType: WhatIfScenario['scenarioType'], customQuery?: string) => Promise<void>;
  onDecideScenario: (scenarioId: string, action: 'apply' | 'discard') => Promise<void>;
  isSimulating: boolean;
}

export const WhatIfSimulationView: React.FC<WhatIfSimulationViewProps> = ({
  trip,
  onRunSimulation,
  onDecideScenario,
  isSimulating
}) => {
  const [customInput, setCustomInput] = useState('');
  const scenarios = trip.whatIfScenarios || [];
  const activeScenario = scenarios.find(s => s.id === trip.activeWhatIfId) || scenarios[scenarios.length - 1];

  const presets: {
    type: WhatIfScenario['scenarioType'];
    title: string;
    description: string;
    icon: any;
    color: string;
  }[] = [
    {
      type: 'train_delay',
      title: 'What if train is delayed by 2h?',
      description: 'Test afternoon schedule cascade on Day 1',
      icon: Train,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      type: 'budget_reduction',
      title: 'What if I reduce budget by 20%?',
      description: 'Optimize ticketed stops to self-guided passes',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      type: 'relaxed_pace',
      title: 'What if I want a relaxed itinerary?',
      description: 'Cap stops at 3/day & add 45m rest margins',
      icon: Coffee,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      type: 'attraction_closure',
      title: 'What if the museum is closed?',
      description: 'Simulate closure of primary sight on Day 2',
      icon: Building,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    {
      type: 'add_day',
      title: 'What if I add one more day?',
      description: 'Extend trip by 1 day with artisan quarters',
      icon: PlusCircle,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      type: 'transit_limit',
      title: 'What if max transit is 30 mins?',
      description: 'Cap transfers and upgrade slow legs to express',
      icon: Compass,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Simulation Header Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600 text-white">
                <FlaskConical className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                What-If Simulation Sandbox
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-blue-700 border border-blue-200">
                Non-Destructive Testing
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Test Hypothetical Travel Scenarios</h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Explore how delays, budget cuts, extra days, or closures impact your trip before committing changes. Your confirmed plan remains safe until you choose to promote a scenario.
            </p>
          </div>
        </div>

        {/* Quick Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
          {presets.map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.type}
                onClick={() => onRunSimulation(p.type)}
                disabled={isSimulating}
                className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all text-left group flex items-start gap-3 disabled:opacity-60"
              >
                <div className={`p-2 rounded-lg ${p.color} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {p.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom What-If Input */}
        <div className="mt-4 pt-4 border-t border-blue-100 flex items-center gap-2">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            placeholder="Or type a custom scenario: 'What if rain forces us indoors on Day 1 afternoon?'"
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-blue-500"
          />
          <button
            onClick={() => {
              if (customInput.trim()) {
                onRunSimulation('custom', customInput.trim());
                setCustomInput('');
              }
            }}
            disabled={!customInput.trim() || isSimulating}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Simulate
          </button>
        </div>
      </div>

      {/* Active Scenario Display */}
      {activeScenario ? (
        <div className="space-y-5">
          
          {/* Active Scenario Control Bar */}
          <div className="bg-white border-2 border-indigo-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  Simulated Scenario
                </span>
                <span className="text-xs text-slate-400">
                  Simulated at {new Date(activeScenario.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{activeScenario.title}</h3>
              <p className="text-xs text-slate-600 max-w-2xl">{activeScenario.impactSummary}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onDecideScenario(activeScenario.id, 'discard')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Discard Scenario
              </button>
              <button
                onClick={() => onDecideScenario(activeScenario.id, 'apply')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                Promote to Confirmed Plan
              </button>
            </div>
          </div>

          {/* Scenario Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Schedule Preservation</span>
              <span className="text-2xl font-black text-indigo-600 mt-1 block">
                {activeScenario.preservedRatioPercent}%
              </span>
              <span className="text-[10px] text-slate-400">Activities preserved</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Estimated Budget Delta</span>
              <div className="flex items-center gap-1 mt-1">
                {activeScenario.costDifference > 0 ? (
                  <span className="text-2xl font-black text-rose-600 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-0.5" />+{activeScenario.costDifference.toLocaleString()}
                  </span>
                ) : activeScenario.costDifference < 0 ? (
                  <span className="text-2xl font-black text-emerald-600 flex items-center">
                    <TrendingDown className="w-5 h-5 mr-0.5" />{activeScenario.costDifference.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-2xl font-black text-slate-800">±0</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">{trip.budget.currency} Compared to current</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Schedule Adjustments</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                {activeScenario.scheduleChangesCount}
              </span>
              <span className="text-[10px] text-slate-400">Modified activities</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Scenario Feasibility</span>
              <span className={`text-2xl font-black mt-1 block ${
                activeScenario.validation.isValid ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {activeScenario.validation.isValid ? 'Verified Valid' : 'Has Warnings'}
              </span>
              <span className="text-[10px] text-slate-400">{activeScenario.validation.warnings.length} timing/budget flags</span>
            </div>
          </div>

          {/* Detailed Differences List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Simulated Schedule Modifications ({activeScenario.diffItems.length})
            </h4>
            
            {activeScenario.diffItems.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                All scheduled items intact under this hypothetical scenario.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {activeScenario.diffItems.map((diff, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        diff.changeType === 'Removed'
                          ? 'bg-rose-100 text-rose-800'
                          : diff.changeType === 'Added'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {diff.changeType}
                      </span>
                      <span className="font-bold text-slate-800">{diff.activityName}</span>
                    </div>
                    <span className="text-slate-500 text-[11px] text-right">{diff.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Active What-If Scenario</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click any simulation preset above (e.g. "Train delayed by 2h" or "Reduce budget by 20%") to generate an interactive sandbox comparison.
          </p>
        </div>
      )}

    </div>
  );
};
