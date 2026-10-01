/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.computedRadianAngle;

public class computed3PtRatio {
    double ratio = 0.0;
    boolean defined;

    public computed3PtRatio(double aX, double aY, double bX, double bY, double cX, double cY) {
        double dx = bX - aX;
        double dy = aY - bY;
        double ABLength = dx * dx + dy * dy;
        boolean bl = this.defined = ABLength != 0.0;
        if (this.defined) {
            dx = cX - aX;
            dy = aY - cY;
            this.ratio = Math.sqrt((dx * dx + dy * dy) / ABLength);
            computedRadianAngle theAngle = new computedRadianAngle(bX, bY, aX, aY, cX, cY);
            if (Math.abs(theAngle.angle()) * 2.0 > Math.PI) {
                this.ratio = -this.ratio;
            }
        }
    }

    public final boolean isDefined() {
        return this.defined;
    }

    public final double ratio() {
        return this.ratio;
    }
}

