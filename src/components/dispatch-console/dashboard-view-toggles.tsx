import { LayoutList, ListFilter } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useDashboardViewStore } from '@/stores/dispatch/dashboard-view-store';

/** Compact toggle bar for the dispatch dashboard: filter to available resources and/or merge them into a single list. */
export const DashboardViewToggles: React.FC = () => {
  const { t } = useTranslation();
  const availableOnly = useDashboardViewStore((s) => s.availableOnly);
  const singleList = useDashboardViewStore((s) => s.singleList);
  const toggleAvailableOnly = useDashboardViewStore((s) => s.toggleAvailableOnly);
  const toggleSingleList = useDashboardViewStore((s) => s.toggleSingleList);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={toggleAvailableOnly}
        style={StyleSheet.flatten([styles.pill, availableOnly ? styles.pillActive : styles.pillInactive])}
        testID="toggle-available-only"
        accessibilityRole="switch"
        accessibilityState={{ checked: availableOnly }}
      >
        <Icon as={ListFilter} size="xs" className={availableOnly ? 'text-white' : 'text-gray-600 dark:text-gray-300'} />
        <Text className={`text-xs font-medium ${availableOnly ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{t('dispatch.available_only')}</Text>
      </Pressable>
      <Pressable
        onPress={toggleSingleList}
        style={StyleSheet.flatten([styles.pill, singleList ? styles.pillActive : styles.pillInactive])}
        testID="toggle-single-list"
        accessibilityRole="switch"
        accessibilityState={{ checked: singleList }}
      >
        <Icon as={LayoutList} size="xs" className={singleList ? 'text-white' : 'text-gray-600 dark:text-gray-300'} />
        <Text className={`text-xs font-medium ${singleList ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{t('dispatch.single_list')}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: '#4f46e5',
  },
  pillInactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
  },
});
