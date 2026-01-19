import { Headphones, Mic, MicOff, Radio, Volume2, VolumeX } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAudioStreamStore } from '@/stores/app/audio-stream-store';

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
      <HStack className="items-center justify-between p-2" space="sm">
        {/* Channel & Stream Info */}
        <HStack className="flex-1 items-center" space="sm">
          {/* TX/RX Indicator */}
          <View style={isTransmitting ? styles.transmittingIndicator : styles.readyIndicator}>
            <Text className="text-xs font-bold text-white">{isTransmitting ? 'TX' : 'RX'}</Text>
          </View>

          {/* Channel Info */}
          <VStack className="flex-1">
            <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
              {currentChannel}
            </Text>
            <Pressable onPress={handleOpenAudioStreams}>
              <HStack className="items-center" space="xs">
                <Icon as={isPlaying ? Volume2 : VolumeX} size="2xs" className={isPlaying ? 'text-blue-500' : 'text-gray-400'} />
                <Text className="text-xs text-gray-600 dark:text-gray-300" numberOfLines={1}>
                  {currentStream ? currentStream.Name : t('dispatch.no_stream')}
                </Text>
              </HStack>
            </Pressable>
          </VStack>
        </HStack>

        {/* Compact Controls */}
        <HStack className="items-center" space="sm">
          {/* Audio Streams Button */}
          <Pressable onPress={handleOpenAudioStreams} style={styles.compactControlButton}>
            <Icon as={Headphones} size="sm" color={colorScheme === 'dark' ? '#9ca3af' : '#6b7280'} />
          </Pressable>

          {/* Mute Button */}
          <Pressable onPress={() => setIsMuted(!isMuted)} style={StyleSheet.flatten([styles.compactControlButton, isMuted && styles.mutedButton])}>
            <Icon as={isMuted ? MicOff : Mic} size="sm" color={isMuted ? '#ef4444' : colorScheme === 'dark' ? '#fff' : '#374151'} />
          </Pressable>

          {/* PTT Button */}
          <Pressable onPressIn={onPTTPress} onPressOut={onPTTRelease} style={StyleSheet.flatten([styles.pttButtonCompact, isTransmitting && styles.pttButtonActive])} disabled={isMuted}>
            <Icon as={Radio} size="sm" color="#fff" />
          </Pressable>
        </HStack>
      </HStack>
    </Box>
  );
};

const styles = StyleSheet.create({
  compactControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  pttButtonCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
      },
    }),
  } as any,
  pttButtonActive: {
    backgroundColor: '#ef4444',
    ...Platform.select({
      web: {
        transform: 'scale(0.95)',
      },
      default: {
        transform: [{ scale: 0.95 }],
      },
    }),
  } as any,
  transmittingIndicator: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  readyIndicator: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 28,
    alignItems: 'center',
  },
});
