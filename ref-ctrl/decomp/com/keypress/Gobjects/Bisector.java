/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gStraight;

public class Bisector
extends gStraight {
    public Bisector(Sketch mySketch, GObject pA, GObject pB, GObject pC) {
        super(mySketch, 3, 1);
        this.AssignParent(0, pA);
        this.AssignParent(1, pB);
        this.AssignParent(2, pC);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gPoint pA = (gPoint)this.getParent(0);
            gPoint pB = (gPoint)this.getParent(1);
            gPoint pC = (gPoint)this.getParent(2);
            if (!pA.distinctFrom(pB) || !pB.distinctFrom(pC)) {
                this.existing = false;
                return;
            }
            this.x1 = pB.getX();
            this.y1 = pB.getY();
            double dX = pA.getX() - pB.getX();
            double dY = pA.getY() - pB.getY();
            double t = Math.sqrt(9000.0 / (dX * dX + dY * dY));
            double p5x = pB.getX() + t * dX;
            double p5y = pB.getY() + t * dY;
            dX = pC.getX() - pB.getX();
            dY = pC.getY() - pB.getY();
            t = Math.sqrt(9000.0 / (dX * dX + dY * dY));
            double p6x = pB.getX() + t * dX;
            double p6y = pB.getY() + t * dY;
            this.x2 = (p5x + p6x) / 2.0;
            this.y2 = (p5y + p6y) / 2.0;
            if (Math.abs(this.x2 - pB.getX()) > 0.01 || Math.abs(this.y2 - pB.getY()) > 0.01) {
                this.updateSecondaryConstraints();
            } else {
                this.existing = false;
            }
        }
    }
}

