/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.doublePoint;
import com.keypress.Gobjects.gPoint;

public abstract class Rotater
extends Transformer {
    double centerX;
    double centerY;
    double cosA;
    double sinA;

    final void PrepareRotation(gPoint dynamicCenter, double dynamicAngle) {
        this.cosA = Math.cos(dynamicAngle);
        this.sinA = Math.sin(dynamicAngle);
        this.centerX = dynamicCenter.getX();
        this.centerY = dynamicCenter.getY();
    }

    public final doublePoint imageXY(double preImageX, double preImageY) {
        double x = preImageX - this.centerX;
        double y = preImageY - this.centerY;
        this.image.x = x * this.cosA + y * this.sinA + this.centerX;
        this.image.y = y * this.cosA - x * this.sinA + this.centerY;
        return this.image;
    }
}

