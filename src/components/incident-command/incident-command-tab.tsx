import { type Href, useRouter } from 'expo-router';
import { ExpandIcon, NetworkIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Loading } from '@/components/common/loading';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useIncidentCommandStore } from '@/stores/incident-command/store';
import { usePersonnelStore } from '@/stores/personnel/store';
import { useSecurityStore } from '@/stores/security/store';
import { useUnitsStore } from '@/stores/units/store';

import { CommandBoardView } from './command-board-view';
import { EstablishCommandSheet } from './incident-command-sheets';

interface IncidentCommandTabProps {
  callId: string;
  /** When true, shows an affordance to open the dedicated full-screen board. */
  showOpenFull?: boolean;
}

export const IncidentCommandTab: React.FC<IncidentCommandTabProps> = ({ callId, showOpenFull = false }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const isLoading = useIncidentCommandStore((s) => s.isLoading);
  const board = useIncidentCommandStore((s) => s.board);
  const error = useIncidentCommandStore((s) => s.error);
  const { canUserCreateCalls } = useSecurityStore();
  const [isEstablishOpen, setIsEstablishOpen] = useState(false);

  useEffect(() => {
    if (callId) {
      useIncidentCommandStore.getState().loadForCall(callId);
      // Preload personnel + units so the board can resolve assignment / role names.
      usePersonnelStore.getState().fetchPersonnel();
      useUnitsStore.getState().fetchUnits();
    }
  }, [callId]);

  const hasCommand = !!board && !!board.Command?.IncidentCommandId;

  if (isLoading && !hasCommand) {
    return (
      <Box className="min-h-[200px] p-4">
        <Loading />
      </Box>
    );
  }

  if (hasCommand) {
    return (
      <Box>
        {showOpenFull ? (
          <HStack className="justify-end px-3 pt-3">
            <Button variant="outline" size="sm" onPress={() => router.push(`/call/${callId}/command` as Href)}>
              <ButtonIcon as={ExpandIcon} className="mr-1" />
              <ButtonText className="text-xs">{t('incident_command.open_full_board')}</ButtonText>
            </Button>
          </HStack>
        ) : null}
        <CommandBoardView />
      </Box>
    );
  }

  return (
    <Box className="p-6">
      <VStack className="items-center space-y-4">
        <NetworkIcon size={40} className="text-gray-400" />
        <Text className="text-center text-base font-medium">{t('incident_command.no_command')}</Text>
        <Text className="text-center text-sm text-gray-500">{t('incident_command.no_command_description')}</Text>
        {error ? <Text className="text-center text-xs text-red-500">{error}</Text> : null}
        {canUserCreateCalls ? (
          <Button onPress={() => setIsEstablishOpen(true)} className="mt-2">
            <ButtonIcon as={NetworkIcon} className="mr-1" />
            <ButtonText>{t('incident_command.establish')}</ButtonText>
          </Button>
        ) : null}
      </VStack>
      <EstablishCommandSheet isOpen={isEstablishOpen} onClose={() => setIsEstablishOpen(false)} />
    </Box>
  );
};
