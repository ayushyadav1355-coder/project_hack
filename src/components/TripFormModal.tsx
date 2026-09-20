import React, { useState } from 'react';
import { ActivityIntensity, TransportationType, TravelerType, TripPreferences } from '../types/travel';
import { 
  X, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Compass, 
  Clock, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight 
} from 'lucide-react';

interface TripFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (preferences: TripPreferences) => Promise<void>;
  isGenerating: boolean;
  planningLogs: string[];
}

const INTERESTS_LIST = [
  'History',
  'Nature & Parks',
  'Food & Dining',
  'Culture',
  'Shopping',
  'Adventure',
  'Family',
  'Photography',
  'Relaxation'
];

export const TripFormModal: React.FC<TripFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isGenerating,
  planningLogs
}) => {
  const [step, setStep] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State
  const [startingLocation, setStartingLocation] = useState('New York, NY (JFK)');
  const [destination, setDestination] = useState('Kyoto, Japan');
  const [startDate, setStartDate] = useState('2026-10-15');
  const [endDate, setEndDate] = useState('2026-10-19');
  const [preferredDailyStartTime, setPreferredDailyStartTime] = useState('09:00');
  const [preferredDailyEndTime, setPreferredDailyEndTime] = useState('21:00');

  const [travelersCount, setTravelersCount] = useState<number>(2);
  const [travelerType, setTravelerType] = useState<TravelerType>('Couple');
  const [totalBudget, setTotalBudget] = useState<number>(3600);
  const [currency, setCurrency] = useState('USD');
  const [preferredTransportation, setPreferredTransportation] = useState<TransportationType>('Train');
  const [accommodationPreference, setAccommodationPreference] = useState('Traditional Ryokan / Boutique Hotel');

  const [selectedInterests, setSelectedInterests] = useState<string[]>(['History', 'Food & Dining', 'Culture', 'Photography']);
  const [activityIntensity, setActivityIntensity] = useState<ActivityIntensity>('Balanced');
  const [dietaryPreferences, setDietaryPreferences] = useState('Keen on vegetarian lunch options');
  const [accessibilityRequirements, setAccessibilityRequirements] = useState('');
  const [specialConstraints, setSpecialConstraints] = useState('Avoid crowded tourist traps during midday');

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const validateStep1 = () => {
    if (!startingLocation.trim()) {
      setValidationError('Please specify a starting departure city.');
      return false;
    }
    if (!destination.trim()) {
      setValidationError('Please specify your trip destination.');
      return false;
    }
    if (!startDate || !endDate) {
      setValidationError('Please select valid start and end dates.');
      return false;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setValidationError('Trip end date cannot be before start date.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const validateStep2 = () => {
    if (travelersCount < 1) {
      setValidationError('Please enter at least 1 traveler.');
      return false;
    }
    if (totalBudget <= 0) {
      setValidationError('Please enter a realistic trip budget.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;
    if (selectedInterests.length === 0) {
      setValidationError('Please pick at least one travel interest.');
      return;
    }

    const preferences: TripPreferences = {
      startingLocation,
      destination,
      startDate,
      endDate,
      travelersCount: Number(travelersCount),
      travelerType,
      totalBudget: Number(totalBudget),
      currency,
      preferredTransportation,
      accommodationPreference,
      interests: selectedInterests,
      activityIntensity,
      dietaryPreferences,
      accessibilityRequirements,
      specialConstraints,
      preferredDailyStartTime,
      preferredDailyEndTime
    };

    await onSubmit(preferences);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Plan New Trip</h2>
            <p className="text-xs text-slate-500">Step {step} of 3 • AI Agent will structure and validate your itinerary</p>
          </div>
          {!isGenerating && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {isGenerating ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">TravelPilot Planning Agent Active</h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Organizing candidate activities by geographic proximity, allocating transit windows, checking opening hours, and running validation passes.
                </p>
              </div>

              {/* Progress workflow terminal logs */}
              <div className="w-full max-w-md bg-slate-900 text-slate-200 p-4 rounded-xl text-left text-xs font-mono space-y-1.5 shadow-inner">
                {planningLogs.length === 0 ? (
                  <p className="text-slate-400">Synthesizing candidate spots for {destination}...</p>
                ) : (
                  planningLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400">›</span>
                      <span>{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: Destination & Dates */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        Starting Location / Airport
                      </label>
                      <input
                        id="form-starting-loc"
                        type="text"
                        value={startingLocation}
                        onChange={e => setStartingLocation(e.target.value)}
                        placeholder="e.g. San Francisco (SFO)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        Destination City & Country
                      </label>
                      <input
                        id="form-destination"
                        type="text"
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                        placeholder="e.g. Kyoto, Japan or Florence, Italy"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        Departure Date
                      </label>
                      <input
                        id="form-start-date"
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        Return Date
                      </label>
                      <input
                        id="form-end-date"
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Preferred Daily Start Time
                      </label>
                      <input
                        id="form-daily-start"
                        type="time"
                        value={preferredDailyStartTime}
                        onChange={e => setPreferredDailyStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Preferred Daily Conclude Time
                      </label>
                      <input
                        id="form-daily-end"
                        type="time"
                        value={preferredDailyEndTime}
                        onChange={e => setPreferredDailyEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Travelers, Transport & Budget */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        Number of Travelers
                      </label>
                      <input
                        id="form-travelers-count"
                        type="number"
                        min="1"
                        max="20"
                        value={travelersCount}
                        onChange={e => setTravelersCount(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Traveler Composition
                      </label>
                      <select
                        id="form-traveler-type"
                        value={travelerType}
                        onChange={e => setTravelerType(e.target.value as TravelerType)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden"
                      >
                        <option value="Solo">Solo Traveler</option>
                        <option value="Couple">Couple</option>
                        <option value="Family">Family (with children)</option>
                        <option value="Friends">Friends Group</option>
                        <option value="Business">Business & Leisure</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                        Total Target Budget
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={currency}
                          onChange={e => setCurrency(e.target.value)}
                          className="w-24 px-2 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 font-semibold"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="JPY">JPY (¥)</option>
                          <option value="INR">INR (₹)</option>
                        </select>
                        <input
                          id="form-budget"
                          type="number"
                          step="50"
                          value={totalBudget}
                          onChange={e => setTotalBudget(parseInt(e.target.value, 10) || 0)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Preferred Transportation
                      </label>
                      <select
                        id="form-transport"
                        value={preferredTransportation}
                        onChange={e => setPreferredTransportation(e.target.value as TransportationType)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden"
                      >
                        <option value="Train">High-Speed & Regional Train</option>
                        <option value="Flight">Commercial Flight</option>
                        <option value="Car">Rental Car</option>
                        <option value="Bus">Express Bus</option>
                        <option value="Mixed">Mixed Modes</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Accommodation Standard
                    </label>
                    <input
                      id="form-accommodation"
                      type="text"
                      value={accommodationPreference}
                      onChange={e => setAccommodationPreference(e.target.value)}
                      placeholder="e.g. 4-star boutique hotel, historic lodge, Airbnb apartment"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Interests, Intensity & Requirements */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Primary Travel Interests (Select all that apply)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS_LIST.map(interest => {
                        const isSelected = selectedInterests.includes(interest);
                        return (
                          <button
                            type="button"
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Daily Activity Intensity
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Relaxed', 'Balanced', 'Packed'] as ActivityIntensity[]).map(intensity => (
                        <button
                          type="button"
                          key={intensity}
                          onClick={() => setActivityIntensity(intensity)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors ${
                            activityIntensity === intensity
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {intensity}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {activityIntensity === 'Relaxed' && 'Up to 3-4 gentle stops per day with plenty of free downtime.'}
                      {activityIntensity === 'Balanced' && '4-6 well-paced stops with adequate lunch and tea breaks.'}
                      {activityIntensity === 'Packed' && '6-8 stops maximizing landmark coverage from morning to evening.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Dietary Preferences
                      </label>
                      <input
                        type="text"
                        value={dietaryPreferences}
                        onChange={e => setDietaryPreferences(e.target.value)}
                        placeholder="e.g. Vegetarian, Halal, Gluten-free"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Accessibility Requirements
                      </label>
                      <input
                        type="text"
                        value={accessibilityRequirements}
                        onChange={e => setAccessibilityRequirements(e.target.value)}
                        placeholder="e.g. Wheelchair access, minimal steep stairs"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Special Constraints or Notes
                    </label>
                    <textarea
                      rows={2}
                      value={specialConstraints}
                      onChange={e => setSpecialConstraints(e.target.value)}
                      placeholder="e.g. Must catch afternoon bullet train on Day 3, avoid walking more than 8km per day"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Navigation */}
        {!isGenerating && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                id="form-next-step-btn"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="form-submit-plan-btn"
                onClick={handleFinalSubmit}
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Generate Feasible Itinerary
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
