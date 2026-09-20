import React, { useState } from 'react';
import { DayItinerary, DisruptionReport, DisruptionRevision, Trip } from '../types/travel';
import { DayTimeline } from './DayTimeline';
import { MapView } from './MapView';
import { BudgetView } from './BudgetView';
import { ValidationView } from './ValidationView';
import { RevisionComparisonView } from './RevisionComparisonView';
import { WhatIfSimulationView } from './WhatIfSimulationView';
import { PlanHealthView } from './PlanHealthView';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  Compass, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  Share2, 
  FileText, 
  Download,
  ArrowLeft,
  FlaskConical,
  Activity as ActivityIcon
} from 'lucide-react';
import { WhatIfScenario } from '../types/travel';

interface ItineraryDashboardProps {
  trip: Trip;
  onUpdateItinerary: (updated: DayItinerary[]) => void;
  onOpenDisruptionModal: () => void;
  onAcceptRevision: (revisionId: string) => void;
  onRevertRevision: (revision: DisruptionRevision) => void;
  onRunSimulation: (scenarioType: WhatIfScenario['scenarioType'], customQuery?: string) => Promise<void>;
  onDecideScenario: (scenarioId: string, action: 'apply' | 'discard') => Promise<void>;
  isSimulating: boolean;
  onToggleChat: () => void;
  onBackToOverview: () => void;
}

type TabType = 'timeline' | 'map' | 'budget' | 'validation' | 'revisions' | 'whatif' | 'health';

export const ItineraryDashboard: React.FC<ItineraryDashboardProps> = ({
  trip,
  onUpdateItinerary,
  onOpenDisruptionModal,
  onAcceptRevision,
  onRevertRevision,
  onRunSimulation,
  onDecideScenario,
  isSimulating,
  onToggleChat,
  onBackToOverview
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(
    trip.revisions && trip.revisions.length > 0 ? 'revisions' : 'timeline'
  );

  const errorCount = (trip.validation.warnings || []).filter(w => w.severity === 'error').length;
  const warningCount = (trip.validation.warnings || []).filter(w => w.severity === 'warning').length;
  const totalWarnings = errorCount + warningCount;

  // Export JSON functionality
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(trip, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${trip.preferences.destination.replace(/[^a-z0-9]/gi, '_')}_itinerary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Back button & Trip Headline Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Trips
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Active Itinerary
            </span>
            {trip.isDemo && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Demo Data (Tokyo)
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {trip.name}
          </h1>

          {/* Metadata quick stats */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{trip.preferences.destination}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{trip.preferences.startDate} to {trip.preferences.endDate} ({trip.itinerary.length} days)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Users className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{trip.preferences.travelersCount} Traveler(s) • {trip.preferences.travelerType}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <DollarSign className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {trip.budget.currency} {trip.budget.totalEstimatedCost.toLocaleString()} est. / {trip.budget.currency} {trip.budget.userBudget.toLocaleString()} budget
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            id="export-trip-json-btn"
            onClick={handleExportJSON}
            title="Export itinerary as structured JSON"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <button
            id="disruption-report-banner-btn"
            onClick={onOpenDisruptionModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Report Disruption
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 rounded-xl shadow-2xs">
        
        <button
          id="tab-timeline"
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Day-by-Day Timeline
        </button>

        <button
          id="tab-map"
          onClick={() => setActiveTab('map')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'map'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          Map & Routes
        </button>

        <button
          id="tab-budget"
          onClick={() => setActiveTab('budget')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'budget'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Budget Engine
        </button>

        <button
          id="tab-validation"
          onClick={() => setActiveTab('validation')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'validation'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Feasibility Audit
          {totalWarnings > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              errorCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {totalWarnings}
            </span>
          )}
        </button>

        <button
          id="tab-revisions"
          onClick={() => setActiveTab('revisions')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'revisions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Disruptions & Revisions
          {trip.revisions && trip.revisions.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-100 text-rose-800">
              {trip.revisions.length}
            </span>
          )}
        </button>

        <button
          id="tab-whatif"
          onClick={() => setActiveTab('whatif')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'whatif'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          What-If Sandbox
          {trip.whatIfScenarios && trip.whatIfScenarios.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-100 text-indigo-800">
              {trip.whatIfScenarios.length}
            </span>
          )}
        </button>

        <button
          id="tab-health"
          onClick={() => setActiveTab('health')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'health'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ActivityIcon className="w-4 h-4" />
          Plan Health & Live Data
        </button>

      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'timeline' && (
          <DayTimeline
            itinerary={trip.itinerary}
            preferences={trip.preferences}
            onUpdateItinerary={onUpdateItinerary}
          />
        )}

        {activeTab === 'map' && (
          <MapView
            itinerary={trip.itinerary}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            budget={trip.budget}
            preferences={trip.preferences}
          />
        )}

        {activeTab === 'validation' && (
          <ValidationView
            validation={trip.validation}
          />
        )}

        {activeTab === 'revisions' && (
          <RevisionComparisonView
            trip={trip}
            onAcceptRevision={onAcceptRevision}
            onRevertRevision={onRevertRevision}
          />
        )}

        {activeTab === 'whatif' && (
          <WhatIfSimulationView
            trip={trip}
            onRunSimulation={onRunSimulation}
            onDecideScenario={onDecideScenario}
            isSimulating={isSimulating}
          />
        )}

        {activeTab === 'health' && (
          <PlanHealthView
            trip={trip}
          />
        )}
      </div>

    </div>
  );
};
