
package com.nexora.app.accessibility;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;

public class NexoraAccessibilityService extends AccessibilityService {

    private static volatile NexoraAccessibilityService instance;

    // Temporary screen event metadata stored only in RAM.
    private volatile String lastPackageName = "";
    private volatile String lastClassName = "";
    private volatile int lastEventType = 0;
    private volatile long lastEventTime = 0L;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {

        if (event == null) {
            return;
        }

        // Read only application and screen class metadata.
        // Never read screen text or sensitive user content.

        CharSequence packageName = event.getPackageName();
        CharSequence className = event.getClassName();

        if (packageName != null) {
            lastPackageName = packageName.toString();
        }

        if (className != null) {
            lastClassName = className.toString();
        }

        lastEventType = event.getEventType();
        lastEventTime = System.currentTimeMillis();
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

    // Check whether Accessibility Service is connected.
    public static boolean isConnected() {
        return instance != null;
    }

    // Get last detected application package.
    public static String getLastPackageName() {

        NexoraAccessibilityService service = instance;

        return service != null
            ? service.lastPackageName
            : "";
    }

    // Get last detected screen/activity class.
    public static String getLastClassName() {

        NexoraAccessibilityService service = instance;

        return service != null
            ? service.lastClassName
            : "";
    }

    // Get last Android Accessibility Event type.
    public static int getLastEventType() {

        NexoraAccessibilityService service = instance;

        return service != null
            ? service.lastEventType
            : 0;
    }

    // Get last Android Accessibility Event timestamp.
    public static long getLastEventTime() {

        NexoraAccessibilityService service = instance;

        return service != null
            ? service.lastEventTime
            : 0L;
    }
}
