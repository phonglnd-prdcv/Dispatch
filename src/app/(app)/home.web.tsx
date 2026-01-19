import { useFocusEffect } from '@react-navigation/native';
import { type Href, router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { getCallNotes, saveCallNote } from '@/api/calls/callNotes';
import { getCallExtraData } from '@/api/calls/calls';
import { getMapDataAndMarkers } from '@/api/mapping/mapping';
import { AudioStreamBottomSheet } from '@/components/audio-stream/audio-stream-bottom-sheet';
import { ActiveCallFilterBanner, ActiveCallsPanel, ActivityLogPanel, MapWidget, NotesPanel, PersonnelPanel, PTTInterface, StatsHeader, UnitsPanel } from '@/components/dispatch-console';
import { Box } from '@/components/ui/box';
import { FocusAwareStatusBar } from '@/components/ui/focus-aware-status-bar';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { useAnalytics } from '@/hooks/use-analytics';
import { logger } from '@/lib/logging';
import { isCallActive, isCallPending, isCallScheduled } from '@/lib/utils';
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';
import useAuthStore from '@/stores/auth/store';
import { useCallsStore } from '@/stores/calls/store';
import { useDispatchConsoleStore } from '@/stores/dispatch/dispatch-console-store';
import { useHomeStore } from '@/stores/home/home-store';
import { useNotesStore } from '@/stores/notes/store';
import { usePersonnelStore } from '@/stores/personnel/store';
import { type SignalREventType, useSignalRStore } from '@/stores/signalr/signalr-store';
import { useUnitsStore } from '@/stores/units/store';

export default function DispatchConsoleWeb() {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;

  // Store hooks
  const { refreshAll } = useHomeStore();
  const { userId } = useAuthStore();
  const { calls, callPriorities, isLoading: callsLoading, fetchCalls, fetchCallPriorities } = useCallsStore();
  const { units, isLoading: unitsLoading, fetchUnits } = useUnitsStore();
  const { personnel, isLoading: personnelLoading, fetchPersonnel } = usePersonnelStore();
  const { notes, isLoading: notesLoading, fetchNotes } = useNotesStore();

  // SignalR store - subscribe to specific event timestamps
  const {
    lastEventType,
    lastPersonnelUpdateTimestamp,
    lastUnitsUpdateTimestamp,
    lastCallsUpdateTimestamp,
    isUpdateHubConnected,
  } = useSignalRStore();

  // Dispatch console store
  const {
    selectedCallId,
    selectedUnitId,
    selectedPersonnelId,
    activityLog,
    radioLog,
    isTransmitting,
    currentChannel,
    isCallFilterActive,
    selectedCallExtraData,
    selectedCallNotes,
    isLoadingCallData,
    mapCenterLatitude,
    mapCenterLongitude,
    setSelectedCallId,
    setSelectedUnitId,
    setSelectedPersonnelId,
    addActivityLogEntry,
    setIsTransmitting,
    toggleCallFilter,
    clearCallFilter,
    setCallExtraData,
    setCallNotes,
    setIsLoadingCallData,
    setMapCenter,
  } = useDispatchConsoleStore();

  // Local state
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [selectedPersonnelData, setSelectedPersonnelData] = useState<PersonnelInfoResultData | null>(null);

  // Track previous timestamps to detect changes
  const prevPersonnelTimestamp = useRef(0);
  const prevUnitsTimestamp = useRef(0);
  const prevCallsTimestamp = useRef(0);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize data when component mounts
  useEffect(() => {
    refreshAll();
    fetchCalls();
    fetchCallPriorities();
    fetchUnits();
    fetchPersonnel();
    fetchNotes();
    fetchMapCenter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch map center coordinates for weather
  const fetchMapCenter = async () => {
    try {
      const mapData = await getMapDataAndMarkers();
      if (mapData?.Data?.CenterLat && mapData?.Data?.CenterLon) {
        const lat = parseFloat(mapData.Data.CenterLat);
        const lon = parseFloat(mapData.Data.CenterLon);
        if (!isNaN(lat) && !isNaN(lon)) {
          setMapCenter(lat, lon);
        }
      }
    } catch (error) {
      logger.error({
        message: 'Failed to fetch map center for weather',
        context: { error },
      });
    }
  };

  // Track analytics when view becomes visible
  useFocusEffect(
    useCallback(() => {
      trackEvent('dispatch_console_viewed', {
        timestamp: new Date().toISOString(),
        isLandscape,
        isTablet,
        platform: 'web',
      });
    }, [trackEvent, isLandscape, isTablet])
  );

  // Helper function to get event description for activity log
  const getEventDescription = (eventType: SignalREventType | null): string => {
    switch (eventType) {
      case 'personnelStatusUpdated':
        return t('dispatch.personnel_status_updated');
      case 'personnelStaffingUpdated':
        return t('dispatch.personnel_staffing_updated');
      case 'unitStatusUpdated':
        return t('dispatch.unit_status_updated');
      case 'callsUpdated':
        return t('dispatch.calls_updated');
      case 'callAdded':
        return t('dispatch.call_added');
      case 'callClosed':
        return t('dispatch.call_closed');
      default:
        return t('dispatch.data_refreshed');
    }
  };

  // Listen for SignalR personnel updates
  useEffect(() => {
    if (lastPersonnelUpdateTimestamp > 0 && lastPersonnelUpdateTimestamp !== prevPersonnelTimestamp.current) {
      prevPersonnelTimestamp.current = lastPersonnelUpdateTimestamp;

      logger.info({
        message: 'SignalR: Personnel update received, refreshing personnel data',
        context: { eventType: lastEventType, timestamp: lastPersonnelUpdateTimestamp },
      });

      addActivityLogEntry({
        type: 'personnel',
        action: t('dispatch.signalr_update'),
        description: getEventDescription(lastEventType),
      });

      fetchPersonnel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPersonnelUpdateTimestamp]);

  // Listen for SignalR units updates
  useEffect(() => {
    if (lastUnitsUpdateTimestamp > 0 && lastUnitsUpdateTimestamp !== prevUnitsTimestamp.current) {
      prevUnitsTimestamp.current = lastUnitsUpdateTimestamp;

      logger.info({
        message: 'SignalR: Units update received, refreshing units data',
        context: { eventType: lastEventType, timestamp: lastUnitsUpdateTimestamp },
      });

      addActivityLogEntry({
        type: 'unit',
        action: t('dispatch.signalr_update'),
        description: getEventDescription(lastEventType),
      });

      fetchUnits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUnitsUpdateTimestamp]);

  // Listen for SignalR calls updates
  useEffect(() => {
    if (lastCallsUpdateTimestamp > 0 && lastCallsUpdateTimestamp !== prevCallsTimestamp.current) {
      prevCallsTimestamp.current = lastCallsUpdateTimestamp;

      logger.info({
        message: 'SignalR: Calls update received, refreshing calls data',
        context: { eventType: lastEventType, timestamp: lastCallsUpdateTimestamp },
      });

      addActivityLogEntry({
        type: 'call',
        action: t('dispatch.signalr_update'),
        description: getEventDescription(lastEventType),
      });

      fetchCalls();
      // Also refresh notes if we have a selected call (call data may have changed)
      if (selectedCallId) {
        fetchNotes();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCallsUpdateTimestamp]);

  // Log when SignalR hub connection status changes
  useEffect(() => {
    if (isUpdateHubConnected) {
      logger.info({
        message: 'SignalR Update Hub connected - dispatch console ready for real-time updates',
      });
      addActivityLogEntry({
        type: 'system',
        action: t('dispatch.signalr_connected'),
        description: t('dispatch.realtime_updates_active'),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdateHubConnected]);

  // Fetch call extra data and notes when filter is active
  useEffect(() => {
    const fetchCallData = async () => {
      if (isCallFilterActive && selectedCallId) {
        setIsLoadingCallData(true);
        try {
          const [extraDataResponse, notesResponse] = await Promise.all([getCallExtraData(selectedCallId), getCallNotes(selectedCallId)]);

          if (extraDataResponse.Data) {
            setCallExtraData(extraDataResponse.Data);
          }
          if (notesResponse.Data) {
            setCallNotes(notesResponse.Data);
          }
        } catch (error) {
          console.error('Error fetching call data:', error);
        } finally {
          setIsLoadingCallData(false);
        }
      }
    };

    fetchCallData();
  }, [isCallFilterActive, selectedCallId, setIsLoadingCallData, setCallExtraData, setCallNotes]);

  // Memoized selected call
  const selectedCall = useMemo(() => {
    return calls.find((c) => c.CallId === selectedCallId);
  }, [calls, selectedCallId]);

  // Memoized selected call priority
  const selectedCallPriority = useMemo(() => {
    if (!selectedCall) return undefined;
    return callPriorities.find((p) => p.Id === selectedCall.Priority);
  }, [selectedCall, callPriorities]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeCalls = calls.filter((c) => isCallActive(c.State)).length;
    const pendingCalls = calls.filter((c) => isCallPending(c.State)).length;
    const scheduledCalls = calls.filter((c) => isCallScheduled(c.State)).length;
    const availableUnits = units.filter((u) => !u.CurrentStatusId || u.CurrentStatusId === 'available').length;
    const onSceneUnits = units.filter((u) => u.CurrentStatusId === 'on_scene').length;
    const onDutyPersonnel = personnel.filter((p) => p.Staffing && p.Staffing.toLowerCase() !== 'off duty').length;

    return {
      activeCalls,
      pendingCalls,
      scheduledCalls,
      unitsAvailable: availableUnits,
      unitsOnScene: onSceneUnits,
      personnelOnDuty: onDutyPersonnel,
    };
  }, [calls, units, personnel]);

  // Handle PTT
  const handlePTTPress = () => {
    setIsTransmitting(true);
    addActivityLogEntry({
      type: 'system',
      action: t('dispatch.ptt_start'),
      description: t('dispatch.transmitting_on', { channel: currentChannel }),
    });
  };

  const handlePTTRelease = () => {
    setIsTransmitting(false);
    addActivityLogEntry({
      type: 'system',
      action: t('dispatch.ptt_end'),
      description: t('dispatch.transmission_ended'),
    });
  };

  // Handle call selection - now toggles filter mode
  const handleSelectCall = (callId: string) => {
    toggleCallFilter(callId);
    const call = calls.find((c) => c.CallId === callId);
    if (call) {
      addActivityLogEntry({
        type: 'call',
        action: isCallFilterActive && selectedCallId === callId ? t('dispatch.call_filter_cleared') : t('dispatch.call_filter_active'),
        description: `#${call.Number} - ${call.Name || call.Nature}`,
        metadata: { callId },
      });
    }
  };

  // Handle unit selection - toggle if already selected
  const handleSelectUnit = (unitId: string) => {
    const isAlreadySelected = selectedUnitId === unitId;
    setSelectedUnitId(isAlreadySelected ? null : unitId);
    const unit = units.find((u) => u.UnitId === unitId);
    if (unit) {
      addActivityLogEntry({
        type: 'unit',
        action: isAlreadySelected ? t('dispatch.unit_deselected') : t('dispatch.unit_selected'),
        description: unit.Name,
        metadata: { unitId },
      });
    }
  };

  // Handle personnel selection - toggle if already selected
  const handleSelectPersonnel = (personnelId: string, person?: PersonnelInfoResultData) => {
    const isAlreadySelected = selectedPersonnelId === personnelId;
    setSelectedPersonnelId(isAlreadySelected ? null : personnelId);
    setSelectedPersonnelData(isAlreadySelected ? null : (person ?? null));
    if (person) {
      addActivityLogEntry({
        type: 'personnel',
        action: isAlreadySelected ? t('dispatch.personnel_deselected') : t('dispatch.personnel_selected'),
        description: `${person.FirstName} ${person.LastName}`,
        metadata: { personnelId },
      });
    }
  };

  // Handle status/staffing update completion - refresh personnel list
  const handleStatusUpdated = useCallback(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  const handleStaffingUpdated = useCallback(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  // Handle expanding map
  const handleExpandMap = () => {
    router.push('/(app)/home/map' as Href);
  };

  // Handle clearing call filter
  const handleClearCallFilter = () => {
    clearCallFilter();
    addActivityLogEntry({
      type: 'system',
      action: t('dispatch.call_filter_cleared'),
      description: t('dispatch.showing_all_data'),
    });
  };

  // Handle adding call note
  const handleAddCallNote = async (note: string) => {
    if (!selectedCallId || !note.trim() || !userId) return;

    setIsAddingNote(true);
    try {
      await saveCallNote(selectedCallId, userId, note, null, null);

      // Refresh call notes
      const notesResponse = await getCallNotes(selectedCallId);
      if (notesResponse.Data) {
        setCallNotes(notesResponse.Data);
      }

      addActivityLogEntry({
        type: 'call',
        action: t('dispatch.note_added'),
        description: note.substring(0, 50) + (note.length > 50 ? '...' : ''),
        metadata: { callId: selectedCallId },
      });
    } catch (error) {
      console.error('Error adding call note:', error);
    } finally {
      setIsAddingNote(false);
    }
  };

  // Handle setting unit status for call
  const handleSetUnitStatusForCall = (unitId: string) => {
    const unit = units.find((u) => u.UnitId === unitId);
    if (unit) {
      addActivityLogEntry({
        type: 'unit',
        action: t('dispatch.unit_status_change'),
        description: `${unit.Name}`,
        metadata: { unitId, callId: selectedCallId ?? undefined },
      });
      // TODO: Implement status change modal or action
    }
  };

  // Handle setting personnel status for call
  const handleSetPersonnelStatusForCall = (personnelId: string) => {
    const person = personnel.find((p) => p.UserId === personnelId);
    if (person) {
      addActivityLogEntry({
        type: 'personnel',
        action: t('dispatch.personnel_status_change'),
        description: `${person.FirstName} ${person.LastName}`,
        metadata: { personnelId, callId: selectedCallId ?? undefined },
      });
      // TODO: Implement status change modal or action
    }
  };

  // Determine layout based on screen size and orientation
  const renderLayout = () => {
    // Desktop/Tablet landscape - 3-column layout
    if (isTablet && isLandscape) {
      return (
        <HStack className="flex-1" space="sm">
          {/* Left Column - Calls & Units */}
          <VStack className="flex-1" space="sm" style={styles.column}>
            <ActiveCallsPanel
              selectedCallId={selectedCallId ?? undefined}
              onSelectCall={handleSelectCall}
              isFilterActive={isCallFilterActive}
            />
            <UnitsPanel
              units={units}
              isLoading={unitsLoading}
              onRefresh={fetchUnits}
              selectedUnitId={selectedUnitId ?? undefined}
              onSelectUnit={handleSelectUnit}
              isCallFilterActive={isCallFilterActive}
              selectedCallId={selectedCallId ?? undefined}
              callDispatches={selectedCallExtraData?.Dispatches}
              onSetUnitStatusForCall={handleSetUnitStatusForCall}
            />
          </VStack>

          {/* Center Column - Map */}
          <VStack className="flex-[1.5]" space="sm" style={styles.column}>
            <MapWidget onExpandMap={handleExpandMap} />
            <ActivityLogPanel
              debugId="web-tablet-landscape"
              entries={activityLog}
              isLoading={false}
              isCallFilterActive={isCallFilterActive}
              selectedCallId={selectedCallId ?? undefined}
              callActivity={selectedCallExtraData?.Activity}
              radioLog={radioLog}
              selectedUnitId={selectedUnitId ?? undefined}
              selectedPersonnelId={selectedPersonnelId ?? undefined}
              selectedPersonnel={selectedPersonnelData}
              onStatusUpdated={handleStatusUpdated}
              onStaffingUpdated={handleStaffingUpdated}
            />
          </VStack>

          {/* Right Column - Personnel, Notes, PTT */}
          <VStack className="flex-1" space="sm" style={styles.column}>
            <PersonnelPanel
              personnel={personnel}
              isLoading={personnelLoading}
              onRefresh={fetchPersonnel}
              selectedPersonnelId={selectedPersonnelId ?? undefined}
              onSelectPersonnel={handleSelectPersonnel}
              isCallFilterActive={isCallFilterActive}
              selectedCallId={selectedCallId ?? undefined}
              callDispatches={selectedCallExtraData?.Dispatches}
              onSetPersonnelStatusForCall={handleSetPersonnelStatusForCall}
            />
            <NotesPanel
              notes={notes}
              isLoading={notesLoading || isLoadingCallData}
              onRefresh={fetchNotes}
              isCallFilterActive={isCallFilterActive}
              callNotes={selectedCallNotes}
              onAddCallNote={handleAddCallNote}
              isAddingNote={isAddingNote}
            />
            <PTTInterface onPTTPress={handlePTTPress} onPTTRelease={handlePTTRelease} isTransmitting={isTransmitting} currentChannel={currentChannel} />
          </VStack>
        </HStack>
      );
    }

    // Tablet portrait - 2-column layout
    if (isTablet) {
      return (
        <HStack className="flex-1" space="sm">
          {/* Left Column */}
          <VStack className="flex-1" space="sm" style={styles.column}>
            <ActiveCallsPanel
              selectedCallId={selectedCallId ?? undefined}
              onSelectCall={handleSelectCall}
              isFilterActive={isCallFilterActive}
            />
            <UnitsPanel
              units={units}
              isLoading={unitsLoading}
              onRefresh={fetchUnits}
              selectedUnitId={selectedUnitId ?? undefined}
              onSelectUnit={handleSelectUnit}
              isCallFilterActive={isCallFilterActive}
              selectedCallId={selectedCallId ?? undefined}
              callDispatches={selectedCallExtraData?.Dispatches}
              onSetUnitStatusForCall={handleSetUnitStatusForCall}
            />
            <PersonnelPanel
              personnel={personnel}
              isLoading={personnelLoading}
              onRefresh={fetchPersonnel}
              selectedPersonnelId={selectedPersonnelId ?? undefined}
              onSelectPersonnel={handleSelectPersonnel}
              isCallFilterActive={isCallFilterActive}
              selectedCallId={selectedCallId ?? undefined}
              callDispatches={selectedCallExtraData?.Dispatches}
              onSetPersonnelStatusForCall={handleSetPersonnelStatusForCall}
            />
          </VStack>

          {/* Right Column */}
          <VStack className="flex-1" space="sm" style={styles.column}>
            <MapWidget onExpandMap={handleExpandMap} />
            <NotesPanel
              notes={notes}
              isLoading={notesLoading || isLoadingCallData}
              onRefresh={fetchNotes}
              isCallFilterActive={isCallFilterActive}
              callNotes={selectedCallNotes}
              onAddCallNote={handleAddCallNote}
              isAddingNote={isAddingNote}
            />
            <PTTInterface onPTTPress={handlePTTPress} onPTTRelease={handlePTTRelease} isTransmitting={isTransmitting} currentChannel={currentChannel} />
            <ActivityLogPanel
              debugId="web-tablet-portrait"
              entries={activityLog}
              isLoading={false}
              isCallFilterActive={isCallFilterActive}
              selectedCallId={selectedCallId ?? undefined}
              callActivity={selectedCallExtraData?.Activity}
              radioLog={radioLog}
              selectedUnitId={selectedUnitId ?? undefined}
              selectedPersonnelId={selectedPersonnelId ?? undefined}
              selectedPersonnel={selectedPersonnelData}
              onStatusUpdated={handleStatusUpdated}
              onStaffingUpdated={handleStaffingUpdated}
            />
          </VStack>
        </HStack>
      );
    }

    // Phone - single column scrollable layout
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <VStack space="sm">
          <ActiveCallsPanel
            selectedCallId={selectedCallId ?? undefined}
            onSelectCall={handleSelectCall}
            isFilterActive={isCallFilterActive}
          />

          <MapWidget onExpandMap={handleExpandMap} />

          <HStack space="sm">
            <Box className="flex-1">
              <UnitsPanel
                units={units}
                isLoading={unitsLoading}
                onRefresh={fetchUnits}
                selectedUnitId={selectedUnitId ?? undefined}
                onSelectUnit={handleSelectUnit}
                isCallFilterActive={isCallFilterActive}
                selectedCallId={selectedCallId ?? undefined}
                callDispatches={selectedCallExtraData?.Dispatches}
                onSetUnitStatusForCall={handleSetUnitStatusForCall}
              />
            </Box>
            <Box className="flex-1">
              <PersonnelPanel
                personnel={personnel}
                isLoading={personnelLoading}
                onRefresh={fetchPersonnel}
                selectedPersonnelId={selectedPersonnelId ?? undefined}
                onSelectPersonnel={handleSelectPersonnel}
                isCallFilterActive={isCallFilterActive}
                selectedCallId={selectedCallId ?? undefined}
                callDispatches={selectedCallExtraData?.Dispatches}
                onSetPersonnelStatusForCall={handleSetPersonnelStatusForCall}
              />
            </Box>
          </HStack>

          <PTTInterface onPTTPress={handlePTTPress} onPTTRelease={handlePTTRelease} isTransmitting={isTransmitting} currentChannel={currentChannel} />

          <NotesPanel
            notes={notes}
            isLoading={notesLoading || isLoadingCallData}
            onRefresh={fetchNotes}
            isCallFilterActive={isCallFilterActive}
            callNotes={selectedCallNotes}
            onAddCallNote={handleAddCallNote}
            isAddingNote={isAddingNote}
          />

          <ActivityLogPanel
            debugId="web-phone"
            entries={activityLog}
            isLoading={false}
            isCallFilterActive={isCallFilterActive}
            selectedCallId={selectedCallId ?? undefined}
            callActivity={selectedCallExtraData?.Activity}
            radioLog={radioLog}
            selectedUnitId={selectedUnitId ?? undefined}
            selectedPersonnelId={selectedPersonnelId ?? undefined}
            selectedPersonnel={selectedPersonnelData}
            onStatusUpdated={handleStatusUpdated}
            onStaffingUpdated={handleStaffingUpdated}
          />
        </VStack>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container} testID="dispatch-console-container">
      <FocusAwareStatusBar />

      {/* Stats Header */}
      <StatsHeader
        activeCalls={stats.activeCalls}
        pendingCalls={stats.pendingCalls}
        scheduledCalls={stats.scheduledCalls}
        unitsAvailable={stats.unitsAvailable}
        unitsOnScene={stats.unitsOnScene}
        personnelOnDuty={stats.personnelOnDuty}
        currentTime={currentTime}
        weatherLatitude={mapCenterLatitude}
        weatherLongitude={mapCenterLongitude}
      />

      {/* Active Call Filter Banner */}
      {isCallFilterActive && selectedCall && <ActiveCallFilterBanner call={selectedCall} priority={selectedCallPriority} onClearFilter={handleClearCallFilter} />}

      {/* Main Content */}
      <Box className="flex-1 bg-gray-100 p-2 dark:bg-gray-950">{renderLayout()}</Box>

      {/* Audio Stream Bottom Sheet */}
      <AudioStreamBottomSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  column: {
    minWidth: 0,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
