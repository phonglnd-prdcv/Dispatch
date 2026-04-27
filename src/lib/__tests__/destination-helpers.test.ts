import { describe, expect, it } from '@jest/globals';

import {
  CustomStateDetailType,
  DestinationEntityType,
  MapMarkerEntityType,
  getDefaultDestinationTab,
  getDestinationCapabilities,
  getDestinationSelectionTypeFromValue,
  getDestinationSelectionTypeValue,
  getEnabledDestinationTabs,
  getSelectedDestinationId,
  isCallMarker,
  isPoiDestinationType,
} from '../destination-helpers';

describe('destination-helpers', () => {
  it('returns the correct capabilities for POI-enabled status details', () => {
    expect(getDestinationCapabilities(CustomStateDetailType.CallsAndPois)).toEqual({
      showCalls: true,
      showStations: false,
      showPois: true,
      supportsDestination: true,
    });
  });

  it('derives enabled tabs and default tabs from detail values', () => {
    expect(getEnabledDestinationTabs(CustomStateDetailType.CallsStationsAndPois)).toEqual(['calls', 'stations', 'pois']);
    expect(getDefaultDestinationTab(CustomStateDetailType.Pois)).toBe('pois');
    expect(getDefaultDestinationTab(undefined)).toBe('calls');
  });

  it('maps POI destination types to and from API values', () => {
    expect(getDestinationSelectionTypeValue('poi')).toBe(DestinationEntityType.Poi);
    expect(getDestinationSelectionTypeFromValue(DestinationEntityType.Poi)).toBe('poi');
    expect(isPoiDestinationType(DestinationEntityType.Poi)).toBe(true);
  });

  it('resolves selected POI destination ids', () => {
    expect(
      getSelectedDestinationId({
        selectedDestinationType: 'poi',
        selectedCall: null,
        selectedStation: null,
        selectedPoi: {
          PoiId: 42,
        } as any,
      })
    ).toBe('42');
  });

  it('recognizes call markers from marker type or image token', () => {
    expect(isCallMarker(MapMarkerEntityType.Call)).toBe(true);
    expect(isCallMarker(undefined, 'call')).toBe(true);
  });
});
