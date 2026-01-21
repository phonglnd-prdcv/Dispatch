import { AlertTriangle, CalendarClock, Clock, Phone, Radio, Truck, Users } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { WeatherWidget } from './weather-widget';

interface StatItemProps {
  icon: React.ComponentType<any>;
  label: string;
  value: number | string;
  color: string;
  darkColor: string;
  bgClassName: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, color, darkColor, bgClassName }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const displayColor = isDark ? darkColor : color;

  return (
    <HStack className={`flex-1 items-center rounded-lg p-2 ${bgClassName}`} space="sm">
      <View style={StyleSheet.flatten([styles.iconContainer, { backgroundColor: displayColor }])}>
        <Icon as={icon} size="sm" color="#fff" />
      </View>
      <VStack>
        <Text style={{ color: displayColor }} className="text-lg font-bold">
          {value}
        </Text>
        <Text className="text-xs text-gray-600 dark:text-gray-400">{label}</Text>
      </VStack>
    </HStack>
  );
};

interface StatsHeaderProps {
  activeCalls: number;
  pendingCalls: number;
  scheduledCalls: number;
  unitsAvailable: number;
  personnelAvailable: number;
  personnelOnDuty: number;
  currentTime: string;
  weatherLatitude?: number | null;
  weatherLongitude?: number | null;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ activeCalls, pendingCalls, scheduledCalls, unitsAvailable, personnelAvailable, personnelOnDuty, currentTime, weatherLatitude, weatherLongitude }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Box className="border-b border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
      <HStack className="flex-wrap items-center justify-between" space="sm">
        {/* Active Calls */}
        <StatItem icon={AlertTriangle} label={t('dispatch.active_calls')} value={activeCalls} color="#ef4444" darkColor="#f87171" bgClassName="bg-error-50 dark:bg-error-950" />

        {/* Pending Calls */}
        <StatItem icon={Phone} label={t('dispatch.pending_calls')} value={pendingCalls} color="#f59e0b" darkColor="#fbbf24" bgClassName="bg-warning-50 dark:bg-warning-950" />

        {/* Scheduled Calls */}
        <StatItem icon={CalendarClock} label={t('dispatch.scheduled_calls')} value={scheduledCalls} color="#0ea5e9" darkColor="#38bdf8" bgClassName="bg-info-50 dark:bg-info-950" />

        {/* Units Available */}
        <StatItem icon={Truck} label={t('dispatch.units_available')} value={unitsAvailable} color="#22c55e" darkColor="#4ade80" bgClassName="bg-success-50 dark:bg-success-950" />

        {/* Personnel Available */}
        <StatItem icon={Radio} label={t('dispatch.personnel_available')} value={personnelAvailable} color="#3b82f6" darkColor="#60a5fa" bgClassName="bg-primary-50 dark:bg-primary-950" />

        {/* Personnel On Duty */}
        <StatItem icon={Users} label={t('dispatch.personnel_on_duty')} value={personnelOnDuty} color="#8b5cf6" darkColor="#a78bfa" bgClassName="bg-tertiary-50 dark:bg-tertiary-950" />

        {/* Current Time & Weather */}
        <HStack className="flex-1 items-center justify-center rounded-lg bg-gray-100 p-2 dark:bg-gray-800" space="sm">
          <HStack className="items-center" space="xs">
            <Clock size={14} className="text-gray-600 dark:text-gray-300" />
            <Text className="text-sm font-bold text-gray-800 dark:text-gray-100">{currentTime}</Text>
          </HStack>
          <View style={StyleSheet.flatten([styles.divider, { backgroundColor: isDark ? '#4b5563' : '#d1d5db' }])} />
          <WeatherWidget latitude={weatherLatitude} longitude={weatherLongitude} compact />
        </HStack>
      </HStack>
    </Box>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#d1d5db',
  },
});
