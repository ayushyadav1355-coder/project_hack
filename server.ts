import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DEMO_TRIP_JAIPUR, DEMO_TRIP_SWISS, DEMO_TRIP_TOKYO } from './src/data/demoTrips';
import { calculateBudget } from './src/lib/budgetEngine';
import { processDisruption } from './src/lib/disruptionEngine';
import { runWhatIfSimulation } from './src/lib/whatIfEngine';
import { validateItinerary } from './src/lib/validationEngine';
import { Trip } from './src/types/travel';
import { chatWithTripAssistant, planItineraryWithAI } from './server/geminiService';
import { geocodeLocation, getLiveWeather, getServiceProvidersStatus } from './server/externalServices';

const PORT = 3000;

// In-memory store initialized with rich demo data
const tripsStore = new Map<string, Trip>();
tripsStore.set(DEMO_TRIP_TOKYO.id, DEMO_TRIP_TOKYO);
tripsStore.set(DEMO_TRIP_SWISS.id, DEMO_TRIP_SWISS);
tripsStore.set(DEMO_TRIP_JAIPUR.id, DEMO_TRIP_JAIPUR);

async function startServer() {
  const app = express();

  // Parse JSON payloads up to 10MB
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'TravelPilot API',
      aiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // Get all trips
  app.get('/api/trips', (req, res) => {
    const list = Array.from(tripsStore.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    res.json({ trips: list });
  });

  // Get single trip
  app.get('/api/trips/:id', (req, res) => {
    const trip = tripsStore.get(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json({ trip });
  });

  // Save / Update trip
  app.post('/api/trips/save', (req, res) => {
    const trip: Trip = req.body;
    if (!trip || !trip.id) {
      return res.status(400).json({ error: 'Valid trip object with id is required' });
    }
    trip.updatedAt = new Date().toISOString();
    tripsStore.set(trip.id, trip);
    res.json({ success: true, trip });
  });

  // Delete trip
  app.delete('/api/trips/:id', (req, res) => {
    const id = req.params.id;
    const deleted = tripsStore.delete(id);
    res.json({ success: deleted });
  });

  // AI Planning Agent Endpoint
  app.post('/api/trips/plan', async (req, res) => {
    try {
      const preferences = req.body.preferences;
      if (!preferences || !preferences.destination) {
        return res.status(400).json({ error: 'Trip preferences with destination required' });
      }

      // 1. Run AI / Factual planning workflow
      const { itinerary, agentWorkflowLogs } = await planItineraryWithAI(preferences);

      // 2. Deterministic budget calculation (Never LLM arithmetic)
      const allActs = itinerary.flatMap(d => d.activities);
      const budget = calculateBudget(allActs, preferences);

      // 3. Deterministic feasibility validation pass
      const validation = validateItinerary(itinerary, preferences, budget);

      const tripId = `trip-${Date.now()}`;
      const newTrip: Trip = {
        id: tripId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: `${preferences.destination} Expedition`,
        isDemo: !process.env.GEMINI_API_KEY,
        preferences,
        itinerary,
        budget,
        validation,
        disruptions: [],
        revisions: [],
        chatHistory: [
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: `Hello! I’ve synthesized your personalized itinerary for ${preferences.destination}. The schedule has been checked for timing feasibility, opening windows, and budget constraints. Let me know if you need any adjustments, or use "Report Disruption" if travel plans change on the go.`,
            timestamp: new Date().toISOString()
          }
        ]
      };

      tripsStore.set(tripId, newTrip);

      res.json({
        trip: newTrip,
        agentWorkflowLogs
      });
    } catch (err: any) {
      console.error('Error planning trip:', err);
      res.status(500).json({ error: err?.message || 'Failed to generate itinerary' });
    }
  });

  // Validation Endpoint
  app.post('/api/trips/validate', (req, res) => {
    try {
      const { itinerary, preferences, budget } = req.body;
      const validationResult = validateItinerary(itinerary, preferences, budget);
      res.json(validationResult);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Validation failed' });
    }
  });

  // Budget Recalculation Endpoint
  app.post('/api/trips/budget', (req, res) => {
    try {
      const { activities, preferences } = req.body;
      const budget = calculateBudget(activities, preferences);
      res.json({ budget });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Budget calculation failed' });
    }
  });

  // External Services Connectivity Status
  app.get('/api/services/status', (req, res) => {
    res.json({ providers: getServiceProvidersStatus() });
  });

  // Live Weather Endpoint
  app.get('/api/services/weather', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string) || 35.6762;
      const lng = parseFloat(req.query.lng as string) || 139.6503;
      const dest = (req.query.destination as string) || 'Destination';
      const weather = await getLiveWeather(lat, lng, dest);
      res.json(weather);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Weather lookup failed' });
    }
  });

  // Geocoding Endpoint
  app.get('/api/services/geocode', async (req, res) => {
    try {
      const q = (req.query.q as string) || '';
      if (!q) return res.status(400).json({ error: 'Query parameter q is required' });
      const result = await geocodeLocation(q);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Geocoding failed' });
    }
  });

  // What-If Simulation Endpoint (Requirement 5)
  app.post('/api/trips/whatif', (req, res) => {
    try {
      const { tripId, scenarioType, customQuery } = req.body;
      const trip = tripsStore.get(tripId);
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      const scenario = runWhatIfSimulation(trip, scenarioType, customQuery);
      if (!trip.whatIfScenarios) trip.whatIfScenarios = [];
      trip.whatIfScenarios.push(scenario);
      trip.activeWhatIfId = scenario.id;

      tripsStore.set(trip.id, trip);
      res.json({ scenario, trip });
    } catch (err: any) {
      console.error('What-If simulation error:', err);
      res.status(500).json({ error: err?.message || 'What-If simulation failed' });
    }
  });

  // What-If Apply / Discard Endpoint
  app.post('/api/trips/whatif/decide', (req, res) => {
    try {
      const { tripId, scenarioId, action } = req.body; // 'apply' | 'discard'
      const trip = tripsStore.get(tripId);
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      const scenario = trip.whatIfScenarios?.find(s => s.id === scenarioId);
      if (!scenario) {
        return res.status(404).json({ error: 'Scenario not found' });
      }

      if (action === 'apply') {
        // Promote scenario to confirmed itinerary
        trip.itinerary = scenario.simulatedItinerary;
        const allActs = trip.itinerary.flatMap(d => d.activities);
        trip.budget = calculateBudget(allActs, trip.preferences);
        trip.validation = validateItinerary(trip.itinerary, trip.preferences, trip.budget);
        trip.activeWhatIfId = null;
        trip.updatedAt = new Date().toISOString();
        trip.chatHistory.push({
          id: `chat-${Date.now()}`,
          role: 'assistant',
          content: `✅ **Scenario Applied**: Promoted "${scenario.title}" to confirmed trip plan. Schedule and budget re-synchronized.`,
          timestamp: new Date().toISOString()
        });
      } else {
        // Discard scenario
        trip.activeWhatIfId = null;
      }

      tripsStore.set(trip.id, trip);
      res.json({ success: true, trip });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to decide on scenario' });
    }
  });

  // Disruption Management (Modes A & B: Local Repair & Full Replan)
  app.post('/api/trips/disrupt', (req, res) => {
    try {
      const { tripId, disruption, mode } = req.body;
      const trip = tripsStore.get(tripId);
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      // Execute Disruption Engine with Mode A or Mode B
      const { revisedItinerary, revision } = processDisruption(
        trip.itinerary,
        disruption,
        trip.preferences,
        mode
      );

      // Deterministic budget update
      const allRevisedActs = revisedItinerary.flatMap(d => d.activities);
      const newBudget = calculateBudget(allRevisedActs, trip.preferences);

      // Deterministic validation update
      const newValidation = validateItinerary(revisedItinerary, trip.preferences, newBudget);

      // Update trip state with pending review revision
      trip.itinerary = revisedItinerary;
      trip.budget = newBudget;
      trip.validation = newValidation;
      trip.disruptions = [disruption, ...(trip.disruptions || [])];
      trip.revisions = [revision, ...(trip.revisions || [])];
      trip.activeRevisionId = revision.id;
      trip.updatedAt = new Date().toISOString();

      // Add disruption entry into assistant chat history
      const modeLabel = revision.replanMode === 'full_replan' ? 'MODE B: FULL REPLAN' : 'MODE A: LOCAL REPAIR';
      trip.chatHistory.push({
        id: `chat-${Date.now()}`,
        role: 'assistant',
        content: `🚨 **Disruption Handled (${modeLabel})**: ${disruption.title}.\n${revision.replanReason}\nPreserved ${revision.preservedRatioPercent}% of planned itinerary. Please review and confirm or revert under the Disruption Revisions tab.`,
        timestamp: new Date().toISOString()
      });

      tripsStore.set(trip.id, trip);

      res.json({
        trip,
        revision
      });
    } catch (err: any) {
      console.error('Disruption handling error:', err);
      res.status(500).json({ error: err?.message || 'Failed to handle disruption' });
    }
  });

  // Accept / Revert Revision Endpoint (Requirement 3 & 10)
  app.post('/api/trips/revisions/decide', (req, res) => {
    try {
      const { tripId, revisionId, action } = req.body; // 'accept' | 'revert'
      const trip = tripsStore.get(tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      const rev = trip.revisions?.find(r => r.id === revisionId);
      if (!rev) return res.status(404).json({ error: 'Revision not found' });

      if (action === 'accept') {
        rev.status = 'accepted';
        trip.updatedAt = new Date().toISOString();
        trip.chatHistory.push({
          id: `chat-${Date.now()}`,
          role: 'assistant',
          content: `Confirmed revision #${revisionId.slice(-4)} for "${rev.disruption.title}". Itinerary officially updated.`,
          timestamp: new Date().toISOString()
        });
      } else if (action === 'revert') {
        if (rev.originalItinerarySnapshot) {
          trip.itinerary = rev.originalItinerarySnapshot;
          const allActs = trip.itinerary.flatMap(d => d.activities);
          trip.budget = calculateBudget(allActs, trip.preferences);
          trip.validation = validateItinerary(trip.itinerary, trip.preferences, trip.budget);
        }
        rev.status = 'rejected';
        trip.updatedAt = new Date().toISOString();
        trip.chatHistory.push({
          id: `chat-${Date.now()}`,
          role: 'assistant',
          content: `Reverted revision #${revisionId.slice(-4)}. Original pre-disruption itinerary restored.`,
          timestamp: new Date().toISOString()
        });
      }

      tripsStore.set(trip.id, trip);
      res.json({ success: true, trip });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed to decide revision' });
    }
  });

  // Context-Aware Trip Assistant Chat
  app.post('/api/trips/chat', async (req, res) => {
    try {
      const { tripId, message } = req.body;
      const trip = tripsStore.get(tripId);
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      const response = await chatWithTripAssistant(trip, message);
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Assistant error' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TravelPilot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
