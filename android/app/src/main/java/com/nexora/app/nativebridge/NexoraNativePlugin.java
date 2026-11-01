
package com.nexora.app.nativebridge;

import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

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
}
