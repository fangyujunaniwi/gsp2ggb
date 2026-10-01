/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gCircle;
import com.keypress.Gobjects.gPoint;

public class CircleCenterPoint
extends gCircle {
    public CircleCenterPoint(GObject center, GObject radiusPt) {
        super(2);
        this.AssignParent(0, center);
        this.AssignParent(1, radiusPt);
    }

    public void Constrain(boolean locusDriving) {
        gPoint radiusPt;
        gPoint centerPt;
        this.existing = this.parentsExisting();
        if (this.existing) {
            centerPt = (gPoint)this.getParent(0);
            radiusPt = (gPoint)this.getParent(1);
            if (centerPt.getX() == radiusPt.getX() && centerPt.getY() == radiusPt.getY()) {
                this.existing = false;
            }
        }
        if (this.existing) {
            centerPt = (gPoint)this.getParent(0);
            radiusPt = (gPoint)this.getParent(1);
            this.centerX = centerPt.getX();
            this.centerY = centerPt.getY();
            double dx = this.centerX - radiusPt.getX();
            double dy = this.centerY - radiusPt.getY();
            this.radius = Math.sqrt(dx * dx + dy * dy);
            this.updateSecondaryConstraints();
        }
    }
}

