import { Activity, DayItinerary, DisruptionReport, ItineraryRevision, TripPreferences } from '../types/travel';
import { minutesToTime, timeToMinutes } from './validationEngine';

/**
 * Disruption Engine for TravelPilot:
 * Supports:
 * - MODE A: LOCAL REPAIR (isolates impact, strictly preserves unaffected activities)
 * - MODE B: FULL REPLAN (for severe cancellations / broad schedule infeasibility, explains why full replanning was needed)
 * 
 * Generates:
 * - Factual consequences summary
 * - Concrete alternative options
 * - Explicit categorization tags: Preserved, Moved, Removed, Added
 * - Strict human-in-the-loop pending_review status
 */

export function applyDisruptionLocalRepair(
  itinerary: DayItinerary[],
  disruption: DisruptionReport,
  preferences: TripPreferences
): {
  revisedItinerary: DayItinerary[];
  revision: ItineraryRevision;
} {
  return processDisruption(itinerary, disruption, preferences, 'local_repair');
}

export function applyDisruptionFullReplan(
  itinerary: DayItinerary[],
  disruption: DisruptionReport,
  preferences: TripPreferences
): {
  revisedItinerary: DayItinerary[];
  revision: ItineraryRevision;
} {
  return processDisruption(itinerary, disruption, preferences, 'full_replan');
}

