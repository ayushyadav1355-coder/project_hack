import { Activity, BudgetBreakdown, DayItinerary, TripPreferences, ValidationWarning } from '../types/travel';

/**
 * Converts "HH:MM" 24h string to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight to "HH:MM" 24h string
 */
export function minutesToTime(mins: number): string {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, mins));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Deterministic Validation Engine.
 * Never relies on LLM for logical or mathematical consistency checks.
 */
export function validateItinerary(
  itinerary: DayItinerary[],
  preferences: TripPreferences,
  budget: BudgetBreakdown
): { isValid: boolean; warnings: ValidationWarning[] } {
  const warnings: ValidationWarning[] = [];
  const preferredDailyStartMins = timeToMinutes(preferences.preferredDailyStartTime || '09:00');
  const preferredDailyEndMins = timeToMinutes(preferences.preferredDailyEndTime || '21:00');

  // 1. Check Date Consistency
  if (!preferences.startDate || !preferences.endDate) {
    warnings.push({
      id: 'date-missing',
      severity: 'error',
      category: 'dates',
      title: 'Missing Trip Dates',
      message: 'Trip start date and end date must be properly set.',
      suggestedFix: 'Select valid start and end dates in the trip parameters.'
    });
  } else {
    const startDate = new Date(preferences.startDate);
    const endDate = new Date(preferences.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      warnings.push({
        id: 'date-invalid',
        severity: 'error',
        category: 'dates',
        title: 'Invalid Date Format',
        message: 'The specified trip dates could not be parsed.',
        suggestedFix: 'Re-enter dates in YYYY-MM-DD format.'
      });
    } else if (startDate > endDate) {
      warnings.push({
        id: 'date-sequence',
        severity: 'error',
        category: 'dates',
        title: 'End Date Precedes Start Date',
        message: 'The trip end date cannot be earlier than the start date.',
        suggestedFix: 'Adjust the departure or return date.'
      });
    }
  }

  // 2. Budget verification
  if (budget.isOverBudget) {
    warnings.push({
      id: 'budget-overflow',
      severity: 'warning',
      category: 'budget',
      title: 'Estimated Trip Cost Exceeds Budget',
      message: `The total estimated cost (${budget.currency} ${budget.totalEstimatedCost.toLocaleString()}) exceeds your budget limit of ${budget.currency} ${budget.userBudget.toLocaleString()} by ${budget.currency} ${Math.abs(budget.remainingBudget).toLocaleString()}.`,
      suggestedFix: 'Consider adjusting accommodation grade, substituting premium ticketed sights, or increasing total budget.'
    });
  }

  // 3. Activity-level checks per day
  const seenActivityNames = new Map<string, number>();

  itinerary.forEach((day) => {
    const dayActs = [...day.activities].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    // Density check
    const maxRecommended = preferences.activityIntensity === 'Relaxed' ? 4 : preferences.activityIntensity === 'Balanced' ? 6 : 8;
    if (dayActs.length > maxRecommended) {
      warnings.push({
        id: `density-day-${day.dayNumber}`,
        severity: 'warning',
        category: 'density',
        dayNumber: day.dayNumber,
        title: `High Activity Density (Day ${day.dayNumber})`,
        message: `Day ${day.dayNumber} has ${dayActs.length} scheduled stops, exceeding the recommended limit of ${maxRecommended} for a ${preferences.activityIntensity} trip pace.`,
        suggestedFix: 'Remove or reschedule one or two non-essential stops to avoid traveler fatigue.'
      });
    }

    // Sequence & Overlap & Travel time checks
    for (let i = 0; i < dayActs.length; i++) {
      const current = dayActs[i];
      const startMins = timeToMinutes(current.startTime);
      const endMins = timeToMinutes(current.endTime);

      // Duplicate check across trip
      const nameKey = current.name.trim().toLowerCase();
      if (seenActivityNames.has(nameKey) && current.category !== 'Food & Dining') {
        const prevDay = seenActivityNames.get(nameKey);
        warnings.push({
          id: `duplicate-${current.id}`,
          severity: 'info',
          category: 'sequence',
          dayNumber: day.dayNumber,
          activityId: current.id,
          title: `Duplicate Activity: ${current.name}`,
          message: `"${current.name}" is already scheduled on Day ${prevDay}.`,
          suggestedFix: 'Replace with an alternative local sight or unique regional experience.'
        });
      } else {
        seenActivityNames.set(nameKey, day.dayNumber);
      }

      // Duration sanity check
      const calculatedDuration = endMins - startMins;
      if (calculatedDuration <= 0) {
        warnings.push({
          id: `invalid-time-${current.id}`,
          severity: 'error',
          category: 'duration',
          dayNumber: day.dayNumber,
          activityId: current.id,
          title: `Invalid Times for ${current.name}`,
          message: `End time (${current.endTime}) cannot be prior to or equal to start time (${current.startTime}).`,
          suggestedFix: 'Adjust the start or end time manually.'
        });
      } else if (calculatedDuration < 15) {
        warnings.push({
          id: `short-duration-${current.id}`,
          severity: 'info',
          category: 'duration',
          dayNumber: day.dayNumber,
          activityId: current.id,
          title: `Very Short Duration: ${current.name}`,
          message: `Duration is only ${calculatedDuration} minutes, which may be insufficient for a typical visit.`,
          suggestedFix: 'Allocate at least 30 to 45 minutes.'
        });
      }

      // Daily start/end boundary checks
      if (startMins < preferredDailyStartMins) {
        warnings.push({
          id: `early-start-${current.id}`,
          severity: 'info',
          category: 'time_limit',
          dayNumber: day.dayNumber,
          activityId: current.id,
          title: `Early Morning Start: ${current.name}`,
          message: `Scheduled to start at ${current.startTime}, earlier than your preferred daily start time of ${preferences.preferredDailyStartTime}.`,
          suggestedFix: 'Shift morning itinerary start time forward.'
        });
      }

      if (endMins > preferredDailyEndMins) {
        warnings.push({
          id: `late-end-${current.id}`,
          severity: 'warning',
          category: 'time_limit',
          dayNumber: day.dayNumber,
          activityId: current.id,
          title: `Late Evening Activity: ${current.name}`,
          message: `Concludes at ${current.endTime}, which extends past your preferred daily cutoff of ${preferences.preferredDailyEndTime}.`,
          suggestedFix: 'Trim visit duration or move evening activity earlier.'
        });
      }

      // Verification check
      if (current.dataStatus === 'needs-verification') {
        warnings.push({
          id: `verify-needed-${current.id}`,
          severity: 'warning',
          category: 'verification',
          dayNumber: day.dayNumber,
          activityId: current.id,
          title: `Live Confirmation Needed: ${current.name}`,
          message: `Opening hours or seasonal admission for "${current.name}" require confirmation before visiting.`,
          suggestedFix: 'Check official venue website or ticket vendor before departure.'
        });
      }

      // Check with previous activity (Overlap & Transit time)
      if (i > 0) {
        const prev = dayActs[i - 1];
        const prevEndMins = timeToMinutes(prev.endTime);
        const travelMins = Number(current.travelTimeFromPreviousMinutes) || 0;

        // Direct overlap
        if (startMins < prevEndMins) {
          warnings.push({
            id: `overlap-${prev.id}-${current.id}`,
            severity: 'error',
            category: 'overlap',
            dayNumber: day.dayNumber,
            activityId: current.id,
            title: `Activity Overlap Detected`,
            message: `"${current.name}" starts at ${current.startTime}, which overlaps with "${prev.name}" ending at ${prev.endTime}.`,
            suggestedFix: `Shift "${current.name}" start time to at least ${minutesToTime(prevEndMins + travelMins)} to account for travel.`
          });
        }
        // Transit time deficit
        else if (startMins - prevEndMins < travelMins) {
          const availableGap = startMins - prevEndMins;
          warnings.push({
            id: `transit-tight-${prev.id}-${current.id}`,
            severity: 'warning',
            category: 'travel_time',
            dayNumber: day.dayNumber,
            activityId: current.id,
            title: `Insufficient Travel Time`,
            message: `Only ${availableGap} minutes scheduled between "${prev.name}" and "${current.name}", but estimated transit is ${travelMins} minutes.`,
            suggestedFix: `Add a buffer of ${travelMins - availableGap} minutes to ensure realistic transit.`
          });
        }
      }
    }
  });

  const hasErrors = warnings.some(w => w.severity === 'error');
  return {
    isValid: !hasErrors,
    warnings
  };
}
