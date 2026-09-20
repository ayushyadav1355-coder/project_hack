import React from 'react';
import { Trip } from '../types/travel';
import { 
  Compass, 
  PlusCircle, 
  AlertTriangle, 
  FolderOpen, 
  MessageSquare, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentTrip: Trip | null;
  savedTrips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onOpenNewTripModal: () => void;
  onOpenDisruptionModal: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTrip,
  savedTrips,
  onSelectTrip,
  onOpenNewTripModal,
  onOpenDisruptionModal,
  onToggleChat,
  isChatOpen,
  onGoHome
}) => {
  const [tripsDropdownOpen, setTripsDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGoHome} id="brand-logo-button">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">TravelPilot</span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                Agent
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Plan smarter. Adapt faster.</p>
          </div>
        </div>

        {/* Center: Current Trip Quick Status */}
        {currentTrip && (
          <div className="hidden md:flex items-center gap-2 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <span className="font-semibold text-slate-800 truncate max-w-[200px]">
              {currentTrip.name}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">{currentTrip.itinerary.length} Days</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">{currentTrip.preferences.destination}</span>
            {currentTrip.isDemo && (
              <span className="ml-1 text-[11px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                Demo Data
              </span>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* My Trips Selector */}
          <div className="relative">
            <button
              id="my-trips-dropdown-btn"
              onClick={() => setTripsDropdownOpen(!tripsDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            >
              <FolderOpen className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">My Trips</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold">
                {savedTrips.length}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {tripsDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setTripsDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Available Trips
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {savedTrips.map(trip => (
                    <button
                      key={trip.id}
                      onClick={() => onSelectTrip(trip)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 ${
                        currentTrip?.id === trip.id ? 'bg-blue-50/70 border-l-2 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-800 truncate">
                          {trip.name}
                        </span>
                        {trip.isDemo && (
                          <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded">
                            Demo
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {trip.preferences.destination} • {trip.itinerary.length} Days
                      </span>
                    </button>
                  ))}
                </div>
                <div className="px-3 pt-2 mt-1 border-t border-slate-100">
                  <button
                    onClick={onOpenNewTripModal}
                    className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-1"
                  >
                    + Create Another Trip
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Report Disruption Button (Restrained Red/Rose accent) */}
          {currentTrip && (
            <button
              id="report-disruption-nav-btn"
              onClick={onOpenDisruptionModal}
              title="Report delays, weather cancellations, or attraction closures"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span className="hidden md:inline">Report Disruption</span>
              <span className="md:hidden">Disrupt</span>
            </button>
          )}

          {/* Start New Trip */}
          <button
            id="start-new-trip-nav-btn"
            onClick={onOpenNewTripModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Start New Trip</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* AI Assistant Chat Drawer Trigger */}
          {currentTrip && (
            <button
              id="toggle-ai-chat-btn"
              onClick={onToggleChat}
              title="Open AI Trip Assistant"
              className={`p-2 rounded-lg border transition-colors relative ${
                isChatOpen
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="sr-only">AI Assistant</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
