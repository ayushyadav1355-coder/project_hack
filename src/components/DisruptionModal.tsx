import React, { useState } from 'react';
import { DisruptionReport, DisruptionType, Trip } from '../types/travel';
import { 
  X, 
  AlertTriangle, 
  Train, 
  Plane, 
  CloudRain, 
  Building, 
  Clock, 
  Sparkles, 
  Check, 
  Zap,
  ArrowRight
} from 'lucide-react';

interface DisruptionModalProps {
  isOpen: boolean;
  trip: Trip;
  onClose: () => void;
  onSubmitDisruption: (disruption: DisruptionReport, mode?: 'local_repair' | 'full_replan') => Promise<void>;
  isProcessing: boolean;
}

export const DisruptionModal: React.FC<DisruptionModalProps> = ({
  isOpen,
  trip,
  onClose,
  onSubmitDisruption,
  isProcessing
}) => {
  const [type, setType] = useState<DisruptionType>('train_delay');
  const [affectedDay, setAffectedDay] = useState<number>(1);
  const [delayDurationMinutes, setDelayDurationMinutes] = useState<number>(180);
  const [affectedActivityId, setAffectedActivityId] = useState<string>('');
  const [title, setTitle] = useState('High-Speed Train Delayed by 3 Hours');
  const [description, setDescription] = useState(
    'Inbound regional rail was stopped due to technical inspection. Arrival in city shifted by 3 hours.'
  );
  const [selectedMode, setSelectedMode] = useState<'auto' | 'local_repair' | 'full_replan'>('auto');

  if (!isOpen) return null;

  const currentDayActivities = trip.itinerary.find(d => d.dayNumber === affectedDay)?.activities || [];

  // Quick 1-Click Preset Handlers
  const applyPreset = (presetKey: 'train3h' | 'flight_cancel' | 'attraction_closed' | 'rainstorm' | 'hotel_delay') => {
    if (presetKey === 'train3h') {
      setType('train_delay');
      setAffectedDay(1);
      setDelayDurationMinutes(180);
      setTitle('Train Delayed by 3 Hours');
      setDescription('Mainline express train delayed by 180 minutes due to switch maintenance.');
      setSelectedMode('local_repair');
      if (currentDayActivities.length > 0) {
        setAffectedActivityId(currentDayActivities[0].id);
      }
    } else if (presetKey === 'flight_cancel') {
      setType('flight_cancellation');
      setAffectedDay(1);
      setDelayDurationMinutes(480);
      setTitle('Inbound Flight Cancelled - Rescheduled to Next Morning');
      setDescription('Primary flight cancelled due to mechanical failure. Rebooked on morning arrival. Day 1 lost.');
      setSelectedMode('full_replan');
    } else if (presetKey === 'attraction_closed') {
      setType('attraction_closure');
      setAffectedDay(Math.min(2, trip.itinerary.length));
      setDelayDurationMinutes(120);
      setTitle('Key Attraction Closed for Emergency Maintenance');
      setDescription('Venue temporarily shut down due to facility inspection. Need alternative indoor spot.');
      setSelectedMode('local_repair');
      const day2Acts = trip.itinerary.find(d => d.dayNumber === Math.min(2, trip.itinerary.length))?.activities || [];
      if (day2Acts.length > 1) {
        setAffectedActivityId(day2Acts[1].id);
      }
    } else if (presetKey === 'rainstorm') {
      setType('weather_disruption');
      setAffectedDay(Math.min(2, trip.itinerary.length));
      setDelayDurationMinutes(240);
      setTitle('Severe Afternoon Rainstorm & High Winds');
      setDescription('Heavy downpour makes outdoor walking tours and gardens impractical. Need indoor alternatives.');
      setSelectedMode('local_repair');
    } else if (presetKey === 'hotel_delay') {
      setType('hotel_issue');
      setAffectedDay(1);
      setDelayDurationMinutes(120);
      setTitle('Hotel Room Not Ready Until 17:00');
      setDescription('Early check-in denied due to full occupancy. Luggage storage and temporary cafe stop needed.');
      setSelectedMode('local_repair');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mode = selectedMode === 'auto' ? undefined : selectedMode;
    const disruption: DisruptionReport = {
      id: `disrupt-${Date.now()}`,
      type,
      affectedDay,
      delayMinutes: Number(delayDurationMinutes) || 0,
      affectedActivityIds: affectedActivityId ? [affectedActivityId] : [],
      severity: Number(delayDurationMinutes) >= 300 || type === 'flight_cancellation' ? 'severe' : 'moderate',
      title: title.trim() || 'Travel Disruption',
      description: description.trim(),
      reportedAt: new Date().toISOString(),
      requestedMode: mode
    };

    await onSubmitDisruption(disruption, mode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <div>
              <h2 className="text-base font-bold">Report Travel Disruption</h2>
              <p className="text-xs text-rose-700">Trigger Local Repair to safely adapt itinerary</p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* Quick Presets Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quick-Test Disruption Presets:
              </span>
              <span className="text-[11px] text-slate-400">1-click simulation</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('train3h')}
                className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors flex items-center gap-2 group"
              >
                <Train className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-blue-700">Train Delayed 3h</div>
                  <div className="text-[10px] text-slate-500">Shifts Day 1 morning</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('attraction_closed')}
                className="p-2 text-left bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-lg transition-colors flex items-center gap-2 group"
              >
                <Building className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-rose-700">Attraction Closed</div>
                  <div className="text-[10px] text-slate-500">Auto indoor substitute</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('rainstorm')}
                className="p-2 text-left bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors flex items-center gap-2 group"
              >
                <CloudRain className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-indigo-700">Afternoon Rainstorm</div>
                  <div className="text-[10px] text-slate-500">Shelters outdoor sights</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('flight_cancel')}
                className="p-2 text-left bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg transition-colors flex items-center gap-2 group"
              >
                <Plane className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-purple-700">Flight Cancelled</div>
                  <div className="text-[10px] text-slate-500">Triggers Mode B Replan</div>
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Disruption Category</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as DisruptionType)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                >
                  <option value="train_delay">Train Delay</option>
                  <option value="flight_delay">Flight Delay</option>
                  <option value="flight_cancellation">Flight Cancellation</option>
                  <option value="bus_delay">Bus Delay</option>
                  <option value="attraction_closure">Attraction Closure</option>
                  <option value="weather_disruption">Weather Disruption</option>
                  <option value="hotel_issue">Hotel / Lodging Issue</option>
                  <option value="schedule_change">Schedule Change</option>
                  <option value="user_defined">Custom / Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Affected Day</label>
                <select
                  value={affectedDay}
                  onChange={e => setAffectedDay(Number(e.target.value))}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                >
                  {trip.itinerary.map(day => (
                    <option key={day.dayNumber} value={day.dayNumber}>
                      Day {day.dayNumber} ({day.date})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Delay / Slippage Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  step="15"
                  value={delayDurationMinutes}
                  onChange={e => setDelayDurationMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Specific Activity (Optional)</label>
                <select
                  value={affectedActivityId}
                  onChange={e => setAffectedActivityId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 truncate"
                >
                  <option value="">-- Apply to entire day window --</option>
                  {currentDayActivities.map(act => (
                    <option key={act.id} value={act.id}>
                      {act.startTime} - {act.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Disruption Headline</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Express Rail Broken Down"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Recovery Mode Strategy</span>
                <span className="text-[10px] text-slate-400 font-normal">Deterministic constraints</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMode('auto')}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedMode === 'auto'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-[11px]">Auto Detect</div>
                  <div className="text-[10px] text-slate-500">Chooses best mode</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('local_repair')}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedMode === 'local_repair'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-[11px]">Mode A: Local Repair</div>
                  <div className="text-[10px] text-slate-500">100% isolates impact</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('full_replan')}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedMode === 'full_replan'
                      ? 'bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-[11px]">Mode B: Full Replan</div>
                  <div className="text-[10px] text-slate-500">Broad re-balancing</div>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Situation Details / Notes</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What happened and what constraints should be considered?"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>

          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
            <strong>Disruption Strategy:</strong> Mode A (Local Repair) isolates changes strictly to the affected day and preserves other days intact. Mode B (Full Replan) re-balances the remaining trip when delays or cancellations make the existing structure broadly infeasible.
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
            >
              {isProcessing ? (
                <>Applying Local Repair...</>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Execute Disruption Recovery
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
