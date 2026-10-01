/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.doublePoint;

public abstract class Reflector
extends Transformer {
    double dX;
    double dY;
    double mirrorX1;
    double mirrorX2;
    double mirrorY1;
    double mirrorY2;
    double squareDist;

    final void prepareReflection(double X1, double Y1, double X2, double Y2) {
        this.mirrorX1 = X1;
        this.mirrorX2 = X2;
        this.mirrorY1 = Y1;
        this.mirrorY2 = Y2;
        this.dX = this.mirrorX1 - this.mirrorX2;
        this.dY = this.mirrorY1 - this.mirrorY2;
        this.squareDist = this.dX * this.dX + this.dY * this.dY;
    }

    public final doublePoint imageXY(double preImageX, double preImageY) {
        double magic = ((preImageX - this.mirrorX2) * this.dX + (preImageY - this.mirrorY2) * this.dY) / this.squareDist;
        this.image.x = 2.0 * (magic * this.dX + this.mirrorX2) - preImageX;
        this.image.y = 2.0 * (magic * this.dY + this.mirrorY2) - preImageY;
        return this.image;
    }
}

