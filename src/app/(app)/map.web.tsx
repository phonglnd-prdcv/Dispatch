import { Stack, useFocusEffect } from 'expo-router';
import { type Feature, type FeatureCollection, type GeoJsonProperties, type Geometry } from 'geojson';
import mapboxgl from 'mapbox-gl';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { getMapDataAndMarkers } from '@/api/mapping/mapping';
import { FocusAwareStatusBar } from '@/components/ui/focus-aware-status-bar';
import { getMapIconWebUrl, MAP_ICONS } from '@/constants/map-icons';
import { useAnalytics } from '@/hooks/use-analytics';
import { MapLayerType, useMapLayers } from '@/hooks/use-map-layers';
import { isPoiMarker } from '@/lib/destination-helpers';
import { Env } from '@/lib/env';
import { logger } from '@/lib/logging';
import { getMapMarkerColor, getMapPinSummary, hasValidMapCoordinates, resolveMapMarkerIconKey } from '@/lib/map-markers';
import { createDefaultVisiblePoiLayerIds, filterMapPinsByPoiLayers, getPoiMapLayerId } from '@/lib/poi-map-layers';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';
import { type GetMapLayersData } from '@/models/v4/mapping/getMapLayersResultData';
import { type PoiLayerData } from '@/models/v4/mapping/poiLayerData';
import { useLocationStore } from '@/stores/app/location-store';

// Mapbox GL CSS needs to be injected for web
const MAPBOX_GL_CSS_URL = 'https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css';

type MapIconKey = keyof typeof MAP_ICONS;

