import Mapbox from '@rnmapbox/maps';
import React from 'react';

import { hasValidMapCoordinates } from '@/lib/map-markers';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';

import PinMarker from './pin-marker';

interface MapPinsProps {
  pins: MapMakerInfoData[];
  onPinPress?: (pin: MapMakerInfoData) => void;
}

const MapPins: React.FC<MapPinsProps> = ({ pins, onPinPress }) => {
  return (
    <>
      {pins
        .filter((pin) => hasValidMapCoordinates(pin))
        .map((pin) => (
          <Mapbox.MarkerView key={`pin-${pin.Id}`} id={`pin-${pin.Id}`} coordinate={[pin.Longitude, pin.Latitude]} anchor={{ x: 0.5, y: 0.5 }} allowOverlap={true}>
            <PinMarker pin={pin} size={32} onPress={() => onPinPress?.(pin)} />
          </Mapbox.MarkerView>
        ))}
    </>
  );
};

export default MapPins;
