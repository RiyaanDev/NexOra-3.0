
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

export interface NexoraLaunchAppResult {
  success: boolean;
  packageName?: string;
  message?: string;
}

export interface NexoraAccessibilityStatus {
  success: boolean;
  connected: boolean;
}

export interface NexoraAccessibilitySettingsResult {
  success: boolean;
  message?: string;
}

// Screen metadata returned by Android Accessibility Service.
export interface NexoraScreenInfo {
  success: boolean;
  connected: boolean;
  packageName: string;
  className: string;
  eventType: number;
  eventTime: number;
}

interface NexoraNativePlugin {
  getNativeInfo(): Promise<NexoraNativeInfo>;

  getInstalledApps(): Promise<NexoraInstalledAppsResult>;

  launchApp(options: {
    packageName: string;
  }): Promise<NexoraLaunchAppResult>;

  isAccessibilityServiceConnected(): Promise<NexoraAccessibilityStatus>;

  openAccessibilitySettings(): Promise<NexoraAccessibilitySettingsResult>;

  getLastScreenInfo(): Promise<NexoraScreenInfo>;
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

export const launchNexoraApp =
  async (
    packageName: string
  ): Promise<NexoraLaunchAppResult | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    if (!packageName || !packageName.trim()) {
      throw new Error('App package name is required.');
    }

    return await NexoraNative.launchApp({
      packageName: packageName.trim(),
    });
  };

export const getNexoraAccessibilityStatus =
  async (): Promise<NexoraAccessibilityStatus | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    return await NexoraNative.isAccessibilityServiceConnected();
  };

export const openNexoraAccessibilitySettings =
  async (): Promise<NexoraAccessibilitySettingsResult | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    return await NexoraNative.openAccessibilitySettings();
  };

// Get latest safe Android screen metadata.
export const getNexoraScreenInfo =
  async (): Promise<NexoraScreenInfo | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    return await NexoraNative.getLastScreenInfo();
  };
