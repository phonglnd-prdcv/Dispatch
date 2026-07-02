import { Stack, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { IncidentCommandTab } from '@/components/incident-command/incident-command-tab';
import { FocusAwareStatusBar } from '@/components/ui';

/** Full-screen incident command board for a call (a larger canvas than the call-detail tab). */
export default function CallCommandBoard() {
  const { id } = useLocalSearchParams();
  const callId = Array.isArray(id) ? id[0] : id;
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();

  return (
    <>
      <Stack.Screen options={{ title: t('incident_command.title'), headerShown: true, headerBackTitle: '' }} />
      <ScrollView className={`size-full flex-1 ${colorScheme === 'dark' ? 'bg-neutral-950' : 'bg-neutral-50'}`}>
        <FocusAwareStatusBar />
        {callId ? <IncidentCommandTab callId={callId} /> : null}
      </ScrollView>
    </>
  );
}
