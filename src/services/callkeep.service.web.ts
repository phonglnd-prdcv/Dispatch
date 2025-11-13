import { logger } from '../lib/logging';

export interface CallKeepConfig {
  appName: string;
  maximumCallGroups: number;
  maximumCallsPerCallGroup: number;
  includesCallsInRecents: boolean;
  supportsVideo: boolean;
  ringtoneSound?: string;
}

/**
 * Web no-op implementation of CallKeepService
 * All methods return immediately without doing anything
 */
export class CallKeepService {
  private static instance: CallKeepService | null = null;

  private constructor() {}

  static getInstance(): CallKeepService {
    if (!CallKeepService.instance) {
      CallKeepService.instance = new CallKeepService();
    }
    return CallKeepService.instance;
  }

  async setup(_config: CallKeepConfig): Promise<void> {
    logger.debug({
      message: 'CallKeep setup skipped - web platform',
    });
  }

  async startCall(_roomName: string, _handle?: string): Promise<string> {
    logger.debug({
      message: 'CallKeep startCall skipped - web platform',
    });
    return '';
  }

  async endCall(): Promise<void> {
    logger.debug({
      message: 'CallKeep endCall skipped - web platform',
    });
  }

  setMuteStateCallback(_callback: ((muted: boolean) => void) | null): void {
    // No-op on web
  }

  isCallActiveNow(): boolean {
    return false;
  }

  getCurrentCallUUID(): string | null {
    return null;
  }

  async cleanup(): Promise<void> {
    logger.debug({
      message: 'CallKeep cleanup skipped - web platform',
    });
  }
}

// Export singleton instance
export const callKeepService = CallKeepService.getInstance();
