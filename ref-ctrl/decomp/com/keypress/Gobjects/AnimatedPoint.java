/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gPoint;

abstract class AnimatedPoint {
    gPoint mover;
    boolean onceOnly;
    double pixelsPerFrame;

    public AnimatedPoint(gPoint thePoint, boolean OnceOnly, double initialPixelSpeed) {
        this.mover = thePoint;
        this.onceOnly = OnceOnly;
        this.pixelsPerFrame = initialPixelSpeed;
    }

    public boolean animationIsDefined() {
        return this.mover.isExisting() && this.getPath().isExisting();
    }

    abstract GObject getPath();

    abstract void setupAnimatingPoint();

    abstract boolean animatePoint();

    abstract void modifySpeed(double var1);
}

