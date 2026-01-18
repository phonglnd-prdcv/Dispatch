import { type Href, router } from 'expo-router';
import { AlertTriangle, ExternalLink, MapPin, Plus, RefreshCw, Truck, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getCallExtraData } from '@/api/calls/calls';
import { Badge } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { logger } from '@/lib/logging';
import { getTimeAgoUtc, invertColor } from '@/lib/utils';
import { type CallPriorityResultData } from '@/models/v4/callPriorities/callPriorityResultData';
import { type CallResultData } from '@/models/v4/calls/callResultData';
import { type DispatchedEventResultData } from '@/models/v4/calls/dispatchedEventResultData';
import { useSecurityStore } from '@/stores/security/store';

import { PanelHeader } from './panel-header';

interface ActiveCallsPanelProps {
  calls: CallResultData[];
  priorities: CallPriorityResultData[];
  isLoading: boolean;
  onRefresh: () => void;
  selectedCallId?: string;
  onSelectCall?: (callId: string) => void;
  isFilterActive?: boolean;
}

// Cache for call dispatches to avoid refetching
const dispatchCache = new Map<string, DispatchedEventResultData[]>();

// Horizontal scrolling dispatched resources component
const DispatchedResourcesScroller: React.FC<{
  dispatches: DispatchedEventResultData[];
  textColor: string;
}> = ({ dispatches, textColor }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Auto-scroll animation
  useEffect(() => {
    if (contentWidth <= containerWidth || dispatches.length === 0) return;

    const scrollDistance = contentWidth - containerWidth;
    const duration = dispatches.length * 2000; // 2 seconds per item

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scrollX, {
          toValue: scrollDistance,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(scrollX, {
          toValue: 0,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [contentWidth, containerWidth, dispatches.length, scrollX]);

  // Scroll position listener
  useEffect(() => {
    const listener = scrollX.addListener(({ value }) => {
      scrollViewRef.current?.scrollTo({ x: value, animated: false });
    });
    return () => scrollX.removeListener(listener);
  }, [scrollX]);

  if (dispatches.length === 0) return null;

  return (
    <View style={styles.dispatchScrollContainer} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false} scrollEnabled={false} contentContainerStyle={styles.dispatchScrollContent} onContentSizeChange={(width) => setContentWidth(width)}>
        {dispatches.map((dispatch, index) => {
          const isUnit = dispatch.Type === 'Unit' || dispatch.Type === 'u';
          const bgColor = dispatch.StatusColor || '#6b7280';
          const itemTextColor = invertColor(bgColor, true);

          return (
            <View key={`${dispatch.Id || dispatch.Name}-${index}`} style={[styles.dispatchBadge, { backgroundColor: bgColor }]}>
              <Icon as={isUnit ? Truck : User} size="xs" color={itemTextColor} style={styles.dispatchIcon} />
              <Text style={[styles.dispatchText, { color: itemTextColor }]} numberOfLines={1}>
                {dispatch.Name}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const CallItem: React.FC<{
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
  const [dispatches, setDispatches] = useState<DispatchedEventResultData[]>([]);

  // Fetch dispatches for this call
  useEffect(() => {
    const fetchDispatches = async () => {
      // Check cache first
      const cached = dispatchCache.get(call.CallId);
      if (cached) {
        setDispatches(cached);
        return;
      }

      try {
        const response = await getCallExtraData(call.CallId);
        if (response?.Data?.Dispatches) {
          dispatchCache.set(call.CallId, response.Data.Dispatches);
          setDispatches(response.Data.Dispatches);
        }
      } catch (error) {
        logger.error({
          message: 'Failed to fetch call dispatches',
          context: { error, callId: call.CallId },
        });
      }
    };

    fetchDispatches();
  }, [call.CallId]);

  return (
    <Pressable onPress={onPress}>
      <Box style={[styles.callItem, { backgroundColor: bgColor }, isSelected && isFilterActive && styles.selectedCall]} className={`mb-2 rounded-lg p-2 ${isSelected && isFilterActive ? 'ring-2 ring-indigo-500' : ''}`}>
        {/* Compact Header Row */}
        <HStack className="items-center justify-between">
          <HStack className="flex-1 items-center" space="xs">
            <Icon as={AlertTriangle} size="xs" color={textColor} />
            <Text style={{ color: textColor }} className="text-sm font-bold">
              #{call.Number}
            </Text>
            {priority ? (
              <Badge size="sm" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <Text style={{ color: textColor }} className="text-xs">
                  {priority.Name}
                </Text>
              </Badge>
            ) : null}
            {isSelected && isFilterActive ? (
              <Badge size="sm" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
                <Text style={{ color: textColor }} className="text-xs font-semibold">
                  {t('dispatch.active_filter')}
                </Text>
              </Badge>
            ) : null}
          </HStack>
          <HStack className="items-center" space="xs">
            <Text style={{ color: textColor }} className="text-xs opacity-80">
              {getTimeAgoUtc(call.LoggedOnUtc)}
            </Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onOpenDetails();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.detailsButton}
            >
              <Icon as={ExternalLink} size="xs" color={textColor} />
            </Pressable>
          </HStack>
        </HStack>

        {/* Compact Details Row */}
        <HStack className="mt-1 items-center" space="sm">
          <Text style={{ color: textColor }} className="flex-1 text-xs" numberOfLines={1}>
            {call.Name || call.Nature}
          </Text>
          {call.Address ? (
            <HStack className="items-center" space="xs">
              <Icon as={MapPin} size="xs" color={textColor} />
              <Text style={{ color: textColor }} className="max-w-[120px] text-xs" numberOfLines={1}>
                {call.Address}
              </Text>
            </HStack>
          ) : null}
        </HStack>

        {/* Dispatched Resources Horizontal Scroller */}
        {dispatches.length > 0 ? (
          <View style={styles.dispatchSection}>
            <DispatchedResourcesScroller dispatches={dispatches} textColor={textColor} />
          </View>
        ) : null}
      </Box>
    </Pressable>
  );
};

export const ActiveCallsPanel: React.FC<ActiveCallsPanelProps> = ({ calls, priorities, isLoading, onRefresh, selectedCallId, onSelectCall, isFilterActive = false }) => {
  const { t } = useTranslation();
  const { canUserCreateCalls } = useSecurityStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeCalls = useMemo(() => calls.filter((c) => c.State === 'Active' || c.State === 'Open'), [calls]);

  const handleNewCall = useCallback(() => {
    router.push('/call/new/' as Href);
  }, []);

  const getPriority = useCallback(
    (priorityId: number) => {
      return priorities.find((p) => p.Id === priorityId);
    },
    [priorities]
  );

  const handleOpenCallDetails = useCallback((callId: string) => {
    router.push(`/call/${callId}` as Href);
  }, []);

  // Clear cache on refresh
  const handleRefresh = useCallback(() => {
    dispatchCache.clear();
    onRefresh();
  }, [onRefresh]);

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
              <Icon as={RefreshCw} size="xs" className={`text-gray-500 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
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
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeCalls.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon as={AlertTriangle} size="lg" className="text-gray-300 dark:text-gray-600" />
              <Text className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">{t('dispatch.no_active_calls')}</Text>
            </View>
          ) : (
            activeCalls.map((call) => (
              <CallItem
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
      ) : null}
    </Box>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 8,
    maxHeight: 300,
  },
  callItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCall: {
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  iconButton: {
    padding: 4,
  },
  detailsButton: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  dispatchSection: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 6,
  },
  dispatchScrollContainer: {
    height: 24,
    overflow: 'hidden',
  },
  dispatchScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  dispatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 120,
  },
  dispatchIcon: {
    marginRight: 4,
  },
  dispatchText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
