import { MAP_ICONS } from '@/constants/map-icons';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';

import { MapMarkerEntityType } from './destination-helpers';

type MapIconKey = keyof typeof MAP_ICONS;

// ---------------------------------------------------------------------------
// POI Marker Shape Path Definitions (viewBox="-24 -48 48 48")
// ---------------------------------------------------------------------------

export const POI_MARKER_PATHS: Record<string, string> = {
  MAP_PIN:
    'M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z',

  SHIELD:
    'M18.8-31.8c.3-3.4 1.3-6.6 3.2-9.5l-7-6.7c-2.2 1.8-4.8 2.8-7.6 3-2.6.2-5.1-.2-7.5-1.4-2.4 1.1-4.9 1.6-7.5 1.4-2.7-.2-5.1-1.1-7.3-2.7l-7.1 6.7c1.7 2.9 2.7 6 2.9 9.2.1 1.5-.3 3.5-1.3 6.1-.5 1.5-.9 2.7-1.2 3.8-.2 1-.4 1.9-.5 2.5 0 2.8.8 5.3 2.5 7.5 1.3 1.6 3.5 3.4 6.5 5.4 3.3 1.6 5.8 2.6 7.6 3.1.5.2 1 .4 1.5.7l1.5.6c1.2.7 2 1.4 2.4 2.1.5-.8 1.3-1.5 2.4-2.1.7-.3 1.3-.5 1.9-.8.5-.2.9-.4 1.1-.5.4-.1.9-.3 1.5-.6.6-.2 1.3-.5 2.2-.8 1.7-.6 3-1.1 3.8-1.6 2.9-2 5.1-3.8 6.4-5.3 1.7-2.2 2.6-4.8 2.5-7.6-.1-1.3-.7-3.3-1.7-6.1-.9-2.8-1.3-4.9-1.2-6.4z',

  ROUTE:
    'M24-28.3c-.2-13.3-7.9-18.5-8.3-18.7l-1.2-.8-1.2.8c-2 1.4-4.1 2-6.1 2-3.4 0-5.8-1.9-5.9-1.9l-1.3-1.1-1.3 1.1c-.1.1-2.5 1.9-5.9 1.9-2.1 0-4.1-.7-6.1-2l-1.2-.8-1.2.8c-.8.6-8 5.9-8.2 18.7-.2 1.1 2.9 22.2 23.9 28.3 22.9-6.7 24.1-26.9 24-28.3z',

  SQUARE: 'M-24-48h48v48h-48z',

  SQUARE_ROUNDED:
    'M24-8c0 4.4-3.6 8-8 8h-32c-4.4 0-8-3.6-8-8v-32c0-4.4 3.6-8 8-8h32c4.4 0 8 3.6 8 8v32z',
};

// ---------------------------------------------------------------------------
// Resolving the POI marker shape path
// ---------------------------------------------------------------------------

/**
 * Returns the SVG path data for the given marker shape.
 * Normalizes the shape string to uppercase. Falls back to MAP_PIN
 * when the shape is null, empty, or not found.
 */
export const getPoiMarkerShapePath = (markerShape?: string | null): string => {
  const normalized = (markerShape ?? '').trim().toUpperCase();
  if (!normalized) return POI_MARKER_PATHS['MAP_PIN'];
  return POI_MARKER_PATHS[normalized] ?? POI_MARKER_PATHS['MAP_PIN'];
};

// ---------------------------------------------------------------------------
// POI Marker Icon (map-icons font) Unicode mappings
// ---------------------------------------------------------------------------

/**
 * Maps a map-icon CSS class name to the Unicode character code
 * from the map-icons font.
 * The keys are the full CSS class name (e.g. "map-icon-hospital").
 * The values are the Unicode code points from map-icons.css.
 * Default: "map-icon-map-pin" (\ue85d)
 */
