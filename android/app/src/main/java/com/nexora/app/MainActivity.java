
package com.nexora.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.nexora.app.nativebridge.NexoraNativePlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NexoraNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
