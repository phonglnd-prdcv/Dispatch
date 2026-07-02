import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';
import { type UnitInfoResultData } from '@/models/v4/units/unitInfoResultData';

/**
 * Whether a unit is currently available for dispatch. A unit counts as available when its current
 * status text/id is "Available", or when it has no known status yet (mirrors the Units panel's
 * available-count heuristic).
 */
export function isUnitAvailable(unit: UnitInfoResultData): boolean {
  const status = (unit.CurrentStatus || '').trim().toLowerCase();
  const statusId = (unit.CurrentStatusId ?? '').toString().trim().toLowerCase();
  if (status || statusId) {
    return status === 'available' || statusId === 'available';
  }
  return true; // no status known yet — treat as available
}

/** Whether a person's current status is "Available". */
export function isPersonnelAvailable(person: PersonnelInfoResultData): boolean {
  return (person.Status || '').trim().toLowerCase() === 'available';
}
