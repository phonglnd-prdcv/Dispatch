import { AlertTriangle, ArrowRight, Clock, Filter, Info, Plus, Truck, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type DispatchedEventResultData } from '@/models/v4/calls/dispatchedEventResultData';

import { PanelHeader } from './panel-header';

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  type: 'call' | 'unit' | 'personnel' | 'system';
  action: string;
  description: string;
  metadata?: {
    callId?: string;
    unitId?: string;
    personnelId?: string;
    priority?: string;
  };
}

interface ActivityLogPanelProps {
  entries: ActivityLogEntry[];
  isLoading: boolean;
  onRefresh?: () => void;
  // Call filter props
  isCallFilterActive?: boolean;
  selectedCallId?: string;
  callActivity?: DispatchedEventResultData[];
  onAddUnitEvent?: () => void;
  onAddPersonnelEvent?: () => void;
}

const getIconForType = (type: ActivityLogEntry['type']) => {
  switch (type) {
    case 'call':
      return AlertTriangle;
    case 'unit':
      return Truck;
    case 'personnel':
      return User;
    case 'system':
    default:
      return Info;
  }
};

const getColorForType = (type: ActivityLogEntry['type']) => {
  switch (type) {
    case 'call':
      return '#ef4444';
    case 'unit':
      return '#3b82f6';
    case 'personnel':
      return '#8b5cf6';
    case 'system':
    default:
      return '#6b7280';
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const ActivityLogItem: React.FC<{ entry: ActivityLogEntry }> = ({ entry }) => {
  const IconComponent = getIconForType(entry.type);
  const color = getColorForType(entry.type);

  return (
    <HStack className="mb-2 items-start border-b border-gray-100 pb-2 dark:border-gray-800" space="sm">
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Icon as={IconComponent} size="xs" color={color} />
      </View>
      <VStack className="flex-1">
        <HStack className="items-center justify-between">
          <Text className="text-xs font-semibold text-gray-800 dark:text-gray-100">{entry.action}</Text>
          <HStack className="items-center" space="xs">
            <Icon as={Clock} size="xs" className="text-gray-400" />
            <Text className="text-xs text-gray-500 dark:text-gray-400">{formatTime(entry.timestamp)}</Text>
          </HStack>
        </HStack>
        <Text className="text-xs text-gray-600 dark:text-gray-400" numberOfLines={2}>
          {entry.description}
        </Text>
      </VStack>
    </HStack>
  );
};

const CallActivityItem: React.FC<{ activity: DispatchedEventResultData }> = ({ activity }) => {
  const getActivityIcon = () => {
    if (activity.Type === 'Unit' || activity.Type === 'u') return Truck;
    if (activity.Type === 'Personnel' || activity.Type === 'p') return User;
    return Info;
  };

  const getActivityColor = () => {
    if (activity.StatusColor) return activity.StatusColor;
    if (activity.Type === 'Unit' || activity.Type === 'u') return '#3b82f6';
    if (activity.Type === 'Personnel' || activity.Type === 'p') return '#8b5cf6';
    return '#6b7280';
  };

  const IconComponent = getActivityIcon();
  const color = getActivityColor();

  return (
    <HStack className="mb-2 items-start border-b border-gray-100 pb-2 dark:border-gray-800" space="sm">
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Icon as={IconComponent} size="xs" color={color} />
      </View>
      <VStack className="flex-1">
        <HStack className="items-center justify-between">
          <Text className="text-xs font-semibold text-gray-800 dark:text-gray-100">{activity.Name}</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">{activity.Timestamp}</Text>
        </HStack>
        <HStack className="items-center" space="xs">
          {activity.StatusText ? (
            <Badge size="sm" style={{ backgroundColor: `${color}20` }}>
              <Text style={{ color }} className="text-xs font-medium">
                {activity.StatusText}
              </Text>
            </Badge>
          ) : null}
          {activity.Note ? (
            <Text className="flex-1 text-xs text-gray-600 dark:text-gray-400" numberOfLines={1}>
              {activity.Note}
            </Text>
          ) : null}
        </HStack>
      </VStack>
    </HStack>
  );
};

export const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({ entries, isLoading, isCallFilterActive, selectedCallId, callActivity, onAddUnitEvent, onAddPersonnelEvent }) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter entries when call filter is active
  const filteredEntries = isCallFilterActive && selectedCallId ? entries.filter((entry) => entry.metadata?.callId === selectedCallId || entry.type === 'system') : entries;

  // Determine display mode - use call activity if available when filtering
  const useCallActivity = isCallFilterActive && callActivity && callActivity.length > 0;
  const displayCount = useCallActivity ? callActivity.length : filteredEntries.length;

  return (
    <Box className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <PanelHeader
        title={isCallFilterActive ? t('dispatch.call_activity') : t('dispatch.activity_log')}
        icon={ArrowRight}
        iconColor="#6b7280"
        count={displayCount}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        rightContent={
          isCallFilterActive ? (
            <HStack space="xs">
              <Badge size="sm" className="bg-indigo-100 dark:bg-indigo-900">
                <HStack className="items-center" space="xs">
                  <Icon as={Filter} size="xs" className="text-indigo-600 dark:text-indigo-300" />
                  <Text className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{t('dispatch.filtered')}</Text>
                </HStack>
              </Badge>
              {onAddUnitEvent ? (
                <Pressable onPress={onAddUnitEvent} style={styles.iconButton}>
                  <HStack className="items-center" space="xs">
                    <Icon as={Truck} size="xs" className="text-blue-500" />
                    <Icon as={Plus} size="xs" className="text-blue-500" />
                  </HStack>
                </Pressable>
              ) : null}
              {onAddPersonnelEvent ? (
                <Pressable onPress={onAddPersonnelEvent} style={styles.iconButton}>
                  <HStack className="items-center" space="xs">
                    <Icon as={User} size="xs" className="text-purple-500" />
                    <Icon as={Plus} size="xs" className="text-purple-500" />
                  </HStack>
                </Pressable>
              ) : null}
            </HStack>
          ) : null
        }
      />

      {!isCollapsed ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {useCallActivity ? (
            // Show call-specific activity from API
            callActivity.map((activity, index) => <CallActivityItem key={`${activity.Id || index}-${activity.Timestamp}`} activity={activity} />)
          ) : filteredEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon as={Info} size="lg" className="text-gray-300 dark:text-gray-600" />
              <Text className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">{isCallFilterActive ? t('dispatch.no_call_activity') : t('dispatch.no_activity')}</Text>
            </View>
          ) : (
            filteredEntries.map((entry) => <ActivityLogItem key={entry.id} entry={entry} />)
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
    maxHeight: 250,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 4,
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
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 4,
  },
});
