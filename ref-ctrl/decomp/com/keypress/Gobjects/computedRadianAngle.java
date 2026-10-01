/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

public class computedRadianAngle {
    double angle = 0.0;
    boolean defined;

    public computedRadianAngle(double cX, double cY, double bX, double bY, double aX, double aY) {
        double dx1 = bX - aX;
        double dy1 = bY - aY;
        double dx2 = bX - cX;
        double dy2 = bY - cY;
        double t1 = dx1 * dx1 + dy1 * dy1;
        double t2 = dx2 * dx2 + dy2 * dy2;
        double t3 = aX - cX;
        double t4 = aY - cY;
        t3 = t3 * t3 + t4 * t4;
        this.angle = 2.0 * Math.sqrt(t1) * Math.sqrt(t2);
        if (this.angle == 0.0) {
            this.defined = false;
        } else {
            this.defined = true;
            this.angle = (t1 + t2 - t3) / this.angle;
            if (this.angle > 1.0) {
                this.angle = 1.0;
            } else if (this.angle < -1.0) {
                this.angle = -1.0;
            }
            this.angle = Math.acos(this.angle);
            double dx1y2 = dx1 * dy2;
            double dx2y1 = dx2 * dy1;
            if (dx1y2 < dx2y1) {
                this.angle = -this.angle;
            } else if (dx1y2 == dx2y1 && (dx1 * dx2 < 0.0 || dy1 * dy2 < 0.0)) {
                this.angle = -this.angle;
            }
        }
    }

    public final boolean isDefined() {
        return this.defined;
    }

    public final double angle() {
        return this.angle;
    }
}

