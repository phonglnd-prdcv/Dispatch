/**
 * Shifts API Module
 * Provides API functions for shift operations
 */

import { type ShiftDayResult } from '@/models/v4/shifts/shiftDayResult';
import { type ShiftDaysResult } from '@/models/v4/shifts/shiftDaysResult';
import { type ShiftResult } from '@/models/v4/shifts/shiftResult';
import { type ShiftsResult } from '@/models/v4/shifts/shiftsResult';

import { createApiEndpoint } from '../common/client';

const getAllShiftsApi = createApiEndpoint('/Shifts/GetAllShifts');
const getShiftApi = createApiEndpoint('/Shifts/GetShift');
const getShiftDayApi = createApiEndpoint('/Shifts/GetShiftDay');
const getTodaysShiftsApi = createApiEndpoint('/Shifts/GetTodaysShifts');
const signupForShiftDayApi = createApiEndpoint('/Shifts/SignupForShiftDay');

/**
 * Get all shifts
 */
export const getAllShifts = async (): Promise<ShiftsResult> => {
  const response = await getAllShiftsApi.get<ShiftsResult>();
  return response.data;
};

/**
 * Get a specific shift by ID
 */
export const getShift = async (shiftId: string): Promise<ShiftResult> => {
  const response = await getShiftApi.get<ShiftResult>({ shiftId });
  return response.data;
};

/**
 * Get shift day information
 */
export const getShiftDay = async (shiftDayId: string): Promise<ShiftDayResult> => {
  const response = await getShiftDayApi.get<ShiftDayResult>({ shiftDayId });
  return response.data;
};

/**
 * Get today's shifts
 */
export const getTodaysShifts = async (): Promise<ShiftDaysResult> => {
  const response = await getTodaysShiftsApi.get<ShiftDaysResult>();
  return response.data;
};

/**
 * Sign up for a shift day
 */
export const signupForShiftDay = async (shiftDayId: string, userId?: string): Promise<void> => {
  await signupForShiftDayApi.post({ shiftDayId, userId });
};
