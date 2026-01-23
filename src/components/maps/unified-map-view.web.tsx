import { type Feature, type FeatureCollection, type GeoJsonProperties, type Geometry } from 'geojson';
import mapboxgl from 'mapbox-gl';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getMapDataAndMarkers } from '@/api/mapping/mapping';
import { getMapIconWebUrl, MAP_ICONS } from '@/constants/map-icons';
import { Env } from '@/lib/env';
import { logger } from '@/lib/logging';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';
import { type GetMapLayersData } from '@/models/v4/mapping/getMapLayersResultData';
import { useLocationStore } from '@/stores/app/location-store';

// Mapbox GL CSS needs to be injected for web
const MAPBOX_GL_CSS_URL = 'https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.css';

type MapIconKey = keyof typeof MAP_ICONS;

interface UnifiedMapViewProps {
  /** Map pins to display */
  pins?: MapMakerInfoData[];
  /** Visible layers data to render */
  visibleLayers?: GetMapLayersData[];
  /** Whether to auto-fetch pins from API */
  autoFetchPins?: boolean;
  /** Callback when a pin is pressed */
  onPinPress?: (pin: MapMakerInfoData) => void;
  /** Callback when map is ready */
  onMapReady?: () => void;
  /** Whether to show user location */
  showUserLocation?: boolean;
  /** Whether to enable interaction */
  interactive?: boolean;
  /** Custom style overrides */
  style?: any;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Unified Map View component for Web using mapbox-gl-js.
 * Supports pins, layers, and user location.
 */
export const UnifiedMapView: React.FC<UnifiedMapViewProps> = ({
  pins: externalPins,
  visibleLayers = [],
  autoFetchPins = false,
  onPinPress,
  onMapReady,
  showUserLocation = true,
  interactive = true,
  style,
  testID = 'unified-map-view',
}) => {
  const { colorScheme } = useColorScheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const layerIdsRef = useRef<string[]>([]);
  const sourceIdsRef = useRef<string[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [internalPins, setInternalPins] = useState<MapMakerInfoData[]>([]);

  const location = useLocationStore((state) => ({
    latitude: state.latitude,
    longitude: state.longitude,
  }));

  // Use external pins if provided, otherwise use internal pins
  const mapPins = externalPins ?? internalPins;

  // Get map style based on current theme
  const getMapStyle = useCallback(() => {
    return colorScheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12';
  }, [colorScheme]);

  // Inject Mapbox GL CSS
  useEffect(() => {
    if (!document.getElementById('mapbox-gl-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-gl-css';
      link.href = MAPBOX_GL_CSS_URL;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    mapboxgl.accessToken = Env.MAPBOX_PUBKEY;

    const initialCenter: [number, number] = location.longitude && location.latitude ? [location.longitude, location.latitude] : [-98.5795, 39.8283];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(),
      center: initialCenter,
      zoom: location.latitude && location.longitude ? 12 : 3,
      interactive,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    if (showUserLocation) {
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserHeading: true,
        })
      );
    }

    map.current.on('load', () => {
      setIsMapReady(true);
      onMapReady?.();
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [getMapStyle, location.latitude, location.longitude, interactive, showUserLocation, onMapReady]);

  // Update map style when theme changes
  useEffect(() => {
    if (map.current && isMapReady) {
      map.current.setStyle(getMapStyle());
    }
  }, [colorScheme, getMapStyle, isMapReady]);

  // Helper function to calculate center from markers
  const calculateCenterFromMarkers = (markers: MapMakerInfoData[]): { lat: number; lon: number } | null => {
    const validMarkers = markers.filter((m) => m.Latitude && m.Longitude);
    if (validMarkers.length === 0) return null;

    const sumLat = validMarkers.reduce((sum, m) => sum + m.Latitude, 0);
    const sumLon = validMarkers.reduce((sum, m) => sum + m.Longitude, 0);

    return {
      lat: sumLat / validMarkers.length,
      lon: sumLon / validMarkers.length,
    };
  };

  // Auto-fetch pins if enabled
  useEffect(() => {
    if (!autoFetchPins) return;

    const abortController = new AbortController();

    const fetchMapDataAndMarkers = async () => {
      try {
        const mapDataAndMarkers = await getMapDataAndMarkers(abortController.signal);

        if (mapDataAndMarkers?.Data) {
          const markers = mapDataAndMarkers.Data.MapMakerInfos;
          setInternalPins(markers);

          // Center map on the data center if provided
          if (mapDataAndMarkers.Data.CenterLat && mapDataAndMarkers.Data.CenterLon && map.current) {
            const centerLat = parseFloat(mapDataAndMarkers.Data.CenterLat);
            const centerLon = parseFloat(mapDataAndMarkers.Data.CenterLon);
            const zoomLevel = mapDataAndMarkers.Data.ZoomLevel ? parseFloat(mapDataAndMarkers.Data.ZoomLevel) : 12;

            if (!isNaN(centerLat) && !isNaN(centerLon)) {
              map.current.flyTo({
                center: [centerLon, centerLat],
                zoom: zoomLevel,
                duration: 1500,
              });
            }
          } else if (markers.length > 0 && map.current) {
            // Fallback: Calculate center from markers if CenterLat/CenterLon not provided
            const center = calculateCenterFromMarkers(markers);
            if (center) {
              const zoomLevel = mapDataAndMarkers.Data.ZoomLevel ? parseFloat(mapDataAndMarkers.Data.ZoomLevel) : 12;
              map.current.flyTo({
                center: [center.lon, center.lat],
                zoom: isNaN(zoomLevel) ? 12 : zoomLevel,
                duration: 1500,
              });
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && (error.name === 'AbortError' || error.message === 'canceled')) {
          return;
        }

        logger.error({
          message: 'Failed to fetch map data',
          context: { error },
        });
      }
    };

    fetchMapDataAndMarkers();

    return () => {
      abortController.abort();
    };
  }, [autoFetchPins]);

  // Update markers when mapPins change
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    mapPins.forEach((pin) => {
      if (!pin.Latitude || !pin.Longitude) return;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.cursor = 'pointer';

      // Create marker icon
      const iconContainer = document.createElement('div');
      iconContainer.style.width = '32px';
      iconContainer.style.height = '32px';
      iconContainer.style.position = 'relative';

      const iconKey = (pin.ImagePath?.toLowerCase() || 'call') as MapIconKey;
      const iconData = MAP_ICONS[iconKey] || MAP_ICONS['call'];

      const img = document.createElement('img');
      const imgSrc = getMapIconWebUrl(iconData);
      img.src = imgSrc;
      img.style.width = '32px';
      img.style.height = '32px';
      img.style.objectFit = 'contain';
      img.alt = pin.Title;
      img.onerror = () => {
        // Fallback to call icon if image fails to load
        img.src = getMapIconWebUrl(MAP_ICONS['call']);
      };
      iconContainer.appendChild(img);

      el.appendChild(iconContainer);

      // Create title label
      const title = document.createElement('div');
      title.textContent = pin.Title;
      title.style.fontSize = '10px';
      title.style.fontWeight = '600';
      title.style.textAlign = 'center';
      title.style.marginTop = '2px';
      title.style.maxWidth = '80px';
      title.style.overflow = 'hidden';
      title.style.textOverflow = 'ellipsis';
      title.style.whiteSpace = 'nowrap';
      title.style.color = colorScheme === 'dark' ? '#ffffff' : '#000000';
      title.style.textShadow = colorScheme === 'dark' ? '0 0 2px rgba(0,0,0,0.8)' : '0 0 2px rgba(255,255,255,0.8)';
      el.appendChild(title);

      // Add click handler
      el.addEventListener('click', () => {
        onPinPress?.(pin);
      });

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600;">${pin.Title}</h3>
          ${pin.InfoWindowContent ? `<p style="margin: 0 0 8px 0; font-size: 12px;">${pin.InfoWindowContent}</p>` : ''}
          <p style="margin: 0; font-size: 11px; color: #666;">
            ${pin.Latitude.toFixed(6)}, ${pin.Longitude.toFixed(6)}
          </p>
        </div>`
      );

      const marker = new mapboxgl.Marker({ element: el }).setLngLat([pin.Longitude, pin.Latitude]).setPopup(popup).addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [mapPins, isMapReady, colorScheme, onPinPress]);

  // Update layers when visibility changes
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Remove existing custom layers
    layerIdsRef.current.forEach((layerId) => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
    });
    sourceIdsRef.current.forEach((sourceId) => {
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    });
    layerIdsRef.current = [];
    sourceIdsRef.current = [];

    // Add visible layers
    visibleLayers.forEach((layer) => {
      if (!layer.Data?.Features || !Array.isArray(layer.Data.Features) || layer.Data.Features.length === 0) return;

      const sourceId = `custom-layer-source-${layer.Id}`;
      const layerId = `custom-layer-${layer.Id}`;

      const featureCollection: FeatureCollection = {
        type: 'FeatureCollection',
        features: layer.Data.Features.flatMap((fc) => fc.features || []) as Feature<Geometry, GeoJsonProperties>[],
      };

      if (featureCollection.features.length === 0) return;

      try {
        map.current!.addSource(sourceId, {
          type: 'geojson',
          data: featureCollection,
        });
        sourceIdsRef.current.push(sourceId);

        const type = layer.Data.Type?.toLowerCase() || 'polygon';
        const color = layer.Color || '#3b82f6';

        if (type === 'linestring' || type === 'multilinestring') {
          map.current!.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': color,
              'line-width': 3,
              'line-opacity': 0.8,
            },
          });
        } else if (type === 'point' || type === 'multipoint') {
          map.current!.addLayer({
            id: layerId,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-color': color,
              'circle-radius': 8,
              'circle-opacity': 0.8,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
            },
          });
        } else {
          map.current!.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': color,
              'fill-opacity': 0.3,
              'fill-outline-color': color,
            },
          });
        }

        layerIdsRef.current.push(layerId);
      } catch (error) {
        logger.error({
          message: 'Failed to add map layer',
          context: { error, layerId: layer.Id },
        });
      }
    });
  }, [visibleLayers, isMapReady]);

  return (
    <View style={StyleSheet.flatten([styles.container, style])} testID={testID}>
      <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default UnifiedMapView;
