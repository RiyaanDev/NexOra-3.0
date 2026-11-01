
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

        call.resolve(result);
    }
}
