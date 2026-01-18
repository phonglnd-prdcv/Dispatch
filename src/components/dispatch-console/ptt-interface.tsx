import { Headphones, Mic, MicOff, Radio, Volume2, VolumeX } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAudioStreamStore } from '@/stores/app/audio-stream-store';

import { PanelHeader } from './panel-header';

interface PTTInterfaceProps {
  onPTTPress?: () => void;
  onPTTRelease?: () => void;
  onOpenAudioStreams?: () => void;
  isTransmitting?: boolean;
  currentChannel?: string;
}

export const PTTInterface: React.FC<PTTInterfaceProps> = ({ onPTTPress, onPTTRelease, onOpenAudioStreams, isTransmitting = false, currentChannel = 'Main Channel' }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const [isMuted, setIsMuted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isPlaying, currentStream, setIsBottomSheetVisible } = useAudioStreamStore();

  const handleOpenAudioStreams = () => {
    if (onOpenAudioStreams) {
      onOpenAudioStreams();
    } else {
      setIsBottomSheetVisible(true);
    }
  };

  return (
    <Box className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <PanelHeader title={t('dispatch.communications')} icon={Radio} iconColor="#10b981" isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />

      {!isCollapsed ? (
        <VStack className="p-3" space="md">
          {/* Current Channel Display */}
          <HStack className="items-center justify-between rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
            <HStack className="items-center" space="sm">
              <Icon as={Radio} size="sm" className="text-green-500" />
              <VStack>
                <Text className="text-xs text-gray-500 dark:text-gray-400">{t('dispatch.current_channel')}</Text>
                <Text className="text-sm font-semibold text-gray-800 dark:text-gray-100">{currentChannel}</Text>
              </VStack>
            </HStack>
            <HStack className="items-center" space="xs">
              {isTransmitting ? (
                <View style={styles.transmittingIndicator}>
                  <Text className="text-xs font-bold text-white">TX</Text>
                </View>
              ) : (
                <View style={styles.readyIndicator}>
                  <Text className="text-xs font-bold text-white">RX</Text>
                </View>
              )}
            </HStack>
          </HStack>

          {/* Audio Stream Status */}
          <Pressable onPress={handleOpenAudioStreams}>
            <HStack className="items-center justify-between rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
              <HStack className="items-center" space="sm">
                {isPlaying ? <Icon as={Volume2} size="sm" className="text-blue-500" /> : <Icon as={VolumeX} size="sm" className="text-gray-400" />}
                <VStack>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">{t('dispatch.audio_stream')}</Text>
                  <Text className="text-sm font-semibold text-gray-800 dark:text-gray-100">{currentStream ? currentStream.Name : t('dispatch.no_stream')}</Text>
                </VStack>
              </HStack>
              <Icon as={Headphones} size="sm" className="text-gray-400" />
            </HStack>
          </Pressable>

          {/* PTT and Mute Controls */}
          <HStack className="items-center justify-center" space="md">
            {/* Mute Button */}
            <Pressable onPress={() => setIsMuted(!isMuted)} style={[styles.controlButton, isMuted && styles.mutedButton]}>
              <Icon as={isMuted ? MicOff : Mic} size="md" color={isMuted ? '#ef4444' : colorScheme === 'dark' ? '#fff' : '#374151'} />
            </Pressable>

            {/* PTT Button */}
            <Pressable onPressIn={onPTTPress} onPressOut={onPTTRelease} style={[styles.pttButton, isTransmitting && styles.pttButtonActive]} disabled={isMuted}>
              <VStack className="items-center">
                <Icon as={Radio} size="lg" color="#fff" />
                <Text className="mt-1 text-xs font-bold text-white">{t('dispatch.ptt')}</Text>
              </VStack>
            </Pressable>

            {/* Volume/Settings Button */}
            <Pressable onPress={handleOpenAudioStreams} style={styles.controlButton}>
              <Icon as={Volume2} size="md" color={colorScheme === 'dark' ? '#fff' : '#374151'} />
            </Pressable>
          </HStack>
        </VStack>
      ) : null}
    </Box>
  );
};

const styles = StyleSheet.create({
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  pttButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pttButtonActive: {
    backgroundColor: '#ef4444',
    transform: [{ scale: 0.95 }],
  },
  transmittingIndicator: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  readyIndicator: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
