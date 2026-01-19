import { type Href, router } from 'expo-router';
import { AlertTriangle, Clock, ExternalLink, MapPin, Plus, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text as RNText, TextInput, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { getTimeAgoUtc, invertColor, isCallActive, stripHtmlTags } from '@/lib/utils';
import { type CallPriorityResultData } from '@/models/v4/callPriorities/callPriorityResultData';
import { type CallResultData } from '@/models/v4/calls/callResultData';
import { useCallsStore } from '@/stores/calls/store';
import { useSecurityStore } from '@/stores/security/store';

import { AnimatedRefreshIcon } from './animated-refresh-icon';
import { PanelHeader } from './panel-header';

// Compact call card optimized for dispatch dashboard
const DashboardCallCard: React.FC<{
  call: CallResultData;
  priority?: CallPriorityResultData;
}> = React.memo(({ call, priority }) => {
  const bgColor = priority?.Color || '#6b7280';
  const textColor = invertColor(bgColor, true);

  const natureText = useMemo(() => {
    if (!call.Nature) return '';
    return stripHtmlTags(call.Nature).trim();
  }, [call.Nature]);

  return (
    <View style={StyleSheet.flatten([styles.dashboardCard, { backgroundColor: bgColor }])}>
      {/* Top Row: Priority indicator, Call Number & Time */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardIdGroup}>
          <View style={StyleSheet.flatten([styles.priorityDot, { backgroundColor: textColor }])} />
          <RNText style={StyleSheet.flatten([styles.cardCallNumber, { color: textColor }])}>#{call.Number}</RNText>
        </View>
        <View style={styles.cardTimeGroup}>
          <Clock size={10} color={textColor} />
          <RNText style={StyleSheet.flatten([styles.cardTimeText, { color: textColor }])}>{getTimeAgoUtc(call.LoggedOnUtc)}</RNText>
        </View>
      </View>

      {/* Call Name - Main Title */}
      <RNText style={StyleSheet.flatten([styles.cardTitle, { color: textColor }])} numberOfLines={1} ellipsizeMode="tail">
        {call.Name}
      </RNText>

      {/* Bottom Row: Location & Nature */}
      <View style={styles.cardDetailsGroup}>
        {call.Address ? (
          <View style={styles.cardDetailRow}>
            <View style={styles.cardDetailIcon}>
              <MapPin size={10} color={textColor} />
            </View>
            <RNText style={StyleSheet.flatten([styles.cardDetailText, { color: textColor }])} numberOfLines={1} ellipsizeMode="tail">
              {call.Address}
            </RNText>
          </View>
        ) : null}
        {natureText ? (
          <RNText style={StyleSheet.flatten([styles.cardNatureText, { color: textColor }])} numberOfLines={1} ellipsizeMode="tail">
            {natureText}
          </RNText>
        ) : null}
      </View>
    </View>
  );
});

DashboardCallCard.displayName = 'DashboardCallCard';

interface ActiveCallsPanelProps {
  selectedCallId?: string;
  onSelectCall?: (callId: string) => void;
  isFilterActive?: boolean;
}

// Call item wrapper for selection and interaction
const CallItemWrapper: React.FC<{
  call: CallResultData;
  priority?: CallPriorityResultData;
  isSelected: boolean;
  isFilterActive: boolean;
  onPress: () => void;
  onOpenDetails: () => void;
}> = ({ call, priority, isSelected, isFilterActive, onPress, onOpenDetails }) => {
  const { t } = useTranslation();
  const bgColor = priority?.Color || '#6b7280';
  const textColor = invertColor(bgColor, true);

  // Build styles safely to avoid passing false/undefined values on web
  const wrapperStyle = isSelected && isFilterActive ? [styles.callItemWrapper, styles.selectedCall] : styles.callItemWrapper;

  return (
    <Pressable onPress={onPress}>
      <Box style={wrapperStyle}>
        {/* Selection indicator */}
        {isSelected && isFilterActive ? (
          <HStack style={styles.selectionBadgeRow}>
            <Badge size="sm" style={{ backgroundColor: '#6366f1' }}>
              <Text className="text-xs font-semibold text-white">{t('dispatch.active_filter')}</Text>
            </Badge>
          </HStack>
        ) : null}

        {/* Dashboard Card with action button overlay */}
        <View style={styles.cardContainer}>
          <DashboardCallCard call={call} priority={priority} />
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.detailsButton, { backgroundColor: `${bgColor}dd` }]}
          >
            <ExternalLink size={12} color={textColor} />
          </Pressable>
        </View>
      </Box>
    </Pressable>
  );
};

