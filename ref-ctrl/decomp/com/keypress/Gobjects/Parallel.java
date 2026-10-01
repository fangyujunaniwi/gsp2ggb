/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gStraight;

public class Parallel
extends gStraight {
    public Parallel(Sketch mySketch, GObject straight, GObject thruPt) {
        super(mySketch, 2, 2);
        this.AssignParent(0, straight);
        this.AssignParent(1, thruPt);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gStraight parallelTo = (gStraight)this.getParent(0);
            gPoint passThru = (gPoint)this.getParent(1);
            this.x1 = passThru.getX() - parallelTo.getdX() / 2.0;
            this.y1 = passThru.getY() - parallelTo.getdY() / 2.0;
            this.x2 = this.x1 + parallelTo.getdX();
            this.y2 = this.y1 + parallelTo.getdY();
            this.updateSecondaryConstraints();
        }
    }
}