export function processDisruption(
  itinerary: DayItinerary[],
  disruption: DisruptionReport,
  preferences: TripPreferences,
  overrideMode?: 'local_repair' | 'full_replan'
): {
  revisedItinerary: DayItinerary[];
  revision: ItineraryRevision;
} {
  const revisionId = `rev-${Date.now()}`;
  const originalSnapshot: DayItinerary[] = JSON.parse(JSON.stringify(itinerary));
  const originalAllActs: Activity[] = [];
  itinerary.forEach(d => originalAllActs.push(...d.activities));

  // Determine mode: Mode B if severe cancellation or delay >= 300m, or user requested
  const isSevere = disruption.severity === 'severe' || 
    disruption.type === 'flight_cancellation' || 
    disruption.type === 'cancellation' || 
    (disruption.delayMinutes && disruption.delayMinutes >= 300);

  const replanMode: 'local_repair' | 'full_replan' = overrideMode || disruption.requestedMode || (isSevere ? 'full_replan' : 'local_repair');

  let replanReason = '';
  if (replanMode === 'full_replan') {
    replanReason = isSevere
      ? `Full Replan triggered because a severe ${disruption.title.toLowerCase()} invalidated downstream transit windows and day structures across multiple days.`
      : `Full Replan requested by user to re-optimize remaining days holistically rather than making piecemeal local adjustments.`;
  } else {
    replanReason = `Local Repair applied to isolate changes to Day ${disruption.affectedDay}. Unaffected activities across all other days have been 100% preserved without disturbance.`;
  }

  const revisedItinerary: DayItinerary[] = JSON.parse(JSON.stringify(itinerary));
  const removedActivities: Activity[] = [];
  const movedActivities: { activity: Activity; oldDay: number; newDay: number; oldTime: string; newTime: string }[] = [];
  const addedActivities: Activity[] = [];
  const changedTimeActivities: { activity: Activity; oldTime: string; newTime: string }[] = [];
  const whyChangedExplanations: { title: string; reason: string }[] = [];
  const alternativeOptions: { title: string; description: string; impact: string }[] = [];

  const targetDayObj = revisedItinerary.find(d => d.dayNumber === disruption.affectedDay);

  if (!targetDayObj) {
    return {
      revisedItinerary,
      revision: {
        id: revisionId,
        timestamp: new Date().toISOString(),
        disruption,
        replanMode,
        replanReason,
        consequencesSummary: 'Disruption day is outside the active itinerary range; no schedule changes made.',
        alternativeOptions: [],
        originalActivities: originalAllActs,
        revisedActivities: originalAllActs,
        removedActivities: [],
        movedActivities: [],
        addedActivities: [],
        changedTimeActivities: [],
        costDifference: 0,
        whyChangedExplanations: [{ title: 'No Action Needed', reason: 'Disruption day was not within active itinerary range.' }],
        preservedRatioPercent: 100,
        originalItinerarySnapshot: originalSnapshot,
        status: 'pending_review'
      }
    };
  }

  const delayMins = disruption.delayMinutes || 120;
  const dayActs = targetDayObj.activities;
  const preferredEndMins = timeToMinutes(preferences.preferredDailyEndTime || '21:00');

  // Consequences analysis
  let consequencesSummary = '';

  if (disruption.type === 'attraction_closure') {
    consequencesSummary = `Venue closure at Day ${disruption.affectedDay} directly blocks scheduled access. Free hours created in afternoon slot.`;
    
    // Find matching activity
    const actsToReplace: Activity[] = [];
    dayActs.forEach(act => {
      if (disruption.affectedActivityIds.includes(act.id) || disruption.affectedActivityIds.length === 0) {
        actsToReplace.push(act);
      }
    });

    if (actsToReplace.length === 0 && dayActs.length > 0) {
      actsToReplace.push(dayActs[0]);
    }

    actsToReplace.forEach(act => {
      const idx = dayActs.findIndex(a => a.id === act.id);
      if (idx !== -1) {
        removedActivities.push(act);

        const alternativeName = `Historic District Gallery & Cultural Pavilion (${act.location.split(',')[0] || preferences.destination})`;
        const altAct: Activity = {
          id: `alt-${Date.now()}-${act.id}`,
          dayNumber: act.dayNumber,
          name: alternativeName,
          category: 'Culture & History',
          startTime: act.startTime,
          endTime: act.endTime,
          durationMinutes: act.durationMinutes,
          location: `${act.location.split(',')[0] || preferences.destination} Arts Quarter`,
          coordinates: act.coordinates,
          estimatedCost: Math.round(act.estimatedCost * 0.9),
          currency: act.currency,
          travelTimeFromPreviousMinutes: act.travelTimeFromPreviousMinutes,
          dataStatus: 'ai-suggestion',
          sourceAttribution: 'TravelPilot Disruption Repair Engine',
          selectionReason: `Selected as immediate reliable cultural alternative for closed venue (${act.name}).`,
          notes: `Replaces ${act.name} during the same schedule window.`,
          isDisrupted: false,
          revisionChangeTag: 'Added'
        };

        dayActs[idx] = altAct;
        addedActivities.push(altAct);
        whyChangedExplanations.push({
          title: `Replaced: ${act.name}`,
          reason: `Attraction closed on Day ${act.dayNumber}. Substituted "${altAct.name}" to prevent downtime.`
        });
      }
    });

    alternativeOptions.push(
      { title: 'Option 1: Nearby Indoor Gallery', description: 'Swap with nearby covered pavilion in same neighborhood (recommended).', impact: 'Zero travel delay, similar budget.' },
      { title: 'Option 2: Leisure & Cafe Break', description: 'Convert time slot into relaxed culinary stop and rest buffer.', impact: 'Saves entry fees, reduces traveler fatigue.' }
    );

  } else if (disruption.type === 'weather_disruption' || disruption.type === 'severe_weather') {
    consequencesSummary = `Inclement weather (rain/storm/wind) affects outdoor sightseeing and walking routes on Day ${disruption.affectedDay}.`;

    dayActs.forEach((act, idx) => {
      const isOutdoor = act.category === 'Nature & Parks' || act.category === 'Adventure' || act.category === 'Sightseeing';
      if (isOutdoor) {
        removedActivities.push(act);
        const altAct: Activity = {
          id: `alt-weather-${Date.now()}-${idx}`,
          dayNumber: act.dayNumber,
          name: `Covered Museum & Heritage Complex (${act.location.split(',')[0] || preferences.destination})`,
          category: 'Culture & History',
          startTime: act.startTime,
          endTime: act.endTime,
          durationMinutes: act.durationMinutes,
          location: `${act.location.split(',')[0] || preferences.destination} Central Arcade`,
          coordinates: act.coordinates,
          estimatedCost: Math.max(10, act.estimatedCost),
          currency: act.currency,
          travelTimeFromPreviousMinutes: act.travelTimeFromPreviousMinutes,
          dataStatus: 'ai-suggestion',
          sourceAttribution: 'Weather Resilience Engine',
          selectionReason: 'Indoor weather-sheltered cultural venue protecting against heavy rain and cold.',
          revisionChangeTag: 'Added'
        };

        dayActs[idx] = altAct;
        addedActivities.push(altAct);
        whyChangedExplanations.push({
          title: `Weather Shelter: ${act.name} → ${altAct.name}`,
          reason: `Outdoor activity sheltered by transitioning to high-rated covered pavilion.`
        });
      }
    });

    alternativeOptions.push(
      { title: 'Option 1: Indoor Museum & Arcade Tour', description: 'Substitute all outdoor walks with covered museums and galleries.', impact: 'Dry, warm, preserves schedule.' },
      { title: 'Option 2: Inverted Day Order', description: 'Swap full Day with an indoor day from later in the trip.', impact: 'May shift dining reservations.' }
    );

  } else if (replanMode === 'full_replan' || disruption.type === 'flight_cancellation' || disruption.type === 'cancellation') {
    // Mode B: Full Replan
    consequencesSummary = `Major transit cancellation on Day ${disruption.affectedDay} eliminated earlier schedule window. Total day re-balancing executed.`;

    // Drop all activities before evening on affected day, and redistribute must-sees to subsequent days
    const nextDays = revisedItinerary.filter(d => d.dayNumber > disruption.affectedDay);
    
    // Keep only 1 light evening activity on affected day
    while (dayActs.length > 1) {
      const dropped = dayActs.pop()!;
      // Try to re-home in next available day with fewer than 4 activities
      const candidateDay = nextDays.find(d => d.activities.length < 4);
      if (candidateDay) {
        const lastAct = candidateDay.activities[candidateDay.activities.length - 1];
        const shiftedStart = lastAct 
          ? minutesToTime(Math.min(preferredEndMins - dropped.durationMinutes, timeToMinutes(lastAct.endTime) + 30))
          : '14:00';
        const shiftedEnd = minutesToTime(timeToMinutes(shiftedStart) + dropped.durationMinutes);

        const movedAct: Activity = {
          ...dropped,
          dayNumber: candidateDay.dayNumber,
          startTime: shiftedStart,
          endTime: shiftedEnd,
          selectionReason: `${dropped.selectionReason} (Rescheduled to Day ${candidateDay.dayNumber} via Full Replan)`,
          revisionChangeTag: 'Moved'
        };
        candidateDay.activities.push(movedAct);
        movedActivities.push({
          activity: dropped,
          oldDay: dropped.dayNumber,
          newDay: candidateDay.dayNumber,
          oldTime: dropped.startTime,
          newTime: shiftedStart
        });
        whyChangedExplanations.push({
          title: `Relocated to Day ${candidateDay.dayNumber}: ${dropped.name}`,
          reason: `Preserved top highlight by transferring from cancelled arrival slot to Day ${candidateDay.dayNumber}.`
        });
      } else {
        removedActivities.push(dropped);
        whyChangedExplanations.push({
          title: `Removed: ${dropped.name}`,
          reason: `Schedule condensed due to lost travel day; lower-priority stop dropped to ensure realistic pace.`
        });
      }
    }

    if (dayActs.length === 1) {
      const arrivalRelax = dayActs[0];
      const oldTime = `${arrivalRelax.startTime} - ${arrivalRelax.endTime}`;
      arrivalRelax.startTime = '19:30';
      arrivalRelax.endTime = '21:00';
      arrivalRelax.name = `Check-in & Restorative Evening Meal (${preferences.destination})`;
      arrivalRelax.selectionReason = 'Relaxed evening buffer following disrupted transportation.';
      arrivalRelax.revisionChangeTag = 'Moved';
      changedTimeActivities.push({
        activity: arrivalRelax,
        oldTime,
        newTime: '19:30 - 21:00'
      });
    }

    alternativeOptions.push(
      { title: 'Option 1: Condensed Highlights Itinerary', description: 'Merge essential sights into remaining days with 15m extra buffers.', impact: 'Pace shifts from Relaxed to Balanced.' },
      { title: 'Option 2: Drop Disrupted Day Completely', description: 'Start itinerary fresh on Day 2 with zero schedule compression.', impact: 'Most restful, 1 day of activities skipped.' }
    );

  } else {
    // Mode A: Standard Delays (train delay, bus delay, flight delay, schedule change)
    consequencesSummary = `A ${delayMins}-minute delay on Day ${disruption.affectedDay} creates a cascading pushback on afternoon activities.`;

    let cumulativeShift = delayMins;
    const nextDay = revisedItinerary.find(d => d.dayNumber === disruption.affectedDay + 1);

    for (let i = 0; i < dayActs.length; i++) {
      const act = dayActs[i];
      const origStart = timeToMinutes(act.startTime);
      const origEnd = timeToMinutes(act.endTime);

      const newStartMins = origStart + cumulativeShift;
      const newEndMins = origEnd + cumulativeShift;

      if (newEndMins > preferredEndMins + 30) {
        // Exceeds comfortable night hours
        if (nextDay && nextDay.activities.length < 5 && act.category !== 'Food & Dining') {
          const movedStart = nextDay.activities.length > 0 
            ? minutesToTime(timeToMinutes(nextDay.activities[nextDay.activities.length - 1].endTime) + 30)
            : '11:00';
          const movedEnd = minutesToTime(timeToMinutes(movedStart) + act.durationMinutes);

          const movedAct: Activity = {
            ...act,
            dayNumber: nextDay.dayNumber,
            startTime: movedStart,
            endTime: movedEnd,
            selectionReason: `${act.selectionReason} (Rescheduled due to ${disruption.title.toLowerCase()})`,
            revisionChangeTag: 'Moved'
          };
          nextDay.activities.push(movedAct);
          dayActs.splice(i, 1);
          i--;
          movedActivities.push({
            activity: act,
            oldDay: act.dayNumber,
            newDay: nextDay.dayNumber,
            oldTime: act.startTime,
            newTime: movedStart
          });
          whyChangedExplanations.push({
            title: `Rescheduled to Day ${nextDay.dayNumber}: ${act.name}`,
            reason: `The ${Math.round(delayMins / 60 * 10) / 10}h delay pushed ${act.name} past evening hours. Shifted to Day ${nextDay.dayNumber}.`
          });
        } else {
          removedActivities.push(act);
          dayActs.splice(i, 1);
          i--;
          whyChangedExplanations.push({
            title: `Removed: ${act.name}`,
            reason: `Due to ${Math.round(delayMins / 60 * 10) / 10}h delay, could not be completed before end-of-day (${preferences.preferredDailyEndTime}).`
          });
        }
      } else {
        const oldTime = `${act.startTime} - ${act.endTime}`;
        act.startTime = minutesToTime(newStartMins);
        act.endTime = minutesToTime(newEndMins);
        act.revisionChangeTag = 'Moved';
        const newTime = `${act.startTime} - ${act.endTime}`;

        changedTimeActivities.push({
          activity: act,
          oldTime,
          newTime
        });
        whyChangedExplanations.push({
          title: `Pushed back: ${act.name}`,
          reason: `Shifted start by ${delayMins} mins to absorb delay without overlap.`
        });
      }
    }

    alternativeOptions.push(
      { title: 'Option 1: Push Schedule Back', description: `Shift activities by ${delayMins} mins, pushing dinner to later evening.`, impact: 'All activities kept, later dinner.' },
      { title: 'Option 2: Drop Final Activity', description: 'Skip evening activity to preserve relaxed bedtime and rest buffer.', impact: 'Zero evening rush.' }
    );
  }

  // Tag surviving untouched activities as 'Preserved'
  const revisedAllActs: Activity[] = [];
  revisedItinerary.forEach(d => {
    d.activities.forEach(a => {
      if (!a.revisionChangeTag) {
        a.revisionChangeTag = 'Preserved';
      }
      revisedAllActs.push(a);
    });
  });

  const originalIds = new Set(originalAllActs.map(a => a.id));
  let preservedCount = 0;
  revisedAllActs.forEach(a => {
    if (originalIds.has(a.id) && a.revisionChangeTag === 'Preserved') {
      preservedCount++;
    }
  });

  const preservedRatioPercent = originalAllActs.length > 0 
    ? Math.round((preservedCount / originalAllActs.length) * 100) 
    : 100;

  const origCost = originalAllActs.reduce((s, a) => s + (Number(a.estimatedCost) || 0), 0);
  const revCost = revisedAllActs.reduce((s, a) => s + (Number(a.estimatedCost) || 0), 0);
  const costDifference = revCost - origCost;

  const revision: ItineraryRevision = {
    id: revisionId,
    timestamp: new Date().toISOString(),
    disruption,
    replanMode,
    replanReason,
    consequencesSummary,
    alternativeOptions,
    originalActivities: originalAllActs,
    revisedActivities: revisedAllActs,
    removedActivities,
    movedActivities,
    addedActivities,
    changedTimeActivities,
    costDifference,
    whyChangedExplanations,
    preservedRatioPercent,
    originalItinerarySnapshot: originalSnapshot,
    status: 'pending_review'
  };

  return {
    revisedItinerary,
    revision
  };
}
