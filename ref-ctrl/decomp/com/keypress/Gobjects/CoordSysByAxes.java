/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Axis;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.gCoordSys;

public class CoordSysByAxes
extends gCoordSys {
    public CoordSysByAxes(GObject AxisX, GObject AxisY, Sketch theSketch) {
        super(2, theSketch);
        this.AssignParent(0, AxisX);
        this.AssignParent(1, AxisY);
    }

    public GObject getAxisX() {
        return this.getParent(0);
    }

    public GObject getAxisY() {
        return this.getParent(1);
    }

    public void Constrain(boolean locusDriving) {
        if (this.parentsExisting()) {
            this.existing = true;
            Axis tAxisX = (Axis)this.getParent(0);
            Axis tAxisY = (Axis)this.getParent(1);
            this.originX = tAxisX.getOrigin();
            this.unitLengthX = tAxisX.getUnitScale();
            this.originY = tAxisY.getOrigin();
            this.unitLengthY = tAxisY.getUnitScale();
        } else {
            this.existing = false;
        }
    }
}

