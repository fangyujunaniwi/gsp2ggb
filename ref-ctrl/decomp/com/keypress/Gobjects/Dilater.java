/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.doublePoint;

public abstract class Dilater
extends Transformer {
    double centerX;
    double centerY;
    double scaleFactor;

    public final doublePoint imageXY(double preImageX, double preImageY) {
        this.image.x = (preImageX - this.centerX) * this.scaleFactor + this.centerX;
        this.image.y = (preImageY - this.centerY) * this.scaleFactor + this.centerY;
        return this.image;
    }

    public final double imageScalar(double scalar) {
        return scalar * this.scaleFactor;
    }
}

