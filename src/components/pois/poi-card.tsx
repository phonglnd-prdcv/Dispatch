import { MapPin, MapPinned } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, BadgeText } from '@/components/ui/badge';
import { getPoiPrimaryDisplayText, getPoiSecondaryDisplayText } from '@/lib/poi-display';
import { type PoiResultData } from '@/models/v4/mapping/poiResultData';

interface PoiCardProps {
  poi: PoiResultData;
  onPress: (poi: PoiResultData) => void;
}

export const PoiCard: React.FC<PoiCardProps> = ({ poi, onPress }) => {
  const { t } = useTranslation();
  const primaryText = getPoiPrimaryDisplayText(poi);
  const secondaryText = getPoiSecondaryDisplayText(poi);
  const accentStyle = StyleSheet.flatten([styles.accent, { backgroundColor: poi.Color || '#2563eb' }]);

  return (
    <Pressable style={styles.card} onPress={() => onPress(poi)}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <View style={accentStyle} />
          <View style={styles.titleTextContainer}>
            <Text style={styles.titleText}>{primaryText || t('pois.unnamed')}</Text>
            <Text style={styles.typeText}>{poi.PoiTypeName || t('pois.unknown_type')}</Text>
          </View>
        </View>
        {poi.IsDestination ? (
          <Badge action="success" variant="outline" size="sm">
            <BadgeText>{t('pois.destination')}</BadgeText>
          </Badge>
        ) : null}
      </View>

      {secondaryText ? (
        <View style={styles.detailRow}>
          <MapPin size={14} color="#6b7280" />
          <Text style={styles.detailText} numberOfLines={2}>
            {secondaryText}
          </Text>
        </View>
      ) : null}

      {poi.Note ? (
        <View style={styles.detailRow}>
          <MapPinned size={14} color="#6b7280" />
          <Text style={styles.noteText} numberOfLines={2}>
            {poi.Note}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
  },
  accent: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 12,
    marginTop: 6,
  },
  titleText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  typeText: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  detailText: {
    color: '#4b5563',
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  noteText: {
    color: '#4b5563',
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
  },
});
