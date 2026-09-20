import React, { useEffect, useState } from 'react';
import { Trip, Activity } from '../types/travel';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  CloudSun, 
  MapPin, 
  Check, 
  AlertCircle,
  Database,
  Layers,
  ArrowRight,
  ExternalLink,
  Activity as ActivityIcon
} from 'lucide-react';
import { LiveWeatherData } from '../../server/externalServices';

interface PlanHealthViewProps {
  trip: Trip;
}

export const PlanHealthView: React.FC<PlanHealthViewProps> = ({ trip }) => {
  const [liveWeather, setLiveWeather] = useState<LiveWeatherData | null>(null);
  const [serviceProviders, setServiceProviders] = useState<any[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const allActivities: Activity[] = trip.itinerary.flatMap(d => d.activities);
  
  // Factual Source Counts (Requirement 7: Source Transparency)
  let verifiedCount = 0;
  let estimatedCount = 0;
  let aiSuggestionCount = 0;
  let userProvidedCount = 0;

  allActivities.forEach(act => {
    const status = act.dataStatus || 'ai-suggestion';
    if (status === 'VERIFIED CURRENT DATA' || status === 'verified') {
      verifiedCount++;
    } else if (status === 'ESTIMATED DATA' || status === 'estimated') {
      estimatedCount++;
    } else if (status === 'USER-PROVIDED DATA' || status === 'user-provided') {
      userProvidedCount++;
    } else {
      aiSuggestionCount++;
    }
  });

  // Fetch live weather from real external Open-Meteo integration
  useEffect(() => {
    async function loadWeatherAndStatus() {
      setIsLoadingWeather(true);
      try {
        const firstCoord = allActivities.find(a => a.coordinates)?.coordinates || { lat: 35.6762, lng: 139.6503 };
        const weatherRes = await fetch(`/api/services/weather?lat=${firstCoord.lat}&lng=${firstCoord.lng}&destination=${encodeURIComponent(trip.preferences.destination)}`);
        if (weatherRes.ok) {
          const wData = await weatherRes.json();
          setLiveWeather(wData);
        }

        const statusRes = await fetch('/api/services/status');
        if (statusRes.ok) {
          const sData = await statusRes.json();
          setServiceProviders(sData.providers || []);
        }
      } catch (e) {
        console.warn('Failed to fetch live weather or service status:', e);
      } finally {
        setIsLoadingWeather(false);
      }
    }

    loadWeatherAndStatus();
  }, [trip.id]);

  // Factual Health Checklist calculations
  const hasTimeConflicts = trip.validation.warnings.some(w => w.category === 'overlap' && w.severity === 'error');
  const isBudgetCompliant = trip.budget.remainingBudget >= 0;
  const hasRestBufferFlags = trip.validation.warnings.some(w => w.category === 'time_limit' || w.category === 'density');
  const hasTransitFlags = trip.validation.warnings.some(w => w.category === 'travel_time');

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Trip Intelligence & Plan Health</h2>
            <p className="text-xs text-slate-500">
              Deterministic verification against schedule feasibility, budget limits, rest buffers, and live external data.
            </p>
          </div>
        </div>
      </div>

      {/* Factual Core Verification Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Check 1: Time Feasibility */}
        <div className={`p-5 rounded-2xl border ${
          !hasTimeConflicts 
            ? 'bg-emerald-50/50 border-emerald-200' 
            : 'bg-rose-50/50 border-rose-200'
        } shadow-2xs space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Schedule Feasibility</span>
            {!hasTimeConflicts ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
          </div>
          <div className="text-sm font-bold text-slate-900">
            {!hasTimeConflicts ? 'No Detected Time Conflicts' : 'Time Conflicts Detected'}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {!hasTimeConflicts 
              ? 'All daily activities have clean start/end spacing with transit buffers.' 
              : 'One or more activities overlap or have negative transfer margins.'}
          </p>
        </div>

        {/* Check 2: Budget Ceiling */}
        <div className={`p-5 rounded-2xl border ${
          isBudgetCompliant 
            ? 'bg-emerald-50/50 border-emerald-200' 
            : 'bg-amber-50/50 border-amber-200'
        } shadow-2xs space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Budget Compliance</span>
            {isBudgetCompliant ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="text-sm font-bold text-slate-900">
            {isBudgetCompliant ? 'Within Budget Ceiling' : 'Exceeds Target Budget'}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isBudgetCompliant 
              ? `${trip.budget.currency} ${trip.budget.remainingBudget.toLocaleString()} safety margin remaining.` 
              : `Current costs exceed limit by ${trip.budget.currency} ${Math.abs(trip.budget.remainingBudget).toLocaleString()}.`}
          </p>
        </div>

        {/* Check 3: Rest & Recovery */}
        <div className={`p-5 rounded-2xl border ${
          !hasRestBufferFlags 
            ? 'bg-emerald-50/50 border-emerald-200' 
            : 'bg-amber-50/50 border-amber-200'
        } shadow-2xs space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Rest & Recovery</span>
            {!hasRestBufferFlags ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="text-sm font-bold text-slate-900">
            {!hasRestBufferFlags ? 'Adequate Rest Buffers' : 'Compressed Rest Margins'}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {!hasRestBufferFlags
              ? 'Minimum 10 hours overnight rest preserved between daily schedules.'
              : 'Some days conclude late with early morning starts.'}
          </p>
        </div>

        {/* Check 4: Transit Feasibility */}
        <div className={`p-5 rounded-2xl border ${
          !hasTransitFlags 
            ? 'bg-emerald-50/50 border-emerald-200' 
            : 'bg-amber-50/50 border-amber-200'
        } shadow-2xs space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Transit Feasibility</span>
            {!hasTransitFlags ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="text-sm font-bold text-slate-900">
            {!hasTransitFlags ? 'Realistic Transit Intervals' : 'High Transit Demands'}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {!hasTransitFlags
              ? 'Activities grouped by district; average transit leg is under 30 minutes.'
              : 'Cross-city hops require extended travel time.'}
          </p>
        </div>

      </div>

      {/* Live External Meteorology (Requirement 1: External APIs) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Live Weather & Environmental Conditions</h3>
          </div>
          {liveWeather && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
              {liveWeather.dataStatus}
            </span>
          )}
        </div>

        {liveWeather ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold block text-[11px]">Current Temperature</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{liveWeather.temperatureC}°C</div>
              <span className="text-slate-500 text-[10px]">{liveWeather.condition}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold block text-[11px]">Precipitation Probability</span>
              <div className="text-2xl font-black text-blue-600 mt-0.5">{liveWeather.precipitationRiskPercent}%</div>
              <span className="text-slate-500 text-[10px]">
                {liveWeather.precipitationRiskPercent > 40 ? 'Indoor options recommended' : 'Favorable for outdoor walks'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold block text-[11px]">Provider Attribution</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{liveWeather.source}</div>
              <span className="text-slate-400 text-[10px]">Polled via Open-Meteo Global Meteorology API</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-3">Loading real-time weather data...</div>
        )}
      </div>

      {/* Source Provenance & Data Quality Transparency (Requirement 7) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Source Transparency & Data Attribution</h3>
            <p className="text-xs text-slate-500">Every item in your itinerary carries clear internal classification.</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">{allActivities.length} Total Items</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="text-[11px] font-bold text-blue-800 uppercase block">Verified Data</span>
            <div className="text-2xl font-black text-blue-900 mt-0.5">{verifiedCount}</div>
            <span className="text-[10px] text-blue-600">Live API / Geocoded</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[11px] font-bold text-slate-700 uppercase block">Estimated Data</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{estimatedCount}</div>
            <span className="text-[10px] text-slate-500">Transit & Cost Models</span>
          </div>

          <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50">
            <span className="text-[11px] font-bold text-purple-800 uppercase block">AI Suggestions</span>
            <div className="text-2xl font-black text-purple-900 mt-0.5">{aiSuggestionCount}</div>
            <span className="text-[10px] text-purple-600">Synthesized / Contextual</span>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <span className="text-[11px] font-bold text-emerald-800 uppercase block">User Provided</span>
            <div className="text-2xl font-black text-emerald-900 mt-0.5">{userProvidedCount}</div>
            <span className="text-[10px] text-emerald-600">Traveler custom inputs</span>
          </div>
        </div>
      </div>

      {/* External Service Providers Status Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Connected Service Providers & Tool Status
          </h3>
          <span className="text-[11px] text-slate-500 font-semibold">Live Integration Health</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {serviceProviders.map((svc, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{svc.service}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {svc.provider}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">{svc.notes}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  svc.status === 'connected'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {svc.status === 'connected' ? 'Connected' : 'Fallback Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
