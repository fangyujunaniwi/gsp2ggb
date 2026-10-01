/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Dilater;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.computed3PtRatio;
import com.keypress.Gobjects.gPoint;

public class Dilation3R
extends Dilater {
    gPoint center;
    gPoint a;
    gPoint b;
    gPoint c;
    boolean preImageIsPoint;

    public Dilation3R(GObject theCenter, GObject mA, GObject mB, GObject mC, boolean isPointPreimage) {
        this.center = (gPoint)theCenter;
        this.a = (gPoint)mA;
        this.b = (gPoint)mB;
        this.c = (gPoint)mC;
        this.preImageIsPoint = isPointPreimage;
    }

    public final boolean prepareTransformer(GObject image) {
        computed3PtRatio ratioObj = new computed3PtRatio(this.a.getX(), this.a.getY(), this.b.getX(), this.b.getY(), this.c.getX(), this.c.getY());
        if (ratioObj.isDefined()) {
            this.centerX = this.center.getX();
            this.centerY = this.center.getY();
            this.scaleFactor = ratioObj.ratio();
            return this.scaleFactor != 0.0 || this.preImageIsPoint;
        }
        return false;
    }
}

