import { Activity, DayItinerary, Trip, WhatIfScenario } from '../types/travel';
import { calculateBudget } from './budgetEngine';
import { processDisruption } from './disruptionEngine';
import { minutesToTime, timeToMinutes, validateItinerary } from './validationEngine';

/**
 * What-If Simulation Engine
 * Generates sandbox hypothetical scenarios without destroying confirmed trip state.
 */

export function runWhatIfSimulation(
  trip: Trip,
  scenarioType: WhatIfScenario['scenarioType'],
  customQuery?: string
): WhatIfScenario {
  const scenarioId = `whatif-${Date.now()}`;
  const originalItinerary = trip.itinerary;
  const preferences = trip.preferences;

  let simulatedItinerary: DayItinerary[] = JSON.parse(JSON.stringify(originalItinerary));
  let title = '';
  let query = customQuery || '';
  let impactSummary = '';
  const diffItems: WhatIfScenario['diffItems'] = [];

  switch (scenarioType) {
    case 'train_delay': {
      title = 'What if train is delayed by 2 hours?';
      query = query || 'Simulate a 120-minute transportation delay on Day 1';
      const result = processDisruption(
        originalItinerary,
        {
          id: `dis-sim-${Date.now()}`,
          type: 'train_delay',
          title: 'Simulated 2-Hour Train Delay',
          description: 'Testing schedule resilience if regional train arrives 120 minutes late.',
          reportedAt: new Date().toISOString(),
          affectedDay: 1,
          delayMinutes: 120,
          affectedActivityIds: [],
          severity: 'moderate'
        },
        preferences,
        'local_repair'
      );
      simulatedItinerary = result.revisedItinerary;
      impactSummary = `Pushed afternoon Day 1 activities back by 2 hours. ${result.revision.movedActivities.length} activities shifted; ${result.revision.preservedRatioPercent}% of planned itinerary preserved.`;
      
      result.revision.changedTimeActivities.forEach(c => {
        diffItems.push({
          activityName: c.activity.name,
          changeType: 'Moved',
          detail: `Time pushed back from ${c.oldTime} to ${c.newTime}`
        });
      });
      break;
    }

    case 'budget_reduction': {
      title = 'What if I reduce my budget by 20%?';
      query = query || 'Optimize activities to reduce total trip cost by 20%';
      // Find highest cost ticketed activities and replace or trim them
      let savings = 0;
      simulatedItinerary.forEach(day => {
        day.activities.forEach(act => {
          if (act.estimatedCost > 25 && act.category !== 'Food & Dining') {
            const originalCost = act.estimatedCost;
            // Trim cost by selecting self-guided / public vantage or free pass
            act.estimatedCost = Math.round(act.estimatedCost * 0.4);
            act.notes = `${act.notes || ''} (Simulated self-guided / discounted pass)`.trim();
            act.sourceAttribution = 'What-If Cost Optimization';
            savings += (originalCost - act.estimatedCost);

            diffItems.push({
              activityName: act.name,
              changeType: 'Moved',
              detail: `Swapped ticketed tour for self-guided entry (saved ${trip.budget.currency} ${originalCost - act.estimatedCost})`
            });
          }
        });
      });

      impactSummary = `Reduced estimated activity expenses by ${trip.budget.currency} ${savings.toLocaleString()} while keeping all locations on your schedule.`;
      break;
    }

    case 'relaxed_pace': {
      title = 'What if I want a relaxed itinerary?';
      query = query || 'Cap activities at max 3 per day and insert 45-min rest buffers';
      
      simulatedItinerary.forEach(day => {
        if (day.activities.length > 3) {
          // Drop non-essential activities past the 3rd
          const dropped = day.activities.splice(3);
          dropped.forEach(d => {
            diffItems.push({
              activityName: d.name,
              changeType: 'Removed',
              detail: 'Removed to provide relaxed afternoon coffee and rest buffer'
            });
          });
        }
        // Expand buffers between remaining activities
        for (let i = 1; i < day.activities.length; i++) {
          const prev = day.activities[i - 1];
          const curr = day.activities[i];
          const prevEnd = timeToMinutes(prev.endTime);
          const currStart = timeToMinutes(curr.startTime);
          if (currStart - prevEnd < 45) {
            const newStart = prevEnd + 45;
            const newEnd = newStart + curr.durationMinutes;
            curr.startTime = minutesToTime(newStart);
            curr.endTime = minutesToTime(newEnd);
            diffItems.push({
              activityName: curr.name,
              changeType: 'Moved',
              detail: `Added 45-min rest buffer before start (${curr.startTime})`
            });
          }
        }
      });

      impactSummary = 'All days capped at 3 key stops with minimum 45-minute relaxation intervals between locations.';
      break;
    }

    case 'attraction_closure': {
      title = 'What if the primary museum/sight is closed?';
      query = query || 'Simulate closure of primary museum on Day 2';
      const day2 = simulatedItinerary.find(d => d.dayNumber === 2) || simulatedItinerary[0];
      const targetAct = day2.activities.find(a => a.category === 'Culture & History' || a.category === 'Sightseeing') || day2.activities[0];
      
      const result = processDisruption(
        simulatedItinerary,
        {
          id: `dis-sim-close-${Date.now()}`,
          type: 'attraction_closure',
          title: `Simulated Closure: ${targetAct ? targetAct.name : 'Museum'}`,
          description: 'Testing schedule if principal heritage museum is closed for renovations.',
          reportedAt: new Date().toISOString(),
          affectedDay: day2.dayNumber,
          affectedActivityIds: targetAct ? [targetAct.id] : [],
          severity: 'moderate'
        },
        preferences,
        'local_repair'
      );
      simulatedItinerary = result.revisedItinerary;
      impactSummary = `Simulated closure of ${targetAct?.name || 'attraction'}. Replaced with high-rated indoor cultural gallery in same neighborhood.`;
      
      result.revision.removedActivities.forEach(r => {
        diffItems.push({
          activityName: r.name,
          changeType: 'Removed',
          detail: 'Closed venue removed from schedule'
        });
      });
      result.revision.addedActivities.forEach(a => {
        diffItems.push({
          activityName: a.name,
          changeType: 'Added',
          detail: `Substituted alternative: ${a.name}`
        });
      });
      break;
    }

    case 'add_day': {
      title = 'What if I add one more day?';
      query = query || 'Simulate extending trip by 1 additional day';
      const lastDay = simulatedItinerary[simulatedItinerary.length - 1];
      const newDayNumber = simulatedItinerary.length + 1;
      
      const nextDate = new Date(lastDay ? lastDay.date : preferences.endDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const newActivities: Activity[] = [
        {
          id: `act-sim-ext-1-${Date.now()}`,
          dayNumber: newDayNumber,
          name: `${preferences.destination} Artisan Quarter & Hidden Alleys`,
          category: 'Shopping',
          startTime: '10:00',
          endTime: '12:00',
          durationMinutes: 120,
          location: `${preferences.destination} Old Artisan District`,
          estimatedCost: 15,
          currency: preferences.currency,
          travelTimeFromPreviousMinutes: 20,
          travelMode: 'Walking',
          dataStatus: 'ai-suggestion',
          sourceAttribution: 'What-If Day Extension Simulator',
          selectionReason: 'Provides extra time for unhurried local exploration and crafts.'
        },
        {
          id: `act-sim-ext-2-${Date.now()}`,
          dayNumber: newDayNumber,
          name: 'Celebratory Farewell Regional Tasting Lunch',
          category: 'Food & Dining',
          startTime: '12:30',
          endTime: '14:30',
          durationMinutes: 120,
          location: `${preferences.destination} Culinary Center`,
          estimatedCost: 45,
          currency: preferences.currency,
          travelTimeFromPreviousMinutes: 15,
          travelMode: 'Walking',
          dataStatus: 'ai-suggestion',
          sourceAttribution: 'What-If Day Extension Simulator',
          selectionReason: 'Culinary wrap-up celebrating authentic regional cuisine.'
        },
        {
          id: `act-sim-ext-3-${Date.now()}`,
          dayNumber: newDayNumber,
          name: 'Scenic Panoramic Overlook & Garden Stroll',
          category: 'Nature & Parks',
          startTime: '15:30',
          endTime: '17:30',
          durationMinutes: 120,
          location: `${preferences.destination} Scenic Heights`,
          estimatedCost: 10,
          currency: preferences.currency,
          travelTimeFromPreviousMinutes: 25,
          travelMode: 'Transit',
          dataStatus: 'ai-suggestion',
          sourceAttribution: 'What-If Day Extension Simulator',
          selectionReason: 'Relaxed golden hour perspective before departure.'
        }
      ];

      simulatedItinerary.push({
        dayNumber: newDayNumber,
        date: nextDate.toISOString().split('T')[0],
        theme: `Day ${newDayNumber}: Unhurried Discovery & Farewell Perspectives`,
        summary: `Relaxed extra day added to discover hidden artisan quarters and panoramic viewpoints without rushing.`,
        activities: newActivities
      });

      newActivities.forEach(a => {
        diffItems.push({
          activityName: a.name,
          changeType: 'Added',
          detail: `Added on new Day ${newDayNumber} (${a.startTime} - ${a.endTime})`
        });
      });

      impactSummary = `Trip extended from ${originalItinerary.length} to ${newDayNumber} days with 3 relaxed activities and ample resting margins.`;
      break;
    }

    case 'transit_limit': {
      title = 'What if max travel between activities is 30 minutes?';
      query = query || 'Ensure no transit leg between activities exceeds 30 minutes';
      
      let cappedCount = 0;
      simulatedItinerary.forEach(day => {
        day.activities.forEach(act => {
          if (act.travelTimeFromPreviousMinutes > 30) {
            act.travelTimeFromPreviousMinutes = 25;
            act.travelMode = 'Express Transit / Taxi';
            act.notes = `${act.notes || ''} (Simulated fast transit cap: <=30m)`.trim();
            cappedCount++;
            diffItems.push({
              activityName: act.name,
              changeType: 'Moved',
              detail: `Upgraded transit to express routing to cap transfer at 25 mins`
            });
          }
        });
      });

      impactSummary = `Optimized transit across all days. Capped ${cappedCount} legs at 25-30 minutes max transit.`;
      break;
    }

    case 'custom':
    default: {
      title = customQuery ? `What if: ${customQuery}` : 'Custom What-If Scenario';
      query = customQuery || 'Testing custom schedule adjustment';
      impactSummary = 'Applied localized schedule simulation based on your hypothetical scenario.';
      break;
    }
  }

  // Calculate budget delta & validation
  const allOrigActs = originalItinerary.flatMap(d => d.activities);
  const allSimActs = simulatedItinerary.flatMap(d => d.activities);

  const origCost = allOrigActs.reduce((s, a) => s + (Number(a.estimatedCost) || 0), 0);
  const simCost = allSimActs.reduce((s, a) => s + (Number(a.estimatedCost) || 0), 0);
  const costDifference = simCost - origCost;

  const originalIds = new Set(allOrigActs.map(a => a.id));
  const preservedCount = allSimActs.filter(a => originalIds.has(a.id)).length;
  const preservedRatioPercent = allOrigActs.length > 0 
    ? Math.round((preservedCount / allOrigActs.length) * 100) 
    : 100;

  const simBudget = calculateBudget(allSimActs, preferences);
  const validation = validateItinerary(simulatedItinerary, preferences, simBudget);

  return {
    id: scenarioId,
    title,
    query,
    scenarioType,
    createdAt: new Date().toISOString(),
    simulatedItinerary,
    costDifference,
    impactSummary,
    scheduleChangesCount: diffItems.length,
    preservedRatioPercent,
    validation,
    diffItems
  };
}
