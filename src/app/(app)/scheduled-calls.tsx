import { useFocusEffect } from '@react-navigation/native';
import { type Href, router, Stack } from 'expo-router';
import { CalendarClockIcon, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, View } from 'react-native';

import { getCallExtraData } from '@/api/calls/calls';
import { ScheduledCallCard } from '@/components/calls/scheduled-call-card';
import { Loading } from '@/components/common/loading';
import ZeroState from '@/components/common/zero-state';
import { Box } from '@/components/ui/box';
import { FlatList } from '@/components/ui/flat-list';
import { FocusAwareStatusBar } from '@/components/ui/focus-aware-status-bar';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { useAnalytics } from '@/hooks/use-analytics';
import { type CallResultData } from '@/models/v4/calls/callResultData';
import { type DispatchedEventResultData } from '@/models/v4/calls/dispatchedEventResultData';
import { useScheduledCallsStore } from '@/stores/calls/scheduled-store';
import { useCallsStore } from '@/stores/calls/store';

export default function ScheduledCalls() {
  const { scheduledCalls, isLoading, error, fetchScheduledCalls } = useScheduledCallsStore();
  const { fetchCallPriorities, callPriorities } = useCallsStore();
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const [searchQuery, setSearchQuery] = useState('');
  const [callDispatchesMap, setCallDispatchesMap] = useState<Record<string, DispatchedEventResultData[]>>({});
  const [loadingDispatchIds, setLoadingDispatchIds] = useState<Set<string>>(new Set());
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      fetchCallPriorities();
      fetchScheduledCalls();
    }, [fetchCallPriorities, fetchScheduledCalls])
  );

  useEffect(() => {
    trackEvent('scheduled_calls_view_rendered', {
      callsCount: scheduledCalls.length,
    });
  }, [trackEvent, scheduledCalls.length]);

  useEffect(() => {
    const toFetch = scheduledCalls.filter((c) => !fetchedIdsRef.current.has(c.CallId)).map((c) => c.CallId);

    if (toFetch.length === 0) return;

    toFetch.forEach((id) => fetchedIdsRef.current.add(id));

    setLoadingDispatchIds((prev) => {
      const next = new Set(prev);
      toFetch.forEach((id) => next.add(id));
      return next;
    });

    Promise.all(
      toFetch.map((callId) =>
        getCallExtraData(callId)
          .then((res) => ({ callId, dispatches: res?.Data?.Dispatches ?? ([] as DispatchedEventResultData[]) }))
          .catch(() => ({ callId, dispatches: [] as DispatchedEventResultData[] }))
      )
    ).then((results) => {
      setCallDispatchesMap((prev) => {
        const next = { ...prev };
        results.forEach(({ callId, dispatches }) => {
          next[callId] = dispatches;
        });
        return next;
      });
      setLoadingDispatchIds((prev) => {
        const next = new Set(prev);
        toFetch.forEach((id) => next.delete(id));
        return next;
      });
    });
  }, [scheduledCalls]);

  const handleRefresh = useCallback(() => {
    fetchedIdsRef.current = new Set();
    setCallDispatchesMap({});
    setLoadingDispatchIds(new Set());
    fetchScheduledCalls();
  }, [fetchScheduledCalls]);

  const filteredCalls = scheduledCalls.filter(
    (call) =>
      call.CallId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (call.Nature?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (call.Name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (call.Address?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (call.Number?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    if (isLoading) {
      return <Loading text={t('scheduled_calls.loading')} />;
    }

    if (error) {
      return <ZeroState heading={t('common.errorOccurred')} description={error} isError={true} />;
    }

    return (
      <FlatList<CallResultData>
        testID="scheduled-calls-list"
        data={filteredCalls}
        renderItem={({ item }: { item: CallResultData }) => (
          <Pressable onPress={() => router.push(`/call/${item.CallId}` as Href)}>
            <ScheduledCallCard call={item} priority={callPriorities.find((p) => p.Id === item.Priority)} dispatches={callDispatchesMap[item.CallId]} isLoadingDispatches={loadingDispatchIds.has(item.CallId)} />
          </Pressable>
        )}
        keyExtractor={(item: CallResultData) => item.CallId}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
        ListEmptyComponent={<ZeroState heading={t('scheduled_calls.no_scheduled_calls')} description={t('scheduled_calls.no_scheduled_calls_description')} icon={CalendarClockIcon} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    );
  };

  return (
    <View className="size-full flex-1 bg-gray-50 dark:bg-gray-900">
      <FocusAwareStatusBar />
      <Stack.Screen
        options={{
          title: t('scheduled_calls.title'),
          headerShown: true,
          headerBackTitle: '',
        }}
      />
      <Box className="flex-1 px-4 pt-4">
        <Input className="mb-4 rounded-lg bg-white dark:bg-gray-800" size="md" variant="outline">
          <InputSlot className="pl-3">
            <InputIcon as={Search} />
          </InputSlot>
          <InputField placeholder={t('scheduled_calls.search')} value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery ? (
            <InputSlot className="pr-3" onPress={() => setSearchQuery('')}>
              <InputIcon as={X} />
            </InputSlot>
          ) : null}
        </Input>
        <Box className="flex-1">{renderContent()}</Box>
      </Box>
    </View>
  );
}
