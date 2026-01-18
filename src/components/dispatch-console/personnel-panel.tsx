import { Circle, Filter, Plus, RefreshCw, User, Users } from 'lucide-react-native';
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
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';

import { PanelHeader } from './panel-header';

interface PersonnelPanelProps {
  personnel: PersonnelInfoResultData[];
  isLoading: boolean;
  onRefresh: () => void;
  selectedPersonnelId?: string;
  onSelectPersonnel?: (personnelId: string) => void;
  // Call filter props
  isCallFilterActive?: boolean;
  selectedCallId?: string;
  callDispatches?: DispatchedEventResultData[];
  onSetPersonnelStatusForCall?: (personnelId: string, personnelName: string) => void;
}

const PersonnelItem: React.FC<{
  person: PersonnelInfoResultData;
  isSelected: boolean;
  isOnCall?: boolean;
  onPress: () => void;
  onSetStatus?: () => void;
}> = ({ person, isSelected, isOnCall, onPress, onSetStatus }) => {
  const { t } = useTranslation();
  const statusColor = person.StatusColor || '#6b7280';
  const staffingColor = person.StaffingColor || '#6b7280';

  return (
    <Pressable onPress={onPress}>
      <Box className={`mb-2 rounded-lg border bg-white p-2 dark:bg-gray-800 ${isSelected ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700'}`}>
        <HStack className="items-center justify-between">
          <HStack className="flex-1 items-center" space="sm">
            <View style={[styles.avatar, { borderColor: statusColor }]}>
              <Icon as={User} size="sm" color={statusColor} />
            </View>
            <VStack className="flex-1">
              <HStack className="items-center" space="xs">
                <Text className="text-sm font-semibold text-gray-800 dark:text-gray-100" numberOfLines={1}>
                  {person.FirstName} {person.LastName}
                </Text>
                {isOnCall ? (
                  <Badge size="sm" className="bg-purple-100 dark:bg-purple-900">
                    <Text className="text-xs text-purple-700 dark:text-purple-300">{t('dispatch.on_call')}</Text>
                  </Badge>
                ) : null}
              </HStack>
              <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                {person.GroupName || 'Unassigned'}
              </Text>
            </VStack>
          </HStack>
          <VStack className="items-end" space="xs">
            <HStack className="items-center" space="xs">
              <Circle size={8} fill={statusColor} color={statusColor} />
              <Text style={{ color: statusColor }} className="text-xs font-medium">
                {person.Status || 'Unknown'}
              </Text>
            </HStack>
            <HStack className="items-center" space="xs">
              <Circle size={6} fill={staffingColor} color={staffingColor} />
              <Text className="text-xs text-gray-500 dark:text-gray-400">{person.Staffing || 'Unknown'}</Text>
            </HStack>
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

export const PersonnelPanel: React.FC<PersonnelPanelProps> = ({
  personnel,
  isLoading,
  onRefresh,
  selectedPersonnelId,
  onSelectPersonnel,
  isCallFilterActive,
  selectedCallId,
  callDispatches,
  onSetPersonnelStatusForCall,
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter personnel based on call dispatches when filter is active
  const displayedPersonnel = useMemo(() => {
    if (!isCallFilterActive || !callDispatches || callDispatches.length === 0) {
      return personnel;
    }
    // Get personnel names from dispatches (dispatches contain personnel info by name)
    const dispatchedPersonnelNames = callDispatches.filter((d) => d.Type === 'Personnel' || d.Type === 'p').map((d) => d.Name.toLowerCase());

    // Also check personnel whose StatusDestinationId matches the call
    return personnel.filter((p) => {
      const fullName = `${p.FirstName} ${p.LastName}`.toLowerCase();
      return dispatchedPersonnelNames.includes(fullName) || (selectedCallId && p.StatusDestinationId === selectedCallId);
    });
  }, [personnel, isCallFilterActive, callDispatches, selectedCallId]);

  // Get list of personnel names that are dispatched to the call
  const dispatchedPersonnelNames = useMemo(() => {
    if (!callDispatches) return new Set<string>();
    return new Set(callDispatches.filter((d) => d.Type === 'Personnel' || d.Type === 'p').map((d) => d.Name.toLowerCase()));
  }, [callDispatches]);

  // Count on-duty personnel
  const onDutyCount = displayedPersonnel.filter((p) => p.Staffing && p.Staffing.toLowerCase() !== 'off duty').length;

  return (
    <Box className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <PanelHeader
        title={isCallFilterActive ? t('dispatch.personnel_on_call') : t('dispatch.personnel')}
        icon={Users}
        iconColor="#8b5cf6"
        count={displayedPersonnel.length}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        rightContent={
          <HStack space="xs">
            <HStack className="items-center rounded bg-purple-100 px-1.5 py-0.5 dark:bg-purple-900" space="xs">
              <Circle size={6} fill="#8b5cf6" color="#8b5cf6" />
              <Text className="text-xs font-medium text-purple-700 dark:text-purple-300">{onDutyCount}</Text>
            </HStack>
            {isCallFilterActive ? (
              <Badge size="sm" className="bg-indigo-100 dark:bg-indigo-900">
                <HStack className="items-center" space="xs">
                  <Icon as={Filter} size="xs" className="text-indigo-600 dark:text-indigo-300" />
                  <Text className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{t('dispatch.filtered')}</Text>
                </HStack>
              </Badge>
            ) : (
              <Pressable style={styles.iconButton}>
                <Icon as={Filter} size="xs" className="text-gray-500 dark:text-gray-400" />
              </Pressable>
            )}
            <Pressable onPress={onRefresh} style={styles.iconButton}>
              <Icon as={RefreshCw} size="xs" className={`text-gray-500 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </Pressable>
          </HStack>
        }
      />

      {!isCollapsed ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {displayedPersonnel.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon as={Users} size="lg" className="text-gray-300 dark:text-gray-600" />
              <Text className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">{isCallFilterActive ? t('dispatch.no_personnel_on_call') : t('dispatch.no_personnel')}</Text>
            </View>
          ) : (
            displayedPersonnel.map((person) => {
              const fullName = `${person.FirstName} ${person.LastName}`.toLowerCase();
              return (
                <PersonnelItem
                  key={person.UserId}
                  person={person}
                  isSelected={selectedPersonnelId === person.UserId}
                  isOnCall={dispatchedPersonnelNames.has(fullName) || Boolean(selectedCallId && person.StatusDestinationId === selectedCallId)}
                  onPress={() => onSelectPersonnel?.(person.UserId)}
                  onSetStatus={isCallFilterActive && onSetPersonnelStatusForCall ? () => onSetPersonnelStatusForCall(person.UserId, `${person.FirstName} ${person.LastName}`) : undefined}
                />
              );
            })
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
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
