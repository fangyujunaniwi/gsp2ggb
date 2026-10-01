/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Rotater;
import com.keypress.Gobjects.computedRadianAngle;
import com.keypress.Gobjects.gPoint;

public class MarkedAngleRotation
extends Rotater {
    gPoint center;
    gPoint a;
    gPoint b;
    gPoint c;

    public MarkedAngleRotation(GObject theCenter, GObject mA, GObject mB, GObject mC) {
        this.center = (gPoint)theCenter;
        this.a = (gPoint)mA;
        this.b = (gPoint)mB;
        this.c = (gPoint)mC;
    }

    public final boolean prepareTransformer(GObject image) {
        computedRadianAngle angleObj = new computedRadianAngle(this.a.getX(), this.a.getY(), this.b.getX(), this.b.getY(), this.c.getX(), this.c.getY());
        if (angleObj.isDefined()) {
            double numericAngle = angleObj.angle();
            this.centerX = this.center.getX();
            this.centerY = this.center.getY();
            this.cosA = Math.cos(numericAngle);
            this.sinA = Math.sin(numericAngle);
            return true;
        }
        return false;
    }
}