export const ActiveCallsPanel: React.FC<ActiveCallsPanelProps> = ({ selectedCallId, onSelectCall, isFilterActive = false }) => {
  const { t } = useTranslation();
  const { canUserCreateCalls } = useSecurityStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get calls and priorities from the store - use separate selectors for better performance
  const calls = useCallsStore((state) => state.calls);
  const callPriorities = useCallsStore((state) => state.callPriorities);
  const isLoading = useCallsStore((state) => state.isLoadingCalls || state.isLoading);
  const error = useCallsStore((state) => state.callsError || state.error);
  const fetchCalls = useCallsStore((state) => state.fetchCalls);
  const fetchCallPriorities = useCallsStore((state) => state.fetchCallPriorities);

  // Fetch calls and priorities on mount
  useEffect(() => {
    fetchCalls();
    fetchCallPriorities();
  }, [fetchCalls, fetchCallPriorities]);

  // Log calls state for debugging
  useEffect(() => {
    console.log('[ActiveCallsPanel] Calls updated:', {
      totalCalls: calls.length,
      callStates: calls.map((c) => ({ id: c.CallId, name: c.Name, state: c.State })),
    });
  }, [calls]);

  const activeCalls = useMemo(() => {
    // Filter for active or open calls using utility function
    let filtered = calls.filter((c) => isCallActive(c.State));

    console.log('[ActiveCallsPanel] Active calls filtered:', {
      total: calls.length,
      active: filtered.length,
      filteredCalls: filtered.map((c) => ({ id: c.CallId, name: c.Name, state: c.State })),
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c) => {
        const name = (c.Name || '').toLowerCase();
        const nature = (c.Nature || '').toLowerCase();
        const address = (c.Address || '').toLowerCase();
        const type = (c.Type || '').toLowerCase();
        const state = String(c.State ?? '').toLowerCase();
        const callId = (c.Number || '').toLowerCase();
        return name.includes(query) || nature.includes(query) || address.includes(query) || type.includes(query) || state.includes(query) || callId.includes(query);
      });
    }

    return filtered;
  }, [calls, searchQuery]);

  const handleNewCall = useCallback(() => {
    router.push('/call/new/' as Href);
  }, []);

  const getPriority = useCallback(
    (priorityId: number) => {
      return callPriorities.find((p) => p.Id === priorityId);
    },
    [callPriorities]
  );

  const handleOpenCallDetails = useCallback((callId: string) => {
    router.push(`/call/${callId}` as Href);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchCalls();
    fetchCallPriorities();
  }, [fetchCalls, fetchCallPriorities]);

  return (
    <Box className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <PanelHeader
        title={t('dispatch.active_calls')}
        icon={AlertTriangle}
        iconColor="#ef4444"
        count={activeCalls.length}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        rightContent={
          <HStack space="xs">
            <Pressable onPress={handleRefresh} style={styles.iconButton}>
              <AnimatedRefreshIcon isLoading={isLoading} />
            </Pressable>
            {canUserCreateCalls ? (
              <Pressable onPress={handleNewCall} style={styles.iconButton}>
                <Icon as={Plus} size="xs" className="text-indigo-500" />
              </Pressable>
            ) : null}
          </HStack>
        }
      />

      {!isCollapsed ? (
        <View style={styles.contentWrapper}>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Icon as={Search} size="xs" className="text-gray-400" />
            <TextInput
              style={styles.searchInput}
              className="flex-1 text-sm text-gray-800 dark:text-gray-100"
              placeholder={t('dispatch.search_calls_placeholder')}
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
          </View>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.emptyState}>
                <Icon as={AlertTriangle} size="lg" className="text-red-400" />
                <Text className="mt-2 text-center text-sm text-red-500">{error}</Text>
                <Pressable onPress={handleRefresh} style={styles.retryButton}>
                  <Text className="text-sm text-indigo-500">{t('common.retry')}</Text>
                </Pressable>
              </View>
            ) : activeCalls.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon as={AlertTriangle} size="lg" className="text-gray-300 dark:text-gray-600" />
                <Text className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">{t('dispatch.no_active_calls')}</Text>
              </View>
            ) : (
              activeCalls.map((call) => (
                <CallItemWrapper
                  key={call.CallId}
                  call={call}
                  priority={getPriority(call.Priority)}
                  isSelected={selectedCallId === call.CallId}
                  isFilterActive={isFilterActive}
                  onPress={() => {
                    onSelectCall?.(call.CallId);
                  }}
                  onOpenDetails={() => handleOpenCallDetails(call.CallId)}
                />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
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
  callItemWrapper: {
    marginBottom: 8,
  },
  selectedCall: {
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 10,
    padding: 4,
  },
  selectionBadgeRow: {
    marginBottom: 4,
  },
  cardContainer: {
    position: 'relative',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  retryButton: {
    marginTop: 8,
    padding: 8,
  },
  iconButton: {
    padding: 4,
  },
  detailsButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 4,
    borderRadius: 4,
  },
  // Dashboard Card Styles
  dashboardCard: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardCallNumber: {
    fontSize: 11,
    fontWeight: '700' as const,
    marginLeft: 6,
  },
  cardTimeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24, // Space for the details button
  },
  cardTimeText: {
    fontSize: 10,
    marginLeft: 3,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  cardDetailsGroup: {
    marginTop: 2,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDetailIcon: {
    marginRight: 4,
  },
  cardDetailText: {
    fontSize: 10,
    flex: 1,
  },
  cardNatureText: {
    fontSize: 10,
    fontStyle: 'italic' as const,
    paddingLeft: 14,
  },
});