export default function MapWeb() {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { colorScheme } = useColorScheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const layerIdsRef = useRef<string[]>([]);
  const sourceIdsRef = useRef<string[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapPins, setMapPins] = useState<MapMakerInfoData[]>([]);
  const [poiLayers, setPoiLayers] = useState<PoiLayerData[]>([]);
  const [visiblePoiLayerIds, setVisiblePoiLayerIds] = useState<Set<string>>(new Set());
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);

  const location = useLocationStore((state) => ({
    latitude: state.latitude,
    longitude: state.longitude,
  }));

  // Map layers hook
  const { layers, visibleLayers, isLoading: isLayersLoading, fetchLayers, toggleLayer, showAllLayers, hideAllLayers, getVisibleLayerData } = useMapLayers({ initialLayerType: MapLayerType.ALL, autoFetch: true });

  const syncPoiLayers = useCallback((nextPoiLayers: PoiLayerData[]) => {
    setPoiLayers(nextPoiLayers);
    setVisiblePoiLayerIds(createDefaultVisiblePoiLayerIds(nextPoiLayers));
  }, []);

  const togglePoiLayer = useCallback((layerId: string) => {
    setVisiblePoiLayerIds((currentLayerIds) => {
      const nextLayerIds = new Set(currentLayerIds);

      if (nextLayerIds.has(layerId)) {
        nextLayerIds.delete(layerId);
      } else {
        nextLayerIds.add(layerId);
      }

      return nextLayerIds;
    });
  }, []);

  const showAllMapLayers = useCallback(() => {
    showAllLayers();
    setVisiblePoiLayerIds(createDefaultVisiblePoiLayerIds(poiLayers));
  }, [poiLayers, showAllLayers]);

  const hideAllMapLayers = useCallback(() => {
    hideAllLayers();
    setVisiblePoiLayerIds(new Set());
  }, [hideAllLayers]);

  const combinedLayers = useMemo(
    () => [
      ...layers.map((layer) => ({ Id: layer.Id, Name: layer.Name, Color: layer.Color, kind: 'custom' as const })),
      ...poiLayers.map((layer) => ({ Id: getPoiMapLayerId(layer.PoiTypeId), Name: layer.Name, Color: layer.Color, kind: 'poi' as const })),
    ],
    [layers, poiLayers]
  );

  const visibleMapPins = useMemo(() => filterMapPinsByPoiLayers(mapPins, visiblePoiLayerIds), [mapPins, visiblePoiLayerIds]);

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
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    mapboxgl.accessToken = Env.MAPBOX_PUBKEY;

    const initialCenter: [number, number] = location.longitude && location.latitude ? [location.longitude, location.latitude] : [-98.5795, 39.8283]; // Center of USA as fallback

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(),
      center: initialCenter,
      zoom: location.latitude && location.longitude ? 12 : 3,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      })
    );

    map.current.on('load', () => {
      setIsMapReady(true);
      logger.info({
        message: 'Web map loaded successfully',
      });
    });

    return () => {
      // Clean up markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      map.current?.remove();
      map.current = null;
    };
  }, [getMapStyle, location.latitude, location.longitude]);

  // Update map style when theme changes
  useEffect(() => {
    if (map.current && isMapReady) {
      map.current.setStyle(getMapStyle());
    }
  }, [colorScheme, getMapStyle, isMapReady]);

  // Handle navigation focus - refresh data when navigating back to map
  useFocusEffect(
    useCallback(() => {
      fetchLayers();
    }, [fetchLayers])
  );

  // Fetch map data and markers on mount
  useEffect(() => {
    const abortController = new AbortController();

    const fetchMapDataAndMarkers = async () => {
      try {
        const mapDataAndMarkers = await getMapDataAndMarkers(abortController.signal);

        if (mapDataAndMarkers && mapDataAndMarkers.Data) {
          setMapPins(mapDataAndMarkers.Data.MapMakerInfos);
          syncPoiLayers(mapDataAndMarkers.Data.PoiLayers ?? []);

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
          }
        }
      } catch (error) {
        // Don't log aborted requests as errors
        if (error instanceof Error && (error.name === 'AbortError' || error.message === 'canceled')) {
          logger.debug({
            message: 'Map data fetch was aborted during component unmount',
          });
          return;
        }

        logger.error({
          message: 'Failed to fetch initial map data and markers',
          context: { error },
        });
      }
    };

    fetchMapDataAndMarkers();

    return () => {
      abortController.abort();
    };
  }, [syncPoiLayers]);

  // Update markers when mapPins change
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    visibleMapPins.forEach((pin) => {
      if (!hasValidMapCoordinates(pin)) return;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.cursor = 'pointer';

      const iconContainer = document.createElement('div');
      iconContainer.style.display = 'flex';
      iconContainer.style.alignItems = 'center';
      iconContainer.style.justifyContent = 'center';
      iconContainer.style.position = 'relative';

      if (isPoiMarker(pin.Type)) {
        iconContainer.style.width = '22px';
        iconContainer.style.height = '22px';
        iconContainer.style.borderRadius = '999px';
        iconContainer.style.backgroundColor = getMapMarkerColor(pin);
        iconContainer.style.border = '2px solid #ffffff';
        iconContainer.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.35)';

        const innerDot = document.createElement('div');
        innerDot.style.width = '8px';
        innerDot.style.height = '8px';
        innerDot.style.borderRadius = '999px';
        innerDot.style.backgroundColor = '#ffffff';
        iconContainer.appendChild(innerDot);
      } else {
        iconContainer.style.width = '32px';
        iconContainer.style.height = '32px';

        const iconKey = resolveMapMarkerIconKey(pin) as MapIconKey;
        const iconData = MAP_ICONS[iconKey] || MAP_ICONS['call'];
        const img = document.createElement('img');
        const imgSrc = getMapIconWebUrl(iconData);
        img.src = imgSrc;
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.objectFit = 'contain';
        img.alt = pin.Title;
        img.onerror = () => {
          img.src = getMapIconWebUrl(MAP_ICONS['call']);
        };
        iconContainer.appendChild(img);
      }

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

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600;">${pin.Title}</h3>
          ${getMapPinSummary(pin) ? `<p style="margin: 0 0 8px 0; font-size: 12px;">${getMapPinSummary(pin)}</p>` : ''}
          <p style="margin: 0; font-size: 11px; color: #666;">
            ${pin.Latitude.toFixed(6)}, ${pin.Longitude.toFixed(6)}
          </p>
        </div>`
      );

      const marker = new mapboxgl.Marker({ element: el }).setLngLat([pin.Longitude, pin.Latitude]).setPopup(popup).addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [visibleMapPins, isMapReady, colorScheme]);

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
    const visibleLayerData = getVisibleLayerData();

    visibleLayerData.forEach((layer) => {
      if (!layer.Data?.Features || !Array.isArray(layer.Data.Features) || layer.Data.Features.length === 0) return;

      const sourceId = `custom-layer-source-${layer.Id}`;
      const layerId = `custom-layer-${layer.Id}`;

      // Build a proper GeoJSON FeatureCollection from the layer data
      const featureCollection: FeatureCollection = {
        type: 'FeatureCollection',
        features: layer.Data.Features.flatMap((fc) => fc.features || []) as Feature<Geometry, GeoJsonProperties>[],
      };

      if (featureCollection.features.length === 0) return;

      try {
        // Add source
        map.current!.addSource(sourceId, {
          type: 'geojson',
          data: featureCollection,
        });
        sourceIdsRef.current.push(sourceId);

        // Determine layer type and add appropriate layer
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
          // Default to fill layer for polygons
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
  }, [visibleLayers, layers, isMapReady, getVisibleLayerData]);

  // Track when map view is rendered
  useEffect(() => {
      trackEvent('map_view_rendered', {
      hasMapPins: mapPins.length > 0,
      mapPinsCount: mapPins.length,
      theme: colorScheme || 'light',
      platform: 'web',
      layersCount: combinedLayers.length,
      visibleLayersCount: visibleLayers.size + visiblePoiLayerIds.size,
    });
  }, [trackEvent, mapPins.length, colorScheme, combinedLayers.length, visibleLayers.size, visiblePoiLayerIds.size]);

  // Render layers panel modal
  const renderLayersPanel = () => {
    const isDark = colorScheme === 'dark';

    return (
      <Modal visible={isLayersPanelOpen} transparent animationType="slide" onRequestClose={() => setIsLayersPanelOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.layersPanelContainer, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
            <View style={styles.layersPanelHeader}>
              <Text style={[styles.layersPanelTitle, { color: isDark ? '#ffffff' : '#000000' }]}>{t('map.layers')}</Text>
              <TouchableOpacity onPress={() => setIsLayersPanelOpen(false)} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.layersPanelActions}>
              <TouchableOpacity onPress={showAllMapLayers} style={[styles.actionButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                <Text style={[styles.actionButtonText, { color: isDark ? '#ffffff' : '#000000' }]}>{t('map.show_all')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={hideAllMapLayers} style={[styles.actionButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                <Text style={[styles.actionButtonText, { color: isDark ? '#ffffff' : '#000000' }]}>{t('map.hide_all')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.layersList}>
              {combinedLayers.length === 0 ? (
                <Text style={[styles.noLayersText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{isLayersLoading ? t('common.loading') : t('map.no_layers')}</Text>
              ) : (
                combinedLayers.map((layer) => (
                  <Pressable key={layer.Id} style={[styles.layerItem, { borderBottomColor: isDark ? '#374151' : '#e5e7eb' }]} onPress={() => (layer.kind === 'custom' ? toggleLayer(layer.Id) : togglePoiLayer(layer.Id))}>
                    <View style={styles.layerInfo}>
                      <View style={[styles.layerColorIndicator, { backgroundColor: layer.Color || '#3b82f6' }]} />
                      <Text style={[styles.layerName, { color: isDark ? '#ffffff' : '#000000' }]} numberOfLines={1}>
                        {layer.Name}
                      </Text>
                    </View>
                    <Switch
                      value={layer.kind === 'custom' ? visibleLayers.has(layer.Id) : visiblePoiLayerIds.has(layer.Id)}
                      onValueChange={() => (layer.kind === 'custom' ? toggleLayer(layer.Id) : togglePoiLayer(layer.Id))}
                      trackColor={{ false: isDark ? '#4b5563' : '#d1d5db', true: '#3b82f6' }}
                      thumbColor={(layer.kind === 'custom' ? visibleLayers.has(layer.Id) : visiblePoiLayerIds.has(layer.Id)) ? '#ffffff' : '#f4f3f4'}
                    />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const isDark = colorScheme === 'dark';

  return (
    <>
      <Stack.Screen
        options={{
          title: t('tabs.map'),
          headerTitle: t('app.title'),
          headerShown: true,
          headerBackTitle: '',
        }}
      />
      <View style={styles.container} testID="map-container">
        <FocusAwareStatusBar />
        <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />

        {/* Layers Button */}
        <TouchableOpacity style={[styles.layersButton, { backgroundColor: isDark ? '#374151' : '#ffffff' }]} onPress={() => setIsLayersPanelOpen(true)} testID="layers-button">
          <Text style={{ fontSize: 16 }}>🗂️</Text>
        </TouchableOpacity>
      </View>

      {/* Layers Panel Modal */}
      {renderLayersPanel()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  layersButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  layersPanelContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: 20,
  },
  layersPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  layersPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  layersPanelActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  layersList: {
    paddingHorizontal: 16,
  },
  layerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  layerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  layerColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  layerName: {
    fontSize: 14,
    flex: 1,
  },
  noLayersText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
});
