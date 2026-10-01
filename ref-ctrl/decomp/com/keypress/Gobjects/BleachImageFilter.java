/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import java.awt.image.ColorModel;
import java.awt.image.DirectColorModel;
import java.awt.image.RGBImageFilter;

public class BleachImageFilter
extends RGBImageFilter {
    private double percent;

    public BleachImageFilter(double percent) {
        this.percent = percent;
        this.canFilterIndexColorModel = true;
    }

    public int filterRGB(int x, int y, int rgb) {
        DirectColorModel cm = (DirectColorModel)ColorModel.getRGBdefault();
        int alpha = cm.getAlpha(rgb);
        int red = cm.getRed(rgb);
        int green = cm.getGreen(rgb);
        int blue = cm.getBlue(rgb);
        red = Math.min((int)((double)red + (double)red * this.percent), 255);
        green = Math.min((int)((double)green + (double)green * this.percent), 255);
        blue = Math.min((int)((double)blue + (double)blue * this.percent), 255);
        return (alpha <<= 24) | (red <<= 16) | (green <<= 8) | blue;
    }
}

