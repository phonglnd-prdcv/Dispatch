import { type Href, router } from 'expo-router';
import { AlertTriangle, ExternalLink, Plus, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CallCard } from '@/components/calls/call-card';
import { AnimatedRefreshIcon } from './animated-refresh-icon';
import { Badge } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { invertColor } from '@/lib/utils';
import { type CallPriorityResultData } from '@/models/v4/callPriorities/callPriorityResultData';
import { type CallResultData } from '@/models/v4/calls/callResultData';
import { useCallsStore } from '@/stores/calls/store';
import { useSecurityStore } from '@/stores/security/store';

import { PanelHeader } from './panel-header';

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

  return (
    <Pressable onPress={onPress}>
      <Box style={[styles.callItemWrapper, isSelected && isFilterActive && styles.selectedCall]}>
        {/* Selection indicator and action buttons */}
        <HStack className="mb-1 items-center justify-between">
          <HStack className="items-center" space="xs">
            {isSelected && isFilterActive ? (
              <Badge size="sm" style={{ backgroundColor: '#6366f1' }}>
                <Text className="text-xs font-semibold text-white">{t('dispatch.active_filter')}</Text>
              </Badge>
            ) : null}
          </HStack>
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

        {/* Use the CallCard component */}
        <CallCard call={call} priority={priority} />
      </Box>
    </Pressable>
  );
};

export const ActiveCallsPanel: React.FC<ActiveCallsPanelProps> = ({ selectedCallId, onSelectCall, isFilterActive = false }) => {
  const { t } = useTranslation();
  const { canUserCreateCalls } = useSecurityStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get calls and priorities from the store
  const { calls, callPriorities, isLoading, error, fetchCalls, fetchCallPriorities } = useCallsStore();

  // Fetch calls and priorities on mount
  useEffect(() => {
    fetchCalls();
    fetchCallPriorities();
  }, [fetchCalls, fetchCallPriorities]);

  const activeCalls = useMemo(() => {
    // Filter for active or open calls (case-insensitive check for robustness)
    let filtered = calls.filter((c) => {
      const state = String(c.State ?? '').toLowerCase();
      return state === 'active' || state === 'open';
    });
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c) => {
        const name = (c.Name || '').toLowerCase();
        const nature = (c.Nature || '').toLowerCase();
        const address = (c.Address || '').toLowerCase();
        const type = (c.Type || '').toLowerCase();
        const state = (c.State || '').toLowerCase();
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
    borderRadius: 12,
    padding: 4,
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
    padding: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
  },
});
