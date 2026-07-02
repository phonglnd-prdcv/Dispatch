import { type StatusesResultData } from '@/models/v4/statuses/statusesResultData';
import { type UnitTypeStatusResultData } from '@/models/v4/statuses/unitTypeStatusResultData';
import { type UnitInfoResultData } from '@/models/v4/units/unitInfoResultData';

/**
 * Resolves the correct selectable status options for a unit.
 *
 * A unit's status set is authoritatively identified by its `CustomStatusSetId` (the department's
 * custom-state-set id) or, secondarily, its unit-type name. The grouped `GetAllUnitStatuses`
 * response (`UnitTypeStatusResultData[]`) carries `StatusId` (== the set id) and `UnitType` (== the
 * type name) per group, so matching by id here is reliable — unlike the server's per-unit endpoint
 * which resolves the type by name and silently falls back to the default statuses on a mismatch.
 *
 * Only the statuses attached to the unit's type are returned. Falls back to the server-provided
 * scoped list, then the default group, when no custom-set group matches (i.e. the unit type has no
 * custom statuses).
 */
export function resolveUnitStatusOptions(
  unit: Pick<UnitInfoResultData, 'CustomStatusSetId' | 'Type'> | null | undefined,
  groups: UnitTypeStatusResultData[] | undefined,
  fallback: StatusesResultData[] = []
): StatusesResultData[] {
  const list = groups ?? [];

  // 1. Exact custom-status-set match by id (most reliable).
  if (unit?.CustomStatusSetId) {
    const byId = list.find((group) => !!group.StatusId && group.StatusId === unit.CustomStatusSetId);
    if (byId?.Statuses?.length) return byId.Statuses;
  }

  // 2. Match by unit-type name.
  if (unit?.Type) {
    const byType = list.find((group) => !!group.UnitType && group.UnitType === unit.Type);
    if (byType?.Statuses?.length) return byType.Statuses;
  }

  // 3. Server-provided per-unit list (already scoped for units without a custom set).
  if (fallback.length) return fallback;

  // 4. Department default unit statuses (the "0" group).
  const defaultGroup = list.find((group) => group.UnitType === '0');
  return defaultGroup?.Statuses ?? [];
}
