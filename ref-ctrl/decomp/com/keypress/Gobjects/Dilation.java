/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Dilater;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gPoint;

public class Dilation
extends Dilater {
    gPoint center;
    boolean preImageIsPoint;

    public Dilation(GObject theCenter, double fixedScale, boolean isPointPreimage) {
        this.center = (gPoint)theCenter;
        this.scaleFactor = fixedScale;
        this.preImageIsPoint = isPointPreimage;
    }

    public final boolean prepareTransformer(GObject image) {
        this.centerX = this.center.getX();
        this.centerY = this.center.getY();
        return this.scaleFactor != 0.0 || this.preImageIsPoint;
    }
}

