
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NexoraNativeInfo {
  success: boolean;
  platform: string;
  androidVersion: string;
  sdkVersion: number;
  packageName: string;
  manufacturer: string;
  brand: string;
  model: string;
  device: string;
}

export interface NexoraInstalledApp {
  appName: string;
  packageName: string;
  activityName: string;
  iconBase64: string;
}

export interface NexoraInstalledAppsResult {
  success: boolean;
  count: number;
  apps: NexoraInstalledApp[];
  message?: string;
}

interface NexoraNativePlugin {
  getNativeInfo(): Promise<NexoraNativeInfo>;

  getInstalledApps(): Promise<NexoraInstalledAppsResult>;
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

export const getNexoraInstalledApps =
  async (): Promise<NexoraInstalledAppsResult | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    return await NexoraNative.getInstalledApps();
  };
