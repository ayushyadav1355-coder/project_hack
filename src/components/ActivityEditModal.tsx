import React, { useState, useEffect } from 'react';
import { Activity, ActivityCategory, DataStatus } from '../types/travel';
import { X, Clock, MapPin, DollarSign, Check } from 'lucide-react';
import { timeToMinutes } from '../lib/validationEngine';

interface ActivityEditModalProps {
  isOpen: boolean;
  activity: Activity | null;
  dayNumber: number;
  currency: string;
  onClose: () => void;
  onSave: (activity: Activity) => void;
}

const CATEGORIES: ActivityCategory[] = [
  'Sightseeing',
  'Culture & History',
  'Food & Dining',
  'Nature & Parks',
  'Shopping',
  'Adventure',
  'Relaxation',
  'Transit',
  'Accommodation',
  'Entertainment'
];

export const ActivityEditModal: React.FC<ActivityEditModalProps> = ({
  isOpen,
  activity,
  dayNumber,
  currency,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('Sightseeing');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [location, setLocation] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(20);
  const [travelTime, setTravelTime] = useState(15);
  const [travelMode, setTravelMode] = useState('Walking');
  const [dataStatus, setDataStatus] = useState<DataStatus>('user-provided');
  const [selectionReason, setSelectionReason] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingRequired, setBookingRequired] = useState(false);

  useEffect(() => {
    if (activity) {
      setName(activity.name);
      setCategory(activity.category);
      setStartTime(activity.startTime);
      setEndTime(activity.endTime);
      setLocation(activity.location);
      setEstimatedCost(activity.estimatedCost);
      setTravelTime(activity.travelTimeFromPreviousMinutes);
      setTravelMode(activity.travelMode || 'Walking');
      setDataStatus(activity.dataStatus);
      setSelectionReason(activity.selectionReason || '');
      setOpeningHours(activity.openingHours || '');
      setNotes(activity.notes || '');
      setBookingRequired(Boolean(activity.bookingRequired));
    } else {
      setName('');
      setCategory('Sightseeing');
      setStartTime('10:00');
      setEndTime('12:00');
      setLocation('');
      setEstimatedCost(20);
      setTravelTime(15);
      setTravelMode('Walking');
      setDataStatus('user-provided');
      setSelectionReason('Added by traveler');
      setOpeningHours('');
      setNotes('');
      setBookingRequired(false);
    }
  }, [activity, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = Math.max(15, timeToMinutes(endTime) - timeToMinutes(startTime));

    const updated: Activity = {
      id: activity ? activity.id : `act-user-${Date.now()}`,
      dayNumber: activity ? activity.dayNumber : dayNumber,
      name: name.trim() || 'Untitled Activity',
      category,
      startTime,
      endTime,
      durationMinutes: duration,
      location: location.trim() || 'Location not specified',
      coordinates: activity?.coordinates,
      estimatedCost: Number(estimatedCost) || 0,
      currency,
      travelTimeFromPreviousMinutes: Number(travelTime) || 0,
      travelMode,
      dataStatus,
      selectionReason: selectionReason.trim() || 'Custom scheduled stop.',
      openingHours: openingHours.trim(),
      notes: notes.trim(),
      bookingRequired
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">
            {activity ? 'Edit Activity' : `Add Activity (Day ${dayNumber})`}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Activity Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Louvre Museum or Dinner at Trattoria"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ActivityCategory)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Data Status</label>
              <select
                value={dataStatus}
                onChange={e => setDataStatus(e.target.value as DataStatus)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
              >
                <option value="verified">Verified</option>
                <option value="estimated">Estimated</option>
                <option value="user-provided">User-Provided</option>
                <option value="ai-suggestion">AI Suggestion</option>
                <option value="needs-verification">Needs Verification</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-slate-500" /> Estimated Cost ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={estimatedCost}
                onChange={e => setEstimatedCost(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Transit from Prev Stop (mins)</label>
              <input
                type="number"
                min="0"
                value={travelTime}
                onChange={e => setTravelTime(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" /> Location / Address
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. 75001 Paris, France"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Selection Rationale / Why Visit?</label>
            <textarea
              rows={2}
              value={selectionReason}
              onChange={e => setSelectionReason(e.target.value)}
              placeholder="e.g. Famous for impressionist galleries and quiet garden setting"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="booking-req-check"
              checked={bookingRequired}
              onChange={e => setBookingRequired(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="booking-req-check" className="font-medium text-slate-700 cursor-pointer">
              Advance Ticket / Table Reservation Required
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Save Activity
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
