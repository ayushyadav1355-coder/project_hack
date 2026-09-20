import { Activity, BudgetBreakdown, TripPreferences } from '../types/travel';

/**
 * Deterministic Budget Engine.
 * Does not rely on LLM for arithmetic.
 * Correctly scales baseline cost components across international currencies (USD, INR, JPY, EUR, GBP, etc.).
 */
export function calculateBudget(
  activities: Activity[],
  preferences: TripPreferences
): BudgetBreakdown {
  const currency = (preferences.currency || 'USD').toUpperCase();

  // Baseline currency multipliers relative to 1 USD
  let rateMultiplier = 1;
  if (currency === 'INR') {
    rateMultiplier = 80;
  } else if (currency === 'JPY') {
    rateMultiplier = 150;
  } else if (currency === 'EUR') {
    rateMultiplier = 0.92;
  } else if (currency === 'GBP') {
    rateMultiplier = 0.79;
  } else if (currency === 'CHF') {
    rateMultiplier = 0.90;
  } else if (currency === 'CAD') {
    rateMultiplier = 1.35;
  } else if (currency === 'AUD') {
    rateMultiplier = 1.50;
  }

  // 1. Activities direct cost sum (uses actual line item prices in the trip's currency)
  const activitiesTotal = activities.reduce((sum, act) => sum + (Number(act.estimatedCost) || 0), 0);

  // 2. Days calculation
  const start = new Date(preferences.startDate);
  const end = new Date(preferences.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const nights = Math.max(1, days - 1);
  const travelers = Math.max(1, preferences.travelersCount || 1);

  // 3. Accommodation estimation based on preference (in USD baseline * multiplier)
  let nightlyRatePerRoomUSD = 120; // default standard
  const lowerPref = (preferences.accommodationPreference || '').toLowerCase();
  if (lowerPref.includes('hostel') || lowerPref.includes('budget') || lowerPref.includes('guest house')) {
    nightlyRatePerRoomUSD = 40;
  } else if (lowerPref.includes('luxury') || lowerPref.includes('5 star') || lowerPref.includes('resort') || lowerPref.includes('palace')) {
    nightlyRatePerRoomUSD = 280;
  } else if (lowerPref.includes('boutique') || lowerPref.includes('4 star') || lowerPref.includes('haveli') || lowerPref.includes('airbnb')) {
    nightlyRatePerRoomUSD = 110;
  }
  const roomsNeeded = Math.ceil(travelers / 2);
  const accommodationTotal = Math.round(nights * (nightlyRatePerRoomUSD * rateMultiplier) * roomsNeeded);

  // 4. Transportation estimation based on preferred transportation
  let transportBasePerPersonUSD = 60;
  const transportMode = preferences.preferredTransportation;
  if (transportMode === 'Flight') {
    transportBasePerPersonUSD = 220;
  } else if (transportMode === 'Train') {
    transportBasePerPersonUSD = 50;
  } else if (transportMode === 'Bus') {
    transportBasePerPersonUSD = 25;
  } else if (transportMode === 'Car') {
    transportBasePerPersonUSD = 90;
  } else {
    transportBasePerPersonUSD = 70;
  }

  // Daily intra-city local transit per person per day
  const dailyLocalTransitUSD = 12;
  const transportationIntercity = Math.round(transportBasePerPersonUSD * rateMultiplier * travelers);
  const localTransportTotal = Math.round(dailyLocalTransitUSD * rateMultiplier * travelers * days);

  // 5. Food & Dining estimation
  let dailyFoodPerPersonUSD = 40;
  if (preferences.interests.includes('Food') || lowerPref.includes('luxury')) {
    dailyFoodPerPersonUSD = 65;
  } else if (preferences.travelerType === 'Solo' && (lowerPref.includes('budget') || lowerPref.includes('hostel'))) {
    dailyFoodPerPersonUSD = 22;
  }
  const foodTotal = Math.round(dailyFoodPerPersonUSD * rateMultiplier * travelers * days);

  // 6. Miscellaneous & contingency (approx 8% of core expenses)
  const subtotal = activitiesTotal + accommodationTotal + transportationIntercity + localTransportTotal + foodTotal;
  const miscellaneous = Math.round(subtotal * 0.08);

  // 7. Total estimated cost
  const totalEstimatedCost = Math.round(subtotal + miscellaneous);
  const userBudget = Number(preferences.totalBudget) || 0;
  const remainingBudget = userBudget - totalEstimatedCost;
  const isOverBudget = userBudget > 0 && remainingBudget < 0;

  return {
    transportation: transportationIntercity,
    localTransport: localTransportTotal,
    accommodation: accommodationTotal,
    activities: Math.round(activitiesTotal),
    food: foodTotal,
    miscellaneous,
    totalEstimatedCost,
    userBudget,
    remainingBudget,
    isOverBudget,
    currency: preferences.currency || 'USD'
  };
}
