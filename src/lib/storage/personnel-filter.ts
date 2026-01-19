import { getItem, setItem } from './index';

const PERSONNEL_FILTER_KEY = 'PERSONNEL_FILTER_OPTIONS';

/**
 * Load saved personnel filter options from storage
 * @returns Array of selected filter IDs
 */
export async function loadPersonnelFilterOptions(): Promise<string[]> {
  try {
    const savedFilters = getItem<string[]>(PERSONNEL_FILTER_KEY);
    return savedFilters || [];
  } catch (error) {
    console.error('Failed to load personnel filter options:', error);
    return [];
  }
}

/**
 * Save personnel filter options to storage
 * @param filters Array of selected filter IDs to save
 */
export async function savePersonnelFilterOptions(filters: string[]): Promise<void> {
  try {
    await setItem(PERSONNEL_FILTER_KEY, filters);
  } catch (error) {
    console.error('Failed to save personnel filter options:', error);
  }
}
