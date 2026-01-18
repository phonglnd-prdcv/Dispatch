import { useFocusEffect } from '@react-navigation/native';
import { type Href, router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import useAuthStore from '@/stores/auth/store';
import { useCallsStore } from '@/stores/calls/store';
import { useDispatchConsoleStore } from '@/stores/dispatch/dispatch-console-store';
import { useHomeStore } from '@/stores/home/home-store';
import { useNotesStore } from '@/stores/notes/store';
import { usePersonnelStore } from '@/stores/personnel/store';
import { useSignalRStore } from '@/stores/signalr/signalr-store';
import { useUnitsStore } from '@/stores/units/store';

export default function DispatchConsole() {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { colorScheme } = useColorScheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;

  // Store hooks
  const { refreshAll } = useHomeStore();
  const { calls, callPriorities, isLoading: callsLoading, fetchCalls, fetchCallPriorities } = useCallsStore();
  const { units, isLoading: unitsLoading, fetchUnits } = useUnitsStore();
  const { personnel, isLoading: personnelLoading, fetchPersonnel } = usePersonnelStore();
  const { notes, isLoading: notesLoading, fetchNotes } = useNotesStore();
  const { lastUpdateTimestamp } = useSignalRStore();
  const { userId } = useAuthStore();

  // Dispatch console store
  const {
    selectedCallId,
    selectedUnitId,
    selectedPersonnelId,
    activityLog,
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
    toggleCallFilter,
    clearCallFilter,
    setCallExtraData,
    setCallNotes,
    setIsLoadingCallData,
    setMapCenter,
    addActivityLogEntry,
    setIsTransmitting,
  } = useDispatchConsoleStore();

  // Local state
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  const [isAddingNote, setIsAddingNote] = useState(false);

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
      });
    }, [trackEvent, isLandscape, isTablet])
  );

  // Listen for SignalR updates and refresh data
  useEffect(() => {
    if (lastUpdateTimestamp > 0) {
      // Add activity log entry for update
      addActivityLogEntry({
        type: 'system',
        action: t('dispatch.system_update'),
        description: t('dispatch.data_refreshed'),
      });

      // Refresh data
      fetchCalls();
      fetchUnits();
      fetchPersonnel();

      // Refresh call data if filter is active
      if (isCallFilterActive && selectedCallId) {
        fetchCallData(selectedCallId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdateTimestamp]);

  // Fetch call extra data and notes when a call is selected for filtering
  useEffect(() => {
    if (isCallFilterActive && selectedCallId) {
      fetchCallData(selectedCallId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCallFilterActive, selectedCallId]);

  // Fetch call extra data and notes
  const fetchCallData = async (callId: string) => {
    setIsLoadingCallData(true);
    try {
      const [extraDataResponse, notesResponse] = await Promise.all([getCallExtraData(callId), getCallNotes(callId)]);

      if (extraDataResponse?.Data) {
        setCallExtraData(extraDataResponse.Data);
      }
      if (notesResponse?.Data) {
        setCallNotes(notesResponse.Data);
      }
    } catch (error) {
      logger.error({
        message: 'Failed to fetch call data',
        context: { error, callId },
      });
    } finally {
      setIsLoadingCallData(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const activeCalls = calls.filter((c) => c.State === 'Active' || c.State === 'Open').length;
    const pendingCalls = calls.filter((c) => c.State === 'Pending').length;
    const scheduledCalls = calls.filter((c) => c.State === 'Scheduled').length;
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
      const currentlySelected = selectedCallId === callId && isCallFilterActive;
      addActivityLogEntry({
        type: 'call',
        action: currentlySelected ? t('dispatch.call_filter_cleared') : t('dispatch.call_filter_active'),
        description: `#${call.Number} - ${call.Name || call.Nature}`,
        metadata: { callId },
      });
    }
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

  // Handle adding a note to the selected call
  const handleAddCallNote = async (note: string) => {
    if (!selectedCallId || !userId) return;

    setIsAddingNote(true);
    try {
      await saveCallNote(selectedCallId, userId, note, null, null);
      // Refresh call notes
      const notesResponse = await getCallNotes(selectedCallId);
      if (notesResponse?.Data) {
        setCallNotes(notesResponse.Data);
      }
      addActivityLogEntry({
        type: 'call',
        action: t('dispatch.note_added'),
        description: note.substring(0, 50) + (note.length > 50 ? '...' : ''),
        metadata: { callId: selectedCallId },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to add call note',
        context: { error, callId: selectedCallId },
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  // Handle setting unit status for a call
  const handleSetUnitStatusForCall = (unitId: string, unitName: string) => {
    // This could open a status selection modal or navigate to unit status screen
    addActivityLogEntry({
      type: 'unit',
      action: t('dispatch.unit_status_change'),
      description: unitName,
      metadata: { unitId, callId: selectedCallId ?? undefined },
    });
    // For now, we'll log the event - in a full implementation, this would open a status picker
  };

  // Handle setting personnel status for a call
  const handleSetPersonnelStatusForCall = (personnelId: string, personnelName: string) => {
    addActivityLogEntry({
      type: 'personnel',
      action: t('dispatch.personnel_status_change'),
      description: personnelName,
      metadata: { personnelId, callId: selectedCallId ?? undefined },
    });
    // For now, we'll log the event - in a full implementation, this would open a status picker
  };

  // Get selected call for filter banner
  const selectedCall = useMemo(() => {
    if (!isCallFilterActive || !selectedCallId) return null;
    return calls.find((c) => c.CallId === selectedCallId);
  }, [calls, selectedCallId, isCallFilterActive]);

  const selectedCallPriority = useMemo(() => {
    if (!selectedCall) return undefined;
    return callPriorities.find((p) => p.Id === selectedCall.Priority);
  }, [selectedCall, callPriorities]);

  // Handle unit selection
  const handleSelectUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    const unit = units.find((u) => u.UnitId === unitId);
    if (unit) {
      addActivityLogEntry({
        type: 'unit',
        action: t('dispatch.unit_selected'),
        description: unit.Name,
        metadata: { unitId },
      });
    }
  };

  // Handle personnel selection
  const handleSelectPersonnel = (personnelId: string) => {
    setSelectedPersonnelId(personnelId);
    const person = personnel.find((p) => p.UserId === personnelId);
    if (person) {
      addActivityLogEntry({
        type: 'personnel',
        action: t('dispatch.personnel_selected'),
        description: `${person.FirstName} ${person.LastName}`,
        metadata: { personnelId },
      });
    }
  };

  // Handle expanding map
  const handleExpandMap = () => {
    router.push('/(app)/map' as Href);
  };

  // Determine layout based on screen size and orientation
  const renderLayout = () => {
    // Tablet landscape - 3-column layout
    if (isTablet && isLandscape) {
      return (
        <HStack className="flex-1" space="sm">
          {/* Left Column - Calls & Units */}
          <VStack className="flex-1" space="sm" style={styles.column}>
            <ActiveCallsPanel selectedCallId={selectedCallId ?? undefined} onSelectCall={handleSelectCall} isFilterActive={isCallFilterActive} />
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
            <MapWidget onExpandMap={handleExpandMap} autoFetchPins={true} />
            <ActivityLogPanel entries={activityLog} isLoading={false} isCallFilterActive={isCallFilterActive} selectedCallId={selectedCallId ?? undefined} callActivity={selectedCallExtraData?.Activity} />
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
            <ActiveCallsPanel selectedCallId={selectedCallId ?? undefined} onSelectCall={handleSelectCall} isFilterActive={isCallFilterActive} />
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
            <MapWidget onExpandMap={handleExpandMap} autoFetchPins={true} />
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
            <ActivityLogPanel entries={activityLog} isLoading={false} isCallFilterActive={isCallFilterActive} selectedCallId={selectedCallId ?? undefined} callActivity={selectedCallExtraData?.Activity} />
          </VStack>
        </HStack>
      );
    }

    // Phone - single column scrollable layout
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <VStack space="sm">
          <ActiveCallsPanel selectedCallId={selectedCallId ?? undefined} onSelectCall={handleSelectCall} isFilterActive={isCallFilterActive} />

          <MapWidget onExpandMap={handleExpandMap} autoFetchPins={true} />

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

          <ActivityLogPanel entries={activityLog} isLoading={false} isCallFilterActive={isCallFilterActive} selectedCallId={selectedCallId ?? undefined} callActivity={selectedCallExtraData?.Activity} />
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
  map: {
    flex: 1,
    minHeight: 200,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
