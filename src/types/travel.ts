export type DataStatus = 
  | 'verified'
  | 'estimated'
  | 'user-provided'
  | 'ai-suggestion'
  | 'needs-verification'
  | 'VERIFIED CURRENT DATA'
  | 'USER-PROVIDED DATA'
  | 'ESTIMATED DATA'
  | 'AI-GENERATED SUGGESTION'
  | 'DEMO DATA';

export type NormalizedDataStatus = 
  | 'VERIFIED CURRENT DATA'
  | 'USER-PROVIDED DATA'
  | 'ESTIMATED DATA'
  | 'AI-GENERATED SUGGESTION'
  | 'DEMO DATA';

export interface SourceInfo {
  source: string;
  sourceType: 'external_place_api' | 'weather_api' | 'transit_routing' | 'user_input' | 'ai_estimate' | 'deterministic_calc' | 'curated_demo';
  status: NormalizedDataStatus;
  lastChecked?: string;
  verificationDetails?: string;
}

export type TravelerType = 'Solo' | 'Couple' | 'Family' | 'Friends' | 'Business';

export type TransportationType = 'Train' | 'Bus' | 'Flight' | 'Car' | 'Mixed';

export type ActivityIntensity = 'Relaxed' | 'Balanced' | 'Packed';

export type ActivityCategory = 
  | 'Sightseeing'
  | 'Culture & History'
  | 'Food & Dining'
  | 'Nature & Parks'
  | 'Shopping'
  | 'Adventure'
  | 'Relaxation'
  | 'Transit'
  | 'Accommodation'
  | 'Entertainment';

export interface Activity {
  id: string;
  dayNumber: number;
  name: string;
  category: ActivityCategory;
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
  durationMinutes: number;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  estimatedCost: number;
  currency: string;
  travelTimeFromPreviousMinutes: number;
  travelDistanceKm?: number;
  travelMode?: string;
  dataStatus: DataStatus;
  notes?: string;
  selectionReason: string;
  openingHours?: string;
  bookingRequired?: boolean;
  isDisrupted?: boolean;
  disruptionNote?: string;
  sourceAttribution?: string;
  sourceInfo?: SourceInfo;
  revisionChangeTag?: 'Preserved' | 'Moved' | 'Removed' | 'Added';
}

export interface DayItinerary {
  dayNumber: number;
  date: string;
  theme: string;
  summary: string;
  activities: Activity[];
}

export interface TripPreferences {
  startingLocation: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelersCount: number;
  travelerType: TravelerType;
  totalBudget: number;
  currency: string;
  preferredTransportation: TransportationType;
  accommodationPreference: string;
  interests: string[];
  activityIntensity: ActivityIntensity;
  dietaryPreferences: string;
  accessibilityRequirements: string;
  specialConstraints: string;
  preferredDailyStartTime: string; // "09:00"
  preferredDailyEndTime: string;   // "21:00"
}

export interface ValidationWarning {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 
    | 'overlap'
    | 'time_limit'
    | 'duration'
    | 'travel_time'
    | 'budget'
    | 'density'
    | 'dates'
    | 'verification'
    | 'sequence';
  dayNumber?: number;
  activityId?: string;
  title: string;
  message: string;
  suggestedFix?: string;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
}

export interface BudgetBreakdown {
  transportation: number;
  localTransport?: number;
  accommodation: number;
  activities: number;
  food: number;
  miscellaneous: number;
  totalEstimatedCost: number;
  userBudget: number;
  remainingBudget: number;
  isOverBudget: boolean;
  currency: string;
}

export type DisruptionType = 
  | 'delay'
  | 'cancellation'
  | 'attraction_closure'
  | 'severe_weather'
  | 'hotel_issue'
  | 'transport_change'
  | 'user_schedule_change'
  | 'custom'
  | 'train_delay'
  | 'flight_delay'
  | 'flight_cancellation'
  | 'bus_delay'
  | 'weather_disruption'
  | 'schedule_change'
  | 'user_defined';

export interface DisruptionReport {
  id: string;
  type: DisruptionType;
  title: string;
  description: string;
  reportedAt: string;
  affectedDay: number;
  delayMinutes?: number;
  affectedActivityIds: string[];
  severity: 'minor' | 'moderate' | 'severe';
  requestedMode?: 'local_repair' | 'full_replan';
}

export interface ItineraryRevision {
  id: string;
  timestamp: string;
  disruption: DisruptionReport;
  replanMode: 'local_repair' | 'full_replan';
  replanReason?: string;
  consequencesSummary?: string;
  alternativeOptions?: {
    title: string;
    description: string;
    impact: string;
  }[];
  originalActivities: Activity[];
  revisedActivities: Activity[];
  removedActivities: Activity[];
  movedActivities: {
    activity: Activity;
    oldDay: number;
    newDay: number;
    oldTime: string;
    newTime: string;
  }[];
  addedActivities: Activity[];
  changedTimeActivities: {
    activity: Activity;
    oldTime: string;
    newTime: string;
  }[];
  costDifference: number;
  whyChangedExplanations: {
    title: string;
    reason: string;
  }[];
  preservedRatioPercent: number;
  originalItinerarySnapshot?: DayItinerary[];
  status?: 'pending_review' | 'accepted' | 'rejected';
}

export type DisruptionRevision = ItineraryRevision;

export interface WhatIfScenario {
  id: string;
  title: string;
  query: string;
  scenarioType: 
    | 'train_delay'
    | 'budget_reduction'
    | 'relaxed_pace'
    | 'attraction_closure'
    | 'add_day'
    | 'transit_limit'
    | 'custom';
  createdAt: string;
  simulatedItinerary: DayItinerary[];
  costDifference: number;
  impactSummary: string;
  scheduleChangesCount: number;
  preservedRatioPercent: number;
  validation: ValidationResult;
  diffItems: {
    activityName: string;
    changeType: 'Preserved' | 'Moved' | 'Removed' | 'Added';
    detail: string;
  }[];
}

export interface FactualHealthCheckItem {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'alert' | 'info';
  detail: string;
}

export interface PlanHealthMetrics {
  hasTimeConflicts: boolean;
  isBudgetCompliant: boolean;
  hasRestBuffers: boolean;
  hasExcessiveTransit: boolean;
  verifiedDataCount: number;
  estimatedDataCount: number;
  userProvidedDataCount: number;
  needsConfirmationCount: number;
  checklist: FactualHealthCheckItem[];
}

export interface AssistantActionProposal {
  id: string;
  type: 'move_activity' | 'reduce_budget' | 'add_day' | 'swap_activity' | 'retime_day';
  summary: string;
  reason: string;
  affectedActivityNames: string[];
  itinerarySnapshot?: DayItinerary[];
  proposedItinerary: DayItinerary[];
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionSuggestion?: {
    type: 'add_activity' | 'move_activity' | 'remove_activity' | 'adjust_budget';
    payload?: any;
    label?: string;
  };
  proposal?: AssistantActionProposal;
}

export interface Trip {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  isDemo?: boolean;
  preferences: TripPreferences;
  itinerary: DayItinerary[];
  budget: BudgetBreakdown;
  validation: {
    isValid: boolean;
    warnings: ValidationWarning[];
  };
  disruptions: DisruptionReport[];
  revisions: ItineraryRevision[];
  activeRevisionId?: string;
  whatIfScenarios?: WhatIfScenario[];
  activeWhatIfId?: string | null;
  chatHistory: ChatMessage[];
}
