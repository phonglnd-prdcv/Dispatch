import type Mapbox from '@rnmapbox/maps';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MAP_ICONS } from '@/constants/map-icons';
import { isPoiMarker } from '@/lib/destination-helpers';
import { getMapMarkerColor, resolveMapMarkerIconKey } from '@/lib/map-markers';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';

type MapIconKey = keyof typeof MAP_ICONS;

interface PinMarkerProps {
  pin: MapMakerInfoData;
  size?: number;
  markerRef?: Mapbox.PointAnnotation | null;
  onPress?: () => void;
}

const PinMarker: React.FC<PinMarkerProps> = ({ pin, size = 32, onPress }) => {
  const { colorScheme } = useColorScheme();

  const iconKey = resolveMapMarkerIconKey(pin) as MapIconKey;
  const icon = MAP_ICONS[iconKey] || MAP_ICONS.call;
  const isPoiMapPin = isPoiMarker(pin.Type);
  const poiMarkerSize = Math.max(size - 8, 20);
  const poiMarkerStyle = StyleSheet.flatten([styles.poiMarker, { width: poiMarkerSize, height: poiMarkerSize, borderRadius: poiMarkerSize / 2, backgroundColor: getMapMarkerColor(pin) }]);
  const poiMarkerDotStyle = StyleSheet.flatten([styles.poiMarkerDot, { width: Math.max(Math.round(poiMarkerSize * 0.38), 8), height: Math.max(Math.round(poiMarkerSize * 0.38), 8) }]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {isPoiMapPin ? (
        <View style={poiMarkerStyle}>
          <View style={poiMarkerDotStyle} />
        </View>
      ) : (
        <Image fadeDuration={0} source={icon.uri} style={StyleSheet.flatten([styles.image, { width: size, height: size }])} />
      )}
      <Text style={StyleSheet.flatten([styles.title, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }])} numberOfLines={2}>
        {pin.Title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  poiMarker: {
    alignItems: 'center',
    borderColor: '#ffffff',
    borderWidth: 2,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  poiMarkerDot: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
  },
  image: {
    overflow: 'visible',
    resizeMode: 'cover',
  },
  title: {
    marginTop: 2,
    overflow: 'visible',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PinMarker;
