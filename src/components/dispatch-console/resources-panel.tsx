import { type Href, router } from 'expo-router';
import { Circle, ExternalLink, LayoutList, Search, Truck, User, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { isPersonnelAvailable, isUnitAvailable } from '@/lib/resource-availability';
import { useDashboardViewStore } from '@/stores/dispatch/dashboard-view-store';
import { usePersonnelStore } from '@/stores/personnel/store';
import { useUnitsStore } from '@/stores/units/store';

import { AnimatedRefreshIcon } from './animated-refresh-icon';
import { PanelHeader } from './panel-header';

type ResourceRow = {
  id: string;
  kind: 'unit' | 'personnel';
  name: string;
  subtitle: string;
  status: string;
  statusColor: string;
  available: boolean;
  href: string;
};

/**
 * A single combined list of units + personnel for the dispatch dashboard, used when the "single list"
 * toggle is on. Reads directly from the units and personnel stores and honours the "available only" filter.
 */
export const ResourcesPanel: React.FC = () => {
  const { t } = useTranslation();
  const units = useUnitsStore((s) => s.units);
  const unitsLoading = useUnitsStore((s) => s.isLoading);
  const fetchUnits = useUnitsStore((s) => s.fetchUnits);
  const personnel = usePersonnelStore((s) => s.personnel);
  const personnelLoading = usePersonnelStore((s) => s.isLoading);
  const fetchPersonnel = usePersonnelStore((s) => s.fetchPersonnel);
  const availableOnly = useDashboardViewStore((s) => s.availableOnly);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const rows = useMemo<ResourceRow[]>(() => {
    const unitRows: ResourceRow[] = units.map((u) => ({
      id: `unit-${u.UnitId}`,
      kind: 'unit',
      name: u.Name,
      subtitle: u.Type || u.GroupName || t('dispatch.unassigned'),
      status: u.CurrentStatus || t('dispatch.available'),
      statusColor: u.CurrentStatusColor || '#22c55e',
      available: isUnitAvailable(u),
      href: `/units/${u.UnitId}`,
    }));
    const personnelRows: ResourceRow[] = personnel.map((p) => ({
      id: `person-${p.UserId}`,
      kind: 'personnel',
      name: `${p.FirstName} ${p.LastName}`,
      subtitle: p.GroupName || t('dispatch.unassigned'),
      status: p.Status || t('dispatch.unknown'),
      statusColor: p.StatusColor || '#6b7280',
      available: isPersonnelAvailable(p),
      href: `/personnel/${p.UserId}`,
    }));

    let all = [...unitRows, ...personnelRows];
    if (availableOnly) {
      all = all.filter((r) => r.available);
    }
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      all = all.filter((r) => r.name.toLowerCase().includes(query) || r.subtitle.toLowerCase().includes(query) || r.status.toLowerCase().includes(query));
    }
    return all;
  }, [units, personnel, availableOnly, searchQuery, t]);

  const availableCount = useMemo(() => rows.filter((r) => r.available).length, [rows]);

  const handleRefresh = () => {
    fetchUnits();
    fetchPersonnel();
  };

  return (
    <Box className={`overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${isCollapsed ? '' : 'flex-1'}`}>
      <PanelHeader
        title={t('dispatch.resources')}
        icon={LayoutList}
        iconColor="#6366f1"
        count={rows.length}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        rightContent={
          <HStack space="xs">
            <HStack className="items-center rounded bg-green-100 px-1.5 py-0.5 dark:bg-green-900" space="xs">
              <Circle size={6} fill="#22c55e" color="#22c55e" />
              <Text className="text-xs font-medium text-green-700 dark:text-green-300">{availableCount}</Text>
            </HStack>
            <Pressable onPress={handleRefresh} style={styles.iconButton}>
              <AnimatedRefreshIcon isLoading={unitsLoading || personnelLoading} />
            </Pressable>
          </HStack>
        }
      />

      {!isCollapsed ? (
        <View style={styles.contentWrapper}>
          <HStack className="items-center border-b border-gray-200 px-2 py-1.5 dark:border-gray-700" space="sm">
            <Icon as={Search} size="xs" className="text-gray-400" />
            <TextInput
              style={styles.searchInput}
              className="flex-1 text-sm text-gray-800 dark:text-gray-100"
              placeholder={t('dispatch.search_resources_placeholder')}
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Icon as={X} size="xs" className="text-gray-400" />
              </Pressable>
            ) : null}
          </HStack>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {rows.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon as={LayoutList} size="lg" className="text-gray-300 dark:text-gray-600" />
                <Text className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">{t('dispatch.no_resources')}</Text>
              </View>
            ) : (
              rows.map((r) => (
                <Pressable key={r.id} onPress={() => router.push(r.href as Href)}>
                  <Box className="mb-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                    <HStack className="items-center justify-between">
                      <HStack className="flex-1 items-center" space="sm">
                        <View style={StyleSheet.flatten([styles.icon, { backgroundColor: r.statusColor }])}>
                          <Icon as={r.kind === 'unit' ? Truck : User} size="xs" color="#fff" />
                        </View>
                        <VStack className="flex-1">
                          <Text className="text-sm font-semibold text-gray-800 dark:text-gray-100" numberOfLines={1}>
                            {r.name}
                          </Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                            {r.subtitle}
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack className="items-center" space="xs">
                        <Circle size={8} fill={r.statusColor} color={r.statusColor} />
                        <Text style={{ color: r.statusColor }} className="text-xs font-medium" numberOfLines={1}>
                          {r.status}
                        </Text>
                        <ExternalLink size={12} color="#6b7280" />
                      </HStack>
                    </HStack>
                  </Box>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      ) : null}
    </Box>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  content: {
    flex: 1,
    padding: 8,
    maxHeight: 300,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  iconButton: {
    padding: 4,
  },
});
