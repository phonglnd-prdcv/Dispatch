import { ShieldCheckIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { type CheckInTimerStatusResultData } from '@/models/v4/checkIn/checkInTimerStatusResultData';
import { usePersonnelStore } from '@/stores/personnel/store';
import { useUnitsStore } from '@/stores/units/store';

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
  const units = useUnitsStore((s) => s.units);
  const personnel = usePersonnelStore((s) => s.personnel);

  const statusColor = STATUS_COLORS[timer.Status] || '#6B7280';
  const progress = timer.DurationMinutes > 0 ? Math.min((timer.ElapsedMinutes / timer.DurationMinutes) * 100, 100) : 0;

  // Use TargetTypeName from API, fall back to translation key lookup
  const typeLabel = timer.TargetTypeName || (CHECK_IN_TYPE_KEYS[String(timer.TargetType)] ? t(CHECK_IN_TYPE_KEYS[String(timer.TargetType)]) : String(timer.TargetType));

  // The API's TargetName often contains the check-in TYPE name (e.g. "UnitType")
  // rather than the actual entity name (e.g. "Engine 1"). Detect this and look up
  // the real name from the units/personnel stores using TargetEntityId.
  const isTargetNameActuallyTypeName = !timer.TargetName
    || timer.TargetName === timer.TargetTypeName
    || /type$/i.test(timer.TargetName)
    || Object.keys(CHECK_IN_TYPE_KEYS).some((k) => k.toLowerCase() === timer.TargetName.toLowerCase())
    || timer.TargetName.toLowerCase() === 'unittype'
    || timer.TargetName.toLowerCase() === 'personneltype';

  const displayName = useMemo(() => {
    // If TargetName is a real entity name (not a type label), use it directly
    if (timer.TargetName && !isTargetNameActuallyTypeName) return timer.TargetName;

    const entityId = timer.TargetEntityId;
    const unitId = timer.UnitId;

    // Look up from units store by TargetEntityId or UnitId
    if (units.length > 0) {
      for (const u of units) {
        if (entityId && u.UnitId === entityId) return u.Name;
        if (unitId > 0 && u.UnitId === String(unitId)) return u.Name;
        if (unitId > 0 && parseInt(u.UnitId, 10) === unitId) return u.Name;
        if (entityId && !isNaN(parseInt(entityId, 10)) && parseInt(u.UnitId, 10) === parseInt(entityId, 10)) return u.Name;
      }
    }

    // Look up from personnel store by TargetEntityId
    if (personnel.length > 0 && entityId) {
      for (const p of personnel) {
        if (p.UserId === entityId || p.IdentificationNumber === entityId) {
          return `${p.FirstName} ${p.LastName}`.trim();
        }
      }
    }

    return entityId || typeLabel;
  }, [timer.TargetName, timer.TargetEntityId, timer.UnitId, isTargetNameActuallyTypeName, units, personnel, typeLabel]);

  const statusKey = `check_in.status_${timer.Status.toLowerCase()}` as const;

  const elapsedText = timer.LastCheckIn ? t('check_in.minutes_ago', { count: Math.round(timer.ElapsedMinutes) }) : '';

  return (
    <Box className={`mb-2 rounded-lg border-l-4 p-3 ${colorScheme === 'dark' ? 'bg-neutral-800' : 'bg-white'}`} style={{ borderLeftColor: statusColor }}>
      <VStack className="gap-2">
        <HStack className="items-center justify-between">
          <HStack className="flex-1 items-center gap-2">
            <ShieldCheckIcon size={16} color={statusColor} />
            <VStack className="ml-2 flex-1">
              <Text className="text-sm font-bold">{displayName}</Text>
              <Text className="text-xs font-medium text-gray-500">{typeLabel}</Text>
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
