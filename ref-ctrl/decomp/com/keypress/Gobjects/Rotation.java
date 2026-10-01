/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Rotater;
import com.keypress.Gobjects.gPoint;

public class Rotation
extends Rotater {
    gPoint center;
    double fixedAngle;

    public Rotation(GObject theCenter, double fixedAngle) {
        this.cosA = Math.cos(fixedAngle);
        this.sinA = Math.sin(fixedAngle);
        this.center = (gPoint)theCenter;
    }

    public final boolean prepareTransformer(GObject image) {
        this.centerX = this.center.getX();
        this.centerY = this.center.getY();
        return true;
    }
}

