/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Axis;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.gCoordSys;

public class Axis3
extends Axis {
    public Axis3(Sketch mySketch, GObject coordSysParent, boolean isHorizontal) {
        super(mySketch, 1, isHorizontal);
        this.AssignParent(0, coordSysParent);
    }

    public double getOrigin() {
        gCoordSys p = (gCoordSys)this.getParent(0);
        if (this.isHorizontal) {
            return p.getOriginX();
        }
        return p.getOriginY();
    }

    public double getUnitScale() {
        gCoordSys p = (gCoordSys)this.getParent(0);
        if (this.isHorizontal) {
            return p.getUnitLengthX();
        }
        return p.getUnitLengthY();
    }

    public void Constrain(boolean locusDriving) {
        gCoordSys p = (gCoordSys)this.getParent(0);
        this.existing = p.isExisting();
        if (this.existing) {
            if (this.isHorizontal) {
                this.x1 = p.getOriginX() - 200.0;
                this.x2 = this.x1 + 400.0;
                this.y2 = this.y1 = p.getOriginY();
            } else {
                this.x2 = this.x1 = p.getOriginX();
                this.y1 = p.getOriginY() + 200.0;
                this.y2 = this.y1 - 400.0;
            }
            this.unitScale = p.getUnitLengthX();
            this.updateSecondaryConstraints();
        }
    }
}

