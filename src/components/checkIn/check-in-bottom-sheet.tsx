import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';

import { CustomBottomSheet } from '@/components/ui/bottom-sheet';
import { Button, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { VStack } from '@/components/ui/vstack';
import { type CheckInTimerStatusResultData } from '@/models/v4/checkIn/checkInTimerStatusResultData';
import { useLocationStore } from '@/stores/app/location-store';
import { useCheckInStore } from '@/stores/checkIn/store';
import { useToastStore } from '@/stores/toast/store';

const CHECK_IN_TYPE_KEYS: Record<string, string> = {
  Personnel: 'check_in.type_personnel',
  Unit: 'check_in.type_unit',
  IC: 'check_in.type_ic',
  PAR: 'check_in.type_par',
  HazmatExposure: 'check_in.type_hazmat',
  SectorRotation: 'check_in.type_sector_rotation',
  Rehab: 'check_in.type_rehab',
};

interface CheckInBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  callId: number;
  selectedTimer?: CheckInTimerStatusResultData | null;
  timers: CheckInTimerStatusResultData[];
}

export const CheckInBottomSheet: React.FC<CheckInBottomSheetProps> = ({ isOpen, onClose, callId, selectedTimer, timers }) => {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const showToast = useToastStore((state) => state.showToast);
  const { performCheckIn, isCheckingIn } = useCheckInStore();
  const userLocation = useLocationStore((state) => ({
    latitude: state.latitude,
    longitude: state.longitude,
  }));

  const typeLabel = (timer: CheckInTimerStatusResultData) => {
    // Use TargetTypeName from API, fall back to translation key lookup
    if (timer.TargetTypeName) return timer.TargetTypeName;
    const key = CHECK_IN_TYPE_KEYS[String(timer.TargetType)];
    return key ? t(key) : String(timer.TargetType);
  };

  const [selected, setSelected] = useState<CheckInTimerStatusResultData | null>(selectedTimer || null);
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'select' | 'confirm'>(selectedTimer ? 'confirm' : 'select');

  React.useEffect(() => {
    if (isOpen) {
      if (selectedTimer) {
        setSelected(selectedTimer);
        setStep('confirm');
      } else {
        setSelected(null);
        setStep('select');
      }
      setNote('');
    }
  }, [isOpen, selectedTimer]);

  const handleSelectTarget = (timer: CheckInTimerStatusResultData) => {
    setSelected(timer);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selected) return;

    // Use CallId from the selected timer (injected during aggregation) or fall back to prop
    const effectiveCallId = selected.CallId || callId;

    // Resolve UnitId: prefer the explicit field, fall back to parsing TargetEntityId
    const resolvedUnitId = selected.UnitId || parseInt(selected.TargetEntityId) || 0;

    console.log('[CheckIn] Performing check-in:', {
      effectiveCallId,
      TargetType: selected.TargetType,
      TargetEntityId: selected.TargetEntityId,
      UnitId: resolvedUnitId,
      TargetName: selected.TargetName,
    });

    if (!effectiveCallId) {
      console.error('[CheckIn] No callId available');
      showToast('error', t('check_in.check_in_error'));
      return;
    }

    try {
      const success = await performCheckIn({
        CallId: effectiveCallId,
        CheckInType: selected.TargetType,
        UnitId: resolvedUnitId || undefined,
        Latitude: userLocation.latitude?.toString() || undefined,
        Longitude: userLocation.longitude?.toString() || undefined,
        Note: note || undefined,
      });

      if (success) {
        showToast('success', t('check_in.check_in_success'));
        handleClose();
      } else {
        showToast('error', t('check_in.check_in_error'));
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      showToast('error', t('check_in.check_in_error'));
    }
  };

  const handleClose = () => {
    setSelected(null);
    setNote('');
    setStep('select');
    onClose();
  };

  return (
    <CustomBottomSheet isOpen={isOpen} onClose={handleClose} isLoading={isCheckingIn}>
      <VStack className="w-full flex-1 gap-4 p-4">
        <Text className="text-center text-lg font-semibold">{t('check_in.perform_check_in')}</Text>

        {step === 'select' && (
          <VStack className="gap-2">
            <Text className="text-sm text-gray-500">{t('check_in.select_target')}</Text>
            {timers.map((timer) => (
              <Button key={`${timer.TargetType}-${timer.TargetEntityId}`} variant="outline" onPress={() => handleSelectTarget(timer)} className="w-full justify-start" size={isLandscape ? 'md' : 'sm'}>
                <VStack className="items-start">
                  <ButtonText className={`font-bold ${isLandscape ? '' : 'text-xs'}`}>{timer.TargetName || timer.TargetEntityId || typeLabel(timer)}</ButtonText>
                  <Text className="text-xs text-gray-500">{typeLabel(timer)}</Text>
                </VStack>
              </Button>
            ))}
          </VStack>
        )}

        {step === 'confirm' && selected && (
          <VStack className="gap-4">
            <VStack>
              <Text className="text-base font-bold">{selected.TargetName || selected.TargetEntityId || typeLabel(selected)}</Text>
              <Text className="text-sm text-gray-500">{typeLabel(selected)}</Text>
            </VStack>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>{t('check_in.add_note')}</FormControlLabelText>
              </FormControlLabel>
              <Textarea>
                <TextareaInput placeholder={t('check_in.add_note')} value={note} onChangeText={setNote} numberOfLines={3} />
              </Textarea>
            </FormControl>

            <HStack className="gap-3 pt-4">
              <Button variant="outline" className="mr-4 flex-1" onPress={handleClose} disabled={isCheckingIn} size={isLandscape ? 'md' : 'sm'}>
                <ButtonText className={isLandscape ? '' : 'text-xs'}>{t('common.cancel')}</ButtonText>
              </Button>
              <Button className="ml-4 flex-1" onPress={handleConfirm} disabled={isCheckingIn} size={isLandscape ? 'md' : 'sm'}>
                <ButtonText className={isLandscape ? '' : 'text-xs'}>{t('check_in.confirm')}</ButtonText>
              </Button>
            </HStack>
          </VStack>
        )}
      </VStack>
    </CustomBottomSheet>
  );
};
