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
        // Privacy protection:
        // Do not read screen text, app names, window content,
        // passwords, OTPs, messages or other screen information.
        // No event data is collected or stored.
    }

    @Override
    public void onInterrupt() {
        // No screen data is processed.
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

    // Compatibility methods: return no collected screen data.
    public static String getLastPackageName() {
        return "";
    }

    public static String getLastClassName() {
        return "";
    }

    public static int getLastEventType() {
        return 0;
    }

    public static long getLastEventTime() {
        return 0L;
    }
}
