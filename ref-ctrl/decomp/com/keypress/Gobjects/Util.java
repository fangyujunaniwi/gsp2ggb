/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.SketchpadRuntimeServices;
import java.applet.Applet;
import java.awt.Color;
import java.awt.Component;
import java.awt.Image;
import java.awt.MediaTracker;

public class Util {
    public static void waitForImage(Component component, Image image) {
        MediaTracker tracker = new MediaTracker(component);
        try {
            tracker.addImage(image, 0);
            tracker.waitForID(0, 20L);
        }
        catch (InterruptedException interruptedException) {
            // empty catch block
        }
    }

    public static int getIntParameter(SketchpadRuntimeServices runtime, String paramName, int min, int max, int defaultValue) {
        String paramValue = runtime.getSketchParameterValue(paramName);
        if (paramValue == null) {
            return defaultValue;
        }
        int val = Integer.parseInt(paramValue);
        if (val < min || val > max) {
            System.out.print(paramName + " parameter value (" + val + ") out of range (" + min + "-" + max + "), using default (" + defaultValue + ")\r\n");
            return defaultValue;
        }
        return val;
    }

    public static float getFloatParameter(SketchpadRuntimeServices runtime, String paramName, float defaultValue) {
        String paramValue = runtime.getSketchParameterValue(paramName);
        if (paramValue == null) {
            return defaultValue;
        }
        float val = Float.valueOf(paramValue).floatValue();
        return val;
    }

    public static Color getColorParameter(Applet theApp, String paramName, Color defaultColor) {
        String paramValue = theApp.getParameter(paramName);
        if (paramValue == null) {
            return defaultColor;
        }
        if (paramValue.equals("red")) {
            return Color.red;
        }
        if (paramValue.equals("green")) {
            return Color.green;
        }
        if (paramValue.equals("yellow")) {
            return Color.yellow;
        }
        if (paramValue.equals("magenta")) {
            return Color.magenta;
        }
        if (paramValue.equals("blue")) {
            return Color.blue;
        }
        if (paramValue.equals("cyan")) {
            return Color.cyan;
        }
        if (paramValue.equals("white")) {
            return Color.white;
        }
        if (paramValue.equals("black")) {
            return Color.black;
        }
        System.out.print(paramName + " parameter value (" + paramValue + ") not legal. Using default color.\r\n");
        return defaultColor;
    }
}

