/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gCircle;
import com.keypress.Gobjects.gPoint;

public class CircleCircleIntersection
extends gPoint {
    private boolean direction;

    public CircleCircleIntersection(GObject circle1, GObject circle2, boolean positive) {
        super(2);
        this.direction = positive;
        this.AssignParent(0, circle1);
        this.AssignParent(1, circle2);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gCircle c1 = (gCircle)this.getParent(0);
            gCircle c2 = (gCircle)this.getParent(1);
            double r = c1.getPixelRadius();
            double rad2 = r * r;
            double r0 = c2.getPixelRadius();
            double rad02 = r0 * r0;
            double x0 = c2.getCenterX() - c1.getCenterX();
            double y0 = c2.getCenterY() - c1.getCenterY();
            double c02 = x0 * x0 + y0 * y0;
            double rmr0 = r - r0;
            rmr0 *= rmr0;
            double rpr0 = r + r0;
            rpr0 *= rpr0;
            double d = -(rmr0 - c02) * (rpr0 - c02);
            double c02t2 = c02 + c02;
            if (c02t2 == 0.0 || d < 0.0) {
                this.existing = false;
            } else {
                double S = c02 + rad2 - rad02;
                double sD = Math.sqrt(d);
                if (!this.direction) {
                    sD = -sD;
                }
                double xx = (x0 * S + y0 * sD) / c02t2 + c1.getCenterX();
                double yy = (y0 * S - x0 * sD) / c02t2 + c1.getCenterY();
                this.x = xx;
                this.y = yy;
            }
        }
    }
}

