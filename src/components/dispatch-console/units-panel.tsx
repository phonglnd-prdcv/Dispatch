import { Circle, Filter, MapPin, Plus, RefreshCw, Truck } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type DispatchedEventResultData } from '@/models/v4/calls/dispatchedEventResultData';
import { type UnitResultData } from '@/models/v4/units/unitResultData';

import { PanelHeader } from './panel-header';

interface UnitsPanelProps {
  units: UnitResultData[];
  isLoading: boolean;
  onRefresh: () => void;
  selectedUnitId?: string;
  onSelectUnit?: (unitId: string) => void;
  // Call filter props
  isCallFilterActive?: boolean;
  selectedCallId?: string;
  callDispatches?: DispatchedEventResultData[];
  onSetUnitStatusForCall?: (unitId: string, unitName: string) => void;
}

const getStatusColor = (statusId: string): string => {
  // Common status colors - customize based on your status definitions
  const statusColors: Record<string, string> = {
    available: '#22c55e',
    responding: '#f59e0b',
    on_scene: '#3b82f6',
    busy: '#ef4444',
    out_of_service: '#6b7280',
  };
  return statusColors[statusId?.toLowerCase()] || '#6b7280';
};

const UnitItem: React.FC<{
  unit: UnitResultData;
  isSelected: boolean;
  isOnCall?: boolean;
  onPress: () => void;
  onSetStatus?: () => void;
}> = ({ unit, isSelected, isOnCall, onPress, onSetStatus }) => {
  const { t } = useTranslation();
  const statusColor = getStatusColor(unit.CurrentStatusId);

  return (
    <Pressable onPress={onPress}>
      <Box className={`mb-2 rounded-lg border bg-white p-2 dark:bg-gray-800 ${isSelected ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700'}`}>
        <HStack className="items-center justify-between">
          <HStack className="flex-1 items-center" space="sm">
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
              <Icon as={Truck} size="xs" color="#fff" />
            </View>
            <VStack className="flex-1">
              <HStack className="items-center" space="xs">
                <Text className="text-sm font-semibold text-gray-800 dark:text-gray-100" numberOfLines={1}>
                  {unit.Name}
                </Text>
                {isOnCall ? (
                  <Badge size="sm" className="bg-blue-100 dark:bg-blue-900">
                    <Text className="text-xs text-blue-700 dark:text-blue-300">{t('dispatch.on_call')}</Text>
                  </Badge>
                ) : null}
              </HStack>
              <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                {unit.Type || unit.GroupName || 'Unassigned'}
              </Text>
            </VStack>
          </HStack>
          <VStack className="items-end" space="xs">
            <HStack className="items-center" space="xs">
              <Circle size={8} fill={statusColor} color={statusColor} />
              <Text style={{ color: statusColor }} className="text-xs font-medium">
                {unit.Note || 'Available'}
              </Text>
            </HStack>
            {unit.Latitude && unit.Longitude ? (
              <HStack className="items-center" space="xs">
                <Icon as={MapPin} size="xs" className="text-gray-400" />
                <Text className="text-xs text-gray-400">GPS</Text>
              </HStack>
            ) : null}
            {onSetStatus ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onSetStatus();
                }}
                style={styles.statusButton}
              >
                <Icon as={Plus} size="xs" className="text-indigo-500" />
              </Pressable>
            ) : null}
          </VStack>
        </HStack>
      </Box>
    </Pressable>
  );
};

export const UnitsPanel: React.FC<UnitsPanelProps> = ({ units, isLoading, onRefresh, selectedUnitId, onSelectUnit, isCallFilterActive, selectedCallId, callDispatches, onSetUnitStatusForCall }) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter units based on call dispatches when filter is active
  const displayedUnits = useMemo(() => {
    if (!isCallFilterActive || !callDispatches || callDispatches.length === 0) {
      return units;
    }
    // Get unit names from dispatches (dispatches contain unit info by name)
    const dispatchedUnitNames = callDispatches.filter((d) => d.Type === 'Unit' || d.Type === 'u').map((d) => d.Name.toLowerCase());

    // Also check units whose CurrentDestinationId matches the call
    return units.filter((u) => dispatchedUnitNames.includes(u.Name.toLowerCase()) || (selectedCallId && u.CurrentDestinationId === selectedCallId));
  }, [units, isCallFilterActive, callDispatches, selectedCallId]);

  // Get list of unit names that are dispatched to the call
  const dispatchedUnitNames = useMemo(() => {
    if (!callDispatches) return new Set<string>();
    return new Set(callDispatches.filter((d) => d.Type === 'Unit' || d.Type === 'u').map((d) => d.Name.toLowerCase()));
  }, [callDispatches]);

  // Count available units
  const availableUnits = displayedUnits.filter((u) => !u.CurrentStatusId || u.CurrentStatusId === 'available').length;

  return (
    <Box className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <PanelHeader
        title={isCallFilterActive ? t('dispatch.units_on_call') : t('dispatch.units')}
        icon={Truck}
        iconColor="#3b82f6"
        count={displayedUnits.length}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        rightContent={
          <HStack space="xs">
            <HStack className="items-center rounded bg-green-100 px-1.5 py-0.5 dark:bg-green-900" space="xs">
              <Circle size={6} fill="#22c55e" color="#22c55e" />
              <Text className="text-xs font-medium text-green-700 dark:text-green-300">{availableUnits}</Text>
            </HStack>
            {isCallFilterActive ? (
              <Badge size="sm" className="bg-indigo-100 dark:bg-indigo-900">
                <HStack className="items-center" space="xs">
                  <Icon as={Filter} size="xs" className="text-indigo-600 dark:text-indigo-300" />
                  <Text className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{t('dispatch.filtered')}</Text>
                </HStack>
              </Badge>
            ) : null}
            <Pressable onPress={onRefresh} style={styles.iconButton}>
              <Icon as={RefreshCw} size="xs" className={`text-gray-500 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </Pressable>
          </HStack>
        }
      />

      {!isCollapsed ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {displayedUnits.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon as={Truck} size="lg" className="text-gray-300 dark:text-gray-600" />
              <Text className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">{isCallFilterActive ? t('dispatch.no_units_on_call') : t('dispatch.no_units')}</Text>
            </View>
          ) : (
            displayedUnits.map((unit) => (
              <UnitItem
                key={unit.UnitId}
                unit={unit}
                isSelected={selectedUnitId === unit.UnitId}
                isOnCall={dispatchedUnitNames.has(unit.Name.toLowerCase()) || Boolean(selectedCallId && unit.CurrentDestinationId === selectedCallId)}
                onPress={() => onSelectUnit?.(unit.UnitId)}
                onSetStatus={isCallFilterActive && onSetUnitStatusForCall ? () => onSetUnitStatusForCall(unit.UnitId, unit.Name) : undefined}
              />
            ))
          )}
        </ScrollView>
      ) : null}
    </Box>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 8,
    maxHeight: 300,
  },
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  iconButton: {
    padding: 4,
  },
  statusButton: {
    padding: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 4,
  },
});
