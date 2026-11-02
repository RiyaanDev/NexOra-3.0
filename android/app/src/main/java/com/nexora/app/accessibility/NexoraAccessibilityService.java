
package com.nexora.app.accessibility;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

public class NexoraAccessibilityService extends AccessibilityService {

    private static volatile NexoraAccessibilityService instance;
    private static final int MAX_NODES = 180;
    private static final int MAX_TEXT_LENGTH = 5000;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    // No continuous monitoring.
    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Screen content is not collected from events.
    }

    @Override
    public void onInterrupt() {
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

    // Called only when the user explicitly requests screen reading.
    public static String readActiveWindowText() {
        NexoraAccessibilityService service = instance;

        if (service == null) {
            return "";
        }

        AccessibilityNodeInfo root = null;
        StringBuilder output = new StringBuilder();
        int[] visited = {0};

        try {
            root = service.getRootInActiveWindow();

            if (root == null) {
                return "";
            }

            appendText(root, output, visited, 0);

        } catch (Exception ignored) {
            return "";
        } finally {
            if (root != null) {
                root.recycle();
            }
        }

        String result = output.toString().trim();

        if (result.length() > MAX_TEXT_LENGTH) {
            result = result.substring(0, MAX_TEXT_LENGTH);
        }

        return result;
    }

    private static void appendText(
        AccessibilityNodeInfo node,
        StringBuilder output,
        int[] visited,
        int depth
    ) {
        if (node == null || visited[0] >= MAX_NODES
            || depth > 25 || output.length() >= MAX_TEXT_LENGTH) {
            return;
        }

        visited[0]++;

        // Never read password or editable fields.
        if (node.isPassword() || node.isEditable()) {
            return;
        }

        appendValue(output, node.getText());
        appendValue(output, node.getContentDescription());

        for (int i = 0; i < node.getChildCount(); i++) {
            if (visited[0] >= MAX_NODES
                || output.length() >= MAX_TEXT_LENGTH) {
                break;
            }

            AccessibilityNodeInfo child = null;

            try {
                child = node.getChild(i);
                appendText(child, output, visited, depth + 1);
            } catch (Exception ignored) {
                // Skip unavailable nodes.
            } finally {
                if (child != null) {
                    child.recycle();
                }
            }
        }
    }

    private static void appendValue(
        StringBuilder output,
        CharSequence value
    ) {
        if (value == null || output.length() >= MAX_TEXT_LENGTH) {
            return;
        }

        String text = value.toString().trim();

        if (text.isEmpty()) {
            return;
        }

        if (output.length() > 0) {
            output.append('\n');
        }

        output.append(text);
    }

    // Compatibility methods.
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
