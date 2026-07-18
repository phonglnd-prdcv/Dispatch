import { type Href, Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl } from 'react-native';

import { Loading } from '@/components/common/loading';
import ZeroState from '@/components/common/zero-state';
import { FocusAwareStatusBar } from '@/components/ui';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type IncidentCommandBoard } from '@/models/v4/incidentCommand/incidentCommandBoard';
import { ParStatus, TacticalObjectiveStatus } from '@/models/v4/incidentCommand/incidentCommandEnums';
import { useCallsStore } from '@/stores/calls/store';
import { useIncidentCommandStore } from '@/stores/incident-command/store';
import { usePersonnelStore } from '@/stores/personnel/store';

/** Department-wide list of all active incident commands (calls with an established IC). */
export default function IncidentCommandList() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeBoards = useIncidentCommandStore((s) => s.activeBoards);
  const isLoadingActive = useIncidentCommandStore((s) => s.isLoadingActive);
  const calls = useCallsStore((s) => s.calls);
  const personnel = usePersonnelStore((s) => s.personnel);

  const load = useCallback(() => {
    useIncidentCommandStore.getState().fetchActiveCommands();
  }, []);

  useEffect(() => {
    load();
    // Load supporting data so the list can show call names/numbers and commander names.
    useCallsStore.getState().fetchCalls();
    usePersonnelStore.getState().fetchPersonnel();
  }, [load]);

  const nameFor = (userId: string): string => {
    const person = personnel.find((p) => p.UserId === userId);
    return person ? `${person.FirstName} ${person.LastName}`.trim() : userId || t('incident_command.unassigned');
  };

  const renderItem = ({ item }: { item: IncidentCommandBoard }) => {
    const command = item.Command;
    const call = calls.find((c) => c.CallId === String(command.CallId));
    const critical = (item.Accountability ?? []).filter((p) => p.Status === ParStatus.Critical).length;
    const activeLanes = (item.Nodes ?? []).filter((n) => !n.DeletedOn).length;
    const roles = (item.Roles ?? []).filter((r) => !r.RemovedOn).length;
    const openObjectives = (item.Objectives ?? []).filter((o) => o.Status !== TacticalObjectiveStatus.Complete).length;

    return (
      <Pressable onPress={() => router.push(`/call/${command.CallId}/command` as Href)} className="mb-2 rounded-lg bg-background-50 p-3">
        <HStack className="items-center justify-between">
          <VStack className="flex-1 pr-2">
            <Text className="font-semibold" numberOfLines={1}>
              {call ? `${call.Name} (#${call.Number})` : `${t('incident_command.call')} ${command.CallId}`}
            </Text>
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              {t('incident_command.commander')}: {nameFor(command.CurrentCommanderUserId)}
            </Text>
          </VStack>
          {critical > 0 ? (
            <Box className="rounded-full bg-red-500 px-2 py-0.5">
              <Text className="text-xs font-medium text-white">
                {critical} {t('incident_command.critical')}
              </Text>
            </Box>
          ) : null}
        </HStack>
        <HStack className="mt-2 space-x-4">
          <Text className="text-xs text-gray-500">
            {activeLanes} {t('incident_command.structure')}
          </Text>
          <Text className="text-xs text-gray-500">
            {roles} {t('incident_command.roles')}
          </Text>
          <Text className="text-xs text-gray-500">
            {openObjectives} {t('incident_command.objectives')}
          </Text>
        </HStack>
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: t('incident_command.active_title'), headerShown: true }} />
      <Box className="size-full flex-1 bg-background-0">
        <FocusAwareStatusBar />
        {isLoadingActive && activeBoards.length === 0 ? (
          <Loading />
        ) : activeBoards.length === 0 ? (
          <Box className="m-4 mt-8">
            <ZeroState heading={t('incident_command.no_active')} description={t('incident_command.no_active_description')} />
          </Box>
        ) : (
          <FlatList
            data={activeBoards}
            keyExtractor={(item) => item.Command.IncidentCommandId}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 12 }}
            refreshControl={<RefreshControl refreshing={isLoadingActive} onRefresh={load} />}
          />
        )}
      </Box>
    </>
  );
}
