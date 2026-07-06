import { type DispatchedEventResultData } from '@/models/v4/calls/dispatchedEventResultData';

/**
 * Dispatch-type helpers shared by the dispatch-console panels (units, personnel,
 * and the combined resources panel). A single source of truth for how a call's
 * DispatchedEvent entries are classified as unit vs. personnel dispatches, since
 * the API returns these type discriminators in several casings/abbreviations.
 */

// The set of `Type` values the API uses for a personnel/user dispatch.
export const PERSONNEL_DISPATCH_TYPES = new Set(['Personnel', 'personnel', 'p', 'P', 'User', 'user']);

// True when the dispatch entry targets a unit.
export const isUnitDispatch = (d: DispatchedEventResultData) => d.Type === 'Unit' || d.Type === 'u';

// True when the dispatch entry targets a person/user.
export const isPersonnelDispatch = (d: DispatchedEventResultData) => PERSONNEL_DISPATCH_TYPES.has(d.Type);
