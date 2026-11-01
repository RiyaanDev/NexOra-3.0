
package com.nexora.app.nativebridge;

import android.os.Build;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;

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

                installedApps.add(
                    new AppEntry(
                        appName,
                        packageName,
                        activityName
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

    private static class AppEntry {

        final String appName;
        final String packageName;
        final String activityName;

        AppEntry(
            String appName,
            String packageName,
            String activityName
        ) {
            this.appName = appName;
            this.packageName = packageName;
            this.activityName = activityName;
        }
    }
}