const MAP_ICONS_UNICODE: Record<string, string> = {
  'map-icon-map-pin': '\ue85d',
  'map-icon-point-of-interest': '\ue871',
  'map-icon-hospital': '\ue84b',
  'map-icon-police': '\ue872',
  'map-icon-fire-station': '\ue837',
  'map-icon-school': '\ue880',
  'map-icon-bank': '\ue80b',
  'map-icon-post-office': '\ue875',
  'map-icon-church': '\ue822',
  'map-icon-parking': '\ue86a',
  'map-icon-gas-station': '\ue840',
  'map-icon-airport': '\ue802',
  'map-icon-restaurant': '\ue87a',
  'map-icon-grocery-or-supermarket': '\ue843',
  'map-icon-pharmacy': '\ue86c',
  'map-icon-library': '\ue855',
  'map-icon-museum': '\ue864',
  'map-icon-stadium': '\ue892',
  'map-icon-courthouse': '\ue82a',
  'map-icon-city-hall': '\ue824',
  'map-icon-embassy': '\ue833',
  'map-icon-campground': '\ue819',
  'map-icon-park': '\ue869',
  'map-icon-lodging': '\ue85a',
  'map-icon-train-station': '\ue89d',
  'map-icon-bus-station': '\ue817',
  'map-icon-square-pin': '\ue88f',
  'map-icon-shield': '\ue883',
  'map-icon-route': '\ue87d',
  'map-icon-square': '\ue891',
  'map-icon-square-rounded': '\ue890',
  'map-icon-cafe': '\ue818',
  'map-icon-bar': '\ue80c',
  'map-icon-store': '\ue894',
  'map-icon-doctor': '\ue82e',
  'map-icon-dentist': '\ue82c',
  'map-icon-gym': '\ue844',
  'map-icon-spa': '\ue88e',
  'map-icon-pool': '\ue874',
  'map-icon-playground': '\ue870',
  'map-icon-golf': '\ue842',
  'map-icon-tennis': '\ue899',
  'map-icon-basketball': '\ue80e',
  'map-icon-baseball': '\ue80d',
  'map-icon-football-stadium': '\ue838',
  'map-icon-university': '\ue8a2',
  'map-icon-college': '\ue826',
  'map-icon-high-school': '\ue849',
  'map-icon-elementary-school': '\ue832',
  'map-icon-preschool': '\ue876',
  'map-icon-casino': '\ue81b',
  'map-icon-theater': '\ue89b',
  'map-icon-cinema': '\ue823',
  'map-icon-night-club': '\ue867',
  'map-icon-shopping-mall': '\ue887',
  'map-icon-department-store': '\ue82d',
  'map-icon-clothing-store': '\ue825',
  'map-icon-hardware-store': '\ue846',
  'map-icon-electronics-store': '\ue831',
  'map-icon-pet-store': '\ue86d',
  'map-icon-bakery': '\ue80a',
  'map-icon-butcher': '\ue816',
  'map-icon-florist': '\ue836',
  'map-icon-book-store': '\ue813',
  'map-icon-convenience-store': '\ue828',
  'map-icon-liquor-store': '\ue858',
  'map-icon-car-repair': '\ue81a',
  'map-icon-car-wash': '\ue81d',
  'map-icon-gas-station-garage': '\ue83f',
  'map-icon-plumber': '\ue873',
  'map-icon-electrician': '\ue830',
  'map-icon-locksmith': '\ue859',
  'map-icon-laundry': '\ue854',
  'map-icon-taxi-stand': '\ue897',
  'map-icon-transit-station': '\ue89e',
  'map-icon-subway-station': '\ue895',
  'map-icon-light-rail': '\ue857',
  'map-icon-ferry': '\ue835',
  'map-icon-marina': '\ue85c',
  'map-icon-harbor': '\ue845',
  'map-icon-lighthouse': '\ue856',
  'map-icon-monument': '\ue862',
  'map-icon-observatory': '\ue868',
  'map-icon-zoo': '\ue8a6',
  'map-icon-aquarium': '\ue805',
  'map-icon-amusement-park': '\ue803',
  'map-icon-water-park': '\ue8a3',
  'map-icon-attraction': '\ue807',
  'map-icon-beach': '\ue80f',
  'map-icon-lake': '\ue853',
  'map-icon-river': '\ue87c',
  'map-icon-mountain': '\ue863',
  'map-icon-skiing': '\ue889',
  'map-icon-skating': '\ue888',
  'map-icon-snowmobile': '\ue88c',
  'map-icon-snow': '\ue88b',
  'map-icon-sledding': '\ue88a',
  'map-icon-ice-fishing': '\ue84e',
  'map-icon-fishing': '\ue834',
  'map-icon-hunting': '\ue84d',
  'map-icon-hiking': '\ue84a',
  'map-icon-biking': '\ue811',
  'map-icon-walking': '\ue8a1',
  'map-icon-running': '\ue87f',
  'map-icon-horseback-riding': '\ue84c',
  'map-icon-boating': '\ue812',
  'map-icon-surfing': '\ue896',
  'map-icon-swimming': '\ue8a0',
  'map-icon-diving': '\ue82f',
  'map-icon-sailing': '\ue881',
  'map-icon-kayaking': '\ue852',
  'map-icon-rafting': '\ue878',
  'map-icon-camping': '\ue81c',
  'map-icon-tent': '\ue898',
  'map-icon-rv-park': '\ue87e',
  'map-icon-picnic': '\ue86e',
  'map-icon-bbq': '\ue810',
  'map-icon-fire-pit': '\ue839',
  'map-icon-toilet': '\ue89c',
  'map-icon-shower': '\ue886',
  'map-icon-water-fountain': '\ue8a4',
  'map-icon-bench': '\ue815',
  'map-icon-table': '\ue8a5',
  'map-icon-trash': '\ue89f',
  'map-icon-recycling': '\ue879',
  'map-icon-wheelchair': '\ue8a7',
  'map-icon-elevator': '\ue82b',
  'map-icon-escalator': '\ue8a8',
  'map-icon-stairs': '\ue893',
  'map-icon-ramp': '\ue87b',
  'map-icon-bridge': '\ue814',
  'map-icon-building': '\ue83c',
  'map-icon-house': '\ue83d',
  'map-icon-apartment': '\ue804',
  'map-icon-condo': '\ue827',
  'map-icon-cabin': '\ue820',
  'map-icon-farm': '\ue83a',
  'map-icon-barn': '\ue808',
  'map-icon-silo': '\ue88d',
  'map-icon-windmill': '\ue8aa',
  'map-icon-well': '\ue8ab',
  'map-icon-water-tower': '\ue8ac',
  'map-icon-cell-tower': '\ue821',
  'map-icon-satellite': '\ue882',
  'map-icon-antenna': '\ue806',
  'map-icon-radio-station': '\ue877',
  'map-icon-tv-station': '\ue8ad',
  'map-icon-news': '\ue866',
  'map-icon-cemetery': '\ue81e',
  'map-icon-crematorium': '\ue829',
  'map-icon-funeral-home': '\ue83c',
  'map-icon-mortuary': '\ue865',
  'map-icon-cross': '\ue84f',
  'map-icon-synagogue': '\ue8af',
  'map-icon-temple': '\ue8b0',
  'map-icon-shrine': '\ue885',
  'map-icon-pagoda': '\ue86b',
  'map-icon-minaret': '\ue85e',
  'map-icon-candle': '\ue81f',
  'map-icon-lantern': '\ue8b2',
  'map-icon-prayer': '\ue86f',
  'map-icon-meditation': '\ue85b',
  'map-icon-yoga': '\ue8b3',
  'map-icon-massage': '\ue860',
  'map-icon-acupuncture': '\ue800',
  'map-icon-aromatherapy': '\ue801',
  'map-icon-chiropractor': '\ue848',
  'map-icon-veterinarian': '\ue8b4',
  'map-icon-animal-shelter': '\ue84f',
  'map-icon-pet-grooming': '\ue86d',
  'map-icon-kennel': '\ue850',
};

