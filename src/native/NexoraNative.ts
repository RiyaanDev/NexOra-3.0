
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NexoraNativeInfo {
  success: boolean;
  platform: string;
  androidVersion: string;
  sdkVersion: number;
  packageName: string;
}

interface NexoraNativePlugin {
  getNativeInfo(): Promise<NexoraNativeInfo>;
}

const NexoraNative = registerPlugin<NexoraNativePlugin>(
  'NexoraNative'
);

export const isNexoraNativeAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const getNexoraNativeInfo =
  async (): Promise<NexoraNativeInfo | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    return await NexoraNative.getNativeInfo();
  };
