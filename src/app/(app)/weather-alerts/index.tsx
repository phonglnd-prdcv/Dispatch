import { useFocusEffect } from '@react-navigation/native';
import { type Href, router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { WeatherAlertCard } from '@/components/weatherAlerts/weather-alert-card';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { WeatherAlertSeverity } from '@/models/v4/weatherAlerts/weatherAlertEnums';
import { type WeatherAlertResultData } from '@/models/v4/weatherAlerts/weatherAlertResultData';
import { useWeatherAlertsStore } from '@/stores/weatherAlerts/store';

type FilterType = 'all' | 'extreme' | 'severe' | 'moderate' | 'minor';
type SortType = 'severity' | 'expires' | 'newest';

export default function WeatherAlertsListScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { alerts, isLoading, fetchActiveAlerts } = useWeatherAlertsStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('severity');

  useFocusEffect(
    useCallback(() => {
      fetchActiveAlerts();
    }, [fetchActiveAlerts])
  );

  const filteredAlerts = useMemo(() => {
    let filtered = [...alerts];

    // Apply severity filter
    switch (filter) {
      case 'extreme':
        filtered = filtered.filter((a) => a.Severity === WeatherAlertSeverity.Extreme);
        break;
      case 'severe':
        filtered = filtered.filter((a) => a.Severity === WeatherAlertSeverity.Severe);
        break;
      case 'moderate':
        filtered = filtered.filter((a) => a.Severity === WeatherAlertSeverity.Moderate);
        break;
      case 'minor':
        filtered = filtered.filter((a) => a.Severity === WeatherAlertSeverity.Minor);
        break;
    }

    // Apply sort
    switch (sort) {
      case 'severity':
        filtered.sort((a, b) => a.Severity - b.Severity || new Date(b.EffectiveUtc).getTime() - new Date(a.EffectiveUtc).getTime());
        break;
      case 'expires':
        filtered.sort((a, b) => {
          const aExp = a.ExpiresUtc ? new Date(a.ExpiresUtc).getTime() : Infinity;
          const bExp = b.ExpiresUtc ? new Date(b.ExpiresUtc).getTime() : Infinity;
          return aExp - bExp;
        });
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.EffectiveUtc).getTime() - new Date(a.EffectiveUtc).getTime());
        break;
    }

    return filtered;
  }, [alerts, filter, sort]);

  const handleAlertPress = (alertId: string) => {
    router.push(`/(app)/weather-alerts/${alertId}` as Href);
  };

  const renderFilterButton = (key: FilterType, label: string) => {
    const isActive = filter === key;
    return (
      <Pressable
        key={key}
        onPress={() => setFilter(key)}
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
      >
        <Text
          className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderSortButton = (key: SortType, label: string) => {
    const isActive = sort === key;
    return (
      <Pressable
        key={key}
        onPress={() => setSort(key)}
        style={[styles.sortButton, isActive && styles.sortButtonActive]}
      >
        <Text
          className={`text-xs ${isActive ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <VStack className="flex-1 items-center justify-center py-12" space="sm">
        <Text className="text-base text-gray-500 dark:text-gray-400">
          {t('weatherAlerts.noActiveAlerts')}
        </Text>
      </VStack>
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: WeatherAlertResultData }) => (
      <WeatherAlertCard alert={item} onPress={handleAlertPress} />
    ),
    []
  );

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <VStack space="sm" style={styles.inner}>
        {/* Header */}
        <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 px-4 pt-4">
          {t('weatherAlerts.title')}
        </Text>

        {/* Filters */}
        <HStack className="px-4" space="xs">
          {renderFilterButton('all', t('weatherAlerts.filter.all'))}
          {renderFilterButton('extreme', t('weatherAlerts.severity.extreme'))}
          {renderFilterButton('severe', t('weatherAlerts.severity.severe'))}
          {renderFilterButton('moderate', t('weatherAlerts.severity.moderate'))}
          {renderFilterButton('minor', t('weatherAlerts.severity.minor'))}
        </HStack>

        {/* Sort */}
        <HStack className="px-4" space="sm">
          {renderSortButton('severity', t('weatherAlerts.sort.severity'))}
          {renderSortButton('expires', t('weatherAlerts.sort.expires'))}
          {renderSortButton('newest', t('weatherAlerts.sort.newest'))}
        </HStack>

        {/* List */}
        {isLoading && alerts.length === 0 ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          <FlatList
            data={filteredAlerts}
            keyExtractor={(item) => item.WeatherAlertId}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={fetchActiveAlerts} />
            }
          />
        )}
      </VStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#f3f4f6' },
  containerDark: { backgroundColor: '#030712' },
  inner: { flex: 1 },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  sortButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sortButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loader: {
    marginTop: 40,
  },
});
