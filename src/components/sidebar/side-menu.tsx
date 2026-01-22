import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

interface SideMenuProps {
  onNavigate?: () => void;
}

// Absolute minimal side menu - just text, no interactions
function SideMenu(_props: SideMenuProps): React.JSX.Element {
  return (
    <View style={styles.container} testID="side-menu-scroll-view">
      <Text style={styles.text}>Home</Text>
      <Text style={styles.text}>Calls</Text>
      <Text style={styles.text}>Map</Text>
      <Text style={styles.text}>Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  text: {
    fontSize: 16,
    color: '#374151',
    paddingVertical: 12,
  },
});

export default SideMenu;
