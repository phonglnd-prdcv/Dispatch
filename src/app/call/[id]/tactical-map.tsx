import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { CommandMap } from '@/components/incident-command/command-map';
import { FocusAwareStatusBar } from '@/components/ui';
import { Box } from '@/components/ui/box';
import { useIncidentCommandStore } from '@/stores/incident-command/store';

/** Full-screen tactical map for an incident's command board. */
export default function TacticalMapScreen() {
  const { id } = useLocalSearchParams();
  const callId = Array.isArray(id) ? id[0] : id;
  const { t } = useTranslation();

  useEffect(() => {
    if (callId && useIncidentCommandStore.getState().callId !== callId) {
      useIncidentCommandStore.getState().loadForCall(callId);
    }
  }, [callId]);

  return (
    <>
      <Stack.Screen options={{ title: t('incident_command.tactical_map'), headerShown: true, headerBackTitle: '' }} />
      <Box className="flex-1">
        <FocusAwareStatusBar />
        <CommandMap />
      </Box>
    </>
  );
}
