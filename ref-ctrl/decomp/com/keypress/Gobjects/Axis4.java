/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Axis;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.UnitPoint;
import com.keypress.Gobjects.gPoint;

public class Axis4
extends Axis {
    public Axis4(Sketch mySketch, GObject originPoint, GObject unitPoint, boolean isHorizontal) {
        super(mySketch, 2, isHorizontal);
        this.AssignParent(0, originPoint);
        this.AssignParent(1, unitPoint);
    }

    public double getOrigin() {
        gPoint p = (gPoint)this.getParent(0);
        if (this.isHorizontal) {
            return p.getX();
        }
        return p.getY();
    }

    public double getUnitScale() {
        UnitPoint u = (UnitPoint)this.getParent(1);
        return u.getUnitScale();
    }

    public void Constrain(boolean locusDriving) {
        gPoint o = (gPoint)this.getParent(0);
        UnitPoint u = (UnitPoint)this.getParent(1);
        boolean bl = this.existing = o.isExisting() && u.isExisting();
        if (this.existing) {
            this.unitScale = u.getUnitScale();
            this.x1 = o.getX();
            this.y1 = o.getY();
            if (this.isHorizontal) {
                this.x1 -= 200.0;
                this.x2 = this.x1 + 400.0;
                this.y2 = this.y1;
            } else {
                this.x2 = this.x1;
                this.y1 -= 200.0;
                this.y2 = this.y1 - 400.0;
            }
            this.updateSecondaryConstraints();
        }
    }
}

