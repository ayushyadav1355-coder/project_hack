import React, { useState } from 'react';
import { Activity, DayItinerary, TripPreferences } from '../types/travel';
import { ActivityCard } from './ActivityCard';
import { ActivityEditModal } from './ActivityEditModal';
import { 
  Calendar, 
  Plus, 
  Navigation, 
  Clock, 
  MapPin, 
  Compass, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface DayTimelineProps {
  itinerary: DayItinerary[];
  preferences: TripPreferences;
  onUpdateItinerary: (updated: DayItinerary[]) => void;
}

export const DayTimeline: React.FC<DayTimelineProps> = ({
  itinerary,
  preferences,
  onUpdateItinerary
}) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(
    itinerary.length > 0 ? itinerary[0].dayNumber : 1
  );
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const activeDay = itinerary.find(d => d.dayNumber === selectedDayNumber) || itinerary[0];

  if (!activeDay) {
    return <div className="p-8 text-center text-slate-500">No itinerary days scheduled yet.</div>;
  }

  // Activity reordering within day
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newActivities = [...activeDay.activities];
    const temp = newActivities[index];
    newActivities[index] = newActivities[index - 1];
    newActivities[index - 1] = temp;

    const newItinerary = itinerary.map(day => 
      day.dayNumber === activeDay.dayNumber ? { ...day, activities: newActivities } : day
    );
    onUpdateItinerary(newItinerary);
  };

  const handleMoveDown = (index: number) => {
    if (index >= activeDay.activities.length - 1) return;
    const newActivities = [...activeDay.activities];
    const temp = newActivities[index];
    newActivities[index] = newActivities[index + 1];
    newActivities[index + 1] = temp;

    const newItinerary = itinerary.map(day => 
      day.dayNumber === activeDay.dayNumber ? { ...day, activities: newActivities } : day
    );
    onUpdateItinerary(newItinerary);
  };

  const handleDeleteActivity = (activityId: string) => {
    const newActivities = activeDay.activities.filter(a => a.id !== activityId);
    const newItinerary = itinerary.map(day => 
      day.dayNumber === activeDay.dayNumber ? { ...day, activities: newActivities } : day
    );
    onUpdateItinerary(newItinerary);
  };

  const handleSaveActivity = (saved: Activity) => {
    let newActivities: Activity[];
    const exists = activeDay.activities.some(a => a.id === saved.id);
    if (exists) {
      newActivities = activeDay.activities.map(a => a.id === saved.id ? saved : a);
    } else {
      newActivities = [...activeDay.activities, saved];
    }

    const newItinerary = itinerary.map(day => 
      day.dayNumber === activeDay.dayNumber ? { ...day, activities: newActivities } : day
    );
    onUpdateItinerary(newItinerary);
  };

  const handleOpenAddModal = () => {
    setEditingActivity(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (activity: Activity) => {
    setEditingActivity(activity);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Day Selector Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {itinerary.map(day => {
          const isSelected = day.dayNumber === selectedDayNumber;
          return (
            <button
              key={day.dayNumber}
              id={`day-tab-${day.dayNumber}`}
              onClick={() => setSelectedDayNumber(day.dayNumber)}
              className={`px-4 py-2.5 rounded-xl text-left shrink-0 transition-all border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  Day {day.dayNumber}
                </span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded font-medium ${
                  isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  {day.activities.length} stops
                </span>
              </div>
              <div className={`text-sm font-semibold truncate max-w-[170px] mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {day.theme}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
              <Calendar className="w-3.5 h-3.5" />
              Day {activeDay.dayNumber} • {activeDay.date}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              {activeDay.theme}
            </h2>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold self-start sm:self-auto transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Activity to Day
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
          {activeDay.summary}
        </p>
      </div>

      {/* Activities Timeline Flow */}
      <div className="space-y-4">
        {activeDay.activities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-8 space-y-3">
            <p className="text-sm font-semibold text-slate-600">No activities scheduled for this day yet.</p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              Add First Activity
            </button>
          </div>
        ) : (
          activeDay.activities.map((activity, index) => {
            return (
              <React.Fragment key={activity.id}>
                
                {/* Transit Gap Connector (between consecutive activities) */}
                {index > 0 && (
                  <div className="flex items-center gap-3 px-4 py-1 text-xs text-slate-500">
                    <div className="h-6 w-0.5 bg-slate-300 ml-4 rounded" />
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 text-[11px] font-medium text-slate-600">
                      <Navigation className="w-3 h-3 text-slate-400" />
                      <span>{activity.travelTimeFromPreviousMinutes}m transit</span>
                      {activity.travelMode && (
                        <span className="text-slate-400">• {activity.travelMode}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* The Activity Card */}
                <ActivityCard
                  activity={activity}
                  index={index}
                  totalActivities={activeDay.activities.length}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteActivity}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />

              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Edit / Add Modal */}
      <ActivityEditModal
        isOpen={isEditModalOpen}
        activity={editingActivity}
        dayNumber={activeDay.dayNumber}
        currency={preferences.currency}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveActivity}
      />

    </div>
  );
};
