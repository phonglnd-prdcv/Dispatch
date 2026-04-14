import { format } from 'date-fns';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type CheckInRecordResultData } from '@/models/v4/checkIn/checkInRecordResultData';

interface CheckInHistoryListProps {
  history: CheckInRecordResultData[];
  isLoading: boolean;
}

export const CheckInHistoryList: React.FC<CheckInHistoryListProps> = ({ history, isLoading }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <Box className="p-3">
        <Text className="text-sm text-gray-500">{t('common.loading')}</Text>
      </Box>
    );
  }

  if (!history.length) {
    return null;
  }

  return (
    <VStack className="mt-4">
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <HStack className="items-center justify-between px-1 pb-2">
          <Text className="font-semibold">{t('check_in.history')}</Text>
          <Text className="text-xs text-gray-500">{isExpanded ? '▲' : '▼'}</Text>
        </HStack>
      </Pressable>

      {isExpanded && (
        <VStack className="gap-2">
          {history.map((record) => (
            <Box
              key={record.CheckInRecordId}
              className={`rounded-lg p-2 ${colorScheme === 'dark' ? 'bg-neutral-800' : 'bg-gray-50'}`}
            >
              <HStack className="items-center justify-between">
                <VStack className="flex-1">
                  <Text className="text-sm font-medium">{record.CheckInTypeName || String(record.CheckInType)}</Text>
                  <Text className="text-xs text-gray-500">
                    {record.UserId ? `User: ${record.UserId}` : ''}{record.UnitId ? ` Unit: ${record.UnitId}` : ''}
                  </Text>
                  {record.Note ? (
                    <Text className="text-xs italic text-gray-400">{record.Note}</Text>
                  ) : null}
                </VStack>
                <Text className="text-xs text-gray-400">
                  {record.Timestamp ? format(new Date(record.Timestamp), 'MMM d, h:mm a') : ''}
                </Text>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
};
