import { describe, expect, it } from '@jest/globals';

import { getPoiDestinationOptionLabel, getPoiPrimaryDisplayText, getPoiSearchValue, getPoiSelectionLabel } from '../poi-display';

describe('poi-display', () => {
  it('prefers name then address then note then type for primary display', () => {
    expect(getPoiPrimaryDisplayText({ Name: 'Mercy Hospital', Address: '123 Main St', Note: 'ER entrance', PoiTypeName: 'Hospital' } as any)).toBe('Mercy Hospital');
    expect(getPoiPrimaryDisplayText({ Name: '', Address: '123 Main St', Note: 'ER entrance', PoiTypeName: 'Hospital' } as any)).toBe('123 Main St');
    expect(getPoiPrimaryDisplayText({ Name: '', Address: '', Note: 'ER entrance', PoiTypeName: 'Hospital' } as any)).toBe('ER entrance');
    expect(getPoiPrimaryDisplayText({ Name: '', Address: '', Note: '', PoiTypeName: 'Hospital' } as any)).toBe('Hospital');
  });

  it('builds selection labels from name and address when available', () => {
    expect(getPoiSelectionLabel({ Name: 'Mercy Hospital', Address: '123 Main St', Note: '', PoiTypeName: 'Hospital' } as any)).toBe('Mercy Hospital - 123 Main St');
    expect(getPoiSelectionLabel({ Name: '', Address: '123 Main St', Note: '', PoiTypeName: 'Hospital' } as any)).toBe('123 Main St');
  });

  it('builds destination option labels with the type name prefix', () => {
    expect(getPoiDestinationOptionLabel({ Name: 'Mercy Hospital', Address: '123 Main St', Note: '', PoiTypeName: 'Hospital' } as any)).toBe('Hospital: Mercy Hospital - 123 Main St');
  });

  it('builds a searchable lower-case value from all visible fields', () => {
    expect(getPoiSearchValue({ Name: 'Mercy Hospital', Address: '123 Main St', Note: 'ER Entrance', PoiTypeName: 'Hospital' } as any)).toBe('mercy hospital 123 main st er entrance hospital');
  });
});