/**
 * Resolves the Unicode character for a POI marker icon.
 *
 * @param poiImage - The icon CSS class name (e.g. "map-icon-hospital")
 *                   or a raw icon key (e.g. "hospital").
 * @returns The Unicode character string for the icon, or the default
 *          map-pin character ("\ue85d") as fallback.
 */
export const getPoiMarkerIconChar = (poiImage?: string | null): string => {
  const raw = (poiImage ?? '').trim();

  if (!raw) return MAP_ICONS_UNICODE['map-icon-map-pin'];

  // Direct lookup with full class name
  if (MAP_ICONS_UNICODE[raw]) return MAP_ICONS_UNICODE[raw];

  // Try with "map-icon-" prefix
  const withPrefix = `map-icon-${raw.toLowerCase().replace(/^map-icon-/, '')}`;
  if (MAP_ICONS_UNICODE[withPrefix]) return MAP_ICONS_UNICODE[withPrefix];

  // Try stripping "map-icon-" prefix and re-adding
  const stripped = raw.toLowerCase().replace(/^map-icon-/, '');
  const rePrefixed = `map-icon-${stripped}`;
  if (MAP_ICONS_UNICODE[rePrefixed]) return MAP_ICONS_UNICODE[rePrefixed];

  return MAP_ICONS_UNICODE['map-icon-map-pin'];
};

