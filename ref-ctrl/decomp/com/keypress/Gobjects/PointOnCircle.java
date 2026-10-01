/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.PointOnObject;
import com.keypress.Gobjects.gCircle;

public class PointOnCircle
extends PointOnObject {
    private double angle;

    public PointOnCircle(GObject circle, double angle) {
        super(circle);
        this.angle = angle;
    }

    void mapPointToHost() {
        double dmb;
        gCircle circle = (gCircle)this.getParent(0);
        double cma = this.x - circle.getCenterX();
        double denom = Math.sqrt(cma * cma + (dmb = this.y - circle.getCenterY()) * dmb);
        if (denom == 0.0) {
            this.y = circle.getCenterY();
            this.x = circle.getCenterX() + circle.getPixelRadius();
            this.angle = 0.0;
        } else {
            this.x = circle.getPixelRadius() * cma / denom;
            this.y = circle.getPixelRadius() * dmb / denom;
            this.angle = Math.atan2(this.y, this.x);
            this.x += circle.getCenterX();
            this.y += circle.getCenterY();
        }
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gCircle host = (gCircle)this.getParent(0);
            this.x = host.getCenterX() + Math.cos(this.angle) * host.getPixelRadius();
            this.y = host.getCenterY() + Math.sin(this.angle) * host.getPixelRadius();
        }
    }
}

