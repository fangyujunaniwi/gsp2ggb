/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gStraight;

public class Perpendicular
extends gStraight {
    public Perpendicular(Sketch mySketch, GObject straight, GObject thruPt) {
        super(mySketch, 2, 2);
        this.AssignParent(0, straight);
        this.AssignParent(1, thruPt);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gStraight perpTo = (gStraight)this.getParent(0);
            gPoint passThru = (gPoint)this.getParent(1);
            double x = passThru.getX() + perpTo.y1 - (perpTo.y1 - perpTo.y2) / 2.0;
            double y = passThru.getY() - perpTo.x1 - (perpTo.x2 - perpTo.x1) / 2.0;
            this.x1 = -perpTo.y1 + x;
            this.y1 = perpTo.x1 + y;
            this.x2 = -perpTo.y2 + x;
            this.y2 = perpTo.x2 + y;
            this.updateSecondaryConstraints();
        }
    }
}

