import React from 'react';
import { Trip } from '../types/travel';
import { 
  Compass, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  ArrowRight, 
  RefreshCw, 
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface LandingViewProps {
  savedTrips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onStartNewTrip: () => void;
  onLoadDemoTrip: (tripId: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  savedTrips,
  onSelectTrip,
  onStartNewTrip,
  onLoadDemoTrip
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Hero Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-xs text-center sm:text-left relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Autonomous Travel Planning & Disruption Agent
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Plan smarter. <span className="text-blue-600">Adapt faster.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            TravelPilot isn’t just another static itinerary generator. It’s an intelligent travel agent that structures realistic day-by-day plans, deterministically validates schedules against opening hours and transit times, and performs <strong>instant local repair</strong> when trains delay, flights cancel, or weather disrupts your journey.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <button
              id="hero-start-new-trip-btn"
              onClick={onStartNewTrip}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              Start New Trip
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-load-demo-tokyo-btn"
              onClick={() => onLoadDemoTrip('demo-tokyo-trip')}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors border border-slate-200"
            >
              Tokyo Demo
            </button>

            <button
              id="hero-load-demo-swiss-btn"
              onClick={() => onLoadDemoTrip('demo-swiss-trip')}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors border border-slate-200"
            >
              Swiss Alps Demo
            </button>

            <button
              id="hero-load-demo-jaipur-btn"
              onClick={() => onLoadDemoTrip('demo-jaipur-trip')}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs sm:text-sm transition-colors border border-amber-200"
            >
              Jaipur Demo
            </button>
          </div>
        </div>
      </div>

      {/* Core Dual Capability Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pillar 1 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Sliders className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Geographic & Proximity Planning</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Organizes each day into tight geographic clusters. Evaluates actual transit durations between stops rather than cramming distant locations together.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            No unrealistic time overlaps
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Real-Time Disruption Recovery</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            When a 3-hour train delay or typhoon strikes, the agent isolates only the affected activities. It performs surgical local repair, preserving unaffected reservations.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs font-medium text-rose-700">
            <CheckCircle2 className="w-4 h-4 text-rose-600" />
            Side-by-side plan diff & reason audit
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Deterministic Validation & Budget</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Never leaves math or scheduling checks to LLM hallucination. Deterministic algorithmic code calculates transit windows, opening boundaries, and exact costs.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs font-medium text-blue-700">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Transparent verified vs estimated data
          </div>
        </div>

      </div>

      {/* Recent Trips Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Available Trips</h2>
            <p className="text-xs text-slate-500">Pick an active trip to view details, inspect budget, or trigger disruption tests.</p>
          </div>
          <button
            onClick={onStartNewTrip}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            + Create New Trip
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedTrips.map(trip => (
            <div
              key={trip.id}
              id={`trip-card-${trip.id}`}
              onClick={() => onSelectTrip(trip)}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {trip.name}
                  </span>
                  {trip.isDemo ? (
                    <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                      Demo Data
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Custom Trip
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">{trip.preferences.destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{trip.preferences.startDate} to {trip.preferences.endDate} ({trip.itinerary.length} days)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{trip.preferences.travelersCount} Travelers • {trip.preferences.travelerType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Est. {trip.budget.currency} {trip.budget.totalEstimatedCost.toLocaleString()} / Budget {trip.budget.currency} {trip.budget.userBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {trip.itinerary.flatMap(d => d.activities).length} activities scheduled
                </span>
                <span className="font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  View Plan <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
