/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.gCoordSys;
import com.keypress.Gobjects.gPoint;

public class OriginUnitCoords
extends gCoordSys {
    public OriginUnitCoords(GObject originPt, GObject unitPt, Sketch theSketch) {
        super(2, theSketch);
        this.AssignParent(0, originPt);
        this.AssignParent(1, unitPt);
    }

    public void Constrain(boolean locusDriving) {
        if (this.parentsExisting()) {
            this.existing = true;
            gPoint origin = (gPoint)this.getParent(0);
            gPoint unitPt = (gPoint)this.getParent(1);
            this.originX = origin.getX();
            this.originY = origin.getY();
            double dX = unitPt.getX() - this.originX;
            double dY = unitPt.getY() - this.originY;
            this.unitLengthX = this.unitLengthY = Math.sqrt(dX * dX + dY * dY);
        } else {
            this.existing = false;
        }
    }
}

