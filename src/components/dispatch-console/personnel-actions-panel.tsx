import { Building2, Check, ChevronRight, Phone, Send, User, X, Zap } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { getAllGroups } from '@/api/groups/groups';
import { getAllPersonnelStaffings, getAllPersonnelStatuses } from '@/api/satuses';
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from '@/components/ui/actionsheet';
import { Box } from '@/components/ui/box';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { invertColor, isCallActive } from '@/lib/utils';
import { type CallResultData } from '@/models/v4/calls/callResultData';
import { type GroupResultData } from '@/models/v4/groups/groupsResultData';
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';
import { type StatusesResultData } from '@/models/v4/statuses/statusesResultData';
import { useCallsStore } from '@/stores/calls/store';
import { usePersonnelActionsStore } from '@/stores/dispatch/personnel-actions-store';

interface PersonnelActionsPanelProps {
  personnel?: PersonnelInfoResultData | null;
  onStatusUpdated?: () => void;
  onStaffingUpdated?: () => void;
}

// Reusable status/staffing option for the action sheet
const StatusSheetOption: React.FC<{
  status: StatusesResultData;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ status, isSelected, onSelect }) => {
  const bgColor = status.BColor || '#6b7280';
  const textColor = invertColor(bgColor, true);

  return (
    <Pressable onPress={onSelect}>
      <HStack
        className={`mb-2 items-center justify-between rounded-lg border-2 px-3 py-2.5 ${
          isSelected ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
        }`}
      >
        <HStack className="items-center" space="sm">
          <View style={{ ...styles.statusIndicator, backgroundColor: bgColor }}>
            <Text style={{ color: textColor }} className="text-sm font-bold">
              {status.Text.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text className="text-sm font-medium text-gray-800 dark:text-gray-100">{status.Text}</Text>
        </HStack>
        {isSelected ? (
          <View style={{ ...styles.checkIcon, backgroundColor: '#6366f1' }}>
            <Icon as={Check} size="sm" color="#fff" />
          </View>
        ) : null}
      </HStack>
    </Pressable>
  );
};

// Destination option for the action sheet
const DestinationSheetOption: React.FC<{
  type: 'call' | 'station' | 'none';
  item?: CallResultData | GroupResultData;
  isSelected: boolean;
  onSelect: () => void;
  label?: string;
}> = ({ type, item, isSelected, onSelect, label }) => {
  const isCall = type === 'call';
  const isNone = type === 'none';
  const call = isCall && item ? (item as CallResultData) : null;
  const station = !isCall && !isNone && item ? (item as GroupResultData) : null;

  return (
    <Pressable onPress={onSelect}>
      <HStack
        className={`mb-2 items-center justify-between rounded-lg border px-3 py-2.5 ${
          isSelected ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
        }`}
      >
        <HStack className="flex-1 items-center" space="sm">
          {isNone ? (
            <Icon as={X} size="sm" className={isSelected ? 'text-indigo-500' : 'text-gray-400'} />
          ) : (
            <Icon as={isCall ? Phone : Building2} size="sm" className={isSelected ? 'text-indigo-500' : 'text-gray-500'} />
          )}
          <Text className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100" numberOfLines={1}>
            {isNone ? label : isCall ? `#${call?.Number} - ${call?.Name}` : station?.Name}
          </Text>
        </HStack>
        {isSelected ? <Icon as={Check} size="sm" className="text-indigo-500" /> : null}
      </HStack>
    </Pressable>
  );
};

export const PersonnelActionsPanel: React.FC<PersonnelActionsPanelProps> = ({ personnel: personnelProp, onStatusUpdated, onStaffingUpdated }) => {
  const { t } = useTranslation();

  // Get calls directly from calls store using selector
  const calls = useCallsStore((state) => state.calls);
  const fetchCalls = useCallsStore((state) => state.fetchCalls);

  // Local state for action sheets
  const [isStatusSheetOpen, setIsStatusSheetOpen] = useState(false);
  const [isStaffingSheetOpen, setIsStaffingSheetOpen] = useState(false);
  const [isDestinationSheetOpen, setIsDestinationSheetOpen] = useState(false);
  const [destinationTab, setDestinationTab] = useState<'calls' | 'stations'>('calls');

  // Store state
  const {
    selectedPersonnel: storeSelectedPersonnel,
    selectedStatus,
    statusDestinationType,
    statusSelectedCall,
    statusSelectedStation,
    statusNote,
    isSubmittingStatus,
    selectedStaffing,
    staffingNote,
    isSubmittingStaffing,
    availableStatuses,
    availableStaffings,
    availableStations,
    isLoadingOptions,
    statusError,
    staffingError,
    closeActions,
    setSelectedStatus,
    setStatusDestinationType,
    setStatusSelectedCall,
    setStatusSelectedStation,
    setStatusNote,
    submitStatus,
    setSelectedStaffing,
    setStaffingNote,
    submitStaffing,
    setAvailableStatuses,
    setAvailableStaffings,
    setAvailableCalls,
    setAvailableStations,
    setIsLoadingOptions,
  } = usePersonnelActionsStore();

  // Use prop if available, fallback to store
  const selectedPersonnel = personnelProp ?? storeSelectedPersonnel;

  // Load options when panel opens
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [statusesResult, staffingsResult, groupsResult] = await Promise.all([getAllPersonnelStatuses(), getAllPersonnelStaffings(), getAllGroups()]);

        if (statusesResult?.Data) {
          setAvailableStatuses(statusesResult.Data);
        }
        if (staffingsResult?.Data) {
          setAvailableStaffings(staffingsResult.Data);
        }
        if (groupsResult?.Data) {
          const stations = groupsResult.Data.filter((g) => g.GroupType?.toLowerCase().includes('station'));
          setAvailableStations(stations.length > 0 ? stations : groupsResult.Data);
        }
      } catch (error) {
        console.error('Failed to load personnel action options:', error);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    if (selectedPersonnel) {
      loadOptions();
    }
  }, [selectedPersonnel, setAvailableStatuses, setAvailableStaffings, setAvailableStations, setIsLoadingOptions]);

  // Update available calls from calls store
  useEffect(() => {
    const activeCalls = calls.filter((c) => isCallActive(c.State));
    setAvailableCalls(activeCalls);
  }, [calls, setAvailableCalls]);

  // Track the last personnel ID we initialized destination for
  const lastInitializedPersonnelIdRef = useRef<string | null>(null);

  // Initialize destination from selected personnel's current destination (only once per personnel)
  useEffect(() => {
    if (!selectedPersonnel) {
      lastInitializedPersonnelIdRef.current = null;
      return;
    }

    // Only initialize once per personnel - skip if we already initialized for this person
    if (lastInitializedPersonnelIdRef.current === selectedPersonnel.UserId) {
      return;
    }

    // If no destination set, just mark as initialized
    if (!selectedPersonnel.StatusDestinationId) {
      lastInitializedPersonnelIdRef.current = selectedPersonnel.UserId;
      return;
    }

    const destinationId = selectedPersonnel.StatusDestinationId;

    // Check if the destination is a call (check available calls)
    const matchingCall = calls.find((c) => c.CallId === destinationId);
    if (matchingCall) {
      setStatusDestinationType('call');
      setStatusSelectedCall(matchingCall);
      setStatusSelectedStation(null);
      lastInitializedPersonnelIdRef.current = selectedPersonnel.UserId;
      return;
    }

    // Check if the destination is a station (check available stations)
    const matchingStation = availableStations.find((s) => s.GroupId === destinationId);
    if (matchingStation) {
      setStatusDestinationType('station');
      setStatusSelectedStation(matchingStation);
      setStatusSelectedCall(null);
      lastInitializedPersonnelIdRef.current = selectedPersonnel.UserId;
      return;
    }

    // If we couldn't match but have data loaded, mark as initialized anyway
    // (the personnel has a destination that doesn't exist in our lists)
    if (calls.length > 0 || availableStations.length > 0) {
      lastInitializedPersonnelIdRef.current = selectedPersonnel.UserId;
    }
  }, [selectedPersonnel, calls, availableStations, setStatusDestinationType, setStatusSelectedCall, setStatusSelectedStation]);

  const handleSubmitStatus = useCallback(async () => {
    const success = await submitStatus();
    if (success) {
      onStatusUpdated?.();
    }
  }, [submitStatus, onStatusUpdated]);

  const handleSubmitStaffing = useCallback(async () => {
    const success = await submitStaffing();
    if (success) {
      onStaffingUpdated?.();
    }
  }, [submitStaffing, onStaffingUpdated]);

  // Get destination display text
  const getDestinationDisplay = useMemo(() => {
    if (statusDestinationType === 'call' && statusSelectedCall) {
      return `#${statusSelectedCall.Number} - ${statusSelectedCall.Name}`;
    }
    if (statusDestinationType === 'station' && statusSelectedStation) {
      return statusSelectedStation.Name;
    }
    return t('dispatch.personnel_actions.no_destination');
  }, [statusDestinationType, statusSelectedCall, statusSelectedStation, t]);

  // Check if status detail requires a destination
  // Detail: 0 = No destination, 1 = Station only, 2 = Call only, 3 = Both
  const requiresDestination = useMemo(() => {
    if (!selectedStatus) return false;
    return selectedStatus.Detail > 0;
  }, [selectedStatus]);

  // Check destination type allowed based on Detail
  // Detail: 0 = No destination needed, 1 = Station only, 2 = Call only, 3 = Both
  // When Detail > 0, the destination sheet can be opened
  const destinationConfig = useMemo(() => {
    if (!selectedStatus) {
      return { showStations: true, showCalls: true }; // Default to both when no status
    }
    // Detail 0 means no destination, but if sheet is open, show both as fallback
    if (selectedStatus.Detail === 0) {
      return { showStations: true, showCalls: true };
    }
    // Detail 1 = Station only, 2 = Call only, 3 = Both
    return {
      showStations: selectedStatus.Detail === 1 || selectedStatus.Detail === 3,
      showCalls: selectedStatus.Detail === 2 || selectedStatus.Detail === 3,
    };
  }, [selectedStatus]);

  // Check note requirement based on Note field
  // Note: 0 = No note, 1 = Optional, 2 = Required
  const statusNoteConfig = useMemo(() => {
    if (!selectedStatus) return { show: true, required: false };
    return {
      show: true, // Always show note
      required: selectedStatus.Note === 2,
    };
  }, [selectedStatus]);

  const staffingNoteConfig = useMemo(() => {
    if (!selectedStaffing) return { show: true, required: false };
    return {
      show: true, // Always show note
      required: selectedStaffing.Note === 2,
    };
  }, [selectedStaffing]);

  // Validate status can be submitted
  const canSubmitStatus = useMemo(() => {
    if (!selectedStatus) return false;
    // Check if note is required and not provided
    if (selectedStatus.Note === 2 && !statusNote.trim()) return false;
    return true;
  }, [selectedStatus, statusNote]);

  // Validate staffing can be submitted
  const canSubmitStaffing = useMemo(() => {
    if (!selectedStaffing) return false;
    // Check if note is required and not provided
    if (selectedStaffing.Note === 2 && !staffingNote.trim()) return false;
    return true;
  }, [selectedStaffing, staffingNote]);

  // Active calls for destination selection
  const activeCalls = useMemo(() => {
    const filtered = calls.filter((c) => isCallActive(c.State));
    console.log('[PersonnelActionsPanel] Active calls:', {
      totalCalls: calls.length,
      activeCalls: filtered.length,
      allStates: calls.map((c) => c.State),
    });
    return filtered;
  }, [calls]);

  // Refresh calls when destination sheet opens
  useEffect(() => {
    if (isDestinationSheetOpen) {
      fetchCalls();
    }
  }, [isDestinationSheetOpen, fetchCalls]);

  // Handle status selection
  const handleStatusSelect = (status: StatusesResultData) => {
    setSelectedStatus(status);
    setIsStatusSheetOpen(false);
    // If status requires destination, open destination sheet
    if (status.Detail > 0) {
      setTimeout(() => setIsDestinationSheetOpen(true), 300);
    }
  };

  // Handle staffing selection
  const handleStaffingSelect = (staffing: StatusesResultData) => {
    setSelectedStaffing(staffing);
    setIsStaffingSheetOpen(false);
  };

  // Handle destination selection
  const handleDestinationSelect = (type: 'none' | 'call' | 'station', item?: CallResultData | GroupResultData) => {
    if (type === 'none') {
      setStatusDestinationType('none');
      setStatusSelectedCall(null);
      setStatusSelectedStation(null);
    } else if (type === 'call' && item) {
      setStatusDestinationType('call');
      setStatusSelectedCall(item as CallResultData);
      setStatusSelectedStation(null);
    } else if (type === 'station' && item) {
      setStatusDestinationType('station');
      setStatusSelectedStation(item as GroupResultData);
      setStatusSelectedCall(null);
    }
    setIsDestinationSheetOpen(false);
  };

  // Don't render if no personnel selected
  if (!selectedPersonnel) {
    return null;
  }

  return (
    <>
      <Box className="rounded-lg border border-indigo-300 bg-white dark:border-indigo-700 dark:bg-gray-900">
        {/* Header with selected personnel */}
        <HStack className="items-center justify-between border-b border-gray-200 px-2 py-1.5 dark:border-gray-700">
          <HStack className="flex-1 items-center" space="xs">
            <View style={styles.avatar}>
              <Icon as={User} size="xs" className="text-indigo-500" />
            </View>
            <VStack className="flex-1">
              <Text className="text-sm font-semibold text-gray-800 dark:text-gray-100" numberOfLines={1}>
                {selectedPersonnel.FirstName} {selectedPersonnel.LastName}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                {selectedPersonnel.GroupName || t('dispatch.unassigned')}
              </Text>
            </VStack>
          </HStack>
          <Pressable onPress={closeActions} style={styles.closeButton}>
            <Icon as={X} size="xs" className="text-gray-500" />
          </Pressable>
        </HStack>

        {/* Loading State */}
        {isLoadingOptions ? (
          <VStack className="items-center justify-center p-4" space="xs">
            <Spinner size="small" />
            <Text className="text-xs text-gray-500 dark:text-gray-400">{t('common.loading')}</Text>
          </VStack>
        ) : (
          <VStack className="p-2" space="xs">
            {/* Status Selection Button */}
            <Pressable onPress={() => setIsStatusSheetOpen(true)}>
              <HStack className="items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                <HStack className="flex-1 items-center" space="sm">
                  <Icon as={Zap} size="sm" className="text-indigo-500" />
                  <VStack className="flex-1">
                    <Text className="text-xs text-gray-500 dark:text-gray-400">{t('dispatch.personnel_actions.status_tab')}</Text>
                    {selectedStatus ? (
                      <HStack className="items-center" space="xs">
                        <View style={{ ...styles.miniIndicator, backgroundColor: selectedStatus.BColor || '#6b7280' }} />
                        <Text className="text-sm font-medium text-gray-800 dark:text-gray-100">{selectedStatus.Text}</Text>
                      </HStack>
                    ) : (
                      <Text className="text-sm text-gray-400 dark:text-gray-500">{t('dispatch.personnel_actions.select_status')}</Text>
                    )}
                  </VStack>
                </HStack>
                <Icon as={ChevronRight} size="sm" className="text-gray-400" />
              </HStack>
            </Pressable>

            {/* Destination Button (only show if status is selected and supports destination) */}
            {selectedStatus && selectedStatus.Detail > 0 ? (
              <Pressable onPress={() => setIsDestinationSheetOpen(true)}>
                <HStack className="items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                  <HStack className="flex-1 items-center" space="sm">
                    <Icon as={statusDestinationType === 'call' ? Phone : Building2} size="sm" className="text-amber-500" />
                    <VStack className="flex-1">
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {t('dispatch.personnel_actions.destination')}
                      </Text>
                      <Text className="text-sm font-medium text-gray-800 dark:text-gray-100" numberOfLines={1}>
                        {getDestinationDisplay}
                      </Text>
                    </VStack>
                  </HStack>
                  <Icon as={ChevronRight} size="sm" className="text-gray-400" />
                </HStack>
              </Pressable>
            ) : null}

            {/* Status Note Input - Always visible */}
            <TextInput
              style={styles.noteInput}
              className={`rounded-lg border bg-white px-3 py-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 ${
                statusNoteConfig.required && !statusNote.trim() ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder={`${t('dispatch.personnel_actions.note')}${statusNoteConfig.required ? ' *' : ` (${t('common.optional')})`}`}
              placeholderTextColor="#9ca3af"
              value={statusNote}
              onChangeText={setStatusNote}
            />

            {/* Update Status Button */}
            {selectedStatus ? (
              <>
                {statusError ? <Text className="text-xs text-red-500">{statusError}</Text> : null}
                <Button size="sm" onPress={handleSubmitStatus} isDisabled={!canSubmitStatus || isSubmittingStatus} className="bg-indigo-600">
                  {isSubmittingStatus ? <ButtonSpinner color="white" /> : <Icon as={Send} size="xs" color="white" />}
                  <ButtonText className="ml-1 text-xs">{t('dispatch.personnel_actions.update_status')}</ButtonText>
                </Button>
              </>
            ) : null}

            {/* Divider */}
            <View className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

            {/* Staffing Selection Button */}
            <Pressable onPress={() => setIsStaffingSheetOpen(true)}>
              <HStack className="items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                <HStack className="flex-1 items-center" space="sm">
                  <Icon as={User} size="sm" className="text-green-500" />
                  <VStack className="flex-1">
                    <Text className="text-xs text-gray-500 dark:text-gray-400">{t('dispatch.personnel_actions.staffing_tab')}</Text>
                    {selectedStaffing ? (
                      <HStack className="items-center" space="xs">
                        <View style={{ ...styles.miniIndicator, backgroundColor: selectedStaffing.BColor || '#6b7280' }} />
                        <Text className="text-sm font-medium text-gray-800 dark:text-gray-100">{selectedStaffing.Text}</Text>
                      </HStack>
                    ) : (
                      <Text className="text-sm text-gray-400 dark:text-gray-500">{t('dispatch.personnel_actions.select_staffing')}</Text>
                    )}
                  </VStack>
                </HStack>
                <Icon as={ChevronRight} size="sm" className="text-gray-400" />
              </HStack>
            </Pressable>

            {/* Staffing Note Input - Always visible */}
            <TextInput
              style={styles.noteInput}
              className={`rounded-lg border bg-white px-3 py-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100 ${
                staffingNoteConfig.required && !staffingNote.trim() ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder={`${t('dispatch.personnel_actions.note')}${staffingNoteConfig.required ? ' *' : ` (${t('common.optional')})`}`}
              placeholderTextColor="#9ca3af"
              value={staffingNote}
              onChangeText={setStaffingNote}
            />

            {/* Update Staffing Button */}
            {selectedStaffing ? (
              <>
                {staffingError ? <Text className="text-xs text-red-500">{staffingError}</Text> : null}
                <Button size="sm" onPress={handleSubmitStaffing} isDisabled={!canSubmitStaffing || isSubmittingStaffing} className="bg-green-600">
                  {isSubmittingStaffing ? <ButtonSpinner color="white" /> : <Icon as={Send} size="xs" color="white" />}
                  <ButtonText className="ml-1 text-xs">{t('dispatch.personnel_actions.update_staffing')}</ButtonText>
                </Button>
              </>
            ) : null}
          </VStack>
        )}
      </Box>

      {/* Status Selection Action Sheet */}
      <Actionsheet isOpen={isStatusSheetOpen} onClose={() => setIsStatusSheetOpen(false)} snapPoints={[50]}>
        <ActionsheetBackdrop />
        <ActionsheetContent className="rounded-t-2xl bg-white px-4 pb-6 dark:bg-gray-900">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack className="w-full" space="md">
            <Text className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('dispatch.personnel_actions.select_status')}</Text>
            <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
              {availableStatuses.length === 0 ? (
                <Text className="py-4 text-center text-gray-500 dark:text-gray-400">{t('dispatch.personnel_actions.no_statuses_available')}</Text>
              ) : (
                availableStatuses.map((status) => (
                  <StatusSheetOption key={status.Id} status={status} isSelected={selectedStatus?.Id === status.Id} onSelect={() => handleStatusSelect(status)} />
                ))
              )}
            </ScrollView>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>

      {/* Staffing Selection Action Sheet */}
      <Actionsheet isOpen={isStaffingSheetOpen} onClose={() => setIsStaffingSheetOpen(false)} snapPoints={[50]}>
        <ActionsheetBackdrop />
        <ActionsheetContent className="rounded-t-2xl bg-white px-4 pb-6 dark:bg-gray-900">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack className="w-full" space="md">
            <Text className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('dispatch.personnel_actions.select_staffing')}</Text>
            <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
              {availableStaffings.length === 0 ? (
                <Text className="py-4 text-center text-gray-500 dark:text-gray-400">{t('dispatch.personnel_actions.no_staffings_available')}</Text>
              ) : (
                availableStaffings.map((staffing) => (
                  <StatusSheetOption key={staffing.Id} status={staffing} isSelected={selectedStaffing?.Id === staffing.Id} onSelect={() => handleStaffingSelect(staffing)} />
                ))
              )}
            </ScrollView>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>

      {/* Destination Selection Action Sheet */}
      <Actionsheet isOpen={isDestinationSheetOpen} onClose={() => setIsDestinationSheetOpen(false)} snapPoints={[90]}>
        <ActionsheetBackdrop />
        <ActionsheetContent className="flex-1 rounded-t-2xl bg-white px-4 pb-6 dark:bg-gray-900">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack className="w-full flex-1" space="sm">
            <Text className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('dispatch.personnel_actions.destination')}</Text>

            {/* No Destination Option */}
            <DestinationSheetOption
              type="none"
              isSelected={statusDestinationType === 'none'}
              onSelect={() => handleDestinationSelect('none')}
              label={t('dispatch.personnel_actions.no_destination')}
            />

            {/* Tabs for Calls and Stations */}
            {destinationConfig.showCalls || destinationConfig.showStations ? (
              <>
                <HStack className="rounded-lg bg-gray-100 p-1 dark:bg-gray-800" space="xs">
                  {destinationConfig.showCalls ? (
                    <Pressable
                      onPress={() => setDestinationTab('calls')}
                      className={`flex-1 rounded-md px-3 py-2 ${destinationTab === 'calls' ? 'bg-white shadow-sm dark:bg-gray-700' : ''}`}
                    >
                      <Text className={`text-center text-sm font-medium ${destinationTab === 'calls' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {t('dispatch.calls')} ({activeCalls.length})
                      </Text>
                    </Pressable>
                  ) : null}
                  {destinationConfig.showStations ? (
                    <Pressable
                      onPress={() => setDestinationTab('stations')}
                      className={`flex-1 rounded-md px-3 py-2 ${destinationTab === 'stations' ? 'bg-white shadow-sm dark:bg-gray-700' : ''}`}
                    >
                      <Text className={`text-center text-sm font-medium ${destinationTab === 'stations' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {t('dispatch.stations')} ({availableStations.length})
                      </Text>
                    </Pressable>
                  ) : null}
                </HStack>

                {/* Tab Content */}
                <ScrollView className="flex-1 pb-5" showsVerticalScrollIndicator>
                  {/* Calls Tab Content */}
                  {destinationTab === 'calls' && destinationConfig.showCalls ? (
                    <VStack space="xs">
                      {activeCalls.length > 0 ? (
                        activeCalls.map((call) => (
                          <DestinationSheetOption
                            key={call.CallId}
                            type="call"
                            item={call}
                            isSelected={statusDestinationType === 'call' && statusSelectedCall?.CallId === call.CallId}
                            onSelect={() => handleDestinationSelect('call', call)}
                          />
                        ))
                      ) : (
                        <Text className="py-8 text-center text-sm text-gray-400">{t('dispatch.personnel_actions.no_active_calls')}</Text>
                      )}
                    </VStack>
                  ) : null}

                  {/* Stations Tab Content */}
                  {destinationTab === 'stations' && destinationConfig.showStations ? (
                    <VStack space="xs">
                      {availableStations.length > 0 ? (
                        availableStations.map((station) => (
                          <DestinationSheetOption
                            key={station.GroupId}
                            type="station"
                            item={station}
                            isSelected={statusDestinationType === 'station' && statusSelectedStation?.GroupId === station.GroupId}
                            onSelect={() => handleDestinationSelect('station', station)}
                          />
                        ))
                      ) : (
                        <Text className="py-8 text-center text-sm text-gray-400">{t('dispatch.personnel_actions.no_stations_available')}</Text>
                      )}
                    </VStack>
                  ) : null}
                </ScrollView>
              </>
            ) : (
              <Text className="py-4 text-center text-gray-500 dark:text-gray-400">{t('dispatch.personnel_actions.no_destinations_available')}</Text>
            )}
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6366f1',
  },
  closeButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetList: {
    maxHeight: 300,
  },
  noteInput: {
    minHeight: 36,
    textAlignVertical: 'top',
  },
});
