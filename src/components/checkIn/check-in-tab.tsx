import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type CheckInTimerStatusResultData } from '@/models/v4/checkIn/checkInTimerStatusResultData';
import { useCheckInStore } from '@/stores/checkIn/store';
import { useSignalRStore } from '@/stores/signalr/signalr-store';

import { CheckInBottomSheet } from './check-in-bottom-sheet';
import { CheckInHistoryList } from './check-in-history-list';
import { CheckInTimerCard } from './check-in-timer-card';

interface CheckInTabProps {
  callId: number;
  checkInTimersEnabled: boolean;
}

export const CheckInTab: React.FC<CheckInTabProps> = ({ callId, checkInTimersEnabled }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState<CheckInTimerStatusResultData | null>(null);

  const {
    timerStatuses,
    checkInHistory,
    isLoadingStatuses,
    isLoadingHistory,
    statusError,
    fetchTimerStatuses,
    fetchCheckInHistory,
    fetchResolvedTimers,
    toggleTimers,
    startPolling,
    stopPolling,
    reset,
  } = useCheckInStore();

  const lastCheckInUpdateTimestamp = useSignalRStore((s) => s.lastCheckInUpdateTimestamp);

  // Initial data fetch
  useEffect(() => {
    if (callId && checkInTimersEnabled) {
      fetchTimerStatuses(callId);
      fetchResolvedTimers(callId);
      fetchCheckInHistory(callId);
      startPolling(callId);
    }
    return () => {
      stopPolling();
      reset();
    };
  }, [callId, checkInTimersEnabled, fetchTimerStatuses, fetchResolvedTimers, fetchCheckInHistory, startPolling, stopPolling, reset]);

  // React to SignalR check-in updates
  useEffect(() => {
    if (lastCheckInUpdateTimestamp > 0 && callId) {
      fetchTimerStatuses(callId);
      fetchCheckInHistory(callId);
    }
  }, [lastCheckInUpdateTimestamp, callId, fetchTimerStatuses, fetchCheckInHistory]);

  const handleCheckIn = useCallback((timer: CheckInTimerStatusResultData) => {
    setSelectedTimer(timer);
    setIsBottomSheetOpen(true);
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    setIsBottomSheetOpen(false);
    setSelectedTimer(null);
  }, []);

  const criticalCount = timerStatuses.filter((s) => s.Status === 'Critical').length;
  const overdueCount = timerStatuses.filter((s) => s.Status === 'Overdue' || s.Status === 'Red').length;
  const warningCount = timerStatuses.filter((s) => s.Status === 'Warning' || s.Status === 'Yellow').length;
  const okCount = timerStatuses.filter((s) => s.Status === 'Ok' || s.Status === 'Green').length;

  const renderTimer = ({ item }: { item: CheckInTimerStatusResultData }) => (
    <CheckInTimerCard timer={item} onCheckIn={handleCheckIn} />
  );

  return (
    <VStack className="flex-1 p-4">
      {!checkInTimersEnabled && (
        <Box className="mb-3 p-4">
          <Text className="text-center text-gray-500">{t('check_in.timers_disabled')}</Text>
        </Box>
      )}

      {checkInTimersEnabled && !isLoadingStatuses && timerStatuses.length === 0 && !statusError && (
        <Box className="mb-3 p-4">
          <Text className="text-center text-gray-500">{t('check_in.no_timers')}</Text>
        </Box>
      )}

      {/* Summary header */}
      {checkInTimersEnabled && timerStatuses.length > 0 && (
        <HStack className="mb-3 items-center gap-2">
          {criticalCount > 0 && (
            <Box className="rounded-full bg-red-200 px-2 py-0.5">
              <Text className="text-xs font-bold text-red-700">
                {criticalCount} {t('check_in.status_critical')}
              </Text>
            </Box>
          )}
          {overdueCount > 0 && (
            <Box className="rounded-full bg-red-100 px-2 py-0.5">
              <Text className="text-xs font-medium text-red-600">
                {t('check_in.overdue_count', { count: overdueCount })}
              </Text>
            </Box>
          )}
          {warningCount > 0 && (
            <Box className="ml-1 rounded-full bg-amber-100 px-2 py-0.5">
              <Text className="text-xs font-medium text-amber-600">
                {t('check_in.warning_count', { count: warningCount })}
              </Text>
            </Box>
          )}
          {okCount > 0 && (
            <Box className="ml-1 rounded-full bg-green-100 px-2 py-0.5">
              <Text className="text-xs font-medium text-green-600">
                {okCount} {t('check_in.status_ok')}
              </Text>
            </Box>
          )}
        </HStack>
      )}

      {statusError && (
        <Box className="mb-2 rounded-lg bg-red-50 p-2">
          <Text className="text-xs text-red-500">{statusError}</Text>
        </Box>
      )}

      {/* Timer list */}
      {checkInTimersEnabled && timerStatuses.length > 0 && (
        <FlatList
          data={timerStatuses}
          renderItem={renderTimer}
          keyExtractor={(item) => `${item.TargetType}-${item.TargetEntityId}`}
          scrollEnabled={false}
        />
      )}

      {/* Toggle timers button */}
      <Box className="mt-3">
        <Button
          variant="outline"
          size="sm"
          onPress={() => toggleTimers(callId, !checkInTimersEnabled)}
        >
          <ButtonText className="text-xs">
            {checkInTimersEnabled ? t('check_in.disable_timers') : t('check_in.enable_timers')}
          </ButtonText>
        </Button>
      </Box>

      {/* History */}
      <CheckInHistoryList history={checkInHistory} isLoading={isLoadingHistory} />

      {/* Check-in bottom sheet */}
      <CheckInBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={handleCloseBottomSheet}
        callId={callId}
        selectedTimer={selectedTimer}
        timers={timerStatuses}
      />
    </VStack>
  );
};
