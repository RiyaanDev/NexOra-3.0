
package com.nexora.app.nativebridge;

import android.os.Build;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import android.provider.Settings;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;

import com.nexora.app.accessibility.NexoraAccessibilityService;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(name = "NexoraNative")
public class NexoraNativePlugin extends Plugin {

    @PluginMethod
    public void getNativeInfo(PluginCall call) {
        JSObject result = new JSObject();

        result.put("success", true);
        result.put("platform", "android");
        result.put("androidVersion", Build.VERSION.RELEASE);
        result.put("sdkVersion", Build.VERSION.SDK_INT);
        result.put("packageName", getContext().getPackageName());
        result.put("manufacturer", Build.MANUFACTURER);
        result.put("brand", Build.BRAND);
        result.put("model", Build.MODEL);
        result.put("device", Build.DEVICE);

        call.resolve(result);
    }

    @PluginMethod
    public void isAccessibilityServiceConnected(PluginCall call) {
        JSObject result = new JSObject();

        result.put("success", true);
        result.put(
            "connected",
            NexoraAccessibilityService.isConnected()
        );

        call.resolve(result);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        try {
            Intent intent = new Intent(
                Settings.ACTION_ACCESSIBILITY_SETTINGS
            );

            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            getContext().startActivity(intent);

            JSObject result = new JSObject();

            result.put("success", true);
            result.put(
                "message",
                "Accessibility Settings opened."
            );

            call.resolve(result);

        } catch (Exception error) {

            JSObject result = new JSObject();

            result.put("success", false);
            result.put(
                "message",
                error.getMessage() != null
                    ? error.getMessage()
                    : "Unable to open Accessibility Settings."
            );

            call.resolve(result);
        }
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        try {
            PackageManager packageManager =
                getContext().getPackageManager();

            Intent launcherIntent = new Intent(
                Intent.ACTION_MAIN
            );

            launcherIntent.addCategory(
                Intent.CATEGORY_LAUNCHER
            );

            ArrayList<ResolveInfo> activities =
                new ArrayList<>(
                    packageManager.queryIntentActivities(
                        launcherIntent,
                        0
                    )
                );

            ArrayList<AppEntry> installedApps =
                new ArrayList<>();

            Set<String> seenPackages = new HashSet<>();

            for (ResolveInfo resolveInfo : activities) {

                if (resolveInfo.activityInfo == null) {
                    continue;
                }

                String packageName =
                    resolveInfo.activityInfo.packageName;

                if (packageName == null ||
                    seenPackages.contains(packageName)) {
                    continue;
                }

                seenPackages.add(packageName);

                CharSequence label =
                    resolveInfo.loadLabel(packageManager);

                String appName = label != null
                    ? label.toString()
                    : packageName;

                String activityName =
                    resolveInfo.activityInfo.name;

                String iconBase64 = getAppIcon(
                    resolveInfo,
                    packageManager
                );

                installedApps.add(
                    new AppEntry(
                        appName,
                        packageName,
                        activityName,
                        iconBase64
                    )
                );
            }

            Collections.sort(
                installedApps,
                (first, second) ->
                    first.appName.compareToIgnoreCase(
                        second.appName
                    )
            );

            JSArray apps = new JSArray();

            for (AppEntry entry : installedApps) {
                JSObject app = new JSObject();

                app.put("appName", entry.appName);
                app.put("packageName", entry.packageName);
                app.put("activityName", entry.activityName);
                app.put("iconBase64", entry.iconBase64);

                apps.put(app);
            }

            JSObject result = new JSObject();

            result.put("success", true);
            result.put("count", installedApps.size());
            result.put("apps", apps);

            call.resolve(result);

        } catch (Exception error) {

            JSObject result = new JSObject();

            result.put("success", false);
            result.put(
                "message",
                error.getMessage() != null
                    ? error.getMessage()
                    : "Unable to scan installed apps"
            );

            call.resolve(result);
        }
    }

    @PluginMethod
    public void launchApp(PluginCall call) {
        try {
            String packageName =
                call.getString("packageName");

            if (packageName == null ||
                packageName.trim().isEmpty()) {
                throw new Exception(
                    "App package name is required."
                );
            }

            PackageManager packageManager =
                getContext().getPackageManager();

            Intent launcherIntent = new Intent(
                Intent.ACTION_MAIN
            );

            launcherIntent.addCategory(
                Intent.CATEGORY_LAUNCHER
            );

            launcherIntent.setPackage(packageName);

            ResolveInfo launchableApp =
                packageManager.resolveActivity(
                    launcherIntent,
                    0
                );

            if (launchableApp == null ||
                launchableApp.activityInfo == null) {
                throw new Exception(
                    "This app is not available to launch."
                );
            }

            Intent launchIntent =
                packageManager.getLaunchIntentForPackage(
                    packageName
                );

            if (launchIntent == null) {
                throw new Exception(
                    "Launch activity not found."
                );
            }

            launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
            );

            getContext().startActivity(launchIntent);

            JSObject result = new JSObject();

            result.put("success", true);
            result.put("packageName", packageName);
            result.put("message", "App launch requested.");

            call.resolve(result);

        } catch (Exception error) {

            JSObject result = new JSObject();

            result.put("success", false);
            result.put(
                "message",
                error.getMessage() != null
                    ? error.getMessage()
                    : "Unable to launch app."
            );

            call.resolve(result);
        }
    }

    private String getAppIcon(
        ResolveInfo resolveInfo,
        PackageManager packageManager
    ) {
        try {
            Drawable icon =
                resolveInfo.loadIcon(packageManager);

            if (icon == null) {
                return "";
            }

            int size = 64;

            Bitmap bitmap = Bitmap.createBitmap(
                size,
                size,
                Bitmap.Config.ARGB_8888
            );

            Canvas canvas = new Canvas(bitmap);

            icon.setBounds(0, 0, size, size);
            icon.draw(canvas);

            ByteArrayOutputStream output =
                new ByteArrayOutputStream();

            bitmap.compress(
                Bitmap.CompressFormat.PNG,
                100,
                output
            );

            bitmap.recycle();

            String encoded = Base64.encodeToString(
                output.toByteArray(),
                Base64.NO_WRAP
            );

            return "data:image/png;base64," + encoded;

        } catch (Exception error) {
            return "";
        }
    }

    private static class AppEntry {

        final String appName;
        final String packageName;
        final String activityName;
        final String iconBase64;

        AppEntry(
            String appName,
            String packageName,
            String activityName,
            String iconBase64
        ) {
            this.appName = appName;
            this.packageName = packageName;
            this.activityName = activityName;
            this.iconBase64 = iconBase64;
        }
    }
}
