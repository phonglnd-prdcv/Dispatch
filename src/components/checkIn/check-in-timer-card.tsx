import { ShieldCheckIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type CheckInTimerStatusResultData } from '@/models/v4/checkIn/checkInTimerStatusResultData';

const STATUS_COLORS: Record<string, string> = {
  Ok: '#22C55E',
  Green: '#22C55E',
  Warning: '#F59E0B',
  Yellow: '#F59E0B',
  Overdue: '#EF4444',
  Red: '#EF4444',
  Critical: '#DC2626',
};

const CHECK_IN_TYPE_KEYS: Record<string, string> = {
  Personnel: 'check_in.type_personnel',
  Unit: 'check_in.type_unit',
  IC: 'check_in.type_ic',
  PAR: 'check_in.type_par',
  HazmatExposure: 'check_in.type_hazmat',
  SectorRotation: 'check_in.type_sector_rotation',
  Rehab: 'check_in.type_rehab',
};

interface CheckInTimerCardProps {
  timer: CheckInTimerStatusResultData;
  onCheckIn: (timer: CheckInTimerStatusResultData) => void;
}

export const CheckInTimerCard: React.FC<CheckInTimerCardProps> = React.memo(({ timer, onCheckIn }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();

  const statusColor = STATUS_COLORS[timer.Status] || '#6B7280';
  const progress = timer.DurationMinutes > 0 ? Math.min((timer.ElapsedMinutes / timer.DurationMinutes) * 100, 100) : 0;

  // Use TargetTypeName from API, fall back to translation key lookup
  const typeLabel = timer.TargetTypeName || (CHECK_IN_TYPE_KEYS[String(timer.TargetType)] ? t(CHECK_IN_TYPE_KEYS[String(timer.TargetType)]) : String(timer.TargetType));

  const statusKey = `check_in.status_${timer.Status.toLowerCase()}` as const;

  const elapsedText = timer.LastCheckIn ? t('check_in.minutes_ago', { count: Math.round(timer.ElapsedMinutes) }) : '';

  return (
    <Box className={`mb-2 rounded-lg border-l-4 p-3 ${colorScheme === 'dark' ? 'bg-neutral-800' : 'bg-white'}`} style={{ borderLeftColor: statusColor }}>
      <VStack className="gap-2">
        <HStack className="items-center justify-between">
          <HStack className="flex-1 items-center gap-2">
            <ShieldCheckIcon size={16} color={statusColor} />
            <VStack className="ml-2 flex-1">
              <Text className="text-sm font-bold">{timer.TargetName || timer.TargetEntityId || typeLabel}</Text>
              {timer.TargetName ? (
                <Text className="text-xs font-medium text-gray-500">{typeLabel}</Text>
              ) : (
                <Text className="text-xs font-medium text-gray-500">
                  {timer.TargetTypeName || String(timer.TargetType)}
                  {timer.TargetEntityId ? ` #${timer.TargetEntityId}` : ''}
                </Text>
              )}
            </VStack>
          </HStack>
          <Box className="rounded-full px-2 py-0.5" style={{ backgroundColor: statusColor + '20' }}>
            <Text className="text-xs font-medium" style={{ color: statusColor }}>
              {t(statusKey)}
            </Text>
          </Box>
        </HStack>

        {/* Progress bar */}
        <View style={{ height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
          <View
            style={{
              height: 4,
              width: `${progress}%` as unknown as number,
              backgroundColor: statusColor,
              borderRadius: 2,
            }}
          />
        </View>

        <HStack className="items-center justify-between">
          <VStack>
            <Text className="text-xs text-gray-500">
              {t('check_in.elapsed')}: {Math.round(timer.ElapsedMinutes)}m / {timer.DurationMinutes}m
            </Text>
            {elapsedText ? (
              <Text className="text-xs text-gray-400">
                {t('check_in.last_check_in')}: {elapsedText}
              </Text>
            ) : null}
          </VStack>
          <Button size="xs" variant="solid" onPress={() => onCheckIn(timer)} className="bg-primary-500">
            <ButtonText className="text-xs">{t('check_in.perform_check_in')}</ButtonText>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
});

CheckInTimerCard.displayName = 'CheckInTimerCard';
