import { useRouter } from 'expo-router';
import { Calendar, CalendarCheck, Contact, Headphones, Home, ListTree, LogOut, type LucideIcon, Mail, Map, Megaphone, Mic, Notebook, Settings, Truck, User, Users } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Divider } from '@/components/ui/divider';
import { HStack } from '@/components/ui/hstack';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthStore } from '@/lib/auth';
import { getAvatarUrl } from '@/lib/utils';
import { useSecurityStore } from '@/stores/security/store';

interface MenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
  route: string;
  testID: string;
}

interface SideMenuProps {
  onNavigate?: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = React.memo(({ onNavigate }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { profile, logout } = useAuthStore();
  const securityStoreState = useSecurityStore();

  // Add safety check for store state
  if (!securityStoreState) {
    return (
      <Box className="flex-1 items-center justify-center bg-white dark:bg-gray-900" testID="side-menu-loading">
        <Text className="text-gray-600 dark:text-gray-400">{t('common.loading', 'Loading...')}</Text>
      </Box>
    );
  }

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      title: t('tabs.home'),
      icon: Home,
      route: '/(app)/home',
      testID: 'side-menu-home',
    },
    {
      id: 'messages',
      title: t('tabs.messages'),
      icon: Mail,
      route: '/(app)/messages',
      testID: 'side-menu-messages',
    },
    {
      id: 'contacts',
      title: t('tabs.contacts'),
      icon: Contact,
      route: '/(app)/contacts',
      testID: 'side-menu-contacts',
    },
    {
      id: 'map',
      title: t('tabs.map'),
      icon: Map,
      route: '/(app)/map',
      testID: 'side-menu-map',
    },
    {
      id: 'notes',
      title: t('tabs.notes'),
      icon: Notebook,
      route: '/(app)/notes',
      testID: 'side-menu-notes',
    },
    {
      id: 'protocols',
      title: t('tabs.protocols'),
      icon: ListTree,
      route: '/(app)/protocols',
      testID: 'side-menu-protocols',
    },
    {
      id: 'calendar',
      title: t('tabs.calendar'),
      icon: Calendar,
      route: '/calendar',
      testID: 'side-menu-calendar',
    },
    {
      id: 'shifts',
      title: t('tabs.shifts'),
      icon: CalendarCheck,
      route: '/(app)/shifts',
      testID: 'side-menu-shifts',
    },
    {
      id: 'settings',
      title: t('tabs.settings'),
      icon: Settings,
      route: '/(app)/settings',
      testID: 'side-menu-settings',
    },
  ];

  const handleNavigation = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    onNavigate?.();
  }, [logout, onNavigate]);

  const getInitials = useCallback((name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, []);

  // Get user display name and department name from security store
  const displayName = securityStoreState.rights?.FullName || profile?.name || t('common.unknown_user');
  const departmentName = securityStoreState.rights?.DepartmentName || t('common.unknown_department');

  const isDark = colorScheme === 'dark';

  return (
    <Box className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} testID="side-menu-container">
      <ScrollView className="mt-4 flex-1">
        <VStack space="md" className="flex-1 p-4">
          {/* Profile Section */}
          <Box className={`rounded-xl p-3 ${isDark ? 'border border-gray-700 bg-gray-800' : 'border border-gray-200 bg-gray-50'}`} testID="side-menu-profile">
            <HStack space="md" className="items-center">
              <Avatar size="lg" className="border-2 border-primary-500">
                <AvatarFallbackText className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{getInitials(displayName)}</AvatarFallbackText>
                {profile?.sub && <AvatarImage source={{ uri: getAvatarUrl(profile.sub) }} alt={`${displayName} avatar`} />}
              </Avatar>

              <VStack space="xs" className="flex-1">
                <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} testID="side-menu-profile-name" numberOfLines={1}>
                  {displayName}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`} testID="side-menu-profile-department">
                  {departmentName}
                </Text>
              </VStack>
            </HStack>
          </Box>

          <Divider className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />

          {/* Navigation Menu */}
          <VStack space="xs" className="flex-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    handleNavigation(item.route);
                    onNavigate?.();
                  }}
                  testID={item.testID}
                  className={`flex-row items-center rounded-lg p-3 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <IconComponent size={20} color={isDark ? '#9CA3AF' : '#4B5563'} />
                  <Text className={`ml-3 text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.title}</Text>
                </Pressable>
              );
            })}
          </VStack>

          <Divider className={`my-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

          {/* Logout Button */}
          <Pressable
            onPress={handleLogout}
            testID="side-menu-logout"
            className={`flex-row items-center rounded-lg p-3 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <LogOut size={20} color={isDark ? '#9CA3AF' : '#4B5563'} />
            <Text className={`ml-3 text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('settings.logout')}</Text>
          </Pressable>
        </VStack>
      </ScrollView>
    </Box>
  );
});

SideMenu.displayName = 'SideMenu';

export default SideMenu;
