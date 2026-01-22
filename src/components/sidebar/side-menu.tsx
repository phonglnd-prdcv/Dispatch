import { useRouter } from 'expo-router';
import {
  Contact,
  FileText,
  Home,
  List,
  type LucideIcon,
  Map,
  MessageCircle,
  Phone,
  Plus,
  Settings,
  Truck,
  Users,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface SideMenuProps {
  onNavigate?: () => void;
  colorScheme?: 'light' | 'dark';
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  route?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { id: 'home', label: 'Home', icon: Home, route: '/' },
  { 
    id: 'calls', 
    label: 'Calls', 
    icon: Phone,
    children: [
      { id: 'calls-list', label: 'Calls List', icon: List, route: '/calls' },
      { id: 'new-call', label: 'New Call', icon: Plus, route: '/new-call' },
    ],
  },
  { id: 'map', label: 'Map', icon: Map, route: '/map' },
  { id: 'personnel', label: 'Personnel', icon: Users, route: '/personnel' },
  { id: 'units', label: 'Units', icon: Truck, route: '/units' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, route: '/messages' },
  { id: 'protocols', label: 'Protocols', icon: FileText, route: '/protocols' },
  { id: 'contacts', label: 'Contacts', icon: Contact, route: '/contacts' },
  { id: 'settings', label: 'Settings', icon: Settings, route: '/settings' },
];

// Color palette matching home page panels
const colors = {
  light: {
    background: '#f3f4f6', // gray-100
    headerBg: '#f9fafb', // gray-50 (matching panel headers)
    headerBorder: '#e5e7eb', // gray-200
    headerText: '#111827', // gray-900
    menuItemText: '#374151', // gray-700
    menuItemIcon: '#4b5563', // gray-600
    menuItemPressed: '#e5e7eb', // gray-200
    divider: '#e5e7eb', // gray-200
    chevron: '#6b7280', // gray-500
    childBg: '#ffffff', // white for child items
    buttonBg: '#2563eb', // blue-600 (matching panel buttons)
    buttonText: '#ffffff',
  },
  dark: {
    background: '#030712', // gray-950
    headerBg: '#1f2937', // gray-800 (matching panel headers)
    headerBorder: '#374151', // gray-700
    headerText: '#f9fafb', // gray-50
    menuItemText: '#d1d5db', // gray-300
    menuItemIcon: '#9ca3af', // gray-400
    menuItemPressed: '#374151', // gray-700
    divider: '#374151', // gray-700
    chevron: '#9ca3af', // gray-400
    childBg: '#111827', // gray-900 for child items
    buttonBg: '#2563eb', // blue-600 (matching panel buttons)
    buttonText: '#ffffff',
  },
};

function SideMenu({ onNavigate, colorScheme: propColorScheme }: SideMenuProps): React.JSX.Element {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Use prop if provided, otherwise default to light on web
  const isDark = propColorScheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const handleNavigation = (route: string) => {
    onNavigate?.();
    router.push(route as any);
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const IconComponent = item.icon;

    return (
      <React.Fragment key={item.id}>
        <Pressable
          onPress={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else if (item.route) {
              handleNavigation(item.route);
            }
          }}
          style={({ pressed }) => [
            styles.menuItem,
            isChild ? [styles.childMenuItem, { backgroundColor: theme.childBg }] : null,
            pressed ? { backgroundColor: theme.menuItemPressed } : null,
          ]}
        >
          <View style={styles.menuItemIcon}>
            <IconComponent size={isChild ? 18 : 20} color={theme.menuItemIcon} />
          </View>
          <Text style={[styles.menuItemText, { color: theme.menuItemText }, isChild ? styles.childMenuItemText : null]}>
            {item.label}
          </Text>
          {hasChildren ? (
            <Text style={[styles.chevron, { color: theme.chevron }]}>
              {isExpanded ? '▼' : '▶'}
            </Text>
          ) : null}
        </Pressable>
        {hasChildren && isExpanded ? (
          <View style={[styles.childrenContainer, { borderLeftColor: theme.divider }]}>
            {item.children?.map((child) => renderMenuItem(child, true))}
          </View>
        ) : null}
      </React.Fragment>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]} testID="side-menu-scroll-view">
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
        <Text style={[styles.headerText, { color: theme.headerText }]}>Menu</Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {renderMenuItem(item)}
            {index < menuItems.length - 1 ? (
              <View style={[styles.divider, { backgroundColor: theme.divider }]} />
            ) : null}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  childMenuItem: {
    paddingLeft: 48,
    paddingVertical: 12,
  },
  childMenuItemText: {
    fontSize: 14,
  },
  menuItemIcon: {
    width: 24,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  chevron: {
    fontSize: 12,
    marginLeft: 8,
  },
  childrenContainer: {
    borderLeftWidth: 2,
    marginLeft: 28,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
});

export default SideMenu;