// ---------------------------------------------------------------------------
// Non-POI (legacy) marker icon resolution
// ---------------------------------------------------------------------------

const normalizeMarkerToken = (token?: string | null) =>
  token?.trim().toLowerCase().replace(/[\s-]+/g, '') ?? '';

export const resolveMapMarkerIconKey = (
  pin: Pick<MapMakerInfoData, 'ImagePath' | 'PoiImage' | 'Type'>,
): MapIconKey => {
  // Prefer PoiImage (new field) over ImagePath (null for POIs after backend fix)
  const resolvedPath = pin.PoiImage || pin.ImagePath;

  // For POI markers, resolveMapMarkerIconKey is not used for rendering
  // (they use the SVG shape + map-icons font system). Return 'flag' as
  // a sensible fallback only when the legacy PNG system is still applied.
  if (pin.Type === MapMarkerEntityType.Poi) {
    if (resolvedPath?.toLowerCase().startsWith('map-icon-')) {
      return 'flag';
    }
  }

  const normalizedToken = normalizeMarkerToken(resolvedPath);

  if (normalizedToken && MAP_ICONS[normalizedToken]) {
    return normalizedToken as MapIconKey;
  }

  switch (pin.Type) {
    case MapMarkerEntityType.Unit:
      return 'truck';
    case MapMarkerEntityType.Station:
      return 'station';
    case MapMarkerEntityType.Personnel:
      return 'person';
    case MapMarkerEntityType.Poi:
      return 'flag';
    case MapMarkerEntityType.Call:
    default:
      return 'call';
  }
};

// ---------------------------------------------------------------------------
// Marker helper utilities
// ---------------------------------------------------------------------------

export const hasValidMapCoordinates = (
  pin: Pick<MapMakerInfoData, 'Latitude' | 'Longitude'>,
) => {
  return (
    Number.isFinite(pin.Latitude) &&
    Number.isFinite(pin.Longitude) &&
    !(pin.Latitude === 0 && pin.Longitude === 0)
  );
};

export const getMapMarkerColor = (
  pin: Pick<MapMakerInfoData, 'Color' | 'Type'>,
) => {
  if (pin.Color) {
    return pin.Color;
  }

  switch (pin.Type) {
    case MapMarkerEntityType.Poi:
      return '#2563eb';
    case MapMarkerEntityType.Station:
      return '#2563eb';
    case MapMarkerEntityType.Unit:
      return '#16a34a';
    case MapMarkerEntityType.Personnel:
      return '#7c3aed';
    case MapMarkerEntityType.Call:
    default:
      return '#f97316';
  }
};

export const getMapPinSummary = (
  pin: Pick<
    MapMakerInfoData,
    'Address' | 'Note' | 'PoiTypeName' | 'InfoWindowContent'
  >,
) => {
  return pin.Address || pin.Note || pin.PoiTypeName || pin.InfoWindowContent || '';
};
