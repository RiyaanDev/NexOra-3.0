
package com.nexora.app.accessibility;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;

public class NexoraAccessibilityService extends AccessibilityService {

    private static volatile NexoraAccessibilityService instance;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Screen events will be handled in a later step.
        // Do not log or store sensitive screen content here.
    }

    @Override
    public void onInterrupt() {
        // Called when the service is interrupted.
    }

    @Override
    public void onDestroy() {
        if (instance == this) {
            instance = null;
        }
        super.onDestroy();
    }

    public static boolean isConnected() {
        return instance != null;
    }
}
