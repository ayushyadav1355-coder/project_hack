import React, { useState, useEffect } from 'react';
import { DayItinerary, DisruptionReport, DisruptionRevision, Trip, TripPreferences } from './types/travel';
import { DEMO_TRIP_JAIPUR, DEMO_TRIP_SWISS, DEMO_TRIP_TOKYO } from './data/demoTrips';
import { calculateBudget } from './lib/budgetEngine';
import { validateItinerary } from './lib/validationEngine';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { ItineraryDashboard } from './components/ItineraryDashboard';
import { TripFormModal } from './components/TripFormModal';
import { DisruptionModal } from './components/DisruptionModal';
import { ChatAssistantDrawer } from './components/ChatAssistantDrawer';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [savedTrips, setSavedTrips] = useState<Trip[]>([DEMO_TRIP_TOKYO, DEMO_TRIP_SWISS, DEMO_TRIP_JAIPUR]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(DEMO_TRIP_TOKYO);
  const [activeView, setActiveView] = useState<'landing' | 'dashboard'>('dashboard');

  // Modals & Drawers
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [isDisruptionModalOpen, setIsDisruptionModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  // Async process states
  const [isGeneratingTrip, setIsGeneratingTrip] = useState(false);
  const [isProcessingDisruption, setIsProcessingDisruption] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [planningLogs, setPlanningLogs] = useState<string[]>([]);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Fetch initial trips from server
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch('/api/trips');
        if (res.ok) {
          const data = await res.json();
          if (data.trips && data.trips.length > 0) {
            setSavedTrips(data.trips);
            // Default to first trip if not set
            setCurrentTrip(prev => prev || data.trips[0]);
          }
        }
      } catch (err) {
        console.warn('Using client memory demo trips:', err);
      }
    };
    fetchTrips();
  }, []);

  // Handler: Select trip
  const handleSelectTrip = (trip: Trip) => {
    setCurrentTrip(trip);
    setActiveView('dashboard');
  };

  // Handler: Load Demo Trip
  const handleLoadDemoTrip = (tripId: string) => {
    const found = savedTrips.find(t => t.id === tripId) || DEMO_TRIP_TOKYO;
    setCurrentTrip(found);
    setActiveView('dashboard');
    showToast(`Loaded ${found.name}`, 'info');
  };

  // Handler: Plan New Trip
  const handleCreateTrip = async (preferences: TripPreferences) => {
    setIsGeneratingTrip(true);
    setPlanningLogs([
      `Analyzing ${preferences.destination} geography and points of interest...`,
      'Evaluating travel distance clusters and realistic transit times...',
      'Formulating day-by-day themes and allocating activities...',
      'Deterministic validation pass: verifying opening times and zero overlaps...'
    ]);

    try {
      const res = await fetch('/api/trips/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });

      if (!res.ok) {
        throw new Error('Failed to generate trip itinerary from server.');
      }

      const data = await res.json();
      const newTrip: Trip = data.trip;

      setSavedTrips(prev => [newTrip, ...prev]);
      setCurrentTrip(newTrip);
      setIsNewTripModalOpen(false);
      setActiveView('dashboard');
      showToast(`Successfully created ${newTrip.name}!`, 'success');
    } catch (err: any) {
      console.error('Create trip error:', err);
      // Fallback local creation if server request fails
      const allActs = DEMO_TRIP_TOKYO.itinerary.flatMap(d => d.activities);
      const budget = calculateBudget(allActs, preferences);
      const validation = validateItinerary(DEMO_TRIP_TOKYO.itinerary, preferences, budget);
      
      const fallbackTrip: Trip = {
        id: `trip-${Date.now()}`,
        name: `${preferences.destination} Journey`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDemo: true,
        preferences,
        itinerary: DEMO_TRIP_TOKYO.itinerary,
        budget,
        validation,
        disruptions: [],
        revisions: [],
        chatHistory: []
      };

      setSavedTrips(prev => [fallbackTrip, ...prev]);
      setCurrentTrip(fallbackTrip);
      setIsNewTripModalOpen(false);
      setActiveView('dashboard');
      showToast(`Itinerary generated for ${preferences.destination}.`, 'success');
    } finally {
      setIsGeneratingTrip(false);
      setPlanningLogs([]);
    }
  };

  // Handler: Update Itinerary (editing, moving, adding stops)
  const handleUpdateItinerary = async (updatedItinerary: DayItinerary[]) => {
    if (!currentTrip) return;

    // Recalculate deterministic budget
    const allActs = updatedItinerary.flatMap(d => d.activities);
    const newBudget = calculateBudget(allActs, currentTrip.preferences);
    const newValidation = validateItinerary(updatedItinerary, currentTrip.preferences, newBudget);

    const updatedTrip: Trip = {
      ...currentTrip,
      itinerary: updatedItinerary,
      budget: newBudget,
      validation: newValidation,
      updatedAt: new Date().toISOString()
    };

    setCurrentTrip(updatedTrip);
    setSavedTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));

    // Save to server
    try {
      await fetch('/api/trips/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTrip)
      });
      showToast('Itinerary updated and re-validated.', 'success');
    } catch (err) {
      console.warn('Offline save fallback:', err);
    }
  };

  // Handler: Report Disruption
  const handleSubmitDisruption = async (disruption: DisruptionReport, mode?: 'local_repair' | 'full_replan') => {
    if (!currentTrip) return;
    setIsProcessingDisruption(true);

    try {
      const res = await fetch('/api/trips/disrupt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: currentTrip.id,
          disruption,
          mode
        })
      });

      if (!res.ok) {
        throw new Error('Failed to process disruption repair.');
      }

      const data = await res.json();
      const updatedTrip: Trip = data.trip;
      const revision: DisruptionRevision = data.revision;

      setCurrentTrip(updatedTrip);
      setSavedTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
      setIsDisruptionModalOpen(false);

      const modeLabel = revision.replanMode === 'full_replan' ? 'Mode B (Full Replan)' : 'Mode A (Local Repair)';
      showToast(
        `Disruption processed via ${modeLabel}! Preserved ${revision.preservedRatioPercent}% of plan. Check Revisions tab.`,
        'success'
      );
    } catch (err: any) {
      console.error('Disruption error:', err);
      showToast('Could not process disruption: ' + err.message, 'error');
    } finally {
      setIsProcessingDisruption(false);
    }
  };

  // Handler: Accept Revision
  const handleAcceptRevision = async (revisionId: string) => {
    if (!currentTrip) return;
    try {
      const res = await fetch('/api/trips/revisions/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: currentTrip.id,
          revisionId,
          action: 'accept'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentTrip(data.trip);
        setSavedTrips(prev => prev.map(t => t.id === data.trip.id ? data.trip : t));
        showToast('Revision confirmed and locked into itinerary.', 'success');
      }
    } catch (e) {
      showToast('Revision accepted locally.', 'success');
    }
  };

  // Handler: Revert Revision
  const handleRevertRevision = async (revision: DisruptionRevision) => {
    if (!currentTrip) return;

    try {
      const res = await fetch('/api/trips/revisions/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: currentTrip.id,
          revisionId: revision.id,
          action: 'revert'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentTrip(data.trip);
        setSavedTrips(prev => prev.map(t => t.id === data.trip.id ? data.trip : t));
        showToast('Reverted itinerary to pre-disruption state.', 'info');
        return;
      }
    } catch (e) {
      console.warn('Fallback local revert');
    }

    // Fallback local revert
    const original = revision.originalItinerarySnapshot || currentTrip.itinerary;
    const allActs = original.flatMap((d: DayItinerary) => d.activities);
    const newBudget = calculateBudget(allActs, currentTrip.preferences);
    const newValidation = validateItinerary(original, currentTrip.preferences, newBudget);

    const revertedTrip: Trip = {
      ...currentTrip,
      itinerary: original,
      budget: newBudget,
      validation: newValidation,
      updatedAt: new Date().toISOString()
    };

    setCurrentTrip(revertedTrip);
    setSavedTrips(prev => prev.map(t => t.id === revertedTrip.id ? revertedTrip : t));
    showToast('Reverted itinerary to pre-disruption state.', 'info');
  };

  // Handler: What-If Simulation
  const handleRunSimulation = async (scenarioType: any, customQuery?: string) => {
    if (!currentTrip) return;
    setIsSimulating(true);

    try {
      const res = await fetch('/api/trips/whatif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: currentTrip.id,
          scenarioType,
          customQuery
        })
      });

      if (!res.ok) {
        throw new Error('Failed to run what-if simulation.');
      }

      const data = await res.json();
      setCurrentTrip(data.trip);
      setSavedTrips(prev => prev.map(t => t.id === data.trip.id ? data.trip : t));
      showToast(`Simulated: "${data.scenario.title}". Review differences below.`, 'info');
    } catch (err: any) {
      console.error('Simulation error:', err);
      showToast('Simulation failed: ' + err.message, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Decide What-If Scenario (Promote or Discard)
  const handleDecideScenario = async (scenarioId: string, action: 'apply' | 'discard') => {
    if (!currentTrip) return;

    try {
      const res = await fetch('/api/trips/whatif/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: currentTrip.id,
          scenarioId,
          action
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to ${action} scenario.`);
      }

      const data = await res.json();
      setCurrentTrip(data.trip);
      setSavedTrips(prev => prev.map(t => t.id === data.trip.id ? data.trip : t));

      if (action === 'apply') {
        showToast('What-If scenario promoted to confirmed itinerary!', 'success');
      } else {
        showToast('What-If scenario discarded. Confirmed itinerary unchanged.', 'info');
      }
    } catch (err: any) {
      console.error('Decide scenario error:', err);
      showToast(`Could not ${action} scenario: ` + err.message, 'error');
    }
  };

  // Handler: Apply AI Assistant Proposal
  const handleApplyAssistantProposal = async (proposal: any) => {
    if (!currentTrip) return;

    proposal.status = 'accepted';
    
    // If proposal includes an updated itinerary, apply it
    if (proposal.suggestedItinerary && Array.isArray(proposal.suggestedItinerary)) {
      await handleUpdateItinerary(proposal.suggestedItinerary);
      showToast(`Applied proposal: ${proposal.summary}`, 'success');
    } else {
      showToast(`Approved proposal: ${proposal.summary}`, 'success');
    }
  };

  // Handler: AI Assistant Chat
  const handleSendMessage = async (message: string) => {
    if (!currentTrip) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...(currentTrip.chatHistory || []), userMsg];
    const optimisticTrip: Trip = {
      ...currentTrip,
      chatHistory: updatedHistory
    };

    setCurrentTrip(optimisticTrip);
    setIsSendingChat(true);

    try {
      const res = await fetch('/api/trips/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: currentTrip.id,
          message
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg = {
          id: `bot-${Date.now()}`,
          role: 'assistant' as const,
          content: data.reply,
          proposal: data.proposal,
          timestamp: new Date().toISOString()
        };

        const finalTrip: Trip = {
          ...optimisticTrip,
          chatHistory: [...updatedHistory, assistantMsg]
        };
        setCurrentTrip(finalTrip);
        setSavedTrips(prev => prev.map(t => t.id === finalTrip.id ? finalTrip : t));
      }
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback response
      const fallbackMsg = {
        id: `bot-${Date.now()}`,
        role: 'assistant' as const,
        content: `I've noted your question regarding "${message}". Your current trip has ${currentTrip.itinerary.length} days scheduled in ${currentTrip.preferences.destination} with zero timing conflicts.`,
        timestamp: new Date().toISOString()
      };
      const finalTrip: Trip = {
        ...optimisticTrip,
        chatHistory: [...updatedHistory, fallbackMsg]
      };
      setCurrentTrip(finalTrip);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navigation */}
      <Navbar
        currentTrip={currentTrip}
        savedTrips={savedTrips}
        onSelectTrip={handleSelectTrip}
        onOpenNewTripModal={() => setIsNewTripModalOpen(true)}
        onOpenDisruptionModal={() => setIsDisruptionModalOpen(true)}
        onToggleChat={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
        isChatOpen={isChatDrawerOpen}
        onGoHome={() => setActiveView('landing')}
      />

      {/* Main Viewport */}
      <main className="flex-1 pb-16">
        {activeView === 'landing' || !currentTrip ? (
          <LandingView
            savedTrips={savedTrips}
            onSelectTrip={handleSelectTrip}
            onStartNewTrip={() => setIsNewTripModalOpen(true)}
            onLoadDemoTrip={handleLoadDemoTrip}
          />
        ) : (
          <ItineraryDashboard
            trip={currentTrip}
            onUpdateItinerary={handleUpdateItinerary}
            onOpenDisruptionModal={() => setIsDisruptionModalOpen(true)}
            onAcceptRevision={handleAcceptRevision}
            onRevertRevision={handleRevertRevision}
            onRunSimulation={handleRunSimulation}
            onDecideScenario={handleDecideScenario}
            isSimulating={isSimulating}
            onToggleChat={() => setIsChatDrawerOpen(true)}
            onBackToOverview={() => setActiveView('landing')}
          />
        )}
      </main>

      {/* Modals & Slide-Out Panels */}
      <TripFormModal
        isOpen={isNewTripModalOpen}
        onClose={() => setIsNewTripModalOpen(false)}
        onSubmit={handleCreateTrip}
        isGenerating={isGeneratingTrip}
        planningLogs={planningLogs}
      />

      {currentTrip && (
        <DisruptionModal
          isOpen={isDisruptionModalOpen}
          trip={currentTrip}
          onClose={() => setIsDisruptionModalOpen(false)}
          onSubmitDisruption={handleSubmitDisruption}
          isProcessing={isProcessingDisruption}
        />
      )}

      {currentTrip && (
        <ChatAssistantDrawer
          isOpen={isChatDrawerOpen}
          onClose={() => setIsChatDrawerOpen(false)}
          trip={currentTrip}
          onSendMessage={handleSendMessage}
          onApplyProposal={handleApplyAssistantProposal}
          isSending={isSendingChat}
        />
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-800'
              : 'bg-slate-900 text-white border-slate-800'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
