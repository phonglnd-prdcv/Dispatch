import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { FocusAwareStatusBar } from '@/components/ui/focus-aware-status-bar';
import { HStack } from '@/components/ui/hstack';
import { SharedTabs, type TabItem } from '@/components/ui/shared-tabs';
import { VStack } from '@/components/ui/vstack';
import { useAnalytics } from '@/hooks/use-analytics';
import { useHomeStore } from '@/stores/home/home-store';

export default function HomeDashboard() {
  const { t } = useTranslation();
  const { refreshAll } = useHomeStore();
  const { trackEvent } = useAnalytics();

  // Initialize data when component mounts
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Track analytics when view becomes visible
  useFocusEffect(
    useCallback(() => {
      trackEvent('home_viewed', {
        timestamp: new Date().toISOString(),
      });
    }, [trackEvent])
  );

  return (
    <>
      <VStack className="size-full flex-1" testID="home-dashboard-container">
        <FocusAwareStatusBar />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Department Statistics */}
          {/*<DepartmentStats />*/}

          {/* User Status and Staffing Cards */}
          <HStack space="md" className="p-4"></HStack>
        </ScrollView>
      </VStack>
    </>
  );
}